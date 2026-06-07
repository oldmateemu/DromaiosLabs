import { describe, expect, it } from "vitest";
import {
  COMPANY_SETUP_CHECKLIST,
  normaliseSetupTitle,
  summariseSetupChecklist,
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
