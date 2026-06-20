import { describe, expect, it } from "vitest";
import { buildReviewMomentum } from "./review-momentum";

const NOW = new Date("2026-06-07T12:00:00.000Z");

describe("buildReviewMomentum", () => {
  it("frames counts against the last review date and day gap", () => {
    const momentum = buildReviewMomentum({
      now: NOW,
      lastReviewAt: "2026-05-31T09:00:00.000Z",
      completedCount: 5,
      createdCount: 3,
      newRiskCount: 1,
      decisionCount: 2
    });

    expect(momentum.hasPrevious).toBe(true);
    expect(momentum.sinceKey).toBe("2026-05-31");
    expect(momentum.days).toBe(7);
    expect(momentum.sinceLabel).toContain("2026-05-31");
    expect(momentum.sinceLabel).toContain("7 days ago");
    expect(momentum.cards.find((card) => card.key === "completed")).toMatchObject({ value: "5", tone: "positive" });
    expect(momentum.cards.find((card) => card.key === "risks")).toMatchObject({ value: "1", tone: "warning" });
  });

  it("handles the first-ever review with a records-so-far framing", () => {
    const momentum = buildReviewMomentum({
      now: NOW,
      lastReviewAt: null,
      completedCount: 0,
      createdCount: 4,
      newRiskCount: 0,
      decisionCount: 0
    });

    expect(momentum.hasPrevious).toBe(false);
    expect(momentum.days).toBeNull();
    expect(momentum.sinceLabel).toBe("in your records so far");
    expect(momentum.cards.find((card) => card.key === "completed")?.tone).toBe("neutral");
  });
});
