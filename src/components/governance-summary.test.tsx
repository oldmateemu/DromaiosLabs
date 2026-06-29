import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GovernanceSummaryPanel } from "./governance-summary";

describe("GovernanceSummaryPanel", () => {
  it("surfaces open risks and recent decisions on the Today page", () => {
    render(
      <GovernanceSummaryPanel
        summary={{
          headline: "1 open risk and 1 recent decision",
          riskCount: 1,
          decisionCount: 1,
          topRisks: [
            {
              id: "risk-1",
              issue: "Public claim review needed",
              severity: "HIGH",
              status: "OPEN"
            }
          ],
          recentDecisions: [
            {
              id: "decision-1",
              decision: "Keep public copy authority-first",
              decidedAt: new Date("2026-05-30")
            }
          ]
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "Risks and decisions" })).toBeInTheDocument();
    expect(screen.getByText("1 open risk and 1 recent decision")).toBeInTheDocument();
    expect(screen.getByText("Public claim review needed")).toBeInTheDocument();
    expect(screen.getByText("Keep public copy authority-first")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open governance" })).toHaveAttribute("href", "/governance");
  });
});
