import { AutomationSafetyLevel } from "@prisma/client";
import { humanizeEnum } from "@/lib/domain";

const templates = [
  {
    name: "Weekly review prep",
    safetyLevel: AutomationSafetyLevel.DRAFT_ONLY,
    trigger: "Manual weekly review prep",
    targetTool: "local cockpit",
    description: "Drafts a local weekly review checklist from overdue work, stale actions, renewals, drafts, and risks.",
    rollbackNote: "Delete the draft run log if it is not useful. No company records are changed by the draft loop."
  },
  {
    name: "Stale task summary",
    safetyLevel: AutomationSafetyLevel.DRAFT_ONLY,
    trigger: "Manual stale action scan",
    targetTool: "local cockpit",
    description: "Drafts a local digest of open actions that have not moved recently.",
    rollbackNote: "Discard the digest. No company records are changed by the draft loop."
  },
  {
    name: "Daily inbox triage",
    safetyLevel: AutomationSafetyLevel.DRAFT_ONLY,
    trigger: "Weekday inbox digest",
    targetTool: "local cockpit",
    description: "Drafts a local inbox triage digest across action needed, waiting, receipt/invoice, lead, FYI, and noise buckets.",
    rollbackNote: "Discard the digest. No Gmail draft is created, no email is sent, and no external records are changed."
  },
  {
    name: "Renewal reminder",
    safetyLevel: AutomationSafetyLevel.APPROVAL_REQUIRED,
    trigger: "Manual launchpad renewal check",
    targetTool: "local cockpit",
    description: "Checks launchpad renewal dates and creates reminders only after approval.",
    rollbackNote: "Mark generated reminder actions done or cancelled if the run was not useful."
  },
  {
    name: "Company mailroom filing",
    safetyLevel: AutomationSafetyLevel.APPROVAL_REQUIRED,
    trigger: "Manual Gmail/Drive/Sheets filing review",
    targetTool: "Gmail Processor / Apps Script",
    description: "Files labelled Gmail attachments into Drive quarantine folders and Sheets review logs for contracts, receipts, invoices, and admin documents.",
    rollbackNote: "Disable Gmail labels or the Apps Script trigger. Originals remain in Gmail and Drive quarantine; no payments or Xero writes are made."
  },
  {
    name: "Document intake triage",
    safetyLevel: AutomationSafetyLevel.APPROVAL_REQUIRED,
    trigger: "Manual scan triage",
    targetTool: "local cockpit",
    description: "Pulls scanned/emailed documents into the intake review queue, reads them locally (OCR + Ollama), and triages Business vs Personal for approval.",
    rollbackNote: "Documents stay in the queue until you approve, archive, or reject them. No action is created without approval and nothing leaves the box."
  },
  {
    name: "Lead follow-up draft",
    safetyLevel: AutomationSafetyLevel.DRAFT_ONLY,
    trigger: "Manual sales follow-up prep",
    targetTool: "n8n or Activepieces",
    description: "Drafts follow-up text or proposed actions for sales and course enquiries without sending anything.",
    rollbackNote: "Discard drafts. Nothing is sent or posted by this starter."
  }
];

export function AutomationStarterTemplates({ action }: { action: (formData: FormData) => Promise<void> }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Safe loops</p>
          <h2>Starter templates</h2>
        </div>
        <p className="muted max-w-xl">Start with governed routines that prepare work or require approval before changing anything.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <form action={action} className="action-row flex flex-col gap-3" key={template.name}>
            <input name="name" type="hidden" value={template.name} />
            <input name="safetyLevel" type="hidden" value={template.safetyLevel} />
            <input name="trigger" type="hidden" value={template.trigger} />
            <input name="targetTool" type="hidden" value={template.targetTool} />
            <input name="description" type="hidden" value={template.description} />
            <input name="rollbackNote" type="hidden" value={template.rollbackNote} />
            <div className="flex-1">
              <p className="font-semibold text-command-ink">{template.name}</p>
              <p className="muted mt-1">{template.description}</p>
            </div>
            <span className="meta-pill w-fit">{humanizeEnum(template.safetyLevel)}</span>
            <button className="button button-secondary" type="submit">Add starter</button>
          </form>
        ))}
      </div>
    </section>
  );
}
