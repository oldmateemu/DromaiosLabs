import type { LaunchpadHealth } from "@/lib/cockpit-insights";

export function LaunchpadHealthPanel({ health }: { health: LaunchpadHealth }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">System control</p>
          <h2>System health</h2>
        </div>
        <p className="muted max-w-xl">A quick check for renewals, ownership, cost visibility, and risky systems.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <HealthMetric
          label="Renewals"
          value={`${health.renewalsDue.length} due / ${health.renewalsSoon.length} soon`}
          tone={health.renewalsDue.length + health.renewalsSoon.length > 0 ? "warning" : "neutral"}
        />
        <HealthMetric
          label="Metadata gaps"
          value={`${health.metadataGaps.length} metadata gaps`}
          tone={health.metadataGaps.length > 0 ? "warning" : "neutral"}
        />
        <HealthMetric label="Missing owners" value={String(health.missingOwners)} tone={health.missingOwners > 0 ? "warning" : "neutral"} />
        <HealthMetric label="Missing costs" value={String(health.missingCosts)} tone={health.missingCosts > 0 ? "warning" : "neutral"} />
        <HealthMetric label="Risk" value={`${health.highRisk.length} high risk`} tone={health.highRisk.length > 0 ? "danger" : "neutral"} />
        <HealthMetric label="Credential notes" value={String(health.credentialNotes)} tone="neutral" />
      </div>
      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        <HealthList title="Renewal attention" items={[...health.renewalsDue, ...health.renewalsSoon]} emptyText="No launchpad renewals need attention in the next 30 days." />
        <HealthList title="Metadata gaps" items={health.metadataGaps} emptyText="Every launchpad record has owner, cost, renewal, and credential context." />
        <HealthList title="Risk attention" items={health.highRisk} emptyText="No high-risk systems are currently marked." />
      </div>
    </section>
  );
}

function HealthMetric({ label, value, tone }: { label: string; value: string; tone: "neutral" | "warning" | "danger" }) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <p className="eyebrow">{label}</p>
      <p className="text-lg font-semibold text-command-ink">{value}</p>
    </article>
  );
}

function HealthList({
  title,
  items,
  emptyText
}: {
  title: string;
  items: Array<{ id: string; name: string; href: string; detail?: string }>;
  emptyText: string;
}) {
  return (
    <div className="rounded-md border border-command-line bg-command-panel p-3">
      <h3 className="text-sm font-semibold text-command-ink">{title}</h3>
      <div className="mt-2 space-y-2">
        {items.length === 0 ? (
          <p className="empty-state">{emptyText}</p>
        ) : (
          items.map((item) => (
            <a className="action-row block" href={item.href} key={item.id}>
              <span className="font-medium text-command-ink">{item.name}</span>
              {item.detail ? <span className="muted mt-1 block">{item.detail}</span> : null}
            </a>
          ))
        )}
      </div>
    </div>
  );
}
