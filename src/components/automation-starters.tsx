import { AutomationSafetyLevel } from "@prisma/client";

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
    targetTool: "n8n or Activepieces",
    description: "Prepares a short digest of open actions that have not moved recently.",
    rollbackNote: "Discard the digest. No company records are changed by the draft loop."
  },
  {
    name: "Renewal reminder",
    safetyLevel: AutomationSafetyLevel.APPROVAL_REQUIRED,
    trigger: "Manual launchpad renewal check",
    targetTool: "webhook",
    description: "Checks launchpad renewal dates and creates reminders only after approval.",
    rollbackNote: "Mark generated reminder actions done or cancelled if the run was not useful."
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
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
            <span className="meta-pill w-fit">{template.safetyLevel.replaceAll("_", " ")}</span>
            <button className="button button-secondary" type="submit">Add starter</button>
          </form>
        ))}
      </div>
    </section>
  );
}
