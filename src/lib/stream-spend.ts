export type SpendStreamRef = {
  id: string;
  name: string;
};

export type SpendLinkInput = {
  cost?: unknown;
  streamId?: string | null;
};

export type StreamSpend = {
  id: string;
  name: string;
  total: number;
  pricedCount: number;
  share: number;
};

export type StreamSpendBreakdown = {
  streams: StreamSpend[];
  grandTotal: number;
  pricedCount: number;
  unpricedCount: number;
};

const UNASSIGNED_ID = "__unassigned__";

/**
 * Sum launchpad cost by the stream a system supports, so spend can be read per
 * venture rather than only in aggregate. Pure and deterministic for testing.
 * Streams with no priced systems are dropped; stream-less spend rolls into an
 * "Unassigned" bucket. Sorted by spend, largest first.
 */
export function buildStreamSpend({
  streams,
  links
}: {
  streams: SpendStreamRef[];
  links: SpendLinkInput[];
}): StreamSpendBreakdown {
  const totals = new Map<string, { name: string; total: number; pricedCount: number }>();
  let grandTotal = 0;
  let pricedCount = 0;
  let unpricedCount = 0;

  for (const link of links) {
    const cost = toNumber(link.cost);
    if (cost === null || cost <= 0) {
      unpricedCount += 1;
      continue;
    }

    const id = link.streamId ?? UNASSIGNED_ID;
    const name = link.streamId ? streamName(streams, link.streamId) : "Unassigned";
    if (!name) {
      // Stream id no longer resolves; treat as unassigned rather than dropping spend.
      addTo(totals, UNASSIGNED_ID, "Unassigned", cost);
    } else {
      addTo(totals, id, name, cost);
    }

    grandTotal += cost;
    pricedCount += 1;
  }

  const result = [...totals.entries()].map(([id, value]) => ({
    id,
    name: value.name,
    total: value.total,
    pricedCount: value.pricedCount,
    share: grandTotal > 0 ? Math.round((value.total / grandTotal) * 100) : 0
  }));

  result.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return a.name.localeCompare(b.name);
  });

  return { streams: result, grandTotal, pricedCount, unpricedCount };
}

function addTo(map: Map<string, { name: string; total: number; pricedCount: number }>, id: string, name: string, cost: number) {
  const entry = map.get(id) ?? { name, total: 0, pricedCount: 0 };
  entry.total += cost;
  entry.pricedCount += 1;
  map.set(id, entry);
}

function streamName(streams: SpendStreamRef[], id: string) {
  return streams.find((stream) => stream.id === id)?.name ?? null;
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(typeof value === "object" && value !== null ? value.toString() : value);
  return Number.isFinite(parsed) ? parsed : null;
}
