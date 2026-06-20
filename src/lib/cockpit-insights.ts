import type { ActionLike, TodayBuckets } from "./domain";

export type CommandTone = "neutral" | "danger" | "warning" | "blocked" | "success";

export type NextBestAction = {
  title: string;
  body: string;
  href: string;
  label: string;
  tone: CommandTone;
};

export type SetupAlert = {
  /** Title of the overdue foundational setup item to escalate. */
  title: string;
  overdueCritical: boolean;
};

export type FocusSetItem = {
  label: "Control" | "Revenue" | "Strategy";
  actionTitle: string | null;
  href: string;
  emptyText: string;
};

export type LaunchpadHealthLink = {
  id: string;
  name: string;
  group?: string | null;
  renewalAt?: Date | string | null;
  cost?: unknown;
  owner?: string | null;
  riskLevel?: string | null;
  loginNote?: string | null;
  sensitive?: boolean | null;
  streamId?: string | null;
};

export type LaunchpadHealthRef = {
  id: string;
  name: string;
  href: string;
};

export type LaunchpadMetadataGap = LaunchpadHealthRef & {
  detail: string;
};

export type LaunchpadHealth = {
  total: number;
  renewalsDue: LaunchpadHealthRef[];
  renewalsSoon: LaunchpadHealthRef[];
  missingOwners: number;
  missingCosts: number;
  missingRenewals: number;
  missingCredentialNotes: number;
  highRisk: LaunchpadHealthRef[];
  credentialNotes: number;
  metadataGaps: LaunchpadMetadataGap[];
};

export type GovernanceRisk = {
  id: string;
  issue: string;
  severity: string;
  status: string;
  nextReviewAt?: Date | string | null;
};

export type GovernanceDecision = {
  id: string;
  decision: string;
  decidedAt: Date | string;
};

export type GovernanceSummary = {
  headline: string;
  riskCount: number;
  decisionCount: number;
  topRisks: GovernanceRisk[];
  recentDecisions: GovernanceDecision[];
};

export function buildNextBestAction({
  buckets,
  today,
  draftCount,
  automationCount,
  setupAlert
}: {
  buckets: TodayBuckets<ActionLike>;
  today: string;
  draftCount: number;
  automationCount: number;
  setupAlert?: SetupAlert;
}): NextBestAction {
  // A foundational setup obligation that has gone overdue (insurance, privacy,
  // legal, tax) outranks routine overdue work — these carry company-level risk.
  if (setupAlert?.overdueCritical) {
    return {
      title: "Close a foundational setup gap",
      body: `${setupAlert.title} is overdue. Foundational legal, insurance, privacy, or tax work outranks routine tasks.`,
      href: "/setup",
      label: "Open setup",
      tone: "danger"
    };
  }

  const overdue = buckets.overdue[0];
  if (overdue) {
    return {
      title: "Clear overdue work",
      body: `${overdue.title} is overdue. Decide, defer, or complete it before adding optional work.`,
      href: `/actions?status=OPEN&dueBefore=${today}`,
      label: "Open overdue",
      tone: "danger"
    };
  }

  const dueToday = buckets.dueToday[0];
  if (dueToday) {
    return {
      title: "Protect today's commitments",
      body: `${dueToday.title} is due today. Keep the day anchored around committed work first.`,
      href: `/actions?dueBefore=${today}`,
      label: "Open today",
      tone: "warning"
    };
  }

  const blocked = buckets.blocked[0];
  if (blocked) {
    return {
      title: "Unblock stalled work",
      body: `${blocked.title} is blocked. A short decision or follow-up may release more value than starting something new.`,
      href: "/actions?status=BLOCKED",
      label: "Open blocked",
      tone: "blocked"
    };
  }

  if (draftCount > 0) {
    return {
      title: "Review assistant drafts",
      body: `${draftCount} assistant ${draftCount === 1 ? "draft needs" : "drafts need"} judgement before becoming company work.`,
      href: "/assistant",
      label: "Review drafts",
      tone: "neutral"
    };
  }

  if (automationCount === 0) {
    return {
      title: "Create the first safe loop",
      body: "Register one draft-only or approval-required routine so the cockpit starts compounding without losing control.",
      href: "/automations",
      label: "Open templates",
      tone: "success"
    };
  }

  return {
    title: "Set the daily focus",
    body: "Pick one control item, one revenue or delivery item, and one strategic item. Keep the rest visible but secondary.",
    href: "/actions",
    label: "Open actions",
    tone: "neutral"
  };
}

export function buildFocusSet(buckets: TodayBuckets<ActionLike>): FocusSetItem[] {
  const active = [
    ...buckets.overdue,
    ...buckets.dueToday,
    ...buckets.blocked,
    ...buckets.waiting,
    ...buckets.upcoming
  ];

  return [
    {
      label: "Control",
      actionTitle: findAction(active, ["finance", "legal", "compliance", "admin", "governance", "risk", "founder workload"])?.title ?? null,
      href: "/actions?companyFunction=finance",
      emptyText: "No control item selected."
    },
    {
      label: "Revenue",
      actionTitle: findAction(active, ["sales", "marketing", "delivery"])?.title ?? null,
      href: "/actions?companyFunction=sales",
      emptyText: "No revenue or delivery item selected."
    },
    {
      label: "Strategy",
      actionTitle: findAction(active, ["product", "research"], ["ClinicBoss", "Medtech Direction", "HIL/Skool"])?.title ?? null,
      href: "/actions?companyFunction=product",
      emptyText: "No strategic item selected."
    }
  ];
}

export function buildLaunchpadHealth(links: LaunchpadHealthLink[], now = new Date()): LaunchpadHealth {
  const today = dateKey(now);
  const soonLimit = dateKey(addDays(now, 30));
  const metadataGaps = links.map(toMetadataGap).filter((gap): gap is LaunchpadMetadataGap => Boolean(gap));

  return {
    total: links.length,
    renewalsDue: links
      .filter((link) => link.renewalAt && dateKey(new Date(link.renewalAt)) <= today)
      .map(toHealthRef),
    renewalsSoon: links
      .filter((link) => {
        if (!link.renewalAt) return false;
        const renewal = dateKey(new Date(link.renewalAt));
        return renewal > today && renewal <= soonLimit;
      })
      .map(toHealthRef),
    missingOwners: links.filter((link) => !link.owner?.trim()).length,
    missingCosts: links.filter((link) => link.cost === null || link.cost === undefined || String(link.cost).trim() === "").length,
    missingRenewals: links.filter((link) => !link.renewalAt).length,
    missingCredentialNotes: links.filter((link) => !link.loginNote?.trim() && !link.sensitive).length,
    highRisk: links.filter((link) => link.riskLevel === "HIGH" || link.riskLevel === "CRITICAL").map(toHealthRef),
    credentialNotes: links.filter((link) => Boolean(link.loginNote?.trim()) || link.sensitive).length,
    metadataGaps
  };
}

export function buildGovernanceSummary({
  risks,
  decisions
}: {
  risks: GovernanceRisk[];
  decisions: GovernanceDecision[];
}): GovernanceSummary {
  const openRisks = risks.filter((risk) => !["CLOSED", "DONE", "RESOLVED"].includes(risk.status.toUpperCase()));
  const recentDecisions = decisions.slice(0, 3);
  return {
    headline: `${openRisks.length} open ${openRisks.length === 1 ? "risk" : "risks"} and ${recentDecisions.length} recent ${recentDecisions.length === 1 ? "decision" : "decisions"}`,
    riskCount: openRisks.length,
    decisionCount: recentDecisions.length,
    topRisks: openRisks.slice(0, 3),
    recentDecisions
  };
}

function findAction(actions: ActionLike[], functions: string[], streams: string[] = []) {
  return actions.find((action) => {
    const functionName = action.companyFunction?.name?.toLowerCase();
    const streamName = action.stream?.name;
    return (functionName ? functions.includes(functionName) : false) || (streamName ? streams.includes(streamName) : false);
  });
}

function toHealthRef(link: LaunchpadHealthLink): LaunchpadHealthRef {
  return { id: link.id, name: link.name, href: "/launchpad" };
}

function toMetadataGap(link: LaunchpadHealthLink): LaunchpadMetadataGap | null {
  const gaps = [
    !link.owner?.trim() ? "owner" : null,
    link.cost === null || link.cost === undefined || String(link.cost).trim() === "" ? "cost" : null,
    !link.renewalAt ? "renewal date" : null,
    !link.loginNote?.trim() && !link.sensitive ? "credential note" : null
  ].filter((gap): gap is string => Boolean(gap));

  return gaps.length > 0 ? { ...toHealthRef(link), detail: gaps.join(", ") } : null;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
