import Link from "next/link";
import type { OperatingBrief } from "@/lib/operating-brief";

export function OperatingBriefPanel({ brief }: { brief: OperatingBrief }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Daily command brief</p>
          <h2>Company guidance for {brief.generatedFor}</h2>
        </div>
        <p className="muted max-w-xl">A small operating checklist for the work that keeps a one-person company controlled.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {brief.cards.map((card) => (
          <article className="action-column bg-white" key={card.title}>
            <h3 className="text-base">{card.title}</h3>
            <p className="muted mt-2">{card.body}</p>
            <Link className="button button-secondary mt-4" href={card.route}>
              {card.actionLabel}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
