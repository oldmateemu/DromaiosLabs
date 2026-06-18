import { describe, expect, it } from "vitest";
import {
  buildSetupDraftContext,
  buildSetupReadiness,
  COMPANY_SETUP_CHECKLIST,
  normaliseSetupTitle,
  selectOutstandingSetupItems,
  setupDueDate,
  setupHorizonDays,
  setupItemStatusLabel,
  summariseSetupChecklist,
  type SetupActionState,
  type SetupChecklistItem
} from "./company-setup-checklist";

const SEEDED_FUNCTIONS = new Set([
  "finance",
  "legal",
  "compliance",
  "admin",
  "sales",
  "marketing",
  "delivery",
  "product",
  "research",
  "governance",
  "risk",
  "founder workload"
]);

const NOW = new Date("2026-06-07T00:00:00.000Z");

function state(status: SetupActionState["status"], dueAt?: SetupActionState["dueAt"]): SetupActionState {
  return { status, dueAt };
}

function stateMap(entries: [string, SetupActionState][]) {
  return new Map<string, SetupActionState>(entries.map(([title, value]) => [normaliseSetupTitle(title), value]));
}

function item(overrides: Partial<SetupChecklistItem> & Pick<SetupChecklistItem, "key" | "title" | "priority">): SetupChecklistItem {
  return {
    category: "Group",
    companyFunction: "legal",
    description: "desc",
    nextStep: "step",
    sensitive: false,
    ...overrides
  };
}

describe("COMPANY_SETUP_CHECKLIST", () => {
  it("has unique keys and titles", () => {
    const keys = COMPANY_SETUP_CHECKLIST.map((entry) => entry.key);
    const titles = COMPANY_SETUP_CHECKLIST.map((entry) => normaliseSetupTitle(entry.title));
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("maps every item to a seeded company function", () => {
    for (const entry of COMPANY_SETUP_CHECKLIST) {
      expect(SEEDED_FUNCTIONS.has(entry.companyFunction)).toBe(true);
    }
  });

  it("gives every item a next step and description", () => {
    for (const entry of COMPANY_SETUP_CHECKLIST) {
      expect(entry.nextStep.trim().length).toBeGreaterThan(0);
      expect(entry.description.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("setupHorizonDays / setupDueDate", () => {
  it("derives a tighter horizon for higher-priority work", () => {
    expect(setupHorizonDays({ priority: "CRITICAL" })).toBe(14);
    expect(setupHorizonDays({ priority: "HIGH" })).toBe(30);
    expect(setupHorizonDays({ priority: "MEDIUM" })).toBe(45);
    expect(setupHorizonDays({ priority: "LOW" })).toBe(60);
  });

  it("respects an explicit horizon override", () => {
    expect(setupHorizonDays({ priority: "LOW", horizonDays: 7 })).toBe(7);
  });

  it("computes a due date measured from the given start", () => {
    const due = setupDueDate({ priority: "HIGH" }, NOW);
    expect(due.toISOString().slice(0, 10)).toBe("2026-07-07");
  });
});

describe("summariseSetupChecklist", () => {
  const items = [
    item({ key: "a", title: "Item A", priority: "HIGH", category: "Group one" }),
    item({ key: "b", title: "Item B", priority: "MEDIUM", category: "Group one", companyFunction: "finance" }),
    item({ key: "c", title: "Item C", priority: "LOW", category: "Group two", companyFunction: "risk" })
  ];

  it("treats unmatched titles as not started", () => {
    const summary = summariseSetupChecklist(items, new Map(), NOW);
    expect(summary.total).toBe(3);
    expect(summary.done).toBe(0);
    expect(summary.notStarted).toBe(3);
    expect(summary.percentComplete).toBe(0);
  });

  it("counts done and in-progress items and rounds percentage", () => {
    const summary = summariseSetupChecklist(
      items,
      stateMap([
        ["Item A", state("DONE")],
        ["Item B", state("IN_PROGRESS")]
      ]),
      NOW
    );
    expect(summary.done).toBe(1);
    expect(summary.inProgress).toBe(1);
    expect(summary.notStarted).toBe(1);
    expect(summary.percentComplete).toBe(33);
  });

  it("flags overdue and due-soon items but never completed ones", () => {
    const summary = summariseSetupChecklist(
      items,
      stateMap([
        ["Item A", state("OPEN", "2026-06-01")], // overdue
        ["Item B", state("OPEN", "2026-06-10")], // due soon (within 14 days)
        ["Item C", state("DONE", "2026-01-01")] // past due but done -> not overdue
      ]),
      NOW
    );
    expect(summary.overdue).toBe(1);
    expect(summary.dueSoon).toBe(1);

    const [groupOne] = summary.categories;
    expect(groupOne.overdue).toBe(1);
    expect(groupOne.dueSoon).toBe(1);
  });

  it("does not count parked WAITING/BLOCKED items as overdue", () => {
    const summary = summariseSetupChecklist(
      items,
      stateMap([
        ["Item A", state("WAITING", "2026-06-01")], // parked, past due -> not overdue
        ["Item B", state("BLOCKED", "2026-06-01")], // parked, past due -> not overdue
        ["Item C", state("IN_PROGRESS", "2026-06-01")] // active, past due -> overdue
      ]),
      NOW
    );
    expect(summary.overdue).toBe(1);
  });

  it("groups items by category in first-seen order with per-category stats", () => {
    const summary = summariseSetupChecklist(items, stateMap([["Item A", state("DONE")]]), NOW);
    expect(summary.categories.map((c) => c.category)).toEqual(["Group one", "Group two"]);
    const [groupOne, groupTwo] = summary.categories;
    expect(groupOne.total).toBe(2);
    expect(groupOne.done).toBe(1);
    expect(groupOne.percentComplete).toBe(50);
    expect(groupTwo.total).toBe(1);
    expect(groupTwo.percentComplete).toBe(0);
  });
});

describe("selectOutstandingSetupItems", () => {
  const items: SetupChecklistItem[] = [
    item({ key: "low", title: "Low item", priority: "LOW" }),
    item({ key: "crit", title: "Critical item", priority: "CRITICAL" }),
    item({ key: "high-started", title: "High started", priority: "HIGH" }),
    item({ key: "high-untouched", title: "High untouched", priority: "HIGH" }),
    item({ key: "done", title: "Done item", priority: "CRITICAL" }),
    item({ key: "cancelled", title: "Cancelled item", priority: "CRITICAL" })
  ];

  const states = stateMap([
    ["High started", state("IN_PROGRESS")],
    ["Done item", state("DONE")],
    ["Cancelled item", state("CANCELLED")]
  ]);

  it("excludes done and cancelled items and orders by priority then status", () => {
    const summary = summariseSetupChecklist(items, states, NOW);
    const outstanding = selectOutstandingSetupItems(summary, 10);
    expect(outstanding.map((entry) => entry.key)).toEqual(["crit", "high-untouched", "high-started", "low"]);
  });

  it("lifts overdue items above higher-priority work that is not overdue", () => {
    const summary = summariseSetupChecklist(
      items,
      stateMap([["Low item", state("OPEN", "2026-06-01")]]),
      NOW
    );
    expect(selectOutstandingSetupItems(summary, 1)[0].key).toBe("low");
  });

  it("respects the limit", () => {
    const summary = summariseSetupChecklist(items, states, NOW);
    expect(selectOutstandingSetupItems(summary, 2).map((entry) => entry.key)).toEqual(["crit", "high-untouched"]);
  });
});

describe("buildSetupReadiness", () => {
  it("does not penalise readiness for cancelled items", () => {
    const items: SetupChecklistItem[] = [
      item({ key: "cancelled-critical", title: "Cancelled critical", priority: "CRITICAL" }),
      item({ key: "done-high", title: "Done high", priority: "HIGH" })
    ];
    const summary = summariseSetupChecklist(
      items,
      stateMap([
        ["Cancelled critical", state("CANCELLED")],
        ["Done high", state("DONE")]
      ]),
      NOW
    );
    const readiness = buildSetupReadiness(summary);
    expect(readiness.score).toBe(100);
    expect(readiness.criticalOutstanding).toBe(0);
    expect(readiness.blockingOutstanding).toBe(0);
  });

  it("weights completion by priority and bands a critical gap as foundational", () => {
    const items: SetupChecklistItem[] = [
      item({ key: "crit", title: "Critical item", priority: "CRITICAL" }),
      item({ key: "high", title: "High item", priority: "HIGH" }),
      item({ key: "low", title: "Low item", priority: "LOW" }),
      item({ key: "done", title: "Done item", priority: "HIGH" })
    ];
    const summary = summariseSetupChecklist(items, stateMap([["Done item", state("DONE")]]), NOW);
    const readiness = buildSetupReadiness(summary);

    // weights: crit 8, high 4, low 1, done(high) 4 -> done 4 / total 17
    expect(readiness.score).toBe(24);
    expect(readiness.band).toBe("Foundational gaps");
    expect(readiness.blockingOutstanding).toBe(1);
    expect(readiness.criticalOutstanding).toBe(2);
  });

  it("reports Scale-ready when weighted score is high with no overdue or critical gaps", () => {
    const items: SetupChecklistItem[] = [
      item({ key: "h", title: "High done", priority: "HIGH" }),
      item({ key: "m", title: "Medium done", priority: "MEDIUM" }),
      item({ key: "l", title: "Low open", priority: "LOW" })
    ];
    const summary = summariseSetupChecklist(
      items,
      stateMap([
        ["High done", state("DONE")],
        ["Medium done", state("DONE")]
      ]),
      NOW
    );
    const readiness = buildSetupReadiness(summary);
    expect(readiness.score).toBe(86); // 6 / 7
    expect(readiness.band).toBe("Scale-ready");
  });

  it("reports Operating when mid-readiness with a high-priority but non-critical gap", () => {
    const items: SetupChecklistItem[] = [
      item({ key: "h1", title: "High done", priority: "HIGH" }),
      item({ key: "h2", title: "High open", priority: "HIGH" }),
      item({ key: "m", title: "Medium done", priority: "MEDIUM" })
    ];
    const summary = summariseSetupChecklist(
      items,
      stateMap([
        ["High done", state("DONE")],
        ["Medium done", state("DONE")]
      ]),
      NOW
    );
    const readiness = buildSetupReadiness(summary);
    expect(readiness.score).toBe(60); // 6 / 10
    expect(readiness.band).toBe("Operating");
    expect(readiness.headline).toContain("Operating");
  });
});

describe("buildSetupDraftContext", () => {
  it("summarises progress, readiness, and outstanding work", () => {
    const items: SetupChecklistItem[] = [
      item({ key: "crit", title: "Critical item", priority: "CRITICAL" }),
      item({ key: "high", title: "High item", priority: "HIGH" }),
      item({ key: "low", title: "Low item", priority: "LOW" }),
      item({ key: "done", title: "Done item", priority: "HIGH" })
    ];
    const summary = summariseSetupChecklist(items, stateMap([["Done item", state("DONE")]]), NOW);
    const context = buildSetupDraftContext(summary, 2);

    expect(context.total).toBe(4);
    expect(context.done).toBe(1);
    expect(context.score).toBe(24);
    expect(context.band).toBe("Foundational gaps");
    expect(context.criticalOutstanding).toBe(2);
    expect(context.outstanding).toHaveLength(2);
    expect(context.outstanding.map((entry) => entry.key)).toEqual(["crit", "high"]);
  });
});

describe("setupItemStatusLabel", () => {
  it("formats statuses for display", () => {
    expect(setupItemStatusLabel("IN_PROGRESS")).toBe("In progress");
    expect(setupItemStatusLabel("NOT_STARTED")).toBe("Not started");
    expect(setupItemStatusLabel("DONE")).toBe("Done");
  });
});
