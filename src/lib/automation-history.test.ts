import { describe, expect, it } from "vitest";
import { summariseAutomationRuns } from "./automation-history";

describe("summariseAutomationRuns", () => {
  it("returns a null success rate when there are no runs", () => {
    expect(summariseAutomationRuns([])).toEqual({
      total: 0,
      success: 0,
      failed: 0,
      blocked: 0,
      successRate: null
    });
  });

  it("counts each status and rounds the success rate", () => {
    const summary = summariseAutomationRuns([
      { status: "SUCCESS" },
      { status: "SUCCESS" },
      { status: "FAILED" },
      { status: "BLOCKED" }
    ]);

    expect(summary).toEqual({
      total: 4,
      success: 2,
      failed: 1,
      blocked: 1,
      successRate: 50
    });
  });

  it("reports a perfect run history as 100 percent", () => {
    expect(summariseAutomationRuns([{ status: "SUCCESS" }, { status: "SUCCESS" }]).successRate).toBe(100);
  });
});
