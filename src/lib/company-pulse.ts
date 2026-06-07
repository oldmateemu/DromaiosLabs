import { summariseAutomationRuns } from "./automation-history";

export type PulseTone = "neutral" | "positive" | "warning" | "danger";
export type PulseTrend = "up" | "down" | "flat";

export type PulseMetric = {
  key: string;
  label: string;
  value: string;
  detail: string;
  tone: PulseTone;
  trend?: PulseTrend;
};

export type PulseAction = {
  status: string;
  createdAt: Date | string;
  completedAt?: Date | string | null;
  dueAt?: Date | string | null;
};

export type PulseRun = {
  status: string;
};

export type PulseLink = {
  cost?: unknown;
};

export type CompanyPulse = {
  weekStart: string;
  completedThisWeek: number;
  completedLastWeek: number;
  createdThisWeek: number;
  overdueOpen: number;
  openRiskCount: number;
  automationRunCount: number;
  automationSuccessRate: number | null;
  trackedSpend: number;
  pricedSystems: number;
  metrics: PulseMetric[];
};

const CLOSED_STATUSES = new Set(["DONE", "CANCELLED"]);

export function buildCompanyPulse({
  now = new Date(),
  actions,
  automationRuns,
  links,
  openRiskCount
}: {
  now?: Date;
  actions: PulseAction[];
  automationRuns: PulseRun[];
  links: PulseLink[];
  openRiskCount: number;
}): CompanyPulse {
  const weekStart = startOfWeek(now);
  const lastWeekStart = addDays(weekStart, -7);
  const todayKey = dateKey(now);

  let completedThisWeek = 0;
  let completedLastWeek = 0;
  let createdThisWeek = 0;
  let overdueOpen = 0;

  for (const action of actions) {
    const completedAt = toDate(action.completedAt);
    if (completedAt) {
      if (completedAt >= weekStart) completedThisWeek += 1;
      else if (completedAt >= lastWeekStart) completedLastWeek += 1;
    }

    if (toDate(action.createdAt)! >= weekStart) createdThisWeek += 1;

    const dueAt = toDate(action.dueAt);
    if (dueAt && !CLOSED_STATUSES.has(action.status.toUpperCase()) && dateKey(dueAt) < todayKey) {
      overdueOpen += 1;
    }
  }

  const runSummary = summariseAutomationRuns(automationRuns);

  let trackedSpend = 0;
  let pricedSystems = 0;
  for (const link of links) {
    const cost = toNumber(link.cost);
    if (cost !== null && cost > 0) {
      trackedSpend += cost;
      pricedSystems += 1;
    }
  }

  const metrics: PulseMetric[] = [
    {
      key: "completed",
      label: "Completed this week",
      value: String(completedThisWeek),
      detail: completedDetail(completedThisWeek, completedLastWeek),
      tone: completedThisWeek > 0 ? "positive" : "neutral",
      trend: trendOf(completedThisWeek, completedLastWeek)
    },
    {
      key: "created",
      label: "Captured this week",
      value: String(createdThisWeek),
      detail: createdThisWeek === 0 ? "Nothing new captured yet this week." : "New work entering the cockpit this week.",
      tone: "neutral"
    },
    {
      key: "overdue",
      label: "Overdue open",
      value: String(overdueOpen),
      detail: overdueOpen === 0 ? "No open work is past its due date." : "Open actions past their due date.",
      tone: overdueOpen > 0 ? "danger" : "positive"
    },
    {
      key: "risks",
      label: "Open risks",
      value: String(openRiskCount),
      detail: openRiskCount === 0 ? "No open risks recorded." : "Risks still awaiting mitigation or closure.",
      tone: openRiskCount > 0 ? "warning" : "positive"
    },
    {
      key: "automation",
      label: "Automation success",
      value: runSummary.successRate === null ? "—" : `${runSummary.successRate}%`,
      detail:
        runSummary.total === 0
          ? "No automation runs logged yet."
          : `${runSummary.success}/${runSummary.total} recent runs succeeded.`,
      tone: automationTone(runSummary.successRate)
    },
    {
      key: "spend",
      label: "Tracked spend",
      value: formatCurrency(trackedSpend),
      detail:
        pricedSystems === 0
          ? "No launchpad systems have a cost recorded."
          : `Across ${pricedSystems} priced ${pricedSystems === 1 ? "system" : "systems"}.`,
      tone: "neutral"
    }
  ];

  return {
    weekStart: dateKey(weekStart),
    completedThisWeek,
    completedLastWeek,
    createdThisWeek,
    overdueOpen,
    openRiskCount,
    automationRunCount: runSummary.total,
    automationSuccessRate: runSummary.successRate,
    trackedSpend,
    pricedSystems,
    metrics
  };
}

function completedDetail(thisWeek: number, lastWeek: number) {
  if (thisWeek === 0 && lastWeek === 0) return "No completions logged in the last two weeks.";
  const diff = thisWeek - lastWeek;
  if (diff === 0) return `Level with last week (${lastWeek}).`;
  if (diff > 0) return `Up ${diff} on last week (${lastWeek}).`;
  return `Down ${Math.abs(diff)} on last week (${lastWeek}).`;
}

function trendOf(thisWeek: number, lastWeek: number): PulseTrend {
  if (thisWeek > lastWeek) return "up";
  if (thisWeek < lastWeek) return "down";
  return "flat";
}

function automationTone(successRate: number | null): PulseTone {
  if (successRate === null) return "neutral";
  if (successRate >= 90) return "positive";
  if (successRate >= 60) return "warning";
  return "danger";
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(typeof value === "object" && value !== null ? value.toString() : value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function startOfWeek(date: Date) {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = copy.getUTCDay();
  copy.setUTCDate(copy.getUTCDate() + (day === 0 ? -6 : 1 - day));
  return copy;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
