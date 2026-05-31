import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AutomationStarterTemplates } from "./automation-starters";

describe("AutomationStarterTemplates", () => {
  it("renders safe starter loops with hidden registration fields", () => {
    render(<AutomationStarterTemplates action={async () => {}} />);

    expect(screen.getByRole("heading", { name: "Starter templates" })).toBeInTheDocument();
    expect(screen.getByText("Weekly review prep")).toBeInTheDocument();
    expect(screen.getByText("Stale task summary")).toBeInTheDocument();
    expect(screen.getByText("Renewal reminder")).toBeInTheDocument();
    expect(screen.getByText("Lead follow-up draft")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Add starter" })).toHaveLength(4);
    expect(screen.getAllByDisplayValue("DRAFT_ONLY").length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue("APPROVAL_REQUIRED")).toBeInTheDocument();
  });
});
