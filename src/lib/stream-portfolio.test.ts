import { describe, expect, it } from "vitest";
import { buildStreamPortfolio } from "./stream-portfolio";

const NOW = new Date("2026-06-04T12:00:00.000Z"); // Thursday

const streams = [
  { id: "s1", name: "ClinicBoss" },
  { id: "s2", name: "DromaiosEd" },
  { id: "s3", name: "Medtech Direction" }
];

describe("buildStreamPortfolio", () => {
  it("scores streams by attention and puts the most pressing first", () => {
    const portfolio = buildStreamPortfolio({
      now: NOW,
      streams,
      actions: [
        { status: "OPEN", streamId: "s1", dueAt: "2026-06-01T00:00:00.000Z" }, // overdue
        { status: "BLOCKED", streamId: "s2" },
        { status: "OPEN", streamId: "s3", dueAt: "2026-06-05T00:00:00.000Z" } // due this week
      ],
      risks: [{ status: "OPEN", streamId: "s1", severity: "HIGH" }]
    });

    expect(portfolio[0].name).toBe("ClinicBoss");
    expect(portfolio[0].overdue).toBe(1);
    expect(portfolio[0].highRisks).toBe(1);
    expect(portfolio[0].tone).toBe("danger");
    expect(portfolio[0].headline).toContain("overdue");

    const ed = portfolio.find((stream) => stream.name === "DromaiosEd");
    expect(ed?.blocked).toBe(1);
    expect(ed?.tone).toBe("warning");
  });

  it("counts completions this week and marks otherwise-quiet streams positive", () => {
    const portfolio = buildStreamPortfolio({
      now: NOW,
      streams: [{ id: "s1", name: "ClinicBoss" }],
      actions: [
        { status: "DONE", streamId: "s1", completedAt: "2026-06-03T09:00:00.000Z" },
        { status: "DONE", streamId: "s1", completedAt: "2026-05-20T09:00:00.000Z" }
      ],
      risks: []
    });

    expect(portfolio[0].completedThisWeek).toBe(1);
    expect(portfolio[0].openActions).toBe(0);
    expect(portfolio[0].tone).toBe("positive");
  });

  it("buckets stream-less work under Unassigned", () => {
    const portfolio = buildStreamPortfolio({
      now: NOW,
      streams: [],
      actions: [{ status: "OPEN", streamId: null, dueAt: "2026-06-01T00:00:00.000Z" }],
      risks: [{ status: "OPEN", streamId: null, severity: "LOW" }]
    });

    expect(portfolio).toHaveLength(1);
    expect(portfolio[0].name).toBe("Unassigned");
    expect(portfolio[0].overdue).toBe(1);
    expect(portfolio[0].openRisks).toBe(1);
  });

  it("ignores closed actions and risks", () => {
    const portfolio = buildStreamPortfolio({
      now: NOW,
      streams: [{ id: "s1", name: "ClinicBoss" }],
      actions: [
        { status: "CANCELLED", streamId: "s1", dueAt: "2026-06-01T00:00:00.000Z" },
        { status: "OPEN", streamId: "s1" }
      ],
      risks: [{ status: "CLOSED", streamId: "s1", severity: "HIGH" }]
    });

    expect(portfolio[0].overdue).toBe(0);
    expect(portfolio[0].openActions).toBe(1);
    expect(portfolio[0].openRisks).toBe(0);
    expect(portfolio[0].headline).toContain("on track");
  });
});
