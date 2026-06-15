import type { CompanyPulse } from "./company-pulse";
import type { StreamHealth } from "./stream-portfolio";

export type DigestAction = {
  title: string;
  status: string;
  priority: string;
  streamName?: string | null;
  dueKey?: string | null;
};

export type DigestRisk = {
  issue: string;
  severity: string;
  status: string;
};

export type DigestDecision = {
  decision: string;
  decidedAt: Date | string;
};

export type DigestRenewal = {
  name: string;
  renewalKey?: string | null;
};

export type DigestRenewalForecast = {
  total: number;
  count: number;
  monthsAhead: number;
};

export type OperatingDigestInput = {
  generatedAt?: Date;
  pulse: CompanyPulse;
  portfolio: StreamHealth[];
  topActions: DigestAction[];
  openRisks: DigestRisk[];
  recentDecisions: DigestDecision[];
  renewalsDue: DigestRenewal[];
  renewalForecast?: DigestRenewalForecast;
};

/**
 * Render a board/records-ready Markdown operating digest from already-assembled
 * cockpit data. Pure so the exact output can be asserted in tests.
 */
export function buildOperatingDigest({
  generatedAt = new Date(),
  pulse,
  portfolio,
  topActions,
  openRisks,
  recentDecisions,
  renewalsDue,
  renewalForecast
}: OperatingDigestInput): string {
  const lines: string[] = [];
  const stamp = generatedAt.toISOString().slice(0, 10);

  lines.push("# Dromaios Labs — Operating Digest");
  lines.push("");
  lines.push(`_Generated ${stamp} · week of ${pulse.weekStart}_`);
  lines.push("");

  lines.push("## Company pulse");
  lines.push("");
  for (const metric of pulse.metrics) {
    lines.push(`- **${metric.label}:** ${metric.value} — ${metric.detail}`);
  }
  lines.push("");

  lines.push("## Stream portfolio");
  lines.push("");
  if (portfolio.length === 0) {
    lines.push("_No streams recorded._");
  } else {
    for (const stream of portfolio) {
      lines.push(
        `- **${stream.name}:** ${stream.headline} ` +
          `(${stream.openActions} open · ${stream.overdue} overdue · ${stream.blocked} blocked · ${stream.openRisks} risks)`
      );
    }
  }
  lines.push("");

  lines.push("## Priority actions");
  lines.push("");
  if (topActions.length === 0) {
    lines.push("_No open actions._");
  } else {
    for (const action of topActions) {
      const meta = [action.priority, action.streamName ?? null, action.dueKey ? `due ${action.dueKey}` : null]
        .filter(Boolean)
        .join(" · ");
      lines.push(`- [ ] ${action.title} (${meta})`);
    }
  }
  lines.push("");

  lines.push("## Open risks");
  lines.push("");
  if (openRisks.length === 0) {
    lines.push("_No open risks._");
  } else {
    for (const risk of openRisks) {
      lines.push(`- **${risk.severity}** — ${risk.issue} (${risk.status})`);
    }
  }
  lines.push("");

  lines.push("## Upcoming renewals");
  lines.push("");
  if (renewalForecast && renewalForecast.count > 0) {
    lines.push(
      `_Forecast: $${formatAmount(renewalForecast.total)} across ${renewalForecast.count} ` +
        `${renewalForecast.count === 1 ? "renewal" : "renewals"} in the next ${renewalForecast.monthsAhead} months._`
    );
    lines.push("");
  }
  if (renewalsDue.length === 0) {
    lines.push("_No renewals need attention._");
  } else {
    for (const renewal of renewalsDue) {
      lines.push(`- ${renewal.name}${renewal.renewalKey ? ` — ${renewal.renewalKey}` : ""}`);
    }
  }
  lines.push("");

  lines.push("## Recent decisions");
  lines.push("");
  if (recentDecisions.length === 0) {
    lines.push("_No decisions recorded._");
  } else {
    for (const decision of recentDecisions) {
      const when = decision.decidedAt instanceof Date ? decision.decidedAt : new Date(decision.decidedAt);
      const whenKey = Number.isNaN(when.getTime()) ? "unknown date" : when.toISOString().slice(0, 10);
      lines.push(`- ${decision.decision} (${whenKey})`);
    }
  }
  lines.push("");

  return lines.join("\n");
}

function formatAmount(value: number) {
  return value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
