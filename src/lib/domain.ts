import { z } from "zod";

export type ActionStatus = "OPEN" | "IN_PROGRESS" | "BLOCKED" | "WAITING" | "DONE" | "CANCELLED";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ActionSource = "USER" | "ASSISTANT" | "REVIEW" | "AUTOMATION" | "LAUNCHPAD";

export type ActionLike = {
  id: string;
  title: string;
  status: ActionStatus;
  priority: Priority;
  dueAt: Date | string | null;
  stream?: { name: string } | null;
  companyFunction?: { name: string } | null;
};

export type TodayBuckets<T extends ActionLike = ActionLike> = {
  overdue: T[];
  dueToday: T[];
  upcoming: T[];
  blocked: T[];
  waiting: T[];
  completed: T[];
};

export type ProposedAction = {
  title: string;
  description?: string;
  stream?: string;
  companyFunction?: string;
  priority: Priority;
  status: Extract<ActionStatus, "OPEN" | "IN_PROGRESS" | "BLOCKED" | "WAITING">;
  dueDate?: string;
  reviewDate?: string;
  nextStep?: string;
  source: ActionSource;
  sensitive: boolean;
};

export type NormalisedQuickCaptureDraft = {
  state: "READY" | "FAILED";
  sourceText: string;
  proposedAction: ProposedAction;
  error?: string;
};

const optionalDateString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
);

const assistantActionSchema = z.object({
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(2000).optional(),
  stream: z.string().trim().max(80).optional(),
  companyFunction: z.string().trim().max(80).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  status: z.enum(["OPEN", "IN_PROGRESS", "BLOCKED", "WAITING"]).default("OPEN"),
  dueDate: optionalDateString,
  reviewDate: optionalDateString,
  nextStep: z.string().trim().max(500).optional(),
  sensitive: z.boolean().default(false)
});

export function bucketActionsForToday<T extends ActionLike>(actions: T[], now = new Date()): TodayBuckets<T> {
  const todayKey = dateKey(now);
  const buckets: TodayBuckets<T> = {
    overdue: [],
    dueToday: [],
    upcoming: [],
    blocked: [],
    waiting: [],
    completed: []
  };

  for (const action of actions) {
    if (action.status === "DONE") {
      buckets.completed.push(action);
      continue;
    }
    if (action.status === "BLOCKED") {
      buckets.blocked.push(action);
      continue;
    }
    if (action.status === "WAITING") {
      buckets.waiting.push(action);
      continue;
    }
    if (!action.dueAt) {
      buckets.upcoming.push(action);
      continue;
    }

    const actionKey = dateKey(new Date(action.dueAt));
    if (actionKey < todayKey) {
      buckets.overdue.push(action);
    } else if (actionKey === todayKey) {
      buckets.dueToday.push(action);
    } else {
      buckets.upcoming.push(action);
    }
  }

  return {
    overdue: sortByPriorityAndDue(buckets.overdue),
    dueToday: sortByPriorityAndDue(buckets.dueToday),
    upcoming: sortByPriorityAndDue(buckets.upcoming),
    blocked: sortByPriorityAndDue(buckets.blocked),
    waiting: sortByPriorityAndDue(buckets.waiting),
    completed: sortByPriorityAndDue(buckets.completed)
  };
}

export function normaliseQuickCaptureDraft(sourceText: string, assistantOutput: string): NormalisedQuickCaptureDraft {
  const trimmedSource = sourceText.trim();
  const fallbackTitle = trimmedSource || "Untitled captured action";

  try {
    const parsed = assistantActionSchema.parse(JSON.parse(assistantOutput));
    return {
      state: "READY",
      sourceText: trimmedSource,
      proposedAction: {
        ...parsed,
        source: "ASSISTANT",
        sensitive: parsed.sensitive ?? false
      }
    };
  } catch (error) {
    return {
      state: "FAILED",
      sourceText: trimmedSource,
      error: error instanceof Error ? error.message : "Assistant output was not valid JSON.",
      proposedAction: {
        title: fallbackTitle,
        status: "OPEN",
        priority: "MEDIUM",
        source: "ASSISTANT",
        sensitive: false,
        nextStep: "Review and structure this captured note manually."
      }
    };
  }
}

export function mapReviewAnswersToDraftActions(answers: Record<string, string>) {
  return Object.entries(answers)
    .filter(([, value]) => value.trim().length > 0)
    .map(([companyFunction, value]) => ({
      title: `Review ${companyFunction}: ${value.trim()}`,
      companyFunction,
      priority: "MEDIUM" as const,
      source: "REVIEW" as const
    }));
}

// Turn an internal enum token (e.g. "DRAFT_ONLY", "IN_PROGRESS", "SUCCESS") into
// a human-readable label ("Draft Only", "In Progress", "Success"). This is the
// single place enum tokens become client-facing text, so raw SCREAMING_SNAKE_CASE
// codes never leak onto a surface.
export function humanizeEnum(value: string) {
  return value
    .split("_")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part))
    .join(" ");
}

export function priorityLabel(priority: Priority) {
  return humanizeEnum(priority);
}

export function statusLabel(status: ActionStatus) {
  return humanizeEnum(status);
}

// Shared date/priority helpers. Kept here (next to the Priority/ActionStatus
// types) so date-key and priority-weight semantics can't drift across modules.
export const priorityWeight: Record<Priority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3
};

export function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function dueValue(dueAt: Date | string | null | undefined) {
  return dueAt ? new Date(dueAt).getTime() : Number.MAX_SAFE_INTEGER;
}

function sortByPriorityAndDue<T extends ActionLike>(actions: T[]) {
  return [...actions].sort((a, b) => {
    const priorityDiff = priorityWeight[a.priority] - priorityWeight[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return dueValue(a.dueAt) - dueValue(b.dueAt);
  });
}
