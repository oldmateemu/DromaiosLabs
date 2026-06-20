import { describe, expect, it } from "vitest";
import { buildOperatingBrief } from "./operating-brief";

describe("buildOperatingBrief", () => {
  it("prioritises overdue work, Friday review, and first automation guidance", () => {
    const brief = buildOperatingBrief({
      now: new Date("2026-05-29T09:00:00+08:00"),
      overdueCount: 2,
      blockedCount: 1,
      draftCount: 3,
      automationCount: 0
    });

    expect(brief.cards.map((card) => card.title)).toEqual([
      "Clear overdue work",
      "Run the weekly review",
      "Create the first safe loop"
    ]);
    expect(brief.cards[0].route).toBe("/actions?status=OPEN&dueBefore=2026-05-29");
  });

  it("falls back to blocked work when nothing is overdue", () => {
    const brief = buildOperatingBrief({
      now: new Date("2026-05-28T09:00:00+08:00"),
      overdueCount: 0,
      blockedCount: 2,
      draftCount: 0,
      automationCount: 3
    });

    expect(brief.cards.map((card) => card.title)).toEqual([
      "Unblock stalled work",
      "Check review dates",
      "Inspect automation logs"
    ]);
    expect(brief.cards[0].route).toBe("/actions?status=BLOCKED");
  });

  it("surfaces drafts when no overdue or blocked work remains", () => {
    const brief = buildOperatingBrief({
      now: new Date("2026-05-28T09:00:00+08:00"),
      overdueCount: 0,
      blockedCount: 0,
      draftCount: 1,
      automationCount: 1
    });

    expect(brief.cards[0]).toMatchObject({ title: "Approve or reject drafts", route: "/assistant" });
  });

  it("protects the daily lane when the queue is clear", () => {
    const brief = buildOperatingBrief({
      now: new Date("2026-05-28T09:00:00+08:00"),
      overdueCount: 0,
      blockedCount: 0,
      draftCount: 0,
      automationCount: 2
    });

    expect(brief.cards[0]).toMatchObject({ title: "Protect the daily lane", route: "/actions" });
    expect(brief.cards[1].title).toBe("Check review dates");
  });
});
