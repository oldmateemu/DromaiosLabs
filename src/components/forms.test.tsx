import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActionSavedViews, CollapsiblePanel } from "./forms";

describe("ActionSavedViews", () => {
  it("renders common operating lenses as direct action register links", () => {
    render(<ActionSavedViews today="2026-05-30" weekEnd="2026-06-06" />);

    expect(screen.getByRole("link", { name: "Today" })).toHaveAttribute("href", "/actions?dueBefore=2026-05-30");
    expect(screen.getByRole("link", { name: "This week" })).toHaveAttribute("href", "/actions?dueBefore=2026-06-06");
    expect(screen.getByRole("link", { name: "Compliance" })).toHaveAttribute("href", "/actions?companyFunction=compliance");
    expect(screen.getByRole("link", { name: "Founder load" })).toHaveAttribute("href", "/actions?companyFunction=founder+workload");
  });
});

describe("CollapsiblePanel", () => {
  it("keeps secondary controls available without opening them by default", () => {
    render(
      <CollapsiblePanel eyebrow="Capture" title="New Action">
        <button type="button">Create action</button>
      </CollapsiblePanel>
    );

    const details = screen.getByText("New Action").closest("details");
    expect(details).not.toHaveAttribute("open");
    expect(screen.getByRole("button", { name: "Create action" })).toBeInTheDocument();
  });
});
