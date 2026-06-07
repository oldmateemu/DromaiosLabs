// Lightweight sales pipeline command-view for the cockpit.
//
// HubSpot is the CRM system of record for leads, deals, and contacts. The
// cockpit does NOT duplicate that: this module provides an opinionated pipeline
// playbook (the stages and what moves a deal forward) plus a summary of the
// sales follow-up actions already tracked in the cockpit, with a deep link out
// to HubSpot for the live deal data.

export type SalesPipelineStage = {
  key: string;
  name: string;
  /** What this stage means. */
  description: string;
  /** What has to be true to move the deal to the next stage. */
  exitCriterion: string;
};

// Mirrors the recommended HubSpot deal pipeline and the discovery → pilot →
// proposal framing from the company statements.
export const SALES_PIPELINE_STAGES: SalesPipelineStage[] = [
  {
    key: "lead",
    name: "New lead",
    description: "Inbound or outbound interest captured, not yet qualified.",
    exitCriterion: "There is a named contact and a real operational problem worth a conversation."
  },
  {
    key: "qualified",
    name: "Qualified",
    description: "Fit confirmed: the organisation, problem, and timing make a discovery call worthwhile.",
    exitCriterion: "A discovery call is booked with the right decision-maker."
  },
  {
    key: "discovery",
    name: "Discovery",
    description: "Understanding the actual workflow, constraints, and what 'better' would look like.",
    exitCriterion: "The core problem and a candidate first workflow are written down."
  },
  {
    key: "pilot",
    name: "Pilot",
    description: "A narrow, testable pilot is defined or running against one or two real workflows.",
    exitCriterion: "Pilot scope, success measure, and timeline are agreed."
  },
  {
    key: "proposal",
    name: "Proposal",
    description: "A proposal grounded in the pilot or discovery is with the customer, awaiting a decision.",
    exitCriterion: "A clear yes/no decision and commercial terms."
  },
  {
    key: "won",
    name: "Won / active",
    description: "Engaged and delivering. Feeds learning back into product, education, and evidence.",
    exitCriterion: "Delivery is underway and the relationship is being maintained."
  }
];

export type SalesActionLike = {
  id: string;
  title: string;
  status: "OPEN" | "IN_PROGRESS" | "BLOCKED" | "WAITING" | "DONE" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  dueAt?: Date | string | null;
  nextStep?: string | null;
  stream?: { name: string } | null;
};

export type SalesFollowUp = {
  id: string;
  title: string;
  status: SalesActionLike["status"];
  priority: SalesActionLike["priority"];
  dueAt: Date | string | null;
  overdue: boolean;
  nextStep: string | null;
  stream: string | null;
};

export type SalesPipelineSummary = {
  total: number;
  open: number;
  inProgress: number;
  waiting: number;
  blocked: number;
  overdue: number;
  followUps: SalesFollowUp[];
};

const PRIORITY_WEIGHT: Record<SalesActionLike["priority"], number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3
};

/**
 * Summarises the cockpit's active sales follow-up actions. Done/cancelled work
 * is excluded; the remaining items are sorted by priority then soonest due, and
 * overdue is computed for active (open/in-progress) work against `now`.
 */
export function summariseSalesPipeline(actions: SalesActionLike[], now: Date = new Date()): SalesPipelineSummary {
  const todayKey = dateKey(now);
  const active = actions.filter((action) => action.status !== "DONE" && action.status !== "CANCELLED");

  const followUps: SalesFollowUp[] = active
    .map((action) => {
      const dueAt = action.dueAt ?? null;
      const isActive = action.status === "OPEN" || action.status === "IN_PROGRESS";
      const overdue = isActive && dueAt !== null && dateKey(new Date(dueAt)) < todayKey;
      return {
        id: action.id,
        title: action.title,
        status: action.status,
        priority: action.priority,
        dueAt,
        overdue,
        nextStep: action.nextStep ?? null,
        stream: action.stream?.name ?? null
      };
    })
    .sort(
      (a, b) =>
        PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority] ||
        dueValue(a.dueAt) - dueValue(b.dueAt) ||
        a.title.localeCompare(b.title)
    );

  return {
    total: active.length,
    open: active.filter((action) => action.status === "OPEN").length,
    inProgress: active.filter((action) => action.status === "IN_PROGRESS").length,
    waiting: active.filter((action) => action.status === "WAITING").length,
    blocked: active.filter((action) => action.status === "BLOCKED").length,
    overdue: followUps.filter((followUp) => followUp.overdue).length,
    followUps
  };
}

function dueValue(dueAt: Date | string | null) {
  return dueAt ? new Date(dueAt).getTime() : Number.MAX_SAFE_INTEGER;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
