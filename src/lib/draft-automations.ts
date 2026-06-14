import { buildLaunchpadHealth, type LaunchpadHealthLink } from "./cockpit-insights";
import { bucketActionsForToday, priorityLabel, statusLabel, type ActionLike } from "./domain";

export type LocalDraftAutomationKind = "WEEKLY_REVIEW_PREP" | "STALE_TASK_SUMMARY" | "DAILY_INBOX_TRIAGE";

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

export type StaleTaskSummaryContext = {
  now?: Date;
  actions: WeeklyReviewPrepAction[];
};

export type DailyInboxTriageAction = WeeklyReviewPrepAction & {
  description?: string | null;
  createdAt?: Date | string | null;
};

export type DailyInboxTriageContext = {
  now?: Date;
  actions: DailyInboxTriageAction[];
};

const STALE_ACTION_DAYS = 7;
const PRIORITY_INBOX_AGE_HOURS = 48;

export function getLocalDraftAutomationKind(automation: LocalDraftAutomationRef): LocalDraftAutomationKind | null {
  const text = [automation.name, automation.trigger, automation.targetTool].filter(Boolean).join(" ").toLowerCase();
  if (text.includes("weekly review prep")) return "WEEKLY_REVIEW_PREP";
  if (text.includes("stale task summary") || text.includes("stale action scan")) return "STALE_TASK_SUMMARY";
  if (text.includes("daily inbox triage") || text.includes("weekday inbox digest")) return "DAILY_INBOX_TRIAGE";
  return null;
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

export function buildStaleTaskSummaryDraft({ now = new Date(), actions }: StaleTaskSummaryContext) {
  const staleActions = actions
    .filter((action) => isStaleAction(action, now))
    .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
  const highPriorityStaleActions = staleActions.filter((action) => ["CRITICAL", "HIGH"].includes(action.priority));
  const waitingStaleActions = staleActions.filter((action) => action.status === "WAITING");
  const blockedStaleActions = staleActions.filter((action) => action.status === "BLOCKED");
  const overdueStaleActions = staleActions.filter((action) => action.dueAt && dateKey(new Date(action.dueAt)) < dateKey(now));

  return [
    "Stale task summary - draft only",
    "",
    `Generated locally: ${dateKey(now)}`,
    "Safety: DRAFT_ONLY. No webhook called. No external system contacted. No actions, reviews, posts, or credentials changed.",
    `Threshold: open actions unchanged for ${STALE_ACTION_DAYS}+ days.`,
    "",
    "Snapshot",
    `- Stale open actions: ${staleActions.length}`,
    `- Critical or high stale actions: ${highPriorityStaleActions.length}`,
    `- Waiting stale actions: ${waitingStaleActions.length}`,
    `- Blocked stale actions: ${blockedStaleActions.length}`,
    `- Overdue stale actions: ${overdueStaleActions.length}`,
    "",
    "Stale work digest",
    ...formatStaleActionList(staleActions.slice(0, 12), now),
    ...formatStaleActionOverflow(staleActions.length, 12),
    "",
    "Review prompts",
    "- Should each stale item still be active, moved to waiting, cancelled, or given a specific next step?",
    "- Which stale items represent real external dependencies rather than owner drift?",
    "- What is the smallest set of stale actions that must move before new work starts?",
    "",
    "Draft follow-ups to consider",
    ...buildStaleTaskFollowUps({
      staleCount: staleActions.length,
      highPriorityCount: highPriorityStaleActions.length,
      waitingCount: waitingStaleActions.length,
      blockedCount: blockedStaleActions.length,
      overdueCount: overdueStaleActions.length
    })
  ].join("\n");
}

export function buildDailyInboxTriageDraft({ now = new Date(), actions }: DailyInboxTriageContext) {
  const buckets = bucketInboxActions(actions, now);
  const priorityItemsOlderThan48Hours = actions.filter((action) => isPriorityInboxItemOlderThan(action, now, PRIORITY_INBOX_AGE_HOURS)).length;

  return [
    "Daily inbox triage - draft only",
    "",
    `Generated locally: ${dateKey(now)}`,
    "Safety: DRAFT_ONLY. No webhook called. No external system contacted. No Gmail draft created. No email sent. No messages labelled, moved, deleted, unsubscribed, or replied to.",
    "Input: local cockpit action register as inbox-work proxy until a reviewed Gmail export or connector is added.",
    "",
    "Snapshot",
    `- Action needed: ${buckets.actionNeeded.length}`,
    `- Waiting: ${buckets.waiting.length}`,
    `- Receipt/invoice: ${buckets.receiptInvoice.length}`,
    `- Lead: ${buckets.lead.length}`,
    `- FYI: ${buckets.fyi.length}`,
    `- Unsubscribe/noise: ${buckets.unsubscribeNoise.length}`,
    `- Priority items older than 48 hours: ${priorityItemsOlderThan48Hours}`,
    "",
    "Action needed",
    ...formatInboxActionList(buckets.actionNeeded),
    "",
    "Waiting",
    ...formatInboxActionList(buckets.waiting),
    "",
    "Receipt/invoice",
    ...formatInboxActionList(buckets.receiptInvoice),
    "",
    "Lead",
    ...formatInboxActionList(buckets.lead),
    "",
    "FYI",
    ...formatInboxActionList(buckets.fyi),
    "",
    "Unsubscribe/noise",
    ...formatInboxActionList(buckets.unsubscribeNoise),
    "",
    "Email work prepared for review",
    ...buildInboxEmailWork({ buckets, priorityItemsOlderThan48Hours })
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

function formatStaleActionList(actions: WeeklyReviewPrepAction[], now: Date) {
  if (actions.length === 0) return ["- None."];
  return actions.map((action) => {
    const updatedAt = new Date(action.updatedAt);
    const due = action.dueAt ? `due ${dateKey(new Date(action.dueAt))}` : "no due date";
    const area = [action.stream?.name, action.companyFunction?.name].filter(Boolean).join(" / ") || "unassigned";
    const nextStep = action.nextStep ? ` Next: ${action.nextStep}` : "";
    return `- ${action.title} (${priorityLabel(action.priority)}, ${statusLabel(action.status)}, ${due}, last updated ${dateKey(updatedAt)}, stale ${staleDays(updatedAt, now)} days, ${area}).${nextStep}`;
  });
}

function formatStaleActionOverflow(total: number, shown: number) {
  const hidden = total - shown;
  if (hidden <= 0) return [];
  const label = hidden === 1 ? "stale action" : "stale actions";
  return [`- ${hidden} more ${label} not shown.`];
}

function buildStaleTaskFollowUps({
  staleCount,
  highPriorityCount,
  waitingCount,
  blockedCount,
  overdueCount
}: {
  staleCount: number;
  highPriorityCount: number;
  waitingCount: number;
  blockedCount: number;
  overdueCount: number;
}) {
  const suggestions: string[] = [];
  if (highPriorityCount > 0) suggestions.push("- Challenge critical and high-priority stale work before accepting new commitments.");
  if (overdueCount > 0) suggestions.push("- Decide whether each overdue stale item should be completed, deferred, or cancelled.");
  if (waitingCount > 0) suggestions.push("- Add owner-visible follow-up dates for stale waiting items.");
  if (blockedCount > 0) suggestions.push("- Name the dependency or human decision needed to unblock each blocked stale item.");
  if (staleCount > 0) suggestions.push("- Convert the digest into a short review agenda before changing records.");
  return suggestions.length > 0 ? suggestions : ["- No stale items found; keep current active actions moving."];
}

function bucketInboxActions(actions: DailyInboxTriageAction[], now: Date) {
  const buckets = {
    actionNeeded: [] as DailyInboxTriageAction[],
    waiting: [] as DailyInboxTriageAction[],
    receiptInvoice: [] as DailyInboxTriageAction[],
    lead: [] as DailyInboxTriageAction[],
    fyi: [] as DailyInboxTriageAction[],
    unsubscribeNoise: [] as DailyInboxTriageAction[]
  };

  for (const action of sortInboxActions(actions.filter((item) => !isClosedAction(item)))) {
    if (isUnsubscribeOrNoise(action)) {
      buckets.unsubscribeNoise.push(action);
    } else if (action.status === "WAITING") {
      buckets.waiting.push(action);
    } else if (isReceiptOrInvoice(action)) {
      buckets.receiptInvoice.push(action);
    } else if (isLeadOrPartnerFollowUp(action)) {
      buckets.lead.push(action);
    } else if (isInboxActionNeeded(action, now)) {
      buckets.actionNeeded.push(action);
    } else {
      buckets.fyi.push(action);
    }
  }

  return buckets;
}

function formatInboxActionList(actions: DailyInboxTriageAction[]) {
  if (actions.length === 0) return ["- None."];
  return actions.slice(0, 8).map((action) => {
    const due = action.dueAt ? `due ${dateKey(new Date(action.dueAt))}` : "no due date";
    const area = [action.stream?.name, action.companyFunction?.name].filter(Boolean).join(" / ") || "unassigned";
    const nextStep = action.nextStep ? ` Next: ${action.nextStep}` : "";
    return `- ${action.title} (${priorityLabel(action.priority)}, ${statusLabel(action.status)}, ${due}, ${area}).${nextStep}`;
  });
}

function buildInboxEmailWork({
  buckets,
  priorityItemsOlderThan48Hours
}: {
  buckets: ReturnType<typeof bucketInboxActions>;
  priorityItemsOlderThan48Hours: number;
}) {
  const suggestions: string[] = [];
  if (buckets.actionNeeded.length > 0) suggestions.push("- Prepare reply notes for action-needed items; send nothing until reviewed.");
  if (buckets.waiting.length > 0) suggestions.push("- Check whether waiting items need a follow-up date before any reply is drafted.");
  if (buckets.receiptInvoice.length > 0) suggestions.push("- Label receipt/invoice items for finance filing review; do not pay, lodge, or post to Xero.");
  if (buckets.lead.length > 0) suggestions.push("- Prepare lead reply drafts with claim-safe wording and human review.");
  if (buckets.unsubscribeNoise.length > 0) suggestions.push("- Review unsubscribe/noise candidates manually; do not unsubscribe or delete automatically.");
  if (priorityItemsOlderThan48Hours > 0) suggestions.push("- Clear or deliberately defer priority inbox items older than 48 hours.");
  return suggestions.length > 0 ? suggestions : ["- No inbox-like cockpit items found; run a reviewed Gmail search/export before scheduling the digest."];
}

function sortInboxActions(actions: DailyInboxTriageAction[]) {
  const priorityWeight: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  return [...actions].sort((a, b) => {
    const priorityDiff = (priorityWeight[a.priority] ?? 4) - (priorityWeight[b.priority] ?? 4);
    if (priorityDiff !== 0) return priorityDiff;
    return dateValue(a.dueAt) - dateValue(b.dueAt) || dateValue(a.createdAt) - dateValue(b.createdAt);
  });
}

function isPriorityInboxItemOlderThan(action: DailyInboxTriageAction, now: Date, hours: number) {
  if (isClosedAction(action) || !action.createdAt) return false;
  if (!isInboxActionNeeded(action, now) && action.status !== "WAITING") return false;
  const ageMs = now.getTime() - new Date(action.createdAt).getTime();
  return ageMs >= hours * 60 * 60 * 1000;
}

function isInboxActionNeeded(action: DailyInboxTriageAction, now: Date) {
  if (action.status === "BLOCKED") return true;
  if (["CRITICAL", "HIGH"].includes(action.priority)) return true;
  return Boolean(action.dueAt && dateKey(new Date(action.dueAt)) <= dateKey(now));
}

function isReceiptOrInvoice(action: DailyInboxTriageAction) {
  return action.companyFunction?.name === "finance" || containsAny(action, ["receipt", "invoice", "supplier", "bill", "payment", "gst", "tax", "xero"]);
}

function isLeadOrPartnerFollowUp(action: DailyInboxTriageAction) {
  return ["sales", "marketing"].includes(action.companyFunction?.name ?? "")
    || containsAny(action, ["lead", "enquiry", "inquiry", "proposal", "partner", "waitlist", "booking"]);
}

function isUnsubscribeOrNoise(action: DailyInboxTriageAction) {
  return containsAny(action, ["unsubscribe", "newsletter", "promo", "promotional", "spam", "noise", "cold outreach"]);
}

function containsAny(action: DailyInboxTriageAction, needles: string[]) {
  const text = [action.title, action.description, action.nextStep, action.stream?.name, action.companyFunction?.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return needles.some((needle) => text.includes(needle));
}

function isClosedAction(action: DailyInboxTriageAction) {
  return action.status === "DONE" || action.status === "CANCELLED";
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

function staleDays(updatedAt: Date, now: Date) {
  return Math.floor((now.getTime() - updatedAt.getTime()) / (24 * 60 * 60 * 1000));
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
