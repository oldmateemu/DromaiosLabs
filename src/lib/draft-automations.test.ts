import { describe, expect, it } from "vitest";
import {
  buildDailyInboxTriageDraft,
  buildStaleTaskSummaryDraft,
  buildWeeklyReviewPrepDraft,
  getLocalDraftAutomationKind
} from "./draft-automations";

describe("getLocalDraftAutomationKind", () => {
  it("recognises the implemented local draft runners", () => {
    expect(getLocalDraftAutomationKind({ name: "Weekly review prep", targetTool: "local cockpit" })).toBe("WEEKLY_REVIEW_PREP");
    expect(getLocalDraftAutomationKind({ name: "Stale task summary", trigger: "Manual stale action scan" })).toBe("STALE_TASK_SUMMARY");
    expect(getLocalDraftAutomationKind({ name: "Daily inbox triage", trigger: "Weekday inbox digest" })).toBe("DAILY_INBOX_TRIAGE");
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
        score: 55,
        band: "Operating",
        done: 4,
        total: 10,
        inProgress: 1,
        notStarted: 5,
        overdue: 1,
        dueSoon: 2,
        criticalOutstanding: 2,
        outstanding: [
          { key: "pi", title: "Professional indemnity insurance in force", category: "Insurance & risk", companyFunction: "risk", priority: "CRITICAL", status: "NOT_STARTED", dueAt: "2026-06-01", overdue: true, dueSoon: false },
          { key: "privacy", title: "Privacy policy and Australian Privacy Principles compliance", category: "Privacy & data protection", companyFunction: "compliance", priority: "HIGH", status: "IN_PROGRESS", dueAt: "2026-06-12", overdue: false, dueSoon: true }
        ]
      }
    });

    expect(draft).toContain("Company setup readiness: 55% (Operating, 1 overdue, 2 high-priority outstanding)");
    expect(draft).toContain("Company setup");
    expect(draft).toContain("Readiness: 55% weighted (Operating).");
    expect(draft).toContain("Progress: 40% (4/10 done, 1 in progress, 5 not started, 1 overdue, 2 due soon).");
    expect(draft).toContain("Professional indemnity insurance in force");
    expect(draft).toContain("overdue");
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

describe("buildDailyInboxTriageDraft", () => {
  it("builds a draft-only inbox digest around the company priority buckets", () => {
    const draft = buildDailyInboxTriageDraft({
      now: new Date("2026-06-05T01:00:00.000Z"),
      actions: [
        {
          id: "action-needed-1",
          title: "Reply to insurance compliance query",
          description: "Needs a decision before EOD.",
          status: "OPEN",
          priority: "HIGH",
          dueAt: new Date("2026-06-05T00:00:00.000Z"),
          updatedAt: new Date("2026-06-04T00:00:00.000Z"),
          createdAt: new Date("2026-06-02T00:00:00.000Z"),
          nextStep: "Draft a short reply for review.",
          stream: { name: "Company Core" },
          companyFunction: { name: "compliance" }
        },
        {
          id: "waiting-1",
          title: "Waiting on venue availability response",
          description: "Course venue email is pending.",
          status: "WAITING",
          priority: "MEDIUM",
          dueAt: null,
          updatedAt: new Date("2026-06-03T00:00:00.000Z"),
          createdAt: new Date("2026-06-01T00:00:00.000Z"),
          nextStep: "Follow up tomorrow if no response.",
          stream: { name: "DromaiosEd" },
          companyFunction: { name: "delivery" }
        },
        {
          id: "finance-1",
          title: "Supplier invoice from venue",
          description: "Invoice PDF needs filing before payment review.",
          status: "OPEN",
          priority: "MEDIUM",
          dueAt: new Date("2026-06-07T00:00:00.000Z"),
          updatedAt: new Date("2026-06-04T00:00:00.000Z"),
          createdAt: new Date("2026-06-03T00:00:00.000Z"),
          nextStep: null,
          stream: { name: "Company Core" },
          companyFunction: { name: "finance" }
        },
        {
          id: "lead-1",
          title: "Lead reply from hospital educator",
          description: "New enquiry about practical de-escalation training.",
          status: "OPEN",
          priority: "HIGH",
          dueAt: null,
          updatedAt: new Date("2026-06-05T00:00:00.000Z"),
          createdAt: new Date("2026-06-05T00:00:00.000Z"),
          nextStep: "Prepare reply draft.",
          stream: { name: "DromaiosEd" },
          companyFunction: { name: "sales" }
        },
        {
          id: "fyi-1",
          title: "FYI software release note",
          description: "No action requested.",
          status: "OPEN",
          priority: "LOW",
          dueAt: null,
          updatedAt: new Date("2026-06-05T00:00:00.000Z"),
          createdAt: new Date("2026-06-05T00:00:00.000Z"),
          nextStep: null,
          stream: { name: "Company Core" },
          companyFunction: { name: "product" }
        },
        {
          id: "noise-1",
          title: "Newsletter unsubscribe candidate",
          description: "Promotional newsletter.",
          status: "OPEN",
          priority: "LOW",
          dueAt: null,
          updatedAt: new Date("2026-06-05T00:00:00.000Z"),
          createdAt: new Date("2026-06-05T00:00:00.000Z"),
          nextStep: null,
          stream: { name: "Company Core" },
          companyFunction: { name: "admin" }
        },
        {
          id: "done-1",
          title: "Completed inbox item",
          description: "Should not be included.",
          status: "DONE",
          priority: "LOW",
          dueAt: null,
          updatedAt: new Date("2026-06-05T00:00:00.000Z"),
          createdAt: new Date("2026-06-05T00:00:00.000Z"),
          nextStep: null,
          stream: null,
          companyFunction: null
        }
      ]
    });

    expect(draft).toContain("Daily inbox triage - draft only");
    expect(draft).toContain("Generated locally: 2026-06-05");
    expect(draft).toContain("No webhook called");
    expect(draft).toContain("No Gmail draft created. No email sent.");
    expect(draft).toContain("Action needed: 1");
    expect(draft).toContain("Waiting: 1");
    expect(draft).toContain("Receipt/invoice: 1");
    expect(draft).toContain("Lead: 1");
    expect(draft).toContain("FYI: 1");
    expect(draft).toContain("Unsubscribe/noise: 1");
    expect(draft).toContain("Priority items older than 48 hours: 2");
    expect(draft).toContain("Reply to insurance compliance query");
    expect(draft).toContain("Waiting on venue availability response");
    expect(draft).toContain("Supplier invoice from venue");
    expect(draft).toContain("Lead reply from hospital educator");
    expect(draft).toContain("FYI software release note");
    expect(draft).toContain("Newsletter unsubscribe candidate");
    expect(draft).not.toContain("Completed inbox item");
    expect(draft).toContain("Email work prepared for review");
  });
});
