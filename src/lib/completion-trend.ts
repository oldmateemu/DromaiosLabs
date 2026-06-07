export type WeekBar = {
  weekStart: string;
  label: string;
  count: number;
};

export type CompletionTrend = {
  weeks: WeekBar[];
  total: number;
  max: number;
  average: number;
  lastWeek: number;
  thisWeek: number;
};

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Bucket completed-action timestamps into the last N ISO weeks (Monday start)
 * so throughput can be read as a trend, not just a single week. Pure and
 * deterministic; weeks run oldest-first for left-to-right charting.
 */
export function buildCompletionTrend({
  now = new Date(),
  completedAts,
  weeks = 8
}: {
  now?: Date;
  completedAts: Array<Date | string | null | undefined>;
  weeks?: number;
}): CompletionTrend {
  const span = Math.max(1, weeks);
  const currentWeekStart = startOfWeek(now);
  const bars: WeekBar[] = [];
  const indexByKey = new Map<string, number>();

  for (let i = span - 1; i >= 0; i--) {
    const weekStart = addDays(currentWeekStart, -7 * i);
    const key = dateKey(weekStart);
    indexByKey.set(key, bars.length);
    bars.push({ weekStart: key, label: monthDayLabel(key), count: 0 });
  }

  for (const value of completedAts) {
    const date = toDate(value);
    if (!date) continue;
    const key = dateKey(startOfWeek(date));
    const index = indexByKey.get(key);
    if (index !== undefined) bars[index].count += 1;
  }

  const total = bars.reduce((sum, bar) => sum + bar.count, 0);
  const max = bars.reduce((peak, bar) => Math.max(peak, bar.count), 0);
  const average = Math.round((total / span) * 10) / 10;

  return {
    weeks: bars,
    total,
    max,
    average,
    thisWeek: bars[bars.length - 1]?.count ?? 0,
    lastWeek: bars.length >= 2 ? bars[bars.length - 2].count : 0
  };
}

function monthDayLabel(key: string) {
  const [, month, day] = key.split("-").map((part) => Number(part));
  return `${MONTH_ABBR[month - 1]} ${day}`;
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
