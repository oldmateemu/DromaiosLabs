import { describe, expect, it } from "vitest";
import {
  buildRenewalReminderRun,
  getLocalApprovalAutomationKind,
  planRenewalReminderPersistence
} from "./renewal-reminders";

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

  it("recognises the approval-gated company mailroom filing runner", () => {
    expect(
      getLocalApprovalAutomationKind({
        name: "Company mailroom filing",
        safetyLevel: "APPROVAL_REQUIRED",
        trigger: "Manual Gmail/Drive/Sheets filing review",
        targetTool: "Gmail Processor / Apps Script"
      })
    ).toBe("COMPANY_MAILROOM_FILING");

    expect(
      getLocalApprovalAutomationKind({
        name: "Company mailroom filing",
        safetyLevel: "TRUSTED_LOOP",
        trigger: "Manual Gmail/Drive/Sheets filing review",
        targetTool: "Gmail Processor / Apps Script"
      })
    ).toBe(null);
  });

  it("recognises the approval-gated document intake triage runner by its exact name", () => {
    expect(
      getLocalApprovalAutomationKind({
        name: "Document intake triage",
        safetyLevel: "APPROVAL_REQUIRED",
        trigger: "Manual scan triage",
        targetTool: "local cockpit"
      })
    ).toBe("DOCUMENT_INTAKE_TRIAGE");
  });

  it("does not hijack a custom automation that merely mentions document intake / scan triage", () => {
    // An operator's external webhook workflow whose name/trigger/target references
    // scanning must reach the webhook branch, not be replaced by local ingest.
    expect(
      getLocalApprovalAutomationKind({
        name: "Document intake reconciliation (Zapier)",
        safetyLevel: "APPROVAL_REQUIRED",
        trigger: "Nightly scan triage export",
        targetTool: "https://hooks.zapier.com/document-intake"
      })
    ).toBe(null);
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
          sensitive: true,
          streamId: "money-stream"
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
      nextStep: "Review Xero renewal decision before 2026-07-01: owner Callum; cost 0.00; risk HIGH; credential note Password manager entry name for the Xero admin account.",
      sensitive: true,
      streamId: "money-stream"
    });
    expect(run.actionsToCreate.find((action) => action.launchpadLinkId === "lawpath")?.nextStep).toBe(
      "Review Lawpath renewal decision before 2026-07-01: owner Callum; cost 0.00; risk HIGH; credential note Password manager entry name for the Lawpath admin account."
    );
    expect(run.actionsToCreate.find((action) => action.launchpadLinkId === "skool")?.nextStep).toBe(
      "Review Skool renewal decision before 2026-07-01: owner Callum; cost 0.00; risk MEDIUM; credential note Password manager entry name for the Skool owner account."
    );
    expect(run.actionsToCreate.find((action) => action.launchpadLinkId === "chatgpt")).toMatchObject({
      priority: "MEDIUM",
      nextStep: "Review ChatGPT renewal decision before 2026-07-01: owner Callum; cost 0.00; risk MEDIUM; credential note Password manager entry name for the ChatGPT or OpenAI account."
    });
    expect(run.responseSummary).toContain("Renewal reminder - approved local run");
    expect(run.responseSummary).toContain("Safety: APPROVAL_REQUIRED");
    expect(run.responseSummary).toContain("No webhook called");
    expect(run.responseSummary).toContain("Renewals due: 0");
    expect(run.responseSummary).toContain("Renewals soon: 4");
    expect(run.responseSummary).toContain("Reminder actions prepared: 4");
    expect(run.responseSummary).toContain("Xero renews 2026-07-01 (Money, HIGH, owner: Callum, cost: 0.00, credential: Password manager entry name for the Xero admin account). Reminder due 2026-06-24.");
    expect(run.responseSummary).toContain("Lawpath renews 2026-07-01 (Legal/Admin, HIGH, owner: Callum, cost: 0.00, credential: Password manager entry name for the Lawpath admin account). Reminder due 2026-06-24.");
    expect(run.responseSummary).toContain("Skool renews 2026-07-01 (Community/Sales, MEDIUM, owner: Callum, cost: 0.00, credential: Password manager entry name for the Skool owner account). Reminder due 2026-06-24.");
    expect(run.responseSummary).toContain("ChatGPT renews 2026-07-01 (AI/Workbench, MEDIUM, owner: Callum, cost: 0.00, credential: Password manager entry name for the ChatGPT or OpenAI account). Reminder due 2026-06-24.");
    expect(run.actionsToCreate.find((action) => action.launchpadLinkId === "xero")?.description).toContain("Credential note: Password manager entry name for the Xero admin account. Verify access without exposing secrets.");
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
      nextStep: "Review Lawpath renewal decision before 2026-07-01: owner Callum; cost 0.00; risk HIGH; credential note Password manager entry name for the Lawpath admin account."
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

  it("flags a missing credential note instead of treating sensitivity as recorded context", () => {
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
          loginNote: "",
          sensitive: true
        }
      ]
    });

    expect(run.responseSummary).toContain("credential: missing for sensitive system");
    expect(run.actionsToCreate[0].description).toContain("Credential note: missing; add a credential-location note before the renewal decision and keep secrets out of Cockpit.");
  });

  it("plans existing open renewal reminders for refresh instead of leaving stale action text skipped", () => {
    const run = buildRenewalReminderRun({
      now: new Date("2026-06-14T09:00:00+08:00"),
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

    const plan = planRenewalReminderPersistence(run, [{ id: "existing-xero-action", launchpadLinkId: "xero" }]);

    expect(plan.actionsToCreate.map((action) => action.launchpadLinkId)).toEqual(["chatgpt"]);
    expect(plan.actionsToUpdate).toHaveLength(1);
    expect(plan.actionsToUpdate[0]).toMatchObject({
      actionId: "existing-xero-action",
      launchpadLinkId: "xero",
      nextStep: "Review Xero renewal decision before 2026-07-01: owner Callum; cost 0.00; risk HIGH; credential note Password manager entry name for the Xero admin account."
    });
  });
});
