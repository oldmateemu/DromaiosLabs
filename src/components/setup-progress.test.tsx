import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SetupProgressPanel } from "./setup-progress";
import type { OutstandingSetupItem, SetupReadiness } from "@/lib/company-setup-checklist";

const readiness: SetupReadiness = {
  score: 48,
  percentComplete: 40,
  band: "Foundational gaps",
  headline: "Foundational gaps — 48% readiness, 1 overdue",
  done: 4,
  total: 10,
  overdue: 1,
  dueSoon: 2,
  criticalOutstanding: 3,
  blockingOutstanding: 1
};

const outstanding: OutstandingSetupItem[] = [
  {
    key: "pi",
    title: "Professional indemnity insurance in force",
    category: "Insurance & risk",
    companyFunction: "risk",
    priority: "CRITICAL",
    status: "NOT_STARTED",
    dueAt: "2026-06-01",
    overdue: true,
    dueSoon: false
  },
  {
    key: "privacy",
    title: "Privacy policy and Australian Privacy Principles compliance",
    category: "Privacy & data protection",
    companyFunction: "compliance",
    priority: "HIGH",
    status: "IN_PROGRESS",
    dueAt: "2026-06-12",
    overdue: false,
    dueSoon: true
  }
];

describe("SetupProgressPanel", () => {
  it("surfaces readiness, overdue counts, and the top outstanding setup work", () => {
    render(<SetupProgressPanel outstanding={outstanding} readiness={readiness} />);

    expect(screen.getByRole("heading", { name: "Build-out readiness" })).toBeInTheDocument();
    expect(screen.getByText("Foundational gaps — 48% readiness, 1 overdue")).toBeInTheDocument();
    expect(screen.getByText("4/10 done")).toBeInTheDocument();
    expect(screen.getByText("1 overdue")).toBeInTheDocument();
    expect(screen.getByText("Professional indemnity insurance in force")).toBeInTheDocument();
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open setup checklist" })).toHaveAttribute("href", "/setup");
  });

  it("shows a complete state when nothing is outstanding", () => {
    render(
      <SetupProgressPanel
        outstanding={[]}
        readiness={{ ...readiness, band: "Scale-ready", overdue: 0, dueSoon: 0, criticalOutstanding: 0 }}
      />
    );
    expect(screen.getByText("Company setup checklist is complete. Nothing outstanding.")).toBeInTheDocument();
  });
});
