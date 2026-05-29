import { canAutomationRun, type AutomationSafetyLevel } from "@/lib/automations";

type AutomationRunView = {
  id: string;
  status: string;
  requestSummary: string | null;
  responseSummary: string | null;
  error: string | null;
};

type AutomationView = {
  id: string;
  name: string;
  description: string | null;
  safetyLevel: AutomationSafetyLevel;
  status: string;
  trigger: string;
  targetTool: string;
  webhookUrl: string | null;
  rollbackNote: string | null;
  runs: AutomationRunView[];
};

export function AutomationRegistry({
  automations,
  runAction
}: {
  automations: AutomationView[];
  runAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Registry</p>
          <h2>Registered Loops</h2>
        </div>
        <p className="muted max-w-xl">Manual runs stay explicit: unsafe levels are blocked, approval-required loops need confirmation, and every attempt is logged.</p>
      </div>

      {automations.length === 0 ? (
        <p className="empty-state">No automations registered yet. Start with a draft-only loop that prepares work for review.</p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {automations.map((automation) => (
            <AutomationCard automation={automation} key={automation.id} runAction={runAction} />
          ))}
        </div>
      )}
    </section>
  );
}

function AutomationCard({
  automation,
  runAction
}: {
  automation: AutomationView;
  runAction: (formData: FormData) => Promise<void>;
}) {
  const runCheck = canAutomationRun(automation.safetyLevel, true);
  const missingWebhook = !automation.webhookUrl;
  const inactive = automation.status !== "ACTIVE";
  const canRun = runCheck.allowed && !missingWebhook && !inactive;
  const runBlockReason = inactive
    ? "Paused automations cannot run."
    : missingWebhook
      ? "Add a webhook URL before this can run."
      : runCheck.reason;

  return (
    <article className="action-row">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="eyebrow">{automation.targetTool}</p>
          <h3 className="text-base font-semibold text-command-ink">{automation.name}</h3>
          <p className="muted">{automation.description ?? "No description yet."}</p>
        </div>
        <span className={automation.safetyLevel === "BLOCKED" ? "status-pill status-high" : "meta-pill"}>
          {automation.safetyLevel.replaceAll("_", " ")}
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <span className="meta-pill">Status: {automation.status}</span>
        <span className="meta-pill">Trigger: {automation.trigger}</span>
        <span className="meta-pill">Webhook: {automation.webhookUrl ? "Configured" : "Missing"}</span>
        <span className="meta-pill">Rollback: {automation.rollbackNote ? "Saved" : "Not set"}</span>
      </div>

      <form action={runAction} className="mt-4 rounded-md border border-command-line bg-command-panel p-3">
        <input name="automationId" type="hidden" value={automation.id} />
        {automation.safetyLevel === "APPROVAL_REQUIRED" ? (
          <label className="mb-3 flex items-center gap-2 text-sm font-medium text-command-ink">
            <input name="approved" required type="checkbox" value="true" />
            I approve this manual run
          </label>
        ) : null}
        {canRun ? (
          <button className="button button-primary" type="submit">
            {automation.safetyLevel === "TRUSTED_LOOP" ? "Run trusted loop" : "Run with approval"}
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-command-muted">{runBlockReason}</p>
            <button className="button button-secondary" disabled type="button">Not runnable</button>
          </div>
        )}
      </form>

      <div className="mt-4">
        <p className="text-sm font-semibold text-command-ink">Recent run logs</p>
        <div className="mt-2 space-y-2">
          {automation.runs.length === 0 ? (
            <p className="empty-state">No run logs yet.</p>
          ) : (
            automation.runs.map((run) => (
              <div className="rounded-md border border-command-line bg-white px-3 py-2" key={run.id}>
                <p className="text-sm font-medium text-command-ink">{run.status}</p>
                <p className="muted">{run.error ?? run.responseSummary ?? run.requestSummary ?? "Run recorded."}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </article>
  );
}
