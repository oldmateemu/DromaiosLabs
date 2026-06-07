import type { CompletionTrend } from "@/lib/completion-trend";

export function CompletionTrendPanel({ trend }: { trend: CompletionTrend }) {
  const peak = Math.max(trend.max, 1);
  const direction = trend.thisWeek === trend.lastWeek ? "level with" : trend.thisWeek > trend.lastWeek ? "up on" : "down on";

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Throughput</p>
          <h2>Completion trend</h2>
        </div>
        <p className="muted max-w-xl">Actions completed per week over the last {trend.weeks.length} weeks. This week is {direction} last week.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="metric-card metric-neutral">
          <p className="eyebrow">This week</p>
          <p className="mt-1 text-2xl font-semibold text-command-ink">{trend.thisWeek}</p>
        </article>
        <article className="metric-card metric-neutral">
          <p className="eyebrow">Weekly average</p>
          <p className="mt-1 text-2xl font-semibold text-command-ink">{trend.average}</p>
        </article>
        <article className="metric-card metric-neutral">
          <p className="eyebrow">Total in window</p>
          <p className="mt-1 text-2xl font-semibold text-command-ink">{trend.total}</p>
        </article>
      </div>

      <div className="mt-4 flex items-end gap-2" style={{ height: "140px" }} role="img" aria-label="Weekly completion bar chart">
        {trend.weeks.map((week) => (
          <div className="flex h-full flex-1 flex-col items-center justify-end gap-1" key={week.weekStart}>
            <span className="text-xs font-semibold text-command-muted">{week.count}</span>
            <div
              className="w-full rounded-t-md bg-command-navy"
              style={{ height: `${Math.max((week.count / peak) * 100, week.count > 0 ? 6 : 2)}%` }}
              title={`Week of ${week.weekStart}: ${week.count}`}
            />
            <span className="text-[11px] text-command-muted">{week.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
