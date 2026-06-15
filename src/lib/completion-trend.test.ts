import { describe, expect, it } from "vitest";
import { buildCompletionTrend } from "./completion-trend";

const NOW = new Date("2026-06-04T12:00:00.000Z"); // Thursday; week starts Mon 2026-06-01

describe("buildCompletionTrend", () => {
  it("buckets completions into the correct ISO weeks", () => {
    const trend = buildCompletionTrend({
      now: NOW,
      weeks: 4,
      completedAts: [
        "2026-06-02T09:00:00.000Z", // this week
        "2026-06-03T09:00:00.000Z", // this week
        "2026-05-26T09:00:00.000Z", // last week
        "2026-05-15T09:00:00.000Z" // three weeks ago
      ]
    });

    expect(trend.weeks).toHaveLength(4);
    expect(trend.weeks[3].weekStart).toBe("2026-06-01");
    expect(trend.thisWeek).toBe(2);
    expect(trend.lastWeek).toBe(1);
    expect(trend.total).toBe(4);
    expect(trend.max).toBe(2);
    expect(trend.average).toBe(1);
    expect(trend.weeks[0].label).toMatch(/^May \d+$/);
  });

  it("ignores completions outside the window and invalid dates", () => {
    const trend = buildCompletionTrend({
      now: NOW,
      weeks: 2,
      completedAts: ["2026-06-02T00:00:00.000Z", "2020-01-01T00:00:00.000Z", null, undefined]
    });

    expect(trend.total).toBe(1);
    expect(trend.weeks).toHaveLength(2);
    expect(trend.thisWeek).toBe(1);
  });
});
