import { buildLaunchpadHealth, type LaunchpadHealthLink } from "./cockpit-insights";
import { bucketActionsForToday, priorityLabel, statusLabel, type ActionLike } from "./domain";

export type LocalDraftAutomationKind = "WEEKLY_REVIEW_PREP";

export type LocalDraftAutomationRef = {
  name: string;
  trigger?: string | null;
  targetTool?: string | null;
};

export type WeeklyReviewPrepAction = ActionLike & {
  updatedAt: Date | string;
  reviewAt?: Date | string | null;
  nextStep?: string | null;
};

export type WeeklyReviewPrepRisk = {
  id: string;
  issue: string;
  severity: string;
  status: string;
  nextReviewAt?: Date | string | null;
};

export type WeeklyReviewPrepContext = {
  now?: Date;
  actions: WeeklyReviewPrepAction[];
  risks: WeeklyReviewPrepRisk[];
  links: LaunchpadHealthLink[];
  draftsNeedingReview: number;
};

const STALE_ACTION_DAYS = 7;

export function getLocalDraftAutomationKind(automation: LocalDraftAutomationRef): LocalDraftAutomationKind | null {
  const text = [automation.name, automation.trigger, automation.targetTool].filter(Boolean).join(" ").toLowerCase();
  return text.includes("weekly review prep") ? "WEEKLY_REVIEW_PREP" : null;
}

export function buildWeeklyReviewPrepDraft({
  now = new Date(),
  actions,
  risks,
  links,
  draftsNeedingReview
}: WeeklyReviewPrepContext) {
  const buckets = bucketActionsForToday(actions, now);
  const staleActions = actions
    .filter((action) => isStaleAction(action, now))
    .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
  const reviewRisks = risks
    .filter((risk) => isOpenStatus(risk.status))
    .sort((a, b) => riskWeight(a.severity) - riskWeight(b.severity) || dateValue(a.nextReviewAt) - dateValue(b.nextReviewAt));
  const dueRisks = reviewRisks.filter((risk) => !risk.nextReviewAt || dateKey(new Date(risk.nextReviewAt)) <= dateKey(addDays(now, 7)));
  const launchpadHealth = buildLaunchpadHealth(links, now);

  return [
    "Weekly review prep - draft only",
    "",
    `Generated locally: ${dateKey(now)}`,
    "Safety: DRAFT_ONLY. No webhook called. No external system contacted. No actions, reviews, posts, or credentials changed.",
    "",
    "Snapshot",
    `- Overdue: ${buckets.overdue.length}`,
    `- Due today: ${buckets.dueToday.length}`,
    `- Waiting: ${buckets.waiting.length}`,
    `- Blocked: ${buckets.blocked.length}`,
    `- Assistant drafts needing review: ${draftsNeedingReview}`,
    `- Stale open actions: ${staleActions.length}`,
    `- Open risks in review window: ${dueRisks.length}`,
    `- Renewals due or missing owner/cost: ${launchpadHealth.renewalsDue.length + launchpadHealth.missingOwners + launchpadHealth.missingCosts}`,
    "",
    "Priority review queue",
    ...formatActionList([...buckets.overdue, ...buckets.dueToday, ...buckets.blocked, ...buckets.waiting].slice(0, 8)),
    "",
    "Stale work to challenge",
    ...formatActionList(staleActions.slice(0, 8)),
    "",
    "Risk checks",
    ...formatRiskList(dueRisks.slice(0, 6)),
    "",
    "Launchpad checks",
    ...formatLaunchpadList([
      ...launchpadHealth.renewalsDue,
      ...launchpadHealth.renewalsSoon,
      ...launchpadHealth.highRisk
    ]),
    "",
    "Review prompts",
    "- What should be completed, deferred, cancelled, or moved into waiting before new work is started?",
    "- Which public claims, IP boundaries, or legal/trademark risks need a human check this week?",
    "- Which assistant drafts are ready to become approved actions, and which should be rejected?",
    "",
    "Draft actions to consider",
    ...buildSuggestedDraftActions({
      overdueCount: buckets.overdue.length,
      blockedCount: buckets.blocked.length,
      waitingCount: buckets.waiting.length,
      staleCount: staleActions.length,
      dueRiskCount: dueRisks.length,
      draftsNeedingReview
    })
  ].join("\n");
}

function buildSuggestedDraftActions({
  overdueCount,
  blockedCount,
  waitingCount,
  staleCount,
  dueRiskCount,
  draftsNeedingReview
}: {
  overdueCount: number;
  blockedCount: number;
  waitingCount: number;
  staleCount: number;
  dueRiskCount: number;
  draftsNeedingReview: number;
}) {
  const suggestions: string[] = [];
  if (overdueCount > 0) suggestions.push("- Decide whether to complete, defer, or cancel overdue work.");
  if (blockedCount > 0) suggestions.push("- Pick one blocked item and name the dependency or next human decision.");
  if (waitingCount > 0) suggestions.push("- Review waiting items and capture the next follow-up date.");
  if (staleCount > 0) suggestions.push("- Challenge stale actions that have not moved in the last week.");
  if (dueRiskCount > 0) suggestions.push("- Review due risks before approving new public or operational commitments.");
  if (draftsNeedingReview > 0) suggestions.push("- Approve, reject, or rewrite pending assistant drafts.");
  return suggestions.length > 0 ? suggestions : ["- Capture one focused control, revenue, or strategy action for the week."];
}

function formatActionList(actions: WeeklyReviewPrepAction[]) {
  if (actions.length === 0) return ["- None."];
  return actions.map((action) => {
    const due = action.dueAt ? `due ${dateKey(new Date(action.dueAt))}` : "no due date";
    const area = [action.stream?.name, action.companyFunction?.name].filter(Boolean).join(" / ") || "unassigned";
    const nextStep = action.nextStep ? ` Next: ${action.nextStep}` : "";
    return `- ${action.title} (${priorityLabel(action.priority)}, ${statusLabel(action.status)}, ${due}, ${area}).${nextStep}`;
  });
}

function formatRiskList(risks: WeeklyReviewPrepRisk[]) {
  if (risks.length === 0) return ["- None."];
  return risks.map((risk) => {
    const review = risk.nextReviewAt ? `review ${dateKey(new Date(risk.nextReviewAt))}` : "review date not set";
    return `- ${risk.issue} (${risk.severity}, ${risk.status}, ${review}).`;
  });
}

function formatLaunchpadList(links: { id: string; name: string }[]) {
  const unique = Array.from(new Map(links.map((link) => [link.id, link])).values());
  if (unique.length === 0) return ["- None."];
  return unique.slice(0, 8).map((link) => `- ${link.name}`);
}

function isStaleAction(action: WeeklyReviewPrepAction, now: Date) {
  if (action.status === "DONE" || action.status === "CANCELLED") return false;
  const ageMs = now.getTime() - new Date(action.updatedAt).getTime();
  return ageMs >= STALE_ACTION_DAYS * 24 * 60 * 60 * 1000;
}

function isOpenStatus(status: string) {
  return !["CLOSED", "DONE", "RESOLVED", "CANCELLED"].includes(status.toUpperCase());
}

function riskWeight(severity: string) {
  const weights: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  return weights[severity.toUpperCase()] ?? 4;
}

function dateValue(date?: Date | string | null) {
  return date ? new Date(date).getTime() : 0;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
