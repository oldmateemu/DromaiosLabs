export type MomentumTone = "neutral" | "positive" | "warning";

export type MomentumCard = {
  key: string;
  label: string;
  value: string;
  detail: string;
  tone: MomentumTone;
};

export type ReviewMomentum = {
  hasPrevious: boolean;
  sinceKey: string | null;
  days: number | null;
  sinceLabel: string;
  cards: MomentumCard[];
};

/**
 * Summarise what has changed since the last completed review so the next review
 * starts from signal, not a blank page. Pure and deterministic for testing.
 * When there is no prior review, counts are reported "in your records so far".
 */
export function buildReviewMomentum({
  now = new Date(),
  lastReviewAt,
  completedCount,
  createdCount,
  newRiskCount,
  decisionCount
}: {
  now?: Date;
  lastReviewAt: Date | string | null;
  completedCount: number;
  createdCount: number;
  newRiskCount: number;
  decisionCount: number;
}): ReviewMomentum {
  const since = toDate(lastReviewAt);
  const hasPrevious = since !== null;
  const sinceKey = since ? dateKey(since) : null;
  const days = since ? Math.max(0, Math.round((startOfDay(now).getTime() - startOfDay(since).getTime()) / 86_400_000)) : null;
  const sinceLabel = since ? `since the last review on ${sinceKey} (${dayLabel(days!)})` : "in your records so far";

  const cards: MomentumCard[] = [
    {
      key: "completed",
      label: "Actions completed",
      value: String(completedCount),
      detail: completedCount > 0 ? `Closed out ${sinceLabel}.` : `Nothing completed ${sinceLabel}.`,
      tone: completedCount > 0 ? "positive" : "neutral"
    },
    {
      key: "created",
      label: "New actions",
      value: String(createdCount),
      detail: `Captured ${sinceLabel}.`,
      tone: "neutral"
    },
    {
      key: "risks",
      label: "New risks",
      value: String(newRiskCount),
      detail: newRiskCount > 0 ? `Logged ${sinceLabel}.` : `No new risks ${sinceLabel}.`,
      tone: newRiskCount > 0 ? "warning" : "neutral"
    },
    {
      key: "decisions",
      label: "Decisions recorded",
      value: String(decisionCount),
      detail: `Made ${sinceLabel}.`,
      tone: decisionCount > 0 ? "positive" : "neutral"
    }
  ];

  return { hasPrevious, sinceKey, days, sinceLabel, cards };
}

function dayLabel(days: number) {
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
