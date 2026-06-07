export type PortfolioTone = "neutral" | "positive" | "warning" | "danger";

export type StreamRef = {
  id: string;
  name: string;
};

export type PortfolioActionInput = {
  status: string;
  streamId?: string | null;
  dueAt?: Date | string | null;
  completedAt?: Date | string | null;
};

export type PortfolioRiskInput = {
  streamId?: string | null;
  status: string;
  severity: string;
};

export type StreamHealth = {
  id: string;
  name: string;
  openActions: number;
  overdue: number;
  blocked: number;
  dueThisWeek: number;
  completedThisWeek: number;
  openRisks: number;
  highRisks: number;
  attentionScore: number;
  tone: PortfolioTone;
  headline: string;
};

const CLOSED_STATUSES = new Set(["DONE", "CANCELLED"]);
const CLOSED_RISK_STATUSES = new Set(["CLOSED", "RESOLVED", "DONE"]);
const UNASSIGNED_ID = "__unassigned__";

/**
 * Roll every stream up into an operating-health snapshot so a founder running
 * several ventures can see, at a glance, which one needs attention next.
 * Pure and deterministic for unit testing. Sorted by attention score so the
 * stream most in need of a decision is first.
 */
export function buildStreamPortfolio({
  now = new Date(),
  streams,
  actions,
  risks
}: {
  now?: Date;
  streams: StreamRef[];
  actions: PortfolioActionInput[];
  risks: PortfolioRiskInput[];
}): StreamHealth[] {
  const todayKey = dateKey(now);
  const weekStart = startOfWeek(now);
  const weekEndKey = dateKey(addDays(weekStart, 6));

  const buckets = new Map<string, StreamHealth>();
  const ensure = (id: string, name: string) => {
    let bucket = buckets.get(id);
    if (!bucket) {
      bucket = {
        id,
        name,
        openActions: 0,
        overdue: 0,
        blocked: 0,
        dueThisWeek: 0,
        completedThisWeek: 0,
        openRisks: 0,
        highRisks: 0,
        attentionScore: 0,
        tone: "neutral",
        headline: ""
      };
      buckets.set(id, bucket);
    }
    return bucket;
  };

  for (const stream of streams) ensure(stream.id, stream.name);

  for (const action of actions) {
    const id = action.streamId ?? UNASSIGNED_ID;
    const name = action.streamId ? streamName(streams, action.streamId) : "Unassigned";
    if (!name) continue;
    const bucket = ensure(id, name);
    const status = action.status.toUpperCase();

    const completedAt = toDate(action.completedAt);
    if (status === "DONE") {
      if (completedAt && dateKey(completedAt) >= dateKey(weekStart)) bucket.completedThisWeek += 1;
      continue;
    }
    if (CLOSED_STATUSES.has(status)) continue;

    bucket.openActions += 1;
    if (status === "BLOCKED") bucket.blocked += 1;

    const dueAt = toDate(action.dueAt);
    if (dueAt) {
      const dueKey = dateKey(dueAt);
      if (dueKey < todayKey) bucket.overdue += 1;
      else if (dueKey <= weekEndKey) bucket.dueThisWeek += 1;
    }
  }

  for (const risk of risks) {
    if (CLOSED_RISK_STATUSES.has(risk.status.toUpperCase())) continue;
    const id = risk.streamId ?? UNASSIGNED_ID;
    const name = risk.streamId ? streamName(streams, risk.streamId) : "Unassigned";
    if (!name) continue;
    const bucket = ensure(id, name);
    bucket.openRisks += 1;
    const severity = risk.severity.toUpperCase();
    if (severity === "HIGH" || severity === "CRITICAL") bucket.highRisks += 1;
  }

  const result = [...buckets.values()].map((bucket) => {
    bucket.attentionScore =
      bucket.overdue * 4 +
      bucket.highRisks * 3 +
      bucket.blocked * 2 +
      bucket.openRisks * 2 +
      bucket.dueThisWeek;
    bucket.tone = toneFor(bucket);
    bucket.headline = headlineFor(bucket);
    return bucket;
  });

  return result.sort((a, b) => {
    if (b.attentionScore !== a.attentionScore) return b.attentionScore - a.attentionScore;
    if (b.openActions !== a.openActions) return b.openActions - a.openActions;
    return a.name.localeCompare(b.name);
  });
}

function toneFor(bucket: StreamHealth): PortfolioTone {
  if (bucket.overdue > 0 || bucket.highRisks > 0) return "danger";
  if (bucket.blocked > 0 || bucket.openRisks > 0 || bucket.dueThisWeek > 0) return "warning";
  if (bucket.completedThisWeek > 0) return "positive";
  return "neutral";
}

function headlineFor(bucket: StreamHealth): string {
  if (bucket.overdue > 0) return `${bucket.overdue} overdue ${plural(bucket.overdue, "action")} need a decision`;
  if (bucket.highRisks > 0) return `${bucket.highRisks} high ${plural(bucket.highRisks, "risk")} open`;
  if (bucket.blocked > 0) return `${bucket.blocked} blocked ${plural(bucket.blocked, "action")} to unblock`;
  if (bucket.dueThisWeek > 0) return `${bucket.dueThisWeek} due this week`;
  if (bucket.openRisks > 0) return `${bucket.openRisks} open ${plural(bucket.openRisks, "risk")} to watch`;
  if (bucket.openActions > 0) return `${bucket.openActions} open ${plural(bucket.openActions, "action")}, on track`;
  if (bucket.completedThisWeek > 0) return `${bucket.completedThisWeek} completed this week`;
  return "Quiet — nothing pressing";
}

function plural(count: number, word: string) {
  return count === 1 ? word : `${word}s`;
}

function streamName(streams: StreamRef[], id: string) {
  return streams.find((stream) => stream.id === id)?.name ?? null;
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
