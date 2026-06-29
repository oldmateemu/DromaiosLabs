import { describe, expect, it } from "vitest";
import { buildCompanyPulse } from "./company-pulse";

const NOW = new Date("2026-06-04T12:00:00.000Z"); // Thursday

describe("buildCompanyPulse", () => {
  it("counts completions for this week and last week with a trend", () => {
    const pulse = buildCompanyPulse({
      now: NOW,
      actions: [
        { status: "DONE", createdAt: "2026-06-02T09:00:00.000Z", completedAt: "2026-06-03T09:00:00.000Z" },
        { status: "DONE", createdAt: "2026-06-02T09:00:00.000Z", completedAt: "2026-06-04T09:00:00.000Z" },
        { status: "DONE", createdAt: "2026-05-20T09:00:00.000Z", completedAt: "2026-05-28T09:00:00.000Z" }
      ],
      automationRuns: [],
      links: [],
      openRiskCount: 0
    });

    expect(pulse.completedThisWeek).toBe(2);
    expect(pulse.completedLastWeek).toBe(1);
    const completed = pulse.metrics.find((metric) => metric.key === "completed");
    expect(completed?.trend).toBe("up");
    expect(completed?.tone).toBe("positive");
  });

  it("flags open actions past their due date as overdue but ignores closed ones", () => {
    const pulse = buildCompanyPulse({
      now: NOW,
      actions: [
        { status: "OPEN", createdAt: NOW, dueAt: "2026-06-01T00:00:00.000Z" },
        { status: "IN_PROGRESS", createdAt: NOW, dueAt: "2026-06-03T00:00:00.000Z" },
        { status: "DONE", createdAt: NOW, dueAt: "2026-05-30T00:00:00.000Z" },
        { status: "OPEN", createdAt: NOW, dueAt: "2026-06-20T00:00:00.000Z" }
      ],
      automationRuns: [],
      links: [],
      openRiskCount: 0
    });

    expect(pulse.overdueOpen).toBe(2);
    expect(pulse.metrics.find((metric) => metric.key === "overdue")?.tone).toBe("danger");
  });

  it("summarises automation success and tracked spend", () => {
    const pulse = buildCompanyPulse({
      now: NOW,
      actions: [],
      automationRuns: [{ status: "SUCCESS" }, { status: "SUCCESS" }, { status: "FAILED" }],
      links: [{ cost: "10.50" }, { cost: 20 }, { cost: null }, { cost: "0" }],
      openRiskCount: 3
    });

    expect(pulse.automationSuccessRate).toBe(67);
    expect(pulse.trackedSpend).toBeCloseTo(30.5);
    expect(pulse.pricedSystems).toBe(2);
    expect(pulse.metrics.find((metric) => metric.key === "spend")?.value).toBe("$30.5");
    expect(pulse.metrics.find((metric) => metric.key === "risks")?.tone).toBe("warning");
  });

  it("handles an empty company with neutral, safe defaults", () => {
    const pulse = buildCompanyPulse({ now: NOW, actions: [], automationRuns: [], links: [], openRiskCount: 0 });
    expect(pulse.automationSuccessRate).toBeNull();
    expect(pulse.metrics.find((metric) => metric.key === "automation")?.value).toBe("—");
    expect(pulse.metrics.find((metric) => metric.key === "overdue")?.tone).toBe("positive");
  });
});
