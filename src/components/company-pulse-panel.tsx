import type { CompanyPulse, PulseTone, PulseTrend } from "@/lib/company-pulse";

const TONE_CLASS: Record<PulseTone, string> = {
  neutral: "metric-card metric-neutral",
  positive: "metric-card metric-success",
  warning: "metric-card metric-warning",
  danger: "metric-card metric-danger"
};

const TREND_GLYPH: Record<PulseTrend, string> = {
  up: "▲",
  down: "▼",
  flat: "—"
};

export function CompanyPulsePanel({ pulse }: { pulse: CompanyPulse }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Company pulse</p>
          <h2>This week at a glance</h2>
        </div>
        <p className="muted max-w-xl">Throughput, overdue load, governance, automation health, and tracked spend in one read.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {pulse.metrics.map((metric) => (
          <article className={TONE_CLASS[metric.tone]} key={metric.key}>
            <div className="flex items-center justify-between">
              <p className="eyebrow">{metric.label}</p>
              {metric.trend ? (
                <span className="text-xs font-semibold text-command-muted" aria-hidden="true">{TREND_GLYPH[metric.trend]}</span>
              ) : null}
            </div>
            <p className="mt-1 text-2xl font-semibold text-command-ink">{metric.value}</p>
            <p className="muted mt-1">{metric.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
