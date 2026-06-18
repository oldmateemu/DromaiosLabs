import { describe, expect, it } from "vitest";
import { SALES_PIPELINE_STAGES, summariseSalesPipeline, type SalesActionLike } from "./sales-pipeline";

const NOW = new Date("2026-06-07T00:00:00.000Z");

describe("SALES_PIPELINE_STAGES", () => {
  it("has unique keys and complete guidance for every stage", () => {
    const keys = SALES_PIPELINE_STAGES.map((stage) => stage.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const stage of SALES_PIPELINE_STAGES) {
      expect(stage.name.trim().length).toBeGreaterThan(0);
      expect(stage.description.trim().length).toBeGreaterThan(0);
      expect(stage.exitCriterion.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("summariseSalesPipeline", () => {
  const actions: SalesActionLike[] = [
    { id: "1", title: "Follow up Perth enquiry", status: "OPEN", priority: "HIGH", dueAt: "2026-06-01", stream: { name: "DromaiosEd" } },
    { id: "2", title: "Draft pilot scope", status: "IN_PROGRESS", priority: "MEDIUM", dueAt: "2026-06-20" },
    { id: "3", title: "Awaiting partner sign-off", status: "WAITING", priority: "HIGH", dueAt: "2026-06-05" },
    { id: "4", title: "Closed won deal", status: "DONE", priority: "LOW", dueAt: null }
  ];

  it("excludes done/cancelled work and counts active items by status", () => {
    const summary = summariseSalesPipeline(actions, NOW);
    expect(summary.total).toBe(3);
    expect(summary.open).toBe(1);
    expect(summary.inProgress).toBe(1);
    expect(summary.waiting).toBe(1);
  });

  it("flags overdue only for active work, not parked WAITING items", () => {
    const summary = summariseSalesPipeline(actions, NOW);
    // Item 1 (OPEN, due 2026-06-01) is overdue; item 3 (WAITING) is parked, not overdue.
    expect(summary.overdue).toBe(1);
  });

  it("sorts follow-ups by priority then soonest due date", () => {
    const summary = summariseSalesPipeline(actions, NOW);
    expect(summary.followUps.map((followUp) => followUp.id)).toEqual(["1", "3", "2"]);
  });
});
