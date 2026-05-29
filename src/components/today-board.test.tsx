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
        quickCaptureAction={async () => {}}
      />
    );

    expect(screen.getByRole("heading", { name: "Today Command Board" })).toBeInTheDocument();
    expect(screen.getByText("Overdue BAS")).toBeInTheDocument();
    expect(screen.getByText("Send course quote")).toBeInTheDocument();
    expect(screen.getByText("Blocked ClinicBoss deploy")).toBeInTheDocument();
    expect(screen.getByLabelText("Quick capture")).toBeInTheDocument();
  });
});
