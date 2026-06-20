import { formatRenewalCurrency } from "@/lib/renewal-calendar";
import type { StreamSpendBreakdown } from "@/lib/stream-spend";

export function StreamSpendPanel({ spend }: { spend: StreamSpendBreakdown }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Cost by venture</p>
          <h2>Spend by stream</h2>
        </div>
        <span className="status-pill status-approved">{formatRenewalCurrency(spend.grandTotal)} tracked</span>
      </div>

      {spend.streams.length === 0 ? (
        <p className="empty-state">No priced systems are assigned to a stream yet. Add a cost and stream to a launchpad system to see spend per venture.</p>
      ) : (
        <div className="space-y-3">
          {spend.streams.map((stream) => (
            <div key={stream.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-command-ink">{stream.name}</p>
                <p className="text-sm font-semibold text-command-ink">
                  {formatRenewalCurrency(stream.total)} <span className="muted font-normal">· {stream.share}%</span>
                </p>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-command-panel">
                <div className="h-full rounded-full bg-command-navy" style={{ width: `${Math.max(stream.share, 2)}%` }} />
              </div>
              <p className="muted mt-1">{stream.pricedCount} priced {stream.pricedCount === 1 ? "system" : "systems"}</p>
            </div>
          ))}
        </div>
      )}

      {spend.unpricedCount > 0 ? (
        <p className="muted mt-4">{spend.unpricedCount} {spend.unpricedCount === 1 ? "system has" : "systems have"} no cost recorded and are excluded from this total.</p>
      ) : null}
    </section>
  );
}
