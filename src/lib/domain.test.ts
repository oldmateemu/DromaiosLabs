import { describe, expect, it } from "vitest";
import {
  bucketActionsForToday,
  mapReviewAnswersToDraftActions,
  normaliseQuickCaptureDraft,
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
