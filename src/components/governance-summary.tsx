import Link from "next/link";
import type { GovernanceSummary } from "@/lib/cockpit-insights";
import { humanizeEnum } from "@/lib/domain";

export function GovernanceSummaryPanel({ summary }: { summary: GovernanceSummary }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Governance</p>
          <h2>Risks and decisions</h2>
        </div>
        <span className={summary.riskCount > 0 ? "status-pill status-draft" : "status-pill status-approved"}>
          {summary.headline}
        </span>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-command-ink">Open risks</h3>
          <div className="mt-2 space-y-2">
            {summary.topRisks.length === 0 ? (
              <p className="empty-state">No open risks are recorded. Capture one if a quiet risk is being carried in your head.</p>
            ) : (
              summary.topRisks.map((risk) => (
                <article className="action-row" key={risk.id}>
                  <p className="font-medium text-command-ink">{risk.issue}</p>
                  <p className="muted">{humanizeEnum(risk.severity)} - {humanizeEnum(risk.status)}</p>
                </article>
              ))
            )}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-command-ink">Recent decisions</h3>
          <div className="mt-2 space-y-2">
            {summary.recentDecisions.length === 0 ? (
              <p className="empty-state">No decisions recorded yet. Use governance to keep important calls durable.</p>
            ) : (
              summary.recentDecisions.map((decision) => (
                <article className="action-row" key={decision.id}>
                  <p className="font-medium text-command-ink">{decision.decision}</p>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="mt-4">
        <Link className="button button-secondary" href="/governance">Open governance</Link>
      </div>
    </section>
  );
}
