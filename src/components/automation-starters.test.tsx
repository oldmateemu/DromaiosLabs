import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AutomationStarterTemplates } from "./automation-starters";

describe("AutomationStarterTemplates", () => {
  it("renders safe starter loops with hidden registration fields", () => {
    render(<AutomationStarterTemplates action={async () => {}} />);

    expect(screen.getByRole("heading", { name: "Starter templates" })).toBeInTheDocument();
    expect(screen.getByText("Weekly review prep")).toBeInTheDocument();
    expect(screen.getByText("Stale task summary")).toBeInTheDocument();
    expect(screen.getByText("Daily inbox triage")).toBeInTheDocument();
    expect(screen.getByText("Renewal reminder")).toBeInTheDocument();
    expect(screen.getByText("Company mailroom filing")).toBeInTheDocument();
    expect(screen.getByText("Document intake triage")).toBeInTheDocument();
    expect(screen.getByText("Lead follow-up draft")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Add starter" })).toHaveLength(7);
    expect(screen.getAllByDisplayValue("DRAFT_ONLY").length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue("APPROVAL_REQUIRED")).toHaveLength(3);
    expect(screen.getAllByDisplayValue("local cockpit")).toHaveLength(5);
    expect(screen.getByDisplayValue("Gmail Processor / Apps Script")).toBeInTheDocument();
  });

  it("renders the company mailroom filing starter as approval-gated external filing", () => {
    render(<AutomationStarterTemplates action={async () => {}} />);

    expect(screen.getByText("Company mailroom filing")).toBeInTheDocument();
    expect(screen.getByText(/Files labelled Gmail attachments into Drive quarantine folders/)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Manual Gmail/Drive/Sheets filing review")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Gmail Processor / Apps Script")).toBeInTheDocument();
    expect(screen.getAllByDisplayValue("APPROVAL_REQUIRED")).toHaveLength(3);
  });

  it("renders the document intake triage starter as approval-gated local triage", () => {
    render(<AutomationStarterTemplates action={async () => {}} />);

    expect(screen.getByText("Document intake triage")).toBeInTheDocument();
    expect(screen.getByText(/Pulls scanned\/emailed documents into the intake review queue/)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Manual scan triage")).toBeInTheDocument();
  });
});
