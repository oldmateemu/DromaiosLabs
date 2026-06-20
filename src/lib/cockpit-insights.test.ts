import { describe, expect, it } from "vitest";
import {
  buildFocusSet,
  buildGovernanceSummary,
  buildLaunchpadHealth,
  buildNextBestAction
} from "./cockpit-insights";
import type { ActionLike, TodayBuckets } from "./domain";

function emptyBuckets(): TodayBuckets<ActionLike> {
  return {
    overdue: [],
    dueToday: [],
    upcoming: [],
    blocked: [],
    waiting: [],
    completed: []
  };
}

describe("buildNextBestAction", () => {
  it("prioritises overdue work above every other dashboard signal", () => {
    const buckets = emptyBuckets();
    buckets.overdue.push({ id: "a1", title: "Overdue BAS check", status: "OPEN", priority: "HIGH", dueAt: "2026-05-20" });
    buckets.dueToday.push({ id: "a2", title: "Send course quote", status: "OPEN", priority: "HIGH", dueAt: "2026-05-30" });

    const next = buildNextBestAction({
      buckets,
      today: "2026-05-30",
      draftCount: 2,
      automationCount: 0
    });

    expect(next.title).toBe("Clear overdue work");
    expect(next.body).toContain("Overdue BAS check");
    expect(next.href).toBe("/actions?status=OPEN&dueBefore=2026-05-30");
    expect(next.tone).toBe("danger");
  });

  it("escalates an overdue foundational setup gap above routine overdue work", () => {
    const buckets = emptyBuckets();
    buckets.overdue.push({ id: "a1", title: "Overdue BAS check", status: "OPEN", priority: "HIGH", dueAt: "2026-05-20" });

    const next = buildNextBestAction({
      buckets,
      today: "2026-05-30",
      draftCount: 0,
      automationCount: 1,
      setupAlert: { title: "Professional indemnity insurance in force", overdueCritical: true }
    });

    expect(next.title).toBe("Close a foundational setup gap");
    expect(next.body).toContain("Professional indemnity insurance in force");
    expect(next.href).toBe("/setup");
    expect(next.tone).toBe("danger");
  });

  it("ignores the setup alert when it is not an overdue critical gap", () => {
    const next = buildNextBestAction({
      buckets: emptyBuckets(),
      today: "2026-05-30",
      draftCount: 0,
      automationCount: 1,
      setupAlert: { title: "Trademark filings", overdueCritical: false }
    });
    expect(next.title).toBe("Set the daily focus");
  });

  it("falls back through due today, blocked, drafts, automation setup, and the calm daily lane", () => {
    const dueToday = emptyBuckets();
    dueToday.dueToday.push({ id: "a1", title: "Send Perth proposal", status: "OPEN", priority: "HIGH", dueAt: "2026-05-30" });
    expect(buildNextBestAction({ buckets: dueToday, today: "2026-05-30", draftCount: 0, automationCount: 1 }).title).toBe(
      "Protect today's commitments"
    );

    const blocked = emptyBuckets();
    blocked.blocked.push({ id: "a2", title: "ClinicBoss deploy", status: "BLOCKED", priority: "HIGH", dueAt: null });
    expect(buildNextBestAction({ buckets: blocked, today: "2026-05-30", draftCount: 0, automationCount: 1 }).title).toBe(
      "Unblock stalled work"
    );

    expect(buildNextBestAction({ buckets: emptyBuckets(), today: "2026-05-30", draftCount: 1, automationCount: 1 }).title).toBe(
      "Review assistant drafts"
    );
    expect(buildNextBestAction({ buckets: emptyBuckets(), today: "2026-05-30", draftCount: 0, automationCount: 0 }).title).toBe(
      "Create the first safe loop"
    );
    expect(buildNextBestAction({ buckets: emptyBuckets(), today: "2026-05-30", draftCount: 0, automationCount: 1 }).title).toBe(
      "Set the daily focus"
    );
  });
});

describe("buildFocusSet", () => {
  it("selects one control, one revenue or delivery, and one strategic item from the active work", () => {
    const buckets = emptyBuckets();
    buckets.upcoming.push(
      {
        id: "finance",
        title: "Check Xero renewal",
        status: "OPEN",
        priority: "MEDIUM",
        dueAt: null,
        companyFunction: { name: "finance" },
        stream: { name: "Company Core" }
      },
      {
        id: "sales",
        title: "Follow up course enquiry",
        status: "OPEN",
        priority: "HIGH",
        dueAt: null,
        companyFunction: { name: "sales" },
        stream: { name: "DromaiosEd" }
      },
      {
        id: "product",
        title: "Review ClinicBoss roadmap",
        status: "OPEN",
        priority: "LOW",
        dueAt: null,
        companyFunction: { name: "product" },
        stream: { name: "ClinicBoss" }
      }
    );

    const focus = buildFocusSet(buckets);

    expect(focus.map((item) => item.label)).toEqual(["Control", "Revenue", "Strategy"]);
    expect(focus.map((item) => item.actionTitle)).toEqual([
      "Check Xero renewal",
      "Follow up course enquiry",
      "Review ClinicBoss roadmap"
    ]);
  });
});

describe("buildLaunchpadHealth", () => {
  it("summarises renewals, ownership gaps, cost gaps, risk, and credential notes", () => {
    const health = buildLaunchpadHealth(
      [
        {
          id: "xero",
          name: "Xero",
          group: "Money",
          renewalAt: new Date("2026-05-29"),
          cost: null,
          owner: null,
          riskLevel: "HIGH",
          loginNote: "1Password",
          sensitive: false
        },
        {
          id: "lawpath",
          name: "Lawpath",
          group: "Legal/Admin",
          renewalAt: new Date("2026-06-10"),
          cost: "89.00",
          owner: "Callum",
          riskLevel: "MEDIUM",
          loginNote: null,
          sensitive: true
        },
        {
          id: "github",
          name: "GitHub",
          group: "Product",
          renewalAt: null,
          cost: "0.00",
          owner: "Callum",
          riskLevel: "HIGH",
          loginNote: "",
          sensitive: false
        }
      ],
      new Date("2026-05-30T08:00:00+08:00")
    );

    expect(health.total).toBe(3);
    expect(health.renewalsDue.map((link) => link.name)).toEqual(["Xero"]);
    expect(health.renewalsSoon.map((link) => link.name)).toEqual(["Lawpath"]);
    expect(health.missingOwners).toBe(1);
    expect(health.missingCosts).toBe(1);
    expect(health.missingRenewals).toBe(1);
    expect(health.missingCredentialNotes).toBe(1);
    expect(health.highRisk.map((link) => link.name)).toEqual(["Xero", "GitHub"]);
    expect(health.credentialNotes).toBe(2);
    expect(health.metadataGaps.map((link) => `${link.name}: ${link.detail}`)).toEqual([
      "Xero: owner, cost",
      "GitHub: renewal date, credential note"
    ]);
  });
});

describe("buildGovernanceSummary", () => {
  it("keeps risks and decisions visible without requiring a new workflow", () => {
    const summary = buildGovernanceSummary({
      risks: [
        { id: "risk-1", issue: "Public claim review needed", severity: "HIGH", status: "OPEN", nextReviewAt: new Date("2026-05-31") }
      ],
      decisions: [
        { id: "decision-1", decision: "Keep Skool as participation layer", decidedAt: new Date("2026-05-28") }
      ]
    });

    expect(summary.riskCount).toBe(1);
    expect(summary.decisionCount).toBe(1);
    expect(summary.headline).toBe("1 open risk and 1 recent decision");
  });
});
