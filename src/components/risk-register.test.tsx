import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RiskRegister } from "./risk-register";

const noop = async () => {};

const openRisk = {
  id: "risk-open",
  issue: "Founder workload concentration creates single point of failure",
  severity: "MEDIUM",
  status: "OPEN",
  mitigation: "Capture recurring tasks as automations.",
  nextReviewAt: null,
  stream: null,
  companyFunction: { name: "founder workload" }
};

const closedRisk = {
  id: "risk-closed",
  issue: "Key supplier or platform renewal lapses without notice",
  severity: "HIGH",
  status: "CLOSED",
  mitigation: "Track renewals in Launchpad.",
  nextReviewAt: new Date("2026-06-30T00:00:00.000Z"),
  stream: null,
  companyFunction: { name: "risk" }
};

describe("RiskRegister", () => {
  it("shows closed risks with a restore control", () => {
    render(<RiskRegister closeAction={noop} restoreAction={noop} risks={[openRisk, closedRisk]} />);

    expect(screen.getByRole("heading", { name: "Open risks" })).toBeInTheDocument();
    expect(screen.getByText("Founder workload concentration creates single point of failure")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Closed risks" })).toBeInTheDocument();
    const closedRow = screen.getByText("Key supplier or platform renewal lapses without notice").closest("tr");
    expect(closedRow).not.toBeNull();
    expect(within(closedRow as HTMLTableRowElement).getByText("2026-06-30")).toBeInTheDocument();
    expect(within(closedRow as HTMLTableRowElement).getByRole("button", { name: "Restore" })).toBeInTheDocument();
  });
});
