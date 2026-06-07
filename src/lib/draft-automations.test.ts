import { describe, expect, it } from "vitest";
import { buildStaleTaskSummaryDraft, buildWeeklyReviewPrepDraft, getLocalDraftAutomationKind } from "./draft-automations";

describe("getLocalDraftAutomationKind", () => {
  it("recognises the implemented local draft runners", () => {
    expect(getLocalDraftAutomationKind({ name: "Weekly review prep", targetTool: "local cockpit" })).toBe("WEEKLY_REVIEW_PREP");
    expect(getLocalDraftAutomationKind({ name: "Stale task summary", trigger: "Manual stale action scan" })).toBe("STALE_TASK_SUMMARY");
  });
});

describe("buildWeeklyReviewPrepDraft", () => {
  it("builds a local draft-only weekly review brief from cockpit state", () => {
    const draft = buildWeeklyReviewPrepDraft({
      now: new Date("2026-05-31T01:00:00.000Z"),
      draftsNeedingReview: 2,
      actions: [
        {
          id: "action-1",
          title: "Bakermed legal/IP review",
          status: "OPEN",
          priority: "HIGH",
          dueAt: new Date("2026-05-27T00:00:00.000Z"),
          updatedAt: new Date("2026-05-24T00:00:00.000Z"),
          nextStep: "Confirm whether any public wording needs to change.",
          stream: { name: "Company Core" },
          companyFunction: { name: "legal" }
        },
        {
          id: "action-2",
          title: "ClinicBoss trademark clearance",
          status: "WAITING",
          priority: "CRITICAL",
          dueAt: null,
          updatedAt: new Date("2026-05-10T00:00:00.000Z"),
          nextStep: null,
          stream: { name: "ClinicBoss" },
          companyFunction: { name: "legal" }
        },
        {
          id: "action-3",
          title: "Refresh company statements",
          status: "OPEN",
          priority: "MEDIUM",
          dueAt: new Date("2026-06-02T00:00:00.000Z"),
          updatedAt: new Date("2026-05-30T00:00:00.000Z"),
          nextStep: null,
          stream: { name: "Company Core" },
          companyFunction: { name: "marketing" }
        }
      ],
      risks: [
        {
          id: "risk-1",
          issue: "Public TGA/SaMD overclaiming",
          severity: "HIGH",
          status: "OPEN",
          nextReviewAt: new Date("2026-05-30T00:00:00.000Z")
        }
      ],
      links: [
        {
          id: "link-1",
          name: "Lawpath",
          group: "Legal/Admin",
          renewalAt: new Date("2026-05-31T00:00:00.000Z"),
          cost: null,
          owner: "",
          riskLevel: "HIGH",
          loginNote: null,
          sensitive: false
        }
      ]
    });

    expect(draft).toContain("Weekly review prep - draft only");
    expect(draft).toContain("Generated locally: 2026-05-31");
    expect(draft).toContain("No webhook called");
    expect(draft).toContain("Overdue: 1");
    expect(draft).toContain("Waiting: 1");
    expect(draft).toContain("Assistant drafts needing review: 2");
    expect(draft).toContain("Stale open actions: 2");
    expect(draft).toContain("Bakermed legal/IP review");
    expect(draft).toContain("ClinicBoss trademark clearance");
    expect(draft).toContain("Public TGA/SaMD overclaiming");
    expect(draft).toContain("Lawpath");
    expect(draft).toContain("Draft actions to consider");
  });

  it("includes a company setup section when setup context is provided", () => {
    const draft = buildWeeklyReviewPrepDraft({
      now: new Date("2026-05-31T01:00:00.000Z"),
      draftsNeedingReview: 0,
      actions: [],
      risks: [],
      links: [],
      setup: {
        percentComplete: 40,
        done: 4,
        total: 10,
        inProgress: 1,
        notStarted: 5,
        criticalOutstanding: 2,
        outstanding: [
          { key: "pi", title: "Professional indemnity insurance in force", category: "Insurance & risk", companyFunction: "risk", priority: "CRITICAL", status: "NOT_STARTED" },
          { key: "privacy", title: "Privacy policy and Australian Privacy Principles compliance", category: "Privacy & data protection", companyFunction: "compliance", priority: "HIGH", status: "IN_PROGRESS" }
        ]
      }
    });

    expect(draft).toContain("Company setup complete: 40%");
    expect(draft).toContain("Company setup");
    expect(draft).toContain("Progress: 40% (4/10 done, 1 in progress, 5 not started).");
    expect(draft).toContain("Professional indemnity insurance in force");
    expect(draft).toContain("Which outstanding company setup items");
    expect(draft).toContain("Schedule the highest-priority company setup items");
  });

  it("omits the company setup section when no setup context is provided", () => {
    const draft = buildWeeklyReviewPrepDraft({
      now: new Date("2026-05-31T01:00:00.000Z"),
      draftsNeedingReview: 0,
      actions: [],
      risks: [],
      links: []
    });

    expect(draft).not.toContain("Company setup");
  });
});

describe("buildStaleTaskSummaryDraft", () => {
  it("builds a local draft-only stale action digest from cockpit actions", () => {
    const draft = buildStaleTaskSummaryDraft({
      now: new Date("2026-05-31T01:00:00.000Z"),
      actions: [
        {
          id: "action-1",
          title: "ClinicBoss trademark clearance",
          status: "WAITING",
          priority: "CRITICAL",
          dueAt: null,
          updatedAt: new Date("2026-05-10T00:00:00.000Z"),
          nextStep: "Ask counsel for a decision date.",
          stream: { name: "ClinicBoss" },
          companyFunction: { name: "legal" }
        },
        {
          id: "action-2",
          title: "Refresh public company statement",
          status: "OPEN",
          priority: "HIGH",
          dueAt: new Date("2026-05-24T00:00:00.000Z"),
          updatedAt: new Date("2026-05-20T00:00:00.000Z"),
          nextStep: null,
          stream: { name: "Company Core" },
          companyFunction: { name: "marketing" }
        },
        {
          id: "action-3",
          title: "Fresh delivery follow-up",
          status: "OPEN",
          priority: "MEDIUM",
          dueAt: new Date("2026-06-02T00:00:00.000Z"),
          updatedAt: new Date("2026-05-30T00:00:00.000Z"),
          nextStep: null,
          stream: { name: "DromaiosEd" },
          companyFunction: { name: "delivery" }
        },
        {
          id: "action-4",
          title: "Completed old task",
          status: "DONE",
          priority: "LOW",
          dueAt: null,
          updatedAt: new Date("2026-05-01T00:00:00.000Z"),
          nextStep: null,
          stream: null,
          companyFunction: null
        }
      ]
    });

    expect(draft).toContain("Stale task summary - draft only");
    expect(draft).toContain("Generated locally: 2026-05-31");
    expect(draft).toContain("No webhook called");
    expect(draft).toContain("Stale open actions: 2");
    expect(draft).toContain("Critical or high stale actions: 2");
    expect(draft).toContain("Waiting stale actions: 1");
    expect(draft).toContain("ClinicBoss trademark clearance");
    expect(draft).toContain("stale 21 days");
    expect(draft).toContain("Refresh public company statement");
    expect(draft).not.toContain("Fresh delivery follow-up");
    expect(draft).not.toContain("Completed old task");
    expect(draft).toContain("Draft follow-ups to consider");
  });

  it("shows when the stale digest is truncated", () => {
    const actions = Array.from({ length: 13 }, (_, index) => ({
      id: `action-${index + 1}`,
      title: `Stale action ${index + 1}`,
      status: "OPEN" as const,
      priority: "MEDIUM" as const,
      dueAt: null,
      updatedAt: new Date("2026-05-01T00:00:00.000Z"),
      nextStep: null,
      stream: null,
      companyFunction: null
    }));

    const draft = buildStaleTaskSummaryDraft({
      now: new Date("2026-05-31T01:00:00.000Z"),
      actions
    });

    expect(draft).toContain("Stale open actions: 13");
    expect(draft).toContain("- 1 more stale action not shown.");
  });
});
