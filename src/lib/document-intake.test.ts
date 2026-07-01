import { describe, expect, it } from "vitest";
import {
  buildDocumentIntakeRun,
  buildIntakeTriage,
  classifyDocumentDomain,
  detectDocumentType,
  mergeExtractionIntoTriage,
  normaliseDocType,
  parseIntakeExtraction,
  proposeDisposition,
  suggestRouting,
  summariseIntakeQueue
} from "./document-intake";

describe("classifyDocumentDomain", () => {
  it("classifies a tax invoice with an ABN as business", () => {
    const result = classifyDocumentDomain({
      filename: "acme-supplies-invoice.pdf",
      text: "TAX INVOICE ABN 12 345 678 901 GST included. Supplier: Acme Pty Ltd"
    });
    expect(result.domain).toBe("BUSINESS");
    expect(result.confidence).toBeGreaterThan(0.6);
    expect(result.signals.business).toContain("tax invoice");
    expect(result.signals.business).toContain("abn");
  });

  it("classifies a medicare/rates document as personal", () => {
    const result = classifyDocumentDomain({
      filename: "council-rates-notice.pdf",
      text: "Council rates notice. Medicare details. Personal residence."
    });
    expect(result.domain).toBe("PERSONAL");
    expect(result.signals.personal).toContain("rates notice");
  });

  it("returns MIXED when strong business and personal signals are balanced", () => {
    const result = classifyDocumentDomain({
      filename: "vehicle.pdf",
      text: "Vehicle registration renewal for personal car. Also claimed for business GST."
    });
    expect(result.domain).toBe("MIXED");
    expect(result.signals.business.length).toBeGreaterThan(0);
    expect(result.signals.personal.length).toBeGreaterThan(0);
  });

  it("returns UNKNOWN with zero confidence when nothing matches", () => {
    const result = classifyDocumentDomain({ filename: "scan001.pdf", text: "hello world" });
    expect(result.domain).toBe("UNKNOWN");
    expect(result.confidence).toBe(0);
  });

  it("does not match a short signal inside a larger word", () => {
    // "rent" must not fire inside current/apparent/parent.
    const result = classifyDocumentDomain({ filename: "statement.pdf", text: "Your current balance is apparent to any parent." });
    expect(result.signals.personal).not.toContain("rent");
    expect(result.domain).toBe("UNKNOWN");
  });
});

describe("detectDocumentType", () => {
  it("detects an invoice", () => {
    expect(detectDocumentType({ filename: "x.pdf", text: "Tax Invoice number 1024" }).docType).toBe("invoice");
  });

  it("detects a receipt", () => {
    expect(detectDocumentType({ filename: "coffee-receipt.jpg", text: "Receipt - paid in full" }).docType).toBe("receipt");
  });

  it("detects a contract", () => {
    expect(detectDocumentType({ filename: "msa.pdf", text: "This agreement is made between the parties" }).docType).toBe("contract");
  });

  it("falls back to unknown", () => {
    const result = detectDocumentType({ filename: "scan.png", text: "random text" });
    expect(result.docType).toBe("unknown");
    expect(result.confidence).toBe(0);
  });
});

describe("proposeDisposition", () => {
  it("proposes ACTION for an invoice", () => {
    expect(proposeDisposition({ docType: "invoice", domain: "BUSINESS" })).toBe("ACTION");
  });

  it("proposes ACTION when action language is present even for a letter", () => {
    expect(proposeDisposition({ docType: "letter", domain: "PERSONAL", text: "Please respond by Friday, action required" })).toBe("ACTION");
  });

  it("proposes FILE for a receipt", () => {
    expect(proposeDisposition({ docType: "receipt", domain: "BUSINESS" })).toBe("FILE");
  });

  it("proposes ARCHIVE for marketing", () => {
    expect(proposeDisposition({ docType: "marketing", domain: "BUSINESS", text: "unsubscribe newsletter" })).toBe("ARCHIVE");
  });

  it("proposes UNSURE for an unknown document with no domain", () => {
    expect(proposeDisposition({ docType: "unknown", domain: "UNKNOWN" })).toBe("UNSURE");
  });
});

describe("suggestRouting", () => {
  it("routes a business invoice to Company Core / finance", () => {
    expect(suggestRouting({ docType: "invoice", domain: "BUSINESS" })).toEqual({ stream: "Company Core", companyFunction: "finance" });
  });

  it("routes a business contract to Company Core / legal", () => {
    expect(suggestRouting({ docType: "contract", domain: "BUSINESS" })).toEqual({ stream: "Company Core", companyFunction: "legal" });
  });

  it("does not route personal documents into a company stream", () => {
    expect(suggestRouting({ docType: "invoice", domain: "PERSONAL" })).toEqual({});
  });

  it("routes mixed and unknown documents to admin regardless of document type", () => {
    expect(suggestRouting({ docType: "invoice", domain: "MIXED" })).toEqual({ stream: "Company Core", companyFunction: "admin" });
    expect(suggestRouting({ docType: "contract", domain: "UNKNOWN" })).toEqual({ stream: "Company Core", companyFunction: "admin" });
  });
});

describe("buildIntakeTriage", () => {
  it("builds a full business invoice triage with an approval-ready proposed action", () => {
    const triage = buildIntakeTriage({
      filename: "acme-invoice-1024.pdf",
      text: "TAX INVOICE ABN 12 345 678 901. Amount due. Supplier Acme Pty Ltd. GST included.",
      now: new Date("2026-06-28T00:00:00Z")
    });

    expect(triage.domain).toBe("BUSINESS");
    expect(triage.docType).toBe("invoice");
    expect(triage.disposition).toBe("ACTION");
    expect(triage.proposedAction.stream).toBe("Company Core");
    expect(triage.proposedAction.companyFunction).toBe("finance");
    expect(triage.proposedAction.domain).toBe("BUSINESS");
    expect(triage.proposedAction.priority).toBe("HIGH");
    expect(triage.proposedAction.status).toBe("OPEN");
    expect(triage.proposedAction.sensitive).toBe(true);
    expect(triage.proposedAction.title).toContain("Invoice");
    expect(triage.proposedAction.description).toContain("2026-06-28");
  });

  it("keeps a personal document out of company routing", () => {
    const triage = buildIntakeTriage({
      filename: "rates-notice.pdf",
      text: "Council rates notice. Payment due. Personal residence."
    });
    expect(triage.domain).toBe("PERSONAL");
    expect(triage.proposedAction.stream).toBeUndefined();
    expect(triage.proposedAction.companyFunction).toBeUndefined();
    expect(triage.proposedAction.domain).toBe("PERSONAL");
  });
});

describe("parseIntakeExtraction", () => {
  it("parses a valid extraction payload", () => {
    const { extraction, error } = parseIntakeExtraction(
      JSON.stringify({ summary: "Invoice from Acme", domain: "BUSINESS", amount: "$420.00", dueDate: "2026-07-15", sensitive: true })
    );
    expect(error).toBeUndefined();
    expect(extraction?.summary).toBe("Invoice from Acme");
    expect(extraction?.dueDate).toBe("2026-07-15");
  });

  it("drops an empty due date string", () => {
    const { extraction } = parseIntakeExtraction(JSON.stringify({ summary: "x", dueDate: "" }));
    expect(extraction?.dueDate).toBeUndefined();
  });

  it("returns an error for invalid JSON", () => {
    const { extraction, error } = parseIntakeExtraction("not json");
    expect(extraction).toBeUndefined();
    expect(error).toBeTruthy();
  });

  it("treats present-but-null optional fields as omitted instead of failing", () => {
    const { extraction, error } = parseIntakeExtraction(JSON.stringify({ summary: "Invoice", domain: "BUSINESS", dueDate: null, amount: null }));
    expect(error).toBeUndefined();
    expect(extraction?.summary).toBe("Invoice");
    expect(extraction?.domain).toBe("BUSINESS");
    expect(extraction?.dueDate).toBeUndefined();
  });

  it("accepts a lower/mixed-case domain from the model and upcases it", () => {
    const { extraction, error } = parseIntakeExtraction(JSON.stringify({ summary: "Personal letter", domain: "personal" }));
    expect(error).toBeUndefined();
    expect(extraction?.domain).toBe("PERSONAL");
    expect(extraction?.summary).toBe("Personal letter");
  });

  it("drops an unrecognised domain rather than discarding the rest of the extraction", () => {
    const { extraction, error } = parseIntakeExtraction(JSON.stringify({ summary: "Useful summary", domain: "corporate", dueDate: "2026-07-15" }));
    expect(error).toBeUndefined();
    expect(extraction?.domain).toBeUndefined();
    expect(extraction?.summary).toBe("Useful summary");
    expect(extraction?.dueDate).toBe("2026-07-15");
  });

  it("coerces a string sensitive flag instead of discarding the extraction", () => {
    const { extraction, error } = parseIntakeExtraction(JSON.stringify({ summary: "Invoice", domain: "BUSINESS", sensitive: "true" }));
    expect(error).toBeUndefined();
    expect(extraction?.sensitive).toBe(true);
    expect(extraction?.summary).toBe("Invoice");

    const falsey = parseIntakeExtraction(JSON.stringify({ summary: "Flyer", sensitive: "false" }));
    expect(falsey.extraction?.sensitive).toBe(false);
  });

  it("parses an extraction wrapped in a Markdown code fence", () => {
    const fenced = "```json\n" + JSON.stringify({ summary: "Fenced invoice", domain: "BUSINESS", dueDate: "2026-07-15" }) + "\n```";
    const { extraction, error } = parseIntakeExtraction(fenced);
    expect(error).toBeUndefined();
    expect(extraction?.summary).toBe("Fenced invoice");
    expect(extraction?.domain).toBe("BUSINESS");
    expect(extraction?.dueDate).toBe("2026-07-15");
  });

  it("coerces a numeric amount to a string instead of discarding the extraction", () => {
    const { extraction, error } = parseIntakeExtraction(JSON.stringify({ summary: "Invoice", domain: "BUSINESS", amount: 420.5 }));
    expect(error).toBeUndefined();
    expect(extraction?.amount).toBe("420.5");
    expect(extraction?.summary).toBe("Invoice");
    expect(extraction?.domain).toBe("BUSINESS");
  });

  it("drops a wrong-shaped optional scalar (object) rather than failing the whole object", () => {
    const { extraction, error } = parseIntakeExtraction(JSON.stringify({ summary: "Invoice", party: { name: "Acme" }, amount: "$10" }));
    expect(error).toBeUndefined();
    expect(extraction?.summary).toBe("Invoice");
    expect(extraction?.party).toBeUndefined();
    expect(extraction?.amount).toBe("$10");
  });

  it("drops an invalid optional date rather than discarding the rest of the extraction", () => {
    const { extraction, error } = parseIntakeExtraction(
      JSON.stringify({ summary: "Invoice", domain: "BUSINESS", suggestedTitle: "Pay Acme", dueDate: "2026-13-45", documentDate: "not-a-date" })
    );
    expect(error).toBeUndefined();
    expect(extraction?.summary).toBe("Invoice");
    expect(extraction?.domain).toBe("BUSINESS");
    expect(extraction?.suggestedTitle).toBe("Pay Acme");
    expect(extraction?.dueDate).toBeUndefined();
    expect(extraction?.documentDate).toBeUndefined();
  });
});

describe("mergeExtractionIntoTriage", () => {
  it("fills an unknown domain from a confident AI extraction and enriches the action", () => {
    const base = buildIntakeTriage({ filename: "scan001.pdf", text: "ambiguous" });
    expect(base.domain).toBe("UNKNOWN");

    const merged = mergeExtractionIntoTriage(base, {
      domain: "BUSINESS",
      summary: "Supplier invoice for hosting",
      dueDate: "2026-07-01",
      suggestedTitle: "Pay hosting invoice",
      suggestedNextStep: "Approve and schedule payment"
    });

    expect(merged.domain).toBe("BUSINESS");
    expect(merged.proposedAction.title).toBe("Pay hosting invoice");
    expect(merged.proposedAction.dueDate).toBe("2026-07-01");
    expect(merged.proposedAction.companyFunction).toBe("admin");
    expect(merged.proposedAction.description).toContain("Local AI summary");
    // An AI-filled domain gets a supporting confidence, not the heuristic's 0, so
    // the queue never shows "Domain: Business (confidence 0)".
    expect(base.domainConfidence).toBe(0);
    expect(merged.domainConfidence).toBeGreaterThanOrEqual(0.6);
    expect(merged.proposedAction.description).toContain("Domain: Business (confidence 0.6)");
    expect(merged.proposedAction.description).not.toContain("Domain: Business (confidence 0)");
  });

  it("never downgrades sensitivity and keeps the heuristic domain when already known", () => {
    const base = buildIntakeTriage({ filename: "invoice.pdf", text: "tax invoice abn gst" });
    const merged = mergeExtractionIntoTriage(base, { domain: "PERSONAL", sensitive: false });
    expect(merged.domain).toBe("BUSINESS");
    expect(merged.proposedAction.sensitive).toBe(true);
  });

  it("returns the triage unchanged when there is no extraction", () => {
    const base = buildIntakeTriage({ filename: "invoice.pdf", text: "tax invoice" });
    expect(mergeExtractionIntoTriage(base, undefined)).toEqual(base);
  });

  it("adopts a confident extracted docType when heuristics found none and recomputes routing/disposition/priority", () => {
    const base = buildIntakeTriage({ filename: "scan001.pdf", text: "blurry text" });
    expect(base.docType).toBe("unknown");
    expect(base.disposition).toBe("UNSURE");

    const merged = mergeExtractionIntoTriage(base, { domain: "BUSINESS", docType: "tax invoice" });

    expect(merged.docType).toBe("invoice");
    expect(merged.disposition).toBe("ACTION");
    expect(merged.proposedAction.priority).toBe("HIGH");
    expect(merged.proposedAction.companyFunction).toBe("finance");
  });

  it("rebuilds the description and summary when extraction adopts a docType/domain", () => {
    const base = buildIntakeTriage({ filename: "scan001.pdf", text: "blurry" });
    expect(base.proposedAction.description).toContain("Document type: Document");
    expect(base.proposedAction.description).toContain("Proposed disposition: UNSURE");

    const merged = mergeExtractionIntoTriage(base, { domain: "BUSINESS", docType: "tax invoice" });

    // The generated body must not keep naming the pre-merge Unknown/Document/UNSURE.
    expect(merged.proposedAction.description).toContain("Domain: Business");
    expect(merged.proposedAction.description).toContain("Document type: Invoice");
    expect(merged.proposedAction.description).not.toContain("Document type: Document");
    expect(merged.proposedAction.description).not.toContain("Proposed disposition: UNSURE");
    expect(merged.summary.startsWith("Business invoice")).toBe(true);
  });

  it("preserves an ACTION disposition set by action-forcing language when adopting an AI docType", () => {
    const base = buildIntakeTriage({ filename: "scan.pdf", text: "please respond by Friday" });
    expect(base.docType).toBe("unknown");
    expect(base.disposition).toBe("ACTION");

    // "letter" on its own would recompute to UNSURE, but the response deadline
    // the heuristic saw must not be silently dropped from the review queue.
    const merged = mergeExtractionIntoTriage(base, { docType: "letter" });
    expect(merged.docType).toBe("letter");
    expect(merged.disposition).toBe("ACTION");
  });

  it("preserves an urgent HIGH priority from the original text when adopting an AI docType", () => {
    const base = buildIntakeTriage({ filename: "scan.pdf", text: "final notice: overdue balance" });
    expect(base.proposedAction.priority).toBe("HIGH");

    // The recompute for "letter" has no text and would yield MEDIUM; the urgency
    // the heuristic already found must not be downgraded away.
    const merged = mergeExtractionIntoTriage(base, { docType: "letter" });
    expect(merged.docType).toBe("letter");
    expect(merged.proposedAction.priority).toBe("HIGH");
  });

  it("does not override a docType the heuristics already found", () => {
    const base = buildIntakeTriage({ filename: "receipt.jpg", text: "receipt paid in full" });
    expect(base.docType).toBe("receipt");
    const merged = mergeExtractionIntoTriage(base, { docType: "contract" });
    expect(merged.docType).toBe("receipt");
  });

  it("keeps the document issue date in the description, never on the review deadline", () => {
    const base = buildIntakeTriage({ filename: "invoice.pdf", text: "tax invoice abn gst" });
    const merged = mergeExtractionIntoTriage(base, { summary: "Old invoice", documentDate: "2025-01-05", dueDate: "2026-07-20" });

    expect(merged.proposedAction.reviewDate).toBeUndefined();
    expect(merged.proposedAction.dueDate).toBe("2026-07-20");
    expect(merged.proposedAction.description).toContain("Document date: 2025-01-05");
    expect(merged.summary).toContain("Document date: 2025-01-05");
  });
});

describe("normaliseDocType", () => {
  it("passes through known types", () => {
    expect(normaliseDocType("invoice")).toBe("invoice");
    expect(normaliseDocType("CONTRACT")).toBe("contract");
  });

  it("maps synonyms", () => {
    expect(normaliseDocType("Tax Invoice")).toBe("invoice");
    expect(normaliseDocType("bank statement")).toBe("statement");
    expect(normaliseDocType("council rates")).toBe("rates-notice");
  });

  it("returns null for unmappable or empty input", () => {
    expect(normaliseDocType("gibberish")).toBeNull();
    expect(normaliseDocType(undefined)).toBeNull();
    expect(normaliseDocType("")).toBeNull();
  });
});

describe("summariseIntakeQueue", () => {
  it("counts queue items by status and domain", () => {
    const summary = summariseIntakeQueue([
      { status: "CAPTURED", domain: "UNKNOWN" },
      { status: "TRIAGED", domain: "BUSINESS" },
      { status: "IN_REVIEW", domain: "PERSONAL" },
      { status: "FILED", domain: "BUSINESS" },
      { status: "ARCHIVED", domain: "MIXED" },
      { status: "REJECTED", domain: "UNKNOWN" },
      { status: "FAILED", domain: "UNKNOWN" }
    ]);

    expect(summary.total).toBe(7);
    expect(summary.pending).toBe(3);
    expect(summary.needsReview).toBe(2);
    expect(summary.captured).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.filed).toBe(1);
    expect(summary.archived).toBe(1);
    expect(summary.rejected).toBe(1);
    expect(summary.byDomain.BUSINESS).toBe(2);
    expect(summary.byDomain.PERSONAL).toBe(1);
    expect(summary.byDomain.MIXED).toBe(1);
    expect(summary.byDomain.UNKNOWN).toBe(3);
  });
});

describe("buildDocumentIntakeRun", () => {
  it("builds an approval-gated intake run with ingest counts and safety boundaries", () => {
    const run = buildDocumentIntakeRun({ now: new Date("2026-06-28T09:00:00Z"), ingested: 4, duplicates: 1 });

    expect(run.actionsToCreate).toHaveLength(1);
    expect(run.actionsToCreate[0]).toMatchObject({
      title: "Review document intake queue",
      dueAt: "2026-06-28",
      reviewAt: "2026-06-28",
      priority: "HIGH",
      sensitive: true
    });
    expect(run.actionsToCreate[0].description).toContain("Documents pulled into the queue this run: 4.");
    // No oversized files this run, so that line is omitted (not rendered as blank/null).
    expect(run.actionsToCreate[0].description).not.toContain("Oversized files skipped");
    expect(run.responseSummary).toContain("Document intake triage - approved run");
    expect(run.responseSummary).toContain("Safety: APPROVAL_REQUIRED");
    expect(run.responseSummary).toContain("local OCR + Ollama only");
    expect(run.responseSummary).toContain("Duplicates skipped (same content hash): 1.");
    expect(run.responseSummary).toContain("No payment execution");
  });

  it("surfaces oversized skipped files in both the run description and the persisted summary", () => {
    const run = buildDocumentIntakeRun({ now: new Date("2026-06-28T09:00:00Z"), ingested: 1, duplicates: 0, skippedOversize: 2 });
    expect(run.actionsToCreate[0].description).toContain("Oversized files skipped (over the 20MB limit, still in the watched folder): 2.");
    // The run summary is persisted even when no new review action is created, so it
    // must also carry the oversized-skip warning.
    expect(run.responseSummary).toContain("Oversized files skipped (over the 20MB limit, still in the watched folder): 2.");
  });

  it("omits the oversized line from the summary when nothing was skipped", () => {
    const run = buildDocumentIntakeRun({ now: new Date("2026-06-28T09:00:00Z"), ingested: 3, duplicates: 0 });
    expect(run.responseSummary).not.toContain("Oversized files skipped");
  });
});
