import { z } from "zod";

// Pure document-intake triage core.
//
// This module classifies a captured document (scanned, uploaded, or emailed)
// into a Business/Personal/Mixed domain, detects a document type, proposes a
// disposition (create an action, file it, archive it, or ask a human), and
// builds a proposed Action draft. It is intentionally pure and dependency-free
// so the routing rules can be unit-tested and can never drift from the review
// queue. Reading bytes (OCR) and any AI extraction happen elsewhere; this
// module only reasons over already-extracted text and filenames.
//
// Nothing here creates company work. Output is a proposal held for human
// approval in the /intake review queue.

export type IntakeDomain = "BUSINESS" | "PERSONAL" | "MIXED" | "UNKNOWN";
export type IntakeDisposition = "ACTION" | "FILE" | "ARCHIVE" | "UNSURE";
export type IntakePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type DomainSignals = {
  business: string[];
  personal: string[];
};

export type DomainClassification = {
  domain: IntakeDomain;
  confidence: number;
  signals: DomainSignals;
};

export type DocTypeClassification = {
  docType: string;
  confidence: number;
};

export type IntakeProposedAction = {
  title: string;
  description: string;
  domain: IntakeDomain;
  stream?: string;
  companyFunction?: string;
  priority: IntakePriority;
  status: "OPEN";
  dueDate?: string;
  reviewDate?: string;
  nextStep: string;
  sensitive: boolean;
};

export type IntakeTriageInput = {
  filename: string;
  text?: string | null;
  now?: Date;
};

export type IntakeTriageResult = {
  domain: IntakeDomain;
  domainConfidence: number;
  signals: DomainSignals;
  docType: string;
  docTypeConfidence: number;
  disposition: IntakeDisposition;
  summary: string;
  proposedAction: IntakeProposedAction;
};

// Weighted keyword signals. Strong, unambiguous markers get a higher weight so
// a single "tax invoice" or "medicare" line outweighs incidental words.
const BUSINESS_SIGNALS: Array<[string, number]> = [
  ["tax invoice", 3],
  ["abn", 3],
  ["a.b.n", 3],
  ["gst", 2],
  ["purchase order", 2],
  ["remittance", 2],
  ["accounts payable", 2],
  ["accounts receivable", 2],
  ["statement of account", 2],
  ["bas", 2],
  ["xero", 2],
  ["pty ltd", 2],
  ["pty. ltd", 2],
  ["supplier", 2],
  ["payroll", 2],
  ["invoice", 1],
  ["net 30", 1],
  ["net 14", 1],
  ["eft", 1],
  ["business", 1],
  ["company", 1],
  ["client", 1],
  ["customer", 1],
  ["wholesale", 1],
  ["dromaios", 3],
  ["dromaiosed", 3],
  ["clinicboss", 3],
  ["hil/skool", 3],
  ["medtech", 2],
  ["venue", 1],
  ["course", 1],
  ["learner", 1]
];

const PERSONAL_SIGNALS: Array<[string, number]> = [
  ["medicare", 3],
  ["centrelink", 3],
  ["rates notice", 3],
  ["council rates", 3],
  ["driver licence", 3],
  ["drivers license", 3],
  ["passport", 3],
  ["pathology", 3],
  ["prescription", 3],
  ["mortgage", 3],
  ["home loan", 3],
  ["tenancy", 2],
  ["lease agreement", 2],
  ["rent", 2],
  ["school", 2],
  ["tuition", 2],
  ["dental", 2],
  ["bank statement", 2],
  ["electricity bill", 2],
  ["water bill", 2],
  ["gas bill", 2],
  ["vehicle registration", 2],
  ["car registration", 2],
  ["personal", 2],
  ["family", 1],
  ["household", 1],
  ["doctor", 1],
  ["appointment", 1]
];

// Action-forcing language. When present, even a low-key document type becomes
// something a human likely needs to act on (never auto-acted on).
const ACTION_KEYWORDS = [
  "due",
  "overdue",
  "amount due",
  "payment due",
  "pay by",
  "action required",
  "respond by",
  "reply by",
  "renew",
  "renewal",
  "expires",
  "expiry",
  "deadline",
  "final notice",
  "appointment",
  "booking"
];

// Document types that, by their nature, usually need a tracked action.
const ACTIONABLE_DOC_TYPES = new Set(["invoice", "bill", "utility-bill", "rates-notice", "registration", "contract"]);
// Document types that are reference material to file and keep findable.
const FILE_DOC_TYPES = new Set(["receipt", "statement", "payslip", "certificate", "insurance", "medical"]);
// Low-signal noise that can be archived rather than filed.
const ARCHIVE_DOC_TYPES = new Set(["marketing", "newsletter"]);

export function classifyDocumentDomain({ filename, text }: { filename: string; text?: string | null }): DomainClassification {
  const haystack = `${filename} ${text ?? ""}`.toLowerCase();
  const business = matchSignals(haystack, BUSINESS_SIGNALS);
  const personal = matchSignals(haystack, PERSONAL_SIGNALS);

  const signals: DomainSignals = {
    business: business.terms,
    personal: personal.terms
  };

  const total = business.score + personal.score;
  if (total === 0) {
    return { domain: "UNKNOWN", confidence: 0, signals };
  }

  const dominant = Math.max(business.score, personal.score);
  const ratio = dominant / total;

  // When both sides carry real weight and neither clearly dominates, treat the
  // document as Mixed so a human picks the destination.
  if (business.score > 0 && personal.score > 0 && ratio < 0.7) {
    return { domain: "MIXED", confidence: round2(1 - Math.abs(business.score - personal.score) / total), signals };
  }

  const domain: IntakeDomain = business.score >= personal.score ? "BUSINESS" : "PERSONAL";
  return { domain, confidence: round2(ratio), signals };
}

export function detectDocumentType({ filename, text }: { filename: string; text?: string | null }): DocTypeClassification {
  const haystack = `${filename} ${text ?? ""}`.toLowerCase();

  // Ordered most-specific-first; first match wins.
  const rules: Array<[string, string[]]> = [
    ["invoice", ["tax invoice", "invoice number", "invoice no", "invoice"]],
    ["receipt", ["tax receipt", "receipt", "payment received", "paid in full"]],
    ["rates-notice", ["rates notice", "council rates"]],
    ["payslip", ["payslip", "pay slip", "payment summary", "payg", "earnings statement"]],
    ["statement", ["bank statement", "account statement", "statement of account", "statement period"]],
    ["contract", ["contract", "agreement", "terms and conditions", "deed", "engagement letter"]],
    ["insurance", ["certificate of currency", "insurance policy", "policy number", "insurance"]],
    ["registration", ["vehicle registration", "car registration", "registration renewal", "rego"]],
    ["utility-bill", ["electricity", "water account", "gas account", "utility", "energy bill"]],
    ["medical", ["medicare", "pathology", "prescription", "referral", "discharge summary", "radiology"]],
    ["certificate", ["certificate", "certification", "accreditation"]],
    ["marketing", ["unsubscribe", "newsletter", "special offer", "promotion", "promotional"]],
    ["bill", ["bill", "amount due", "balance due"]],
    ["letter", ["dear ", "yours sincerely", "yours faithfully", "to whom it may concern"]]
  ];

  for (const [docType, needles] of rules) {
    const hit = needles.find((needle) => haystack.includes(needle));
    if (hit) {
      // Longer, more specific matches imply higher confidence.
      const confidence = hit.length >= 10 ? 0.85 : hit.length >= 6 ? 0.7 : 0.55;
      return { docType, confidence };
    }
  }

  return { docType: "unknown", confidence: 0 };
}

export function proposeDisposition({
  docType,
  domain,
  text,
  filename
}: {
  docType: string;
  domain: IntakeDomain;
  text?: string | null;
  filename?: string;
}): IntakeDisposition {
  const haystack = `${filename ?? ""} ${text ?? ""}`.toLowerCase();
  const hasActionLanguage = ACTION_KEYWORDS.some((keyword) => haystack.includes(keyword));

  if (ACTIONABLE_DOC_TYPES.has(docType)) return "ACTION";
  if (hasActionLanguage && docType !== "marketing") return "ACTION";
  if (FILE_DOC_TYPES.has(docType)) return "FILE";
  if (ARCHIVE_DOC_TYPES.has(docType)) return "ARCHIVE";
  if (docType === "unknown" && domain === "UNKNOWN") return "UNSURE";
  if (docType === "letter") return "UNSURE";
  return "UNSURE";
}

export function suggestRouting({
  docType,
  domain
}: {
  docType: string;
  domain: IntakeDomain;
}): { stream?: string; companyFunction?: string } {
  // Personal documents are deliberately not routed into a company stream or
  // function; they belong to the Personal pipeline and stay out of company ops.
  if (domain === "PERSONAL") return {};

  const financeTypes = new Set(["invoice", "receipt", "statement", "payslip", "bill", "utility-bill", "rates-notice"]);
  const legalTypes = new Set(["contract", "insurance", "certificate"]);

  if (financeTypes.has(docType)) return { stream: "Company Core", companyFunction: "finance" };
  if (legalTypes.has(docType)) return { stream: "Company Core", companyFunction: "legal" };
  if (docType === "medical") return { stream: "Company Core", companyFunction: "admin" };
  return { stream: "Company Core", companyFunction: "admin" };
}

export function buildIntakeTriage({ filename, text, now = new Date() }: IntakeTriageInput): IntakeTriageResult {
  const domainClass = classifyDocumentDomain({ filename, text });
  const docTypeClass = detectDocumentType({ filename, text });
  const disposition = proposeDisposition({ docType: docTypeClass.docType, domain: domainClass.domain, text, filename });
  const routing = suggestRouting({ docType: docTypeClass.docType, domain: domainClass.domain });
  const priority = derivePriority({ docType: docTypeClass.docType, disposition, text });

  const docTypeLabel = labelDocType(docTypeClass.docType);
  const domainLabel = labelDomain(domainClass.domain);
  const cleanName = tidyFilename(filename);

  const summary = [
    `${domainLabel} ${docTypeLabel.toLowerCase()}`,
    `disposition ${disposition.toLowerCase()}`,
    domainClass.signals.business.length > 0 ? `business signals: ${domainClass.signals.business.join(", ")}` : null,
    domainClass.signals.personal.length > 0 ? `personal signals: ${domainClass.signals.personal.join(", ")}` : null
  ]
    .filter(Boolean)
    .join(" | ");

  const proposedAction: IntakeProposedAction = {
    title: `${docTypeLabel}: ${cleanName}`,
    description: [
      `Captured document triaged locally on ${dateKey(now)}.`,
      `Domain: ${domainLabel} (confidence ${domainClass.confidence}).`,
      `Document type: ${docTypeLabel} (confidence ${docTypeClass.confidence}).`,
      `Proposed disposition: ${disposition}.`,
      "No company record is created until you approve this in the intake review queue."
    ].join("\n"),
    domain: domainClass.domain,
    stream: routing.stream,
    companyFunction: routing.companyFunction,
    priority,
    status: "OPEN",
    nextStep: nextStepFor(disposition, docTypeLabel),
    sensitive: true
  };

  return {
    domain: domainClass.domain,
    domainConfidence: domainClass.confidence,
    signals: domainClass.signals,
    docType: docTypeClass.docType,
    docTypeConfidence: docTypeClass.confidence,
    disposition,
    summary,
    proposedAction
  };
}

// Schema for the optional local-AI (Ollama) extraction pass. Every field is
// optional: the heuristic triage already produces a complete proposal, and AI
// output only enriches it. Parsing is defensive so malformed JSON never breaks
// the queue.
const intakeExtractionSchema = z.object({
  summary: optionalCoercedString(1200),
  docType: optionalCoercedString(60),
  // Local models often echo the domain in lower/mixed case ("business"), which
  // is still a useful extraction. Upcase before validating so a casing mismatch
  // never rejects the whole object, and fall back to undefined for any value the
  // enum doesn't recognise rather than discarding the summary/dates/title with it.
  domain: z
    .preprocess((v) => (typeof v === "string" ? v.trim().toUpperCase() : v), z.enum(["BUSINESS", "PERSONAL", "MIXED", "UNKNOWN"]))
    .optional()
    .catch(undefined),
  party: optionalCoercedString(160),
  amount: optionalCoercedString(60),
  documentDate: optionalDateString(),
  dueDate: optionalDateString(),
  suggestedTitle: optionalCoercedString(160),
  suggestedNextStep: optionalCoercedString(400),
  sensitive: z.boolean().optional()
});

export type IntakeExtraction = z.infer<typeof intakeExtractionSchema>;

export function parseIntakeExtraction(raw: string): { extraction?: IntakeExtraction; error?: string } {
  try {
    // Local models commonly emit present-but-null fields (e.g. "dueDate": null).
    // Strip nulls so one null field doesn't reject the whole object and discard
    // the useful extracted values; a missing field and a null field mean the same.
    const extraction = intakeExtractionSchema.parse(stripNullValues(JSON.parse(raw)));
    return { extraction };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Extraction output was not valid JSON." };
  }
}

function stripNullValues(value: unknown): unknown {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== null));
  }
  return value;
}

/**
 * Merges optional local-AI extraction into a heuristic triage result. The
 * heuristic domain is kept unless it was UNKNOWN, in which case a confident AI
 * domain fills the gap. Summary, title, next step, and a due date are enriched
 * when the model provides them. Never downgrades sensitivity below true.
 */
export function mergeExtractionIntoTriage(triage: IntakeTriageResult, extraction: IntakeExtraction | undefined): IntakeTriageResult {
  if (!extraction) return triage;

  const domain: IntakeDomain = triage.domain === "UNKNOWN" && extraction.domain ? extraction.domain : triage.domain;

  // Adopt a confident extracted document type only when the heuristics found
  // none, then recompute the downstream disposition, routing, and priority so an
  // AI-identified invoice/contract is no longer left as a generic admin item.
  const extractedType = triage.docType === "unknown" ? normaliseDocType(extraction.docType) : null;
  const docType = extractedType ?? triage.docType;
  const docTypeChanged = docType !== triage.docType;
  const domainChanged = domain !== triage.domain;

  // Recompute disposition for the adopted type, but never downgrade an ACTION the
  // heuristic set from action-forcing language ("respond by") that the recompute
  // no longer sees, since that would hide a required response from the queue.
  const disposition = docTypeChanged
    ? triage.disposition === "ACTION"
      ? "ACTION"
      : proposeDisposition({ docType, domain })
    : triage.disposition;
  const routing =
    docTypeChanged || domainChanged
      ? suggestRouting({ docType, domain })
      : { stream: triage.proposedAction.stream, companyFunction: triage.proposedAction.companyFunction };
  // Recompute priority for the adopted type, but never downgrade below what the
  // heuristic set: the heuristic may have seen urgent language ("overdue", "final
  // notice") in the original text that this recompute (which has no text) cannot,
  // and losing HIGH would bury an urgent document in the queue.
  const priority = docTypeChanged
    ? maxPriority(triage.proposedAction.priority, derivePriority({ docType, disposition }))
    : triage.proposedAction.priority;

  const summaryParts = [
    extraction.summary,
    extraction.documentDate ? `Document date: ${extraction.documentDate}` : null,
    extraction.party ? `Party: ${extraction.party}` : null,
    extraction.amount ? `Amount: ${extraction.amount}` : null
  ]
    .filter(Boolean)
    .join(" | ");

  // The document's own issue date is kept in the description, never mapped onto
  // the action's review deadline (which would make it immediately stale).
  const descriptionExtras = [
    extraction.summary ? `Local AI summary: ${extraction.summary}` : null,
    extraction.documentDate ? `Document date: ${extraction.documentDate}` : null
  ]
    .filter(Boolean)
    .join("\n");

  return {
    ...triage,
    domain,
    docType,
    docTypeConfidence: docTypeChanged ? Math.max(triage.docTypeConfidence, 0.6) : triage.docTypeConfidence,
    disposition,
    summary: summaryParts || triage.summary,
    proposedAction: {
      ...triage.proposedAction,
      domain,
      stream: routing.stream,
      companyFunction: routing.companyFunction,
      priority,
      title: extraction.suggestedTitle?.trim() || triage.proposedAction.title,
      nextStep:
        extraction.suggestedNextStep?.trim() || (docTypeChanged ? nextStepFor(disposition, labelDocType(docType)) : triage.proposedAction.nextStep),
      dueDate: extraction.dueDate ?? triage.proposedAction.dueDate,
      sensitive: triage.proposedAction.sensitive || extraction.sensitive === true,
      description: descriptionExtras ? `${triage.proposedAction.description}\n\n${descriptionExtras}` : triage.proposedAction.description
    }
  };
}

const KNOWN_DOC_TYPES = new Set([
  "invoice",
  "receipt",
  "statement",
  "contract",
  "insurance",
  "registration",
  "utility-bill",
  "medical",
  "certificate",
  "marketing",
  "bill",
  "letter",
  "payslip",
  "rates-notice"
]);

const DOC_TYPE_SYNONYMS: Record<string, string> = {
  "tax invoice": "invoice",
  "bank statement": "statement",
  "account statement": "statement",
  "pay slip": "payslip",
  "payment summary": "payslip",
  "rates notice": "rates-notice",
  "council rates": "rates-notice",
  "utility bill": "utility-bill",
  utility: "utility-bill"
};

/** Normalises a free-text document type from the AI into one of the known
 * routing types, or null when it cannot be confidently mapped. */
export function normaliseDocType(value?: string | null): string | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (KNOWN_DOC_TYPES.has(v)) return v;
  if (DOC_TYPE_SYNONYMS[v]) return DOC_TYPE_SYNONYMS[v];
  for (const type of KNOWN_DOC_TYPES) {
    if (v.includes(type)) return type;
  }
  return null;
}

export type IntakeQueueItem = {
  status: string;
  domain: string;
};

export type IntakeQueueSummary = {
  total: number;
  pending: number;
  needsReview: number;
  captured: number;
  failed: number;
  filed: number;
  archived: number;
  rejected: number;
  byDomain: Record<IntakeDomain, number>;
};

const PENDING_STATUSES = new Set(["CAPTURED", "READ", "TRIAGED", "IN_REVIEW"]);
const NEEDS_REVIEW_STATUSES = new Set(["READ", "TRIAGED", "IN_REVIEW"]);

export type IntakeStatusDomainCount = { status: string; domain: string; count: number };

export function summariseIntakeQueue(items: IntakeQueueItem[]): IntakeQueueSummary {
  return summariseIntakeQueueFromCounts(items.map((item) => ({ status: item.status, domain: item.domain, count: 1 })));
}

/**
 * Builds the queue summary from pre-aggregated status/domain counts (e.g. a
 * Prisma groupBy), so the work stays bounded by the number of groups rather than
 * the total number of documents.
 */
export function summariseIntakeQueueFromCounts(rows: IntakeStatusDomainCount[]): IntakeQueueSummary {
  const byDomain: Record<IntakeDomain, number> = { BUSINESS: 0, PERSONAL: 0, MIXED: 0, UNKNOWN: 0 };
  const summary: IntakeQueueSummary = {
    total: 0,
    pending: 0,
    needsReview: 0,
    captured: 0,
    failed: 0,
    filed: 0,
    archived: 0,
    rejected: 0,
    byDomain
  };

  for (const row of rows) {
    const count = row.count;
    summary.total += count;
    if (PENDING_STATUSES.has(row.status)) summary.pending += count;
    if (NEEDS_REVIEW_STATUSES.has(row.status)) summary.needsReview += count;
    if (row.status === "CAPTURED") summary.captured += count;
    if (row.status === "FAILED") summary.failed += count;
    if (row.status === "FILED") summary.filed += count;
    if (row.status === "ARCHIVED") summary.archived += count;
    if (row.status === "REJECTED") summary.rejected += count;
    if (row.domain in byDomain) byDomain[row.domain as IntakeDomain] += count;
  }

  return summary;
}

const CONTRACT_DOC_PATH = "docs/workflows/document-intake-triage.md";
const CONTRACT_JSON_PATH = "docs/workflows/document-intake-triage.contract.json";

export type DocumentIntakeActionDraft = {
  title: string;
  description: string;
  priority: "HIGH";
  dueAt: string;
  reviewAt: string;
  nextStep: string;
  sensitive: boolean;
};

export type DocumentIntakeRun = {
  responseSummary: string;
  actionsToCreate: DocumentIntakeActionDraft[];
};

/**
 * Control-room run summary for the approval-gated "Document intake triage"
 * automation. Mirrors the mailroom-filing run: approving the automation pulls
 * newly scanned/emailed files into the review queue (as CAPTURED documents) and
 * records a review action. It never creates per-document actions and never
 * contacts an external service; each document still needs human approval.
 */
export function buildDocumentIntakeRun({ now = new Date(), ingested = 0, duplicates = 0 }: { now?: Date; ingested?: number; duplicates?: number } = {}): DocumentIntakeRun {
  const today = dateKey(now);

  return {
    actionsToCreate: [
      {
        title: "Review document intake queue",
        description: [
          "Approval-gated local document intake triage run.",
          `Workflow contract: ${CONTRACT_DOC_PATH}`,
          `Workflow contract JSON: ${CONTRACT_JSON_PATH}`,
          `Documents pulled into the queue this run: ${ingested}.`,
          `Duplicates skipped this run: ${duplicates}.`,
          "Intake sources: watched scan folder, in-cockpit upload, and emailed documents synced into the intake folder.",
          "Reading is local only: Tesseract OCR plus the local Ollama model. No document bytes or text leave the box.",
          "Each captured document is triaged into Business/Personal/Mixed and held for human approval; no action is created automatically."
        ].join("\n"),
        priority: "HIGH",
        dueAt: today,
        reviewAt: today,
        nextStep: "Open /intake, read & triage captured documents, then approve into actions, file, or archive each one.",
        sensitive: true
      }
    ],
    responseSummary: [
      "Document intake triage - approved run",
      "",
      `Generated locally: ${today}`,
      "Safety: APPROVAL_REQUIRED. Explicit approval captured. Cockpit did not contact any external service; reading uses local OCR + Ollama only.",
      `Workflow source: ${CONTRACT_DOC_PATH}`,
      `Workflow contract JSON: ${CONTRACT_JSON_PATH}`,
      "",
      "Run result",
      `- Documents pulled into the queue: ${ingested}.`,
      `- Duplicates skipped (same content hash): ${duplicates}.`,
      "",
      "Pathway",
      "- Scan/upload/email -> captured -> read (local OCR + Ollama) -> triaged (Business/Personal/Mixed) -> human review -> action, file, or archive.",
      "- Personal documents are routed to the Personal pipeline and kept out of company streams and functions.",
      "",
      "Blocked boundaries",
      "- No document bytes or text sent to cloud AI by default.",
      "- No payment execution, bank rules, tax lodgement, or Xero writes.",
      "- No action created from any document without explicit human approval."
    ].join("\n")
  };
}

function matchSignals(haystack: string, signals: Array<[string, number]>): { score: number; terms: string[] } {
  let score = 0;
  const terms: string[] = [];
  for (const [term, weight] of signals) {
    // Match on word boundaries so a short signal like "rent" does not fire inside
    // "current"/"parent". Boundaries are "not adjacent to an alphanumeric char",
    // which also works for phrase and punctuated terms (e.g. "tax invoice", "a.b.n").
    const pattern = new RegExp(`(?<![a-z0-9])${escapeRegExp(term)}(?![a-z0-9])`);
    if (pattern.test(haystack)) {
      score += weight;
      terms.push(term);
    }
  }
  return { score, terms };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function derivePriority({ docType, disposition, text }: { docType: string; disposition: IntakeDisposition; text?: string | null }): IntakePriority {
  const haystack = (text ?? "").toLowerCase();
  if (haystack.includes("overdue") || haystack.includes("final notice")) return "HIGH";
  if (disposition === "ACTION" && (docType === "invoice" || docType === "bill" || docType === "contract")) return "HIGH";
  if (disposition === "ACTION") return "MEDIUM";
  if (disposition === "FILE") return "LOW";
  return "MEDIUM";
}

const PRIORITY_RANK: Record<IntakePriority, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

/** Returns the higher of two priorities, so a recompute can never downgrade an
 * urgency the heuristic already established. */
function maxPriority(a: IntakePriority, b: IntakePriority): IntakePriority {
  return PRIORITY_RANK[a] >= PRIORITY_RANK[b] ? a : b;
}

function nextStepFor(disposition: IntakeDisposition, docTypeLabel: string): string {
  switch (disposition) {
    case "ACTION":
      return `Confirm the destination and turn this ${docTypeLabel.toLowerCase()} into a tracked action.`;
    case "FILE":
      return `File this ${docTypeLabel.toLowerCase()} into the right records folder and confirm the domain.`;
    case "ARCHIVE":
      return "Confirm there is nothing to action, then archive for records.";
    default:
      return "Decide the domain and whether this needs an action, filing, or archiving.";
  }
}

function labelDocType(docType: string): string {
  if (docType === "unknown") return "Document";
  return docType
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function labelDomain(domain: IntakeDomain): string {
  return domain.charAt(0) + domain.slice(1).toLowerCase();
}

function tidyFilename(filename: string): string {
  const base = filename.replace(/\.[a-z0-9]{1,5}$/i, "");
  const cleaned = base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return cleaned.length > 0 ? cleaned.slice(0, 80) : "document";
}

// Optional free-text field that tolerates the model returning a number for a
// scalar (e.g. "amount": 420.5) by coercing it to a string so the value is kept,
// and drops any other wrong-shaped value to undefined rather than failing the
// whole extraction (mirrors the domain/date fields).
function optionalCoercedString(max: number) {
  return z.preprocess(
    (value) => (typeof value === "number" && Number.isFinite(value) ? String(value) : value),
    z.string().trim().max(max).optional().catch(undefined)
  );
}

function optionalDateString() {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      // Reject impossible dates (e.g. 2026-13-45) that pass the shape check, so a
      // hallucinated model date never becomes an unparseable dueAt/reviewAt.
      .refine(isRealCalendarDate, "Invalid calendar date")
      .optional()
      // A bad date is optional data: drop it to undefined rather than failing the
      // whole extraction, so one hallucinated date doesn't discard the summary,
      // domain, title, and next step alongside it (mirrors the domain field).
      .catch(undefined)
  );
}

function isRealCalendarDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
