import { describe, expect, it } from "vitest";
import {
  buildSetupDraftContext,
  COMPANY_SETUP_CHECKLIST,
  normaliseSetupTitle,
  selectOutstandingSetupItems,
  setupItemStatusLabel,
  summariseSetupChecklist,
  type SetupChecklistItem,
  type SetupItemStatus
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

describe("COMPANY_SETUP_CHECKLIST", () => {
  it("has unique keys and titles", () => {
    const keys = COMPANY_SETUP_CHECKLIST.map((item) => item.key);
    const titles = COMPANY_SETUP_CHECKLIST.map((item) => normaliseSetupTitle(item.title));
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("maps every item to a seeded company function", () => {
    for (const item of COMPANY_SETUP_CHECKLIST) {
      expect(SEEDED_FUNCTIONS.has(item.companyFunction)).toBe(true);
    }
  });

  it("gives every item a next step and description", () => {
    for (const item of COMPANY_SETUP_CHECKLIST) {
      expect(item.nextStep.trim().length).toBeGreaterThan(0);
      expect(item.description.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("summariseSetupChecklist", () => {
  const items = [
    {
      key: "a",
      title: "Item A",
      category: "Group one",
      companyFunction: "legal",
      priority: "HIGH" as const,
      description: "desc",
      nextStep: "step",
      sensitive: false
    },
    {
      key: "b",
      title: "Item B",
      category: "Group one",
      companyFunction: "finance",
      priority: "MEDIUM" as const,
      description: "desc",
      nextStep: "step",
      sensitive: false
    },
    {
      key: "c",
      title: "Item C",
      category: "Group two",
      companyFunction: "risk",
      priority: "LOW" as const,
      description: "desc",
      nextStep: "step",
      sensitive: false
    }
  ];

  it("treats unmatched titles as not started", () => {
    const summary = summariseSetupChecklist(items, new Map());
    expect(summary.total).toBe(3);
    expect(summary.done).toBe(0);
    expect(summary.notStarted).toBe(3);
    expect(summary.percentComplete).toBe(0);
  });

  it("counts done and in-progress items and rounds percentage", () => {
    const statusByTitle = new Map<string, SetupItemStatus>([
      [normaliseSetupTitle("Item A"), "DONE"],
      [normaliseSetupTitle("Item B"), "IN_PROGRESS"]
    ]);
    const summary = summariseSetupChecklist(items, statusByTitle);
    expect(summary.done).toBe(1);
    expect(summary.inProgress).toBe(1);
    expect(summary.notStarted).toBe(1);
    expect(summary.percentComplete).toBe(33);
  });

  it("groups items by category in first-seen order with per-category stats", () => {
    const statusByTitle = new Map<string, SetupItemStatus>([
      [normaliseSetupTitle("Item A"), "DONE"]
    ]);
    const summary = summariseSetupChecklist(items, statusByTitle);
    expect(summary.categories.map((c) => c.category)).toEqual(["Group one", "Group two"]);
    const [groupOne, groupTwo] = summary.categories;
    expect(groupOne.total).toBe(2);
    expect(groupOne.done).toBe(1);
    expect(groupOne.percentComplete).toBe(50);
    expect(groupTwo.total).toBe(1);
    expect(groupTwo.percentComplete).toBe(0);
  });
});

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

describe("selectOutstandingSetupItems", () => {
  const items: SetupChecklistItem[] = [
    item({ key: "low", title: "Low item", priority: "LOW" }),
    item({ key: "crit", title: "Critical item", priority: "CRITICAL" }),
    item({ key: "high-started", title: "High started", priority: "HIGH" }),
    item({ key: "high-untouched", title: "High untouched", priority: "HIGH" }),
    item({ key: "done", title: "Done item", priority: "CRITICAL" }),
    item({ key: "cancelled", title: "Cancelled item", priority: "CRITICAL" })
  ];

  const statusByTitle = new Map<string, SetupItemStatus>([
    [normaliseSetupTitle("High started"), "IN_PROGRESS"],
    [normaliseSetupTitle("Done item"), "DONE"],
    [normaliseSetupTitle("Cancelled item"), "CANCELLED"]
  ]);

  it("excludes done and cancelled items and orders by priority then status", () => {
    const summary = summariseSetupChecklist(items, statusByTitle);
    const outstanding = selectOutstandingSetupItems(summary, 10);
    expect(outstanding.map((entry) => entry.key)).toEqual([
      "crit",
      "high-untouched",
      "high-started",
      "low"
    ]);
  });

  it("respects the limit", () => {
    const summary = summariseSetupChecklist(items, statusByTitle);
    expect(selectOutstandingSetupItems(summary, 2).map((entry) => entry.key)).toEqual(["crit", "high-untouched"]);
  });
});

describe("buildSetupDraftContext", () => {
  it("summarises progress and counts high-priority outstanding work", () => {
    const items: SetupChecklistItem[] = [
      item({ key: "crit", title: "Critical item", priority: "CRITICAL" }),
      item({ key: "high", title: "High item", priority: "HIGH" }),
      item({ key: "low", title: "Low item", priority: "LOW" }),
      item({ key: "done", title: "Done item", priority: "HIGH" })
    ];
    const summary = summariseSetupChecklist(
      items,
      new Map<string, SetupItemStatus>([[normaliseSetupTitle("Done item"), "DONE"]])
    );
    const context = buildSetupDraftContext(summary, 2);

    expect(context.total).toBe(4);
    expect(context.done).toBe(1);
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
