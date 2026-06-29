import { describe, expect, it } from "vitest";
import {
  bucketActionsForToday,
  mapReviewAnswersToDraftActions,
  normaliseQuickCaptureDraft,
  priorityLabel,
  statusLabel,
  type ActionLike
} from "./domain";

describe("bucketActionsForToday", () => {
  it("separates overdue, due today, upcoming, blocked, waiting, and completed actions", () => {
    const now = new Date("2026-05-29T09:00:00+08:00");
    const actions: ActionLike[] = [
      { id: "1", title: "Overdue BAS", status: "OPEN", priority: "HIGH", dueAt: new Date("2026-05-20") },
      { id: "2", title: "Send course quote", status: "OPEN", priority: "HIGH", dueAt: new Date("2026-05-29") },
      { id: "3", title: "Renew domain", status: "OPEN", priority: "MEDIUM", dueAt: new Date("2026-06-03") },
      { id: "4", title: "Waiting on lawpath", status: "WAITING", priority: "MEDIUM", dueAt: null },
      { id: "5", title: "Blocked product task", status: "BLOCKED", priority: "HIGH", dueAt: null },
      { id: "6", title: "Finished weekly review", status: "DONE", priority: "LOW", dueAt: new Date("2026-05-29") }
    ];

    const buckets = bucketActionsForToday(actions, now);

    expect(buckets.overdue.map((action) => action.title)).toEqual(["Overdue BAS"]);
    expect(buckets.dueToday.map((action) => action.title)).toEqual(["Send course quote"]);
    expect(buckets.upcoming.map((action) => action.title)).toEqual(["Renew domain"]);
    expect(buckets.waiting.map((action) => action.title)).toEqual(["Waiting on lawpath"]);
    expect(buckets.blocked.map((action) => action.title)).toEqual(["Blocked product task"]);
    expect(buckets.completed.map((action) => action.title)).toEqual(["Finished weekly review"]);
  });

  it("treats active actions without a due date as upcoming", () => {
    const buckets = bucketActionsForToday(
      [{ id: "1", title: "Someday research", status: "OPEN", priority: "LOW", dueAt: null }],
      new Date("2026-05-29T09:00:00+08:00")
    );

    expect(buckets.upcoming.map((action) => action.title)).toEqual(["Someday research"]);
  });

  it("sorts each bucket by priority, then due date, with undated work last", () => {
    const now = new Date("2026-05-29T09:00:00+08:00");
    const actions: ActionLike[] = [
      { id: "1", title: "Low soon", status: "OPEN", priority: "LOW", dueAt: new Date("2026-06-02") },
      { id: "2", title: "Critical later", status: "OPEN", priority: "CRITICAL", dueAt: new Date("2026-06-10") },
      { id: "3", title: "Critical no date", status: "OPEN", priority: "CRITICAL", dueAt: null },
      { id: "4", title: "Critical soon", status: "OPEN", priority: "CRITICAL", dueAt: new Date("2026-06-01") }
    ];

    const buckets = bucketActionsForToday(actions, now);

    expect(buckets.upcoming.map((action) => action.title)).toEqual([
      "Critical soon",
      "Critical later",
      "Critical no date",
      "Low soon"
    ]);
  });
});

describe("priorityLabel and statusLabel", () => {
  it("renders human-friendly priority labels", () => {
    expect(priorityLabel("CRITICAL")).toBe("Critical");
    expect(priorityLabel("LOW")).toBe("Low");
  });

  it("renders human-friendly status labels including multi-word statuses", () => {
    expect(statusLabel("OPEN")).toBe("Open");
    expect(statusLabel("IN_PROGRESS")).toBe("In Progress");
  });
});

describe("normaliseQuickCaptureDraft", () => {
  it("returns a safe failed draft when assistant JSON is invalid", () => {
    const draft = normaliseQuickCaptureDraft("follow up course lead next week", "{not json}");

    expect(draft.state).toBe("FAILED");
    expect(draft.sourceText).toBe("follow up course lead next week");
    expect(draft.proposedAction.title).toBe("follow up course lead next week");
    expect(draft.proposedAction.status).toBe("OPEN");
  });

  it("accepts strict assistant JSON and fills defaults", () => {
    const draft = normaliseQuickCaptureDraft(
      "renew insurance",
      JSON.stringify({
        title: "Renew professional indemnity insurance",
        stream: "Company Core",
        companyFunction: "legal",
        priority: "HIGH",
        dueDate: "2026-06-01",
        nextStep: "Check policy renewal email"
      })
    );

    expect(draft.state).toBe("READY");
    expect(draft.proposedAction.title).toBe("Renew professional indemnity insurance");
    expect(draft.proposedAction.stream).toBe("Company Core");
    expect(draft.proposedAction.companyFunction).toBe("legal");
    expect(draft.proposedAction.dueDate).toBe("2026-06-01");
  });

  it("omits empty optional date fields from assistant JSON", () => {
    const draft = normaliseQuickCaptureDraft(
      "follow up invoice tomorrow",
      JSON.stringify({
        title: "Follow up overdue invoice",
        priority: "HIGH",
        dueDate: "2026-06-22",
        reviewDate: ""
      })
    );

    expect(draft.state).toBe("READY");
    expect(draft.proposedAction.dueDate).toBe("2026-06-22");
    expect(draft.proposedAction.reviewDate).toBeUndefined();
  });
});

describe("mapReviewAnswersToDraftActions", () => {
  it("creates draft actions only for review answers that contain follow-up text", () => {
    const drafts = mapReviewAnswersToDraftActions({
      finance: "Check Xero reconciliation and Airwallex fees",
      compliance: "",
      sales: "Follow up Perth course enquiry",
      founderWorkload: "  "
    });

    expect(drafts).toEqual([
      {
        title: "Review finance: Check Xero reconciliation and Airwallex fees",
        companyFunction: "finance",
        priority: "MEDIUM",
        source: "REVIEW"
      },
      {
        title: "Review sales: Follow up Perth course enquiry",
        companyFunction: "sales",
        priority: "MEDIUM",
        source: "REVIEW"
      }
    ]);
  });
});
