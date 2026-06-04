import { buildLaunchpadHealth, type LaunchpadHealthLink } from "./cockpit-insights";

export type LocalApprovalAutomationKind = "RENEWAL_REMINDER";

export type LocalApprovalAutomationRef = {
  name: string;
  safetyLevel: string;
  trigger?: string | null;
  targetTool?: string | null;
};

export type RenewalReminderActionDraft = {
  launchpadLinkId: string;
  title: string;
  description: string;
  priority: "MEDIUM" | "HIGH" | "CRITICAL";
  dueAt: string;
  reviewAt: string;
  nextStep: string;
  sensitive: boolean;
};

export type RenewalReminderRun = {
  responseSummary: string;
  actionsToCreate: RenewalReminderActionDraft[];
};

const RENEWAL_WINDOW_DAYS = 30;
const REMINDER_LEAD_DAYS = 7;

export function getLocalApprovalAutomationKind(automation: LocalApprovalAutomationRef): LocalApprovalAutomationKind | null {
  if (automation.safetyLevel !== "APPROVAL_REQUIRED") return null;

  const text = [automation.name, automation.trigger, automation.targetTool].filter(Boolean).join(" ").toLowerCase();
  return text.includes("renewal reminder") || text.includes("launchpad renewal check") ? "RENEWAL_REMINDER" : null;
}

export function buildRenewalReminderRun({
  now = new Date(),
  links
}: {
  now?: Date;
  links: LaunchpadHealthLink[];
}): RenewalReminderRun {
  const health = buildLaunchpadHealth(links, now);
  const attentionIds = new Set([...health.renewalsDue, ...health.renewalsSoon].map((link) => link.id));
  const candidates = links
    .filter((link) => attentionIds.has(link.id) && link.renewalAt)
    .sort((a, b) => {
      const aRenewal = dateKey(new Date(a.renewalAt as Date | string));
      const bRenewal = dateKey(new Date(b.renewalAt as Date | string));
      return (
        dateValue(aRenewal) - dateValue(bRenewal) ||
        riskWeight(a.riskLevel) - riskWeight(b.riskLevel) ||
        a.name.localeCompare(b.name)
      );
    });
  const actionsToCreate = candidates.map((link) => toReminderAction(link, now));

  return {
    actionsToCreate,
    responseSummary: [
      "Renewal reminder - approved local run",
      "",
      `Generated locally: ${dateKey(now)}`,
      "Safety: APPROVAL_REQUIRED. Explicit approval captured. No webhook called. No external system contacted. Reminder actions are created only for launchpad renewals due or due soon.",
      `Window: renewals due now or within ${RENEWAL_WINDOW_DAYS} days. Reminder due date targets ${REMINDER_LEAD_DAYS} days before renewal when possible.`,
      "",
      "Snapshot",
      `- Renewals due: ${health.renewalsDue.length}`,
      `- Renewals soon: ${health.renewalsSoon.length}`,
      `- Reminder actions created: ${actionsToCreate.length}`,
      "",
      "Renewal reminders",
      ...formatRenewalList(candidates, now),
      "",
      "Operator checks",
      "- Confirm whether each subscription or account should renew, downgrade, cancel, or move owner.",
      "- Check payment method, cost, credential access, and recovery details before the renewal date.",
      "- Keep secrets in the password manager or launchpad credential-location note; do not paste credentials into actions."
    ].join("\n")
  };
}

function toReminderAction(link: LaunchpadHealthLink, now: Date): RenewalReminderActionDraft {
  const renewalAt = dateKey(new Date(link.renewalAt as Date | string));
  const dueAt = reminderDueDate(renewalAt, now);
  const priority = reminderPriority(renewalAt, now, link.riskLevel);
  const owner = link.owner?.trim() || "owner not recorded";
  const group = link.group?.trim() || "ungrouped";
  const cost = link.cost === null || link.cost === undefined || String(link.cost).trim() === "" ? "cost not recorded" : String(link.cost);
  const credentialContext = link.loginNote?.trim() || link.sensitive
    ? "Credential context is recorded in Launchpad or the password manager; verify access without exposing secrets."
    : "Credential context is missing; add a credential-location note before the renewal decision.";

  return {
    launchpadLinkId: link.id,
    title: `Review ${link.name} renewal due ${renewalAt}`,
    description: [
      `Launchpad renewal check for ${link.name}.`,
      `Renewal date: ${renewalAt}.`,
      `Group: ${group}.`,
      `Owner: ${owner}.`,
      `Cost: ${cost}.`,
      `Risk: ${link.riskLevel ?? "not recorded"}.`,
      credentialContext
    ].join("\n"),
    priority,
    dueAt,
    reviewAt: dueAt,
    nextStep: `Confirm the renewal decision, payment status, account owner, cost, and credential access for ${link.name}.`,
    sensitive: Boolean(link.sensitive)
  };
}

function formatRenewalList(links: LaunchpadHealthLink[], now: Date) {
  if (links.length === 0) return ["- None."];
  return links.map((link) => {
    const renewalAt = dateKey(new Date(link.renewalAt as Date | string));
    const dueAt = reminderDueDate(renewalAt, now);
    const owner = link.owner?.trim() || "owner missing";
    const risk = link.riskLevel ?? "risk not recorded";
    const group = link.group?.trim() || "ungrouped";
    return `- ${link.name} renews ${renewalAt} (${group}, ${risk}, owner: ${owner}). Reminder due ${dueAt}.`;
  });
}

function reminderDueDate(renewalDate: string, now: Date) {
  const today = dateKey(now);
  if (renewalDate <= today) return today;

  const reminderDate = addDaysToDateKey(renewalDate, -REMINDER_LEAD_DAYS);
  return reminderDate < today ? today : reminderDate;
}

function reminderPriority(renewalDate: string, now: Date, riskLevel?: string | null): RenewalReminderActionDraft["priority"] {
  if (renewalDate <= dateKey(now)) return "CRITICAL";
  if (riskLevel === "CRITICAL" || riskLevel === "HIGH") return "HIGH";
  return "MEDIUM";
}

function riskWeight(riskLevel?: string | null) {
  const weights: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  return weights[String(riskLevel ?? "").toUpperCase()] ?? 4;
}

function dateValue(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function addDaysToDateKey(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  value.setUTCDate(value.getUTCDate() + days);
  return dateKey(value);
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
