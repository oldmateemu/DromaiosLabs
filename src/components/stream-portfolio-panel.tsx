import Link from "next/link";
import type { PortfolioTone, StreamHealth } from "@/lib/stream-portfolio";

const TONE_CLASS: Record<PortfolioTone, string> = {
  neutral: "metric-card metric-neutral",
  positive: "metric-card metric-success",
  warning: "metric-card metric-warning",
  danger: "metric-card metric-danger"
};

const TONE_PILL: Record<PortfolioTone, string> = {
  neutral: "status-pill status-approved",
  positive: "status-pill status-approved",
  warning: "status-pill status-draft",
  danger: "status-pill status-high"
};

function actionsHref(stream: StreamHealth) {
  if (stream.id === "__unassigned__") return "/actions";
  return `/actions?${new URLSearchParams({ streamId: stream.id }).toString()}`;
}

export function StreamPortfolioPanel({
  portfolio,
  limit,
  eyebrow = "Portfolio",
  title = "Stream health",
  description = "Every venture rolled up by what needs attention next.",
  showViewAll = false
}: {
  portfolio: StreamHealth[];
  limit?: number;
  eyebrow?: string;
  title?: string;
  description?: string;
  showViewAll?: boolean;
}) {
  const shown = typeof limit === "number" ? portfolio.slice(0, limit) : portfolio;

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        {showViewAll ? (
          <Link className="button button-secondary" href="/portfolio">View portfolio</Link>
        ) : (
          <p className="muted max-w-xl">{description}</p>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="empty-state">No streams recorded yet. Add work to a stream to see its operating health here.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((stream) => (
            <Link className={`${TONE_CLASS[stream.tone]} block transition hover:border-command-navy`} href={actionsHref(stream)} key={stream.id}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-command-ink">{stream.name}</p>
                <span className={TONE_PILL[stream.tone]}>{stream.openActions} open</span>
              </div>
              <p className="muted mt-1">{stream.headline}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {stream.overdue > 0 ? <span className="meta-pill">{stream.overdue} overdue</span> : null}
                {stream.blocked > 0 ? <span className="meta-pill">{stream.blocked} blocked</span> : null}
                {stream.dueThisWeek > 0 ? <span className="meta-pill">{stream.dueThisWeek} due this week</span> : null}
                {stream.openRisks > 0 ? <span className="meta-pill">{stream.openRisks} risks</span> : null}
                {stream.completedThisWeek > 0 ? <span className="meta-pill">{stream.completedThisWeek} done this week</span> : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
