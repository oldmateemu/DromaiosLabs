import Link from "next/link";
import { dateKey, priorityLabel } from "@/lib/domain";
import {
  setupItemStatusLabel,
  SETUP_BAND_PILL_CLASS,
  type OutstandingSetupItem,
  type SetupReadiness
} from "@/lib/company-setup-checklist";

function dueLabel(item: OutstandingSetupItem) {
  if (item.overdue) return "Overdue";
  if (!item.dueAt) return null;
  return `Due ${dateKey(new Date(item.dueAt))}`;
}

export function SetupProgressPanel({
  readiness,
  outstanding
}: {
  readiness: SetupReadiness;
  outstanding: OutstandingSetupItem[];
}) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Company setup</p>
          <h2>Build-out readiness</h2>
        </div>
        <span className={SETUP_BAND_PILL_CLASS[readiness.band]}>{readiness.headline}</span>
      </div>

      <div className="mt-1 flex flex-wrap gap-2">
        <span className="meta-pill">
          {readiness.done}/{readiness.total} done
        </span>
        <span className="meta-pill">{readiness.percentComplete}% complete</span>
        {readiness.overdue > 0 ? <span className="status-pill status-high">{readiness.overdue} overdue</span> : null}
        {readiness.dueSoon > 0 ? <span className="status-pill status-draft">{readiness.dueSoon} due soon</span> : null}
        {readiness.criticalOutstanding > 0 ? (
          <span className="meta-pill">{readiness.criticalOutstanding} high-priority outstanding</span>
        ) : null}
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${readiness.score}%` }} />
      </div>

      <div className="mt-4 space-y-2">
        {outstanding.length === 0 ? (
          <p className="empty-state">Company setup checklist is complete. Nothing outstanding.</p>
        ) : (
          outstanding.map((item) => {
            const due = dueLabel(item);
            return (
              <article className="action-row" key={item.key}>
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-command-ink">{item.title}</p>
                  <span
                    className={
                      item.priority === "HIGH" || item.priority === "CRITICAL"
                        ? "status-pill status-high"
                        : "meta-pill"
                    }
                  >
                    {priorityLabel(item.priority)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="meta-pill">{item.category}</span>
                  <span className="meta-pill">{setupItemStatusLabel(item.status)}</span>
                  {due ? (
                    <span className={item.overdue ? "status-pill status-high" : "meta-pill"}>{due}</span>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="mt-4">
        <Link className="button button-secondary" href="/setup">
          Open setup checklist
        </Link>
      </div>
    </section>
  );
}
