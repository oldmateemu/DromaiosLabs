import { canAutomationRun, type AutomationSafetyLevel } from "@/lib/automations";
import { humanizeEnum } from "@/lib/domain";
import { getLocalDraftAutomationKind } from "@/lib/draft-automations";
import { getLocalApprovalAutomationKind, type LocalApprovalAutomationKind } from "@/lib/renewal-reminders";

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
  prepareDraftAction,
  runAction
}: {
  automations: AutomationView[];
  prepareDraftAction: (formData: FormData) => Promise<void>;
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
            <AutomationCard automation={automation} key={automation.id} prepareDraftAction={prepareDraftAction} runAction={runAction} />
          ))}
        </div>
      )}
    </section>
  );
}

function AutomationCard({
  automation,
  prepareDraftAction,
  runAction
}: {
  automation: AutomationView;
  prepareDraftAction: (formData: FormData) => Promise<void>;
  runAction: (formData: FormData) => Promise<void>;
}) {
  const runCheck = canAutomationRun(automation.safetyLevel, true);
  const missingWebhook = !automation.webhookUrl;
  const inactive = automation.status !== "ACTIVE";
  const localDraftKind = getLocalDraftAutomationKind(automation);
  const localApprovalKind = getLocalApprovalAutomationKind(automation);
  const localApprovalCopy = localApprovalKind ? localApprovalRunCopy(localApprovalKind) : null;
  const canPrepareLocalDraft = !inactive && automation.safetyLevel === "DRAFT_ONLY" && Boolean(localDraftKind);
  const canRunLocalApproval = Boolean(localApprovalKind);
  const canRun = runCheck.allowed && (!missingWebhook || canRunLocalApproval) && !inactive;
  const runBlockReason = inactive
    ? "Paused automations cannot run."
    : !runCheck.allowed
      ? runCheck.reason
      : missingWebhook && !canRunLocalApproval
        ? "Add a webhook URL before this can run."
        : undefined;

  return (
    <article className="action-row">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="eyebrow">{automation.targetTool}</p>
          <h3 className="text-base font-semibold text-command-ink">{automation.name}</h3>
          <p className="muted">{automation.description ?? "No description yet."}</p>
        </div>
        <span className={automation.safetyLevel === "BLOCKED" ? "status-pill status-high" : "meta-pill"}>
          {humanizeEnum(automation.safetyLevel)}
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <span className="meta-pill">Status: {humanizeEnum(automation.status)}</span>
        <span className="meta-pill">Trigger: {automation.trigger}</span>
        <span className="meta-pill">Webhook: {automation.webhookUrl ? "Configured" : "Missing"}</span>
        <span className="meta-pill">Rollback: {automation.rollbackNote ? "Saved" : "Not set"}</span>
      </div>

      {canPrepareLocalDraft ? (
        <form action={prepareDraftAction} className="mt-4 rounded-md border border-command-line bg-command-panel p-3">
          <input name="automationId" type="hidden" value={automation.id} />
          <p className="mb-3 text-sm font-medium text-command-muted">
            External execution stays blocked; this only writes a local draft run log.
          </p>
          <button className="button button-primary" type="submit">Prepare draft locally</button>
        </form>
      ) : (
        <form action={runAction} className="mt-4 rounded-md border border-command-line bg-command-panel p-3">
          <input name="automationId" type="hidden" value={automation.id} />
          {automation.safetyLevel === "APPROVAL_REQUIRED" ? (
            <label className="mb-3 flex items-center gap-2 text-sm font-medium text-command-ink">
              <input name="approved" required type="checkbox" value="true" />
              I approve this manual run
            </label>
          ) : null}
          {localApprovalCopy ? (
            <p className="mb-3 text-sm font-medium text-command-muted">
              {localApprovalCopy}
            </p>
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
      )}

      <div className="mt-4">
        <p className="text-sm font-semibold text-command-ink">Recent run logs</p>
        <div className="mt-2 space-y-2">
          {automation.runs.length === 0 ? (
            <p className="empty-state">No run logs yet.</p>
          ) : (
            automation.runs.map((run) => (
              <div className="rounded-md border border-command-line bg-white px-3 py-2" key={run.id}>
                <p className="text-sm font-medium text-command-ink">{humanizeEnum(run.status)}</p>
                {run.responseSummary ? (
                  <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-md border border-command-line bg-command-panel p-3 text-sm leading-6 text-command-ink">
                    {run.responseSummary}
                  </pre>
                ) : (
                  <p className="muted">{run.error ?? run.requestSummary ?? "Run recorded."}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </article>
  );
}

function localApprovalRunCopy(kind: LocalApprovalAutomationKind) {
  if (kind === "RENEWAL_REMINDER") {
    return "Approval creates local renewal reminders; no webhook is called.";
  }
  return "Approval records the mailroom filing control summary; Gmail, Drive, Sheets, OCR, payments, and Xero stay outside Cockpit.";
}
