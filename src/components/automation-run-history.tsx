import type { AutomationRunSummary } from "@/lib/automation-history";

type RunHistoryItem = {
  id: string;
  status: string;
  requestSummary: string | null;
  responseSummary: string | null;
  error: string | null;
  createdAt: Date | string;
  automation: { name: string; targetTool: string };
  triggeredBy: { name: string } | null;
};

function statusClass(status: string) {
  if (status === "SUCCESS") return "status-pill status-approved";
  if (status === "BLOCKED") return "status-pill status-draft";
  return "status-pill status-high";
}

function formatWhen(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

export function AutomationRunHistory({ runs, summary }: { runs: RunHistoryItem[]; summary: AutomationRunSummary }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Run history</p>
          <h2>Automation activity</h2>
        </div>
        <p className="muted max-w-xl">Every attempt across all loops, newest first, so blocked and failed runs stay visible.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="metric-card metric-neutral">
          <p className="eyebrow">Recent runs</p>
          <p className="mt-1 text-2xl font-semibold text-command-ink">{summary.total}</p>
        </article>
        <article className={summary.successRate !== null && summary.successRate >= 90 ? "metric-card metric-success" : "metric-card metric-neutral"}>
          <p className="eyebrow">Success rate</p>
          <p className="mt-1 text-2xl font-semibold text-command-ink">{summary.successRate === null ? "—" : `${summary.successRate}%`}</p>
        </article>
        <article className={summary.failed > 0 ? "metric-card metric-danger" : "metric-card metric-neutral"}>
          <p className="eyebrow">Failed</p>
          <p className="mt-1 text-2xl font-semibold text-command-ink">{summary.failed}</p>
        </article>
        <article className={summary.blocked > 0 ? "metric-card metric-warning" : "metric-card metric-neutral"}>
          <p className="eyebrow">Blocked</p>
          <p className="mt-1 text-2xl font-semibold text-command-ink">{summary.blocked}</p>
        </article>
      </div>

      <div className="mt-4 space-y-2">
        {runs.length === 0 ? (
          <p className="empty-state">No automation runs logged yet. Prepare a draft or run an approved loop to start the history.</p>
        ) : (
          runs.map((run) => (
            <article className="action-row" key={run.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-command-ink">{run.automation.name}</p>
                  <p className="muted">
                    {run.requestSummary ?? run.error ?? "Run recorded."}
                    {run.triggeredBy ? ` · by ${run.triggeredBy.name}` : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={statusClass(run.status)}>{run.status}</span>
                  <span className="meta-pill">{formatWhen(run.createdAt)}</span>
                </div>
              </div>
              {run.status !== "SUCCESS" && run.error ? <p className="muted mt-2">{run.error}</p> : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
