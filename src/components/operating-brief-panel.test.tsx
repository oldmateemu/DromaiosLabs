import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OperatingBriefPanel } from "./operating-brief-panel";

describe("OperatingBriefPanel", () => {
  it("renders each brief card with its guidance and routed action", () => {
    render(
      <OperatingBriefPanel
        brief={{
          generatedFor: "2026-06-07",
          cards: [
            { title: "Clear overdue work", body: "2 overdue actions need a decision.", route: "/actions?status=OPEN", actionLabel: "Open overdue" },
            { title: "Run the weekly review", body: "Friday checkpoint.", route: "/reviews", actionLabel: "Open review" }
          ]
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "Company guidance for 2026-06-07" })).toBeInTheDocument();
    expect(screen.getByText("Clear overdue work")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open overdue" })).toHaveAttribute("href", "/actions?status=OPEN");
    expect(screen.getByRole("link", { name: "Open review" })).toHaveAttribute("href", "/reviews");
  });
});
