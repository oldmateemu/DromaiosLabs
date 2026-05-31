import Link from "next/link";
import type { FocusSetItem, NextBestAction } from "@/lib/cockpit-insights";
import type { ActionLike, TodayBuckets } from "@/lib/domain";
import { priorityLabel, statusLabel } from "@/lib/domain";

type TodayBoardProps = {
  buckets: TodayBuckets<ActionLike>;
  nextAction: NextBestAction;
  focusSet: FocusSetItem[];
  quickCaptureAction: (formData: FormData) => Promise<void>;
};

export function TodayBoard({ buckets, nextAction, focusSet, quickCaptureAction }: TodayBoardProps) {
  return (
    <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Command</p>
            <h1>Today Command Board</h1>
          </div>
          <p className="status-pill status-high">{buckets.overdue.length} overdue</p>
        </div>

        <div className={`next-action next-action-${nextAction.tone}`}>
          <div>
            <p className="eyebrow">Next best action</p>
            <h2>{nextAction.title}</h2>
            <p className="muted mt-1">{nextAction.body}</p>
          </div>
          <Link className="button button-primary" href={nextAction.href}>
            {nextAction.label}
          </Link>
        </div>

        <div className="mt-4 rounded-lg border border-command-line bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-command-ink">Daily focus set</h2>
            <span className="meta-pill">Control / revenue / strategy</span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {focusSet.map((item) => (
              <Link className="focus-card" href={item.href} key={item.label}>
                <p className="eyebrow">{item.label}</p>
                <p className="text-sm font-semibold text-command-ink">
                  {item.actionTitle ? `Selected: ${item.actionTitle}` : item.emptyText}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <ActionColumn title="Overdue" tone="danger" actions={buckets.overdue} emptyText="No overdue work. Keep it that way before opening new loops." />
          <ActionColumn title="Due today" tone="warning" actions={buckets.dueToday} emptyText="No due-today commitments. Pull from the focus set if you have capacity." />
          <ActionColumn title="Blocked" tone="blocked" actions={buckets.blocked} emptyText="No blocked work. Use this lane only for genuine dependencies." />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <ActionColumn title="Upcoming" actions={buckets.upcoming.slice(0, 6)} emptyText="No upcoming work. Capture the next controlled company step." />
          <ActionColumn title="Waiting" actions={buckets.waiting.slice(0, 6)} emptyText="No waiting work. Check review dates or capture a loose end." />
          <ActionColumn title="Recently completed" actions={buckets.completed.slice(0, 6)} emptyText="No completions logged yet. Close one small loop before adding more." />
        </div>
      </div>

      <aside className="panel panel-muted">
        <p className="eyebrow">Assistant</p>
        <h2>Quick Capture</h2>
        <p className="muted">
          Type the rough note. The local assistant will draft structure, but you approve anything that becomes work.
        </p>
        <form action={quickCaptureAction} className="mt-4 space-y-3">
          <label className="field-label" htmlFor="quick-capture">
            Quick capture
          </label>
          <textarea
            id="quick-capture"
            name="text"
            rows={6}
            className="text-area"
            placeholder="Follow up Perth course enquiry next week and check if the venue needs an invoice..."
          />
          <button className="button button-primary" type="submit">
            Draft action
          </button>
        </form>
      </aside>
    </section>
  );
}

function ActionColumn({
  title,
  actions,
  emptyText,
  tone = "neutral"
}: {
  title: string;
  actions: ActionLike[];
  emptyText: string;
  tone?: "neutral" | "danger" | "warning" | "blocked";
}) {
  return (
    <div className="action-column">
      <div className="flex items-center justify-between gap-3">
        <h3>{title}</h3>
        <span className={`count-pill count-${tone}`}>{actions.length}</span>
      </div>
      <div className="mt-3 space-y-2">
        {actions.length === 0 ? (
          <p className="empty-state">{emptyText}</p>
        ) : (
          actions.map((action) => (
            <article className="action-row" key={action.id}>
              <p className="font-medium text-command-ink">{action.title}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="meta-pill">{priorityLabel(action.priority)}</span>
                <span className="meta-pill">{statusLabel(action.status)}</span>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
