export type CompanyMailroomFilingActionDraft = {
  title: string;
  description: string;
  priority: "HIGH";
  dueAt: string;
  reviewAt: string;
  nextStep: string;
  sensitive: boolean;
};

export type CompanyMailroomFilingRun = {
  responseSummary: string;
  actionsToCreate: CompanyMailroomFilingActionDraft[];
};

const CONTRACT_DOC_PATH = "docs/workflows/company-mailroom-filing.md";
const CONTRACT_JSON_PATH = "docs/workflows/company-mailroom-filing.contract.json";
const GMAIL_LABELS = ["contract", "receipt", "invoice", "certificate", "insurance", "venue", "course", "software"];
const DRIVE_FOLDERS = [
  "Company Core/Finance/Receipts/Inbox",
  "Company Core/Finance/Receipts/Processed",
  "Company Core/Finance/Invoices/Inbox",
  "Company Core/Admin/Contracts",
  "Company Core/Admin/Insurance",
  "Company Core/Admin/Renewals",
  "Company Core/Automation Logs"
];
const SHEETS = ["Finance Receipt Log", "Supplier Invoice Review", "Automation Exception Log"];

export function buildCompanyMailroomFilingRun({ now = new Date() }: { now?: Date } = {}): CompanyMailroomFilingRun {
  const today = dateKey(now);

  return {
    actionsToCreate: [
      {
        title: "Review Company mailroom filing setup and exceptions",
        description: [
          "Approval-gated setup check for Company mailroom filing.",
          `Workflow contract: ${CONTRACT_DOC_PATH}`,
          `Workflow contract JSON: ${CONTRACT_JSON_PATH}`,
          `Gmail labels: ${GMAIL_LABELS.join(", ")}`,
          `Drive folders: ${DRIVE_FOLDERS.join("; ")}`,
          `Sheets: ${SHEETS.join("; ")}`,
          "Receipt support: labelled receipt attachments file to the receipts quarantine and log source metadata.",
          "Invoice support: labelled invoice attachments file to the invoices quarantine and log source metadata.",
          "OCR is disabled in v1; OCR columns are reserved for later reviewed extraction.",
          "No payment execution, bank rules, BAS/tax lodgement, or Xero writes are permitted."
        ].join("\n"),
        priority: "HIGH",
        dueAt: today,
        reviewAt: today,
        nextStep: `Review ${CONTRACT_DOC_PATH}, install or inspect the Gmail Processor/Apps Script source, then run a 10-20 message quarantine test before promotion.`,
        sensitive: true
      }
    ],
    responseSummary: [
      "Company mailroom filing - approved setup run",
      "",
      `Generated locally: ${today}`,
      "Safety: APPROVAL_REQUIRED. Explicit approval captured. Cockpit did not contact Gmail, Drive, Sheets, OCR, payment, tax, accounting, or Xero systems.",
      `Workflow source: ${CONTRACT_DOC_PATH}`,
      `Workflow contract JSON: ${CONTRACT_JSON_PATH}`,
      "",
      "Receipt and invoice support",
      "- Gmail labels: receipt, invoice, contract, certificate, insurance, venue, course, software.",
      "- Drive receipt quarantine: Company Core/Finance/Receipts/Inbox.",
      "- Drive invoice quarantine: Company Core/Finance/Invoices/Inbox.",
      "- Admin review folders: Company Core/Admin/Contracts; Company Core/Admin/Insurance; Company Core/Admin/Renewals.",
      "- File naming convention: YYYY-MM-DD_vendor_amount_source.ext when metadata is available; otherwise preserve source filename with message ID context.",
      "- Originals stay in Gmail; filed copies stay reviewable in Drive quarantine before any processed/archive promotion.",
      "",
      "Sheets logging",
      "- Finance Receipt Log: source email date, sender, subject, Gmail message ID, attachment filename, attachment hash, Drive file link, amount fields reserved for later OCR.",
      "- Supplier Invoice Review: source email date, sender, subject, Gmail message ID, attachment filename, Drive file link, due-date fields reserved for later OCR.",
      "- Automation Exception Log: missing attachment, unsupported file type, duplicate hash, missing label, or filing failure.",
      "",
      "OCR foundation",
      "- OCR is disabled in v1.",
      "- Reserved columns: merchant_or_supplier, document_date, amount, tax_or_gst, currency, category, due_date, extraction_confidence, reviewer_note.",
      "- OCR may be added only after privacy review and must write drafts or review fields, not final accounting decisions.",
      "",
      "Blocked boundaries",
      "- No payment execution.",
      "- No bank rule changes.",
      "- No BAS, tax, or legal filing.",
      "- No Xero writes.",
      "- No deletion of Gmail originals or Drive quarantine files."
    ].join("\n")
  };
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
