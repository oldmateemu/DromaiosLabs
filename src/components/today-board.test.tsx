import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TodayBoard } from "./today-board";

describe("TodayBoard", () => {
  it("renders a tidy command board with due, overdue, blocked, and quick capture areas", () => {
    render(
      <TodayBoard
        buckets={{
          overdue: [{ id: "1", title: "Overdue BAS", status: "OPEN", priority: "HIGH", dueAt: new Date("2026-05-20") }],
          dueToday: [{ id: "2", title: "Send course quote", status: "OPEN", priority: "HIGH", dueAt: new Date("2026-05-29") }],
          upcoming: [],
          blocked: [{ id: "3", title: "Blocked ClinicBoss deploy", status: "BLOCKED", priority: "HIGH", dueAt: null }],
          waiting: [],
          completed: []
        }}
        focusSet={[
          { label: "Control", actionTitle: "Overdue BAS", href: "/actions?companyFunction=finance", emptyText: "No control item selected." },
          { label: "Revenue", actionTitle: "Send course quote", href: "/actions?companyFunction=sales", emptyText: "No revenue item selected." },
          { label: "Strategy", actionTitle: null, href: "/actions?companyFunction=product", emptyText: "No strategy item selected." }
        ]}
        nextAction={{
          title: "Clear overdue work",
          body: "Overdue BAS needs a decision before new work is added.",
          href: "/actions?status=OPEN&dueBefore=2026-05-29",
          label: "Open overdue",
          tone: "danger"
        }}
        quickCaptureAction={async () => {}}
      />
    );

    expect(screen.getByRole("heading", { name: "Today Command Board" })).toBeInTheDocument();
    expect(screen.getByText("Next best action")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open overdue" })).toHaveAttribute("href", "/actions?status=OPEN&dueBefore=2026-05-29");
    expect(screen.getByText("Daily focus set")).toBeInTheDocument();
    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("Overdue BAS")).toBeInTheDocument();
    expect(screen.getByText("Send course quote")).toBeInTheDocument();
    expect(screen.getByText("Blocked ClinicBoss deploy")).toBeInTheDocument();
    expect(screen.getByText("No waiting work. Check review dates or capture a loose end.")).toBeInTheDocument();
    expect(screen.getByLabelText("Quick capture")).toBeInTheDocument();
  });

  it("shows a phase pill on cards that carry a strategy phase", () => {
    render(
      <TodayBoard
        buckets={{
          overdue: [],
          dueToday: [],
          upcoming: [],
          blocked: [],
          waiting: [
            { id: "p2", title: "Pursue ISO 27001", status: "WAITING", priority: "HIGH", phase: 2, dueAt: null }
          ],
          completed: []
        }}
        focusSet={[]}
        nextAction={{ title: "Plan the week", body: "Pick a controlled next step.", href: "/actions", label: "Open actions", tone: "neutral" }}
        quickCaptureAction={async () => {}}
      />
    );

    expect(screen.getByText("Pursue ISO 27001")).toBeInTheDocument();
    expect(screen.getByText("Phase 2")).toBeInTheDocument();
  });
});
