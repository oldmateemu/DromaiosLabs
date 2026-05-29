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
});
