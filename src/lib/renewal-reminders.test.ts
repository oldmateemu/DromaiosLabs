import { describe, expect, it } from "vitest";
import { buildRenewalReminderRun, getLocalApprovalAutomationKind } from "./renewal-reminders";

describe("getLocalApprovalAutomationKind", () => {
  it("recognises the approval-gated renewal reminder runner", () => {
    expect(
      getLocalApprovalAutomationKind({
        name: "Renewal reminder",
        safetyLevel: "APPROVAL_REQUIRED",
        trigger: "Manual launchpad renewal check",
        targetTool: "local cockpit"
      })
    ).toBe("RENEWAL_REMINDER");

    expect(
      getLocalApprovalAutomationKind({
        name: "Renewal reminder",
        safetyLevel: "DRAFT_ONLY",
        trigger: "Manual launchpad renewal check",
        targetTool: "local cockpit"
      })
    ).toBeNull();
  });
});

describe("buildRenewalReminderRun", () => {
  it("builds approved reminder actions for July 1 launchpad renewals due soon", () => {
    const run = buildRenewalReminderRun({
      now: new Date("2026-06-04T09:00:00+08:00"),
      links: [
        {
          id: "xero",
          name: "Xero",
          group: "Money",
          renewalAt: "2026-07-01",
          cost: "0.00",
          owner: "Callum",
          riskLevel: "HIGH",
          loginNote: "Password manager entry name for the Xero admin account",
          sensitive: true
        },
        {
          id: "airwallex",
          name: "Airwallex",
          group: "Money",
          renewalAt: null,
          cost: "0.00",
          owner: "Callum",
          riskLevel: "HIGH",
          loginNote: "Password manager entry name for the Airwallex admin account",
          sensitive: true
        },
        {
          id: "lawpath",
          name: "Lawpath",
          group: "Legal/Admin",
          renewalAt: "2026-07-01",
          cost: "0.00",
          owner: "Callum",
          riskLevel: "HIGH",
          loginNote: "Password manager entry name for the Lawpath admin account",
          sensitive: true
        },
        {
          id: "skool",
          name: "Skool",
          group: "Community/Sales",
          renewalAt: "2026-07-01",
          cost: "0.00",
          owner: "Callum",
          riskLevel: "MEDIUM",
          loginNote: "Password manager entry name for the Skool owner account",
          sensitive: true
        },
        {
          id: "chatgpt",
          name: "ChatGPT",
          group: "AI/Workbench",
          renewalAt: "2026-07-01",
          cost: "0.00",
          owner: "Callum",
          riskLevel: "MEDIUM",
          loginNote: "Password manager entry name for the ChatGPT or OpenAI account",
          sensitive: true
        }
      ]
    });

    expect(run.actionsToCreate.map((action) => action.launchpadLinkId).sort()).toEqual([
      "chatgpt",
      "lawpath",
      "skool",
      "xero"
    ]);
    expect(run.actionsToCreate).toHaveLength(4);
    expect(run.actionsToCreate.every((action) => action.dueAt === "2026-06-24")).toBe(true);
    expect(run.actionsToCreate.find((action) => action.launchpadLinkId === "xero")).toMatchObject({
      title: "Review Xero renewal due 2026-07-01",
      priority: "HIGH",
      sensitive: true
    });
    expect(run.actionsToCreate.find((action) => action.launchpadLinkId === "chatgpt")).toMatchObject({
      priority: "MEDIUM"
    });
    expect(run.responseSummary).toContain("Renewal reminder - approved local run");
    expect(run.responseSummary).toContain("Safety: APPROVAL_REQUIRED");
    expect(run.responseSummary).toContain("No webhook called");
    expect(run.responseSummary).toContain("Renewals due: 0");
    expect(run.responseSummary).toContain("Renewals soon: 4");
    expect(run.responseSummary).toContain("Xero renews 2026-07-01");
    expect(run.responseSummary).not.toContain("Airwallex");
  });

  it("uses today's date for already-due renewal reminders", () => {
    const run = buildRenewalReminderRun({
      now: new Date("2026-07-02T09:00:00+08:00"),
      links: [
        {
          id: "lawpath",
          name: "Lawpath",
          group: "Legal/Admin",
          renewalAt: "2026-07-01",
          cost: "0.00",
          owner: "Callum",
          riskLevel: "HIGH",
          loginNote: "Password manager entry name for the Lawpath admin account",
          sensitive: true
        }
      ]
    });

    expect(run.actionsToCreate).toHaveLength(1);
    expect(run.actionsToCreate[0]).toMatchObject({
      dueAt: "2026-07-02",
      priority: "CRITICAL",
      nextStep: "Confirm the renewal decision, payment status, account owner, cost, and credential access for Lawpath."
    });
    expect(run.responseSummary).toContain("Renewals due: 1");
  });

  it("preserves July 1 calendar dates when Prisma returns Date objects", () => {
    const run = buildRenewalReminderRun({
      now: new Date("2026-06-04T09:00:00+08:00"),
      links: [
        {
          id: "xero",
          name: "Xero",
          group: "Money",
          renewalAt: new Date("2026-07-01T00:00:00.000Z"),
          cost: "0.00",
          owner: "Callum",
          riskLevel: "HIGH",
          loginNote: "Password manager entry name for the Xero admin account",
          sensitive: true
        }
      ]
    });

    expect(run.actionsToCreate[0]).toMatchObject({
      title: "Review Xero renewal due 2026-07-01",
      dueAt: "2026-06-24"
    });
    expect(run.responseSummary).toContain("Xero renews 2026-07-01");
  });
});
