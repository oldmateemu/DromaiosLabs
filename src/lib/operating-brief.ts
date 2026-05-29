type BriefInput = {
  now: Date;
  overdueCount: number;
  blockedCount: number;
  draftCount: number;
  automationCount: number;
};

type BriefCard = {
  title: string;
  body: string;
  route: string;
  actionLabel: string;
};

export type OperatingBrief = {
  generatedFor: string;
  cards: BriefCard[];
};

export function buildOperatingBrief(input: BriefInput): OperatingBrief {
  const today = isoDate(input.now);
  const cards: BriefCard[] = [];

  if (input.overdueCount > 0) {
    cards.push({
      title: "Clear overdue work",
      body: `${input.overdueCount} overdue ${input.overdueCount === 1 ? "action needs" : "actions need"} a decision before new work is added.`,
      route: `/actions?status=OPEN&dueBefore=${today}`,
      actionLabel: "Open overdue"
    });
  } else if (input.blockedCount > 0) {
    cards.push({
      title: "Unblock stalled work",
      body: `${input.blockedCount} blocked ${input.blockedCount === 1 ? "action is" : "actions are"} waiting on a decision, reply, or dependency.`,
      route: "/actions?status=BLOCKED",
      actionLabel: "Open blocked"
    });
  } else if (input.draftCount > 0) {
    cards.push({
      title: "Approve or reject drafts",
      body: `${input.draftCount} assistant ${input.draftCount === 1 ? "draft is" : "drafts are"} waiting for human judgement.`,
      route: "/assistant",
      actionLabel: "Review drafts"
    });
  } else {
    cards.push({
      title: "Protect the daily lane",
      body: "Start with one admin, money, compliance, or sales check before adding optional work.",
      route: "/actions",
      actionLabel: "Open actions"
    });
  }

  if (input.now.getDay() === 5) {
    cards.push({
      title: "Run the weekly review",
      body: "Friday is a good checkpoint for cash, compliance, sales follow-ups, delivery, product, and founder load.",
      route: "/reviews",
      actionLabel: "Open review"
    });
  } else {
    cards.push({
      title: "Check review dates",
      body: "Look for anything due for a review today so quiet risks do not disappear from view.",
      route: `/actions?reviewBefore=${today}`,
      actionLabel: "Review due"
    });
  }

  if (input.automationCount === 0) {
    cards.push({
      title: "Create the first safe loop",
      body: "Register one draft-only or approval-required loop before trying to automate any company workflow.",
      route: "/automations",
      actionLabel: "Open control room"
    });
  } else {
    cards.push({
      title: "Inspect automation logs",
      body: "Review recent runs and blocked attempts before trusting any loop with more responsibility.",
      route: "/automations",
      actionLabel: "Check logs"
    });
  }

  return { generatedFor: today, cards: cards.slice(0, 3) };
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
