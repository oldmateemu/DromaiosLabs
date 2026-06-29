export type RenewalLinkInput = {
  id: string;
  name: string;
  group?: string | null;
  cost?: unknown;
  renewalAt?: Date | string | null;
  riskLevel?: string | null;
};

export type RenewalItem = {
  id: string;
  name: string;
  group: string | null;
  cost: number | null;
  renewalKey: string;
  riskLevel: string | null;
};

export type RenewalMonth = {
  key: string;
  label: string;
  items: RenewalItem[];
  total: number;
  pricedCount: number;
};

export type RenewalCalendar = {
  monthsAhead: number;
  months: RenewalMonth[];
  overdue: RenewalItem[];
  overdueTotal: number;
  windowTotal: number;
  windowCount: number;
  untrackedCount: number;
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

/**
 * Turn launchpad renewal dates and costs into a forward-looking calendar so
 * upcoming spend is never a surprise. Pure and deterministic for testing.
 * Overdue renewals are surfaced separately; everything else is grouped by the
 * month it falls due within the horizon.
 */
export function buildRenewalCalendar({
  now = new Date(),
  links,
  monthsAhead = 6
}: {
  now?: Date;
  links: RenewalLinkInput[];
  monthsAhead?: number;
}): RenewalCalendar {
  const todayKey = dateKey(now);
  const horizonKey = dateKey(endOfMonthAhead(now, monthsAhead));

  const overdue: RenewalItem[] = [];
  const monthMap = new Map<string, RenewalMonth>();

  for (const link of links) {
    const renewal = toDate(link.renewalAt);
    if (!renewal) continue;

    const renewalKey = dateKey(renewal);
    const item: RenewalItem = {
      id: link.id,
      name: link.name,
      group: link.group ?? null,
      cost: toNumber(link.cost),
      renewalKey,
      riskLevel: link.riskLevel ?? null
    };

    if (renewalKey < todayKey) {
      overdue.push(item);
      continue;
    }
    if (renewalKey > horizonKey) continue;

    const monthKey = renewalKey.slice(0, 7);
    let month = monthMap.get(monthKey);
    if (!month) {
      month = { key: monthKey, label: monthLabel(monthKey), items: [], total: 0, pricedCount: 0 };
      monthMap.set(monthKey, month);
    }
    month.items.push(item);
    if (item.cost !== null) {
      month.total += item.cost;
      month.pricedCount += 1;
    }
  }

  const months = [...monthMap.values()].sort((a, b) => a.key.localeCompare(b.key));
  for (const month of months) {
    month.items.sort((a, b) => (a.renewalKey === b.renewalKey ? a.name.localeCompare(b.name) : a.renewalKey.localeCompare(b.renewalKey)));
  }

  overdue.sort((a, b) => (a.renewalKey === b.renewalKey ? a.name.localeCompare(b.name) : a.renewalKey.localeCompare(b.renewalKey)));

  const windowItems = months.flatMap((month) => month.items);
  const windowTotal = windowItems.reduce((sum, item) => sum + (item.cost ?? 0), 0);
  const untrackedCount = windowItems.filter((item) => item.cost === null).length;
  const overdueTotal = overdue.reduce((sum, item) => sum + (item.cost ?? 0), 0);

  return {
    monthsAhead,
    months,
    overdue,
    overdueTotal,
    windowTotal,
    windowCount: windowItems.length,
    untrackedCount
  };
}

export function formatRenewalCurrency(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function monthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map((part) => Number(part));
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function endOfMonthAhead(now: Date, monthsAhead: number) {
  // Last day of the month that is `monthsAhead` months from now (inclusive horizon).
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthsAhead + 1, 0));
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

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
