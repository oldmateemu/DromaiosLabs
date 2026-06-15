import type { MomentumTone, ReviewMomentum } from "@/lib/review-momentum";

const TONE_CLASS: Record<MomentumTone, string> = {
  neutral: "metric-card metric-neutral",
  positive: "metric-card metric-success",
  warning: "metric-card metric-warning"
};

export function ReviewMomentumPanel({ momentum }: { momentum: ReviewMomentum }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Since last review</p>
          <h2>What changed {momentum.hasPrevious ? "since the last review" : "so far"}</h2>
        </div>
        <p className="muted max-w-xl">
          {momentum.hasPrevious
            ? `Bring this into the next review. Counted ${momentum.sinceLabel}.`
            : "Run your first review to start tracking momentum between checkpoints."}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {momentum.cards.map((card) => (
          <article className={TONE_CLASS[card.tone]} key={card.key}>
            <p className="eyebrow">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold text-command-ink">{card.value}</p>
            <p className="muted mt-1">{card.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
