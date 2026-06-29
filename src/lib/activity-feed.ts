export type ActivityKind =
  | "ACTION_COMPLETED"
  | "ACTION_CREATED"
  | "RISK_LOGGED"
  | "DECISION_RECORDED"
  | "AUTOMATION_RUN"
  | "DRAFT_CREATED"
  | "REVIEW_COMPLETED";

export type ActivityTone = "neutral" | "positive" | "warning" | "danger";

export type ActivityEvent = {
  id: string;
  kind: ActivityKind;
  label: string;
  title: string;
  detail: string;
  at: Date;
  tone: ActivityTone;
  href: string;
};

export type ActivityFeedInputs = {
  completedActions?: Array<{ id: string; title: string; completedAt?: Date | string | null; stream?: { name: string } | null }>;
  createdActions?: Array<{ id: string; title: string; createdAt: Date | string; source?: string | null }>;
  risks?: Array<{ id: string; issue: string; severity: string; createdAt: Date | string }>;
  decisions?: Array<{ id: string; decision: string; decidedAt: Date | string }>;
  automationRuns?: Array<{ id: string; status: string; createdAt: Date | string; automation?: { name: string } | null }>;
  drafts?: Array<{ id: string; sourceSummary: string; state: string; createdAt: Date | string }>;
  reviews?: Array<{ id: string; type: string; createdAt: Date | string }>;
};

/**
 * Merge recent records from across the cockpit into one chronological activity
 * timeline (newest first). Pure and deterministic for testing; each source
 * record becomes a normalised, tone-tagged, linkable event.
 */
export function buildActivityFeed(inputs: ActivityFeedInputs, limit = 40): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  for (const action of inputs.completedActions ?? []) {
    const at = toDate(action.completedAt);
    if (!at) continue;
    events.push({
      id: `completed-${action.id}`,
      kind: "ACTION_COMPLETED",
      label: "Action completed",
      title: action.title,
      detail: action.stream?.name ? `Completed · ${action.stream.name}` : "Completed",
      at,
      tone: "positive",
      href: `/actions/${action.id}`
    });
  }

  for (const action of inputs.createdActions ?? []) {
    const at = toDate(action.createdAt);
    if (!at) continue;
    events.push({
      id: `created-${action.id}`,
      kind: "ACTION_CREATED",
      label: "Action captured",
      title: action.title,
      detail: `Captured${action.source ? ` · ${humanise(action.source)}` : ""}`,
      at,
      tone: "neutral",
      href: `/actions/${action.id}`
    });
  }

  for (const risk of inputs.risks ?? []) {
    const at = toDate(risk.createdAt);
    if (!at) continue;
    events.push({
      id: `risk-${risk.id}`,
      kind: "RISK_LOGGED",
      label: "Risk logged",
      title: risk.issue,
      detail: `Risk · ${risk.severity}`,
      at,
      tone: risk.severity === "HIGH" || risk.severity === "CRITICAL" ? "danger" : "warning",
      href: "/governance"
    });
  }

  for (const decision of inputs.decisions ?? []) {
    const at = toDate(decision.decidedAt);
    if (!at) continue;
    events.push({
      id: `decision-${decision.id}`,
      kind: "DECISION_RECORDED",
      label: "Decision recorded",
      title: decision.decision,
      detail: "Decision recorded",
      at,
      tone: "positive",
      href: "/governance"
    });
  }

  for (const run of inputs.automationRuns ?? []) {
    const at = toDate(run.createdAt);
    if (!at) continue;
    events.push({
      id: `run-${run.id}`,
      kind: "AUTOMATION_RUN",
      label: "Automation run",
      title: run.automation?.name ?? "Automation",
      detail: `Automation ${humanise(run.status)}`,
      at,
      tone: run.status === "SUCCESS" ? "positive" : run.status === "BLOCKED" ? "warning" : "danger",
      href: "/automations"
    });
  }

  for (const draft of inputs.drafts ?? []) {
    const at = toDate(draft.createdAt);
    if (!at) continue;
    events.push({
      id: `draft-${draft.id}`,
      kind: "DRAFT_CREATED",
      label: "Assistant draft",
      title: draft.sourceSummary,
      detail: `Assistant draft · ${humanise(draft.state)}`,
      at,
      tone: "neutral",
      href: "/assistant"
    });
  }

  for (const review of inputs.reviews ?? []) {
    const at = toDate(review.createdAt);
    if (!at) continue;
    events.push({
      id: `review-${review.id}`,
      kind: "REVIEW_COMPLETED",
      label: "Review completed",
      title: `${humanise(review.type)} review`,
      detail: "Review completed",
      at,
      tone: "positive",
      href: "/reviews"
    });
  }

  events.sort((a, b) => b.at.getTime() - a.at.getTime());
  return events.slice(0, limit);
}

function humanise(value: string) {
  return value
    .split("_")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part))
    .join(" ");
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
