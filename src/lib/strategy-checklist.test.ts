import { describe, expect, it } from "vitest";
import { phase0AuthorityTrustChecklist } from "./strategy-checklist";

// Canonical reference data seeded in prisma/seed.ts. Kept here so the checklist
// cannot drift onto a stream or function that does not exist.
const SEEDED_STREAMS = ["DromaiosEd", "ClinicBoss", "HIL/Skool", "Medtech Direction", "Company Core"];
const SEEDED_FUNCTIONS = [
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
];
const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

describe("phase0AuthorityTrustChecklist", () => {
  it("is a non-empty checklist", () => {
    expect(phase0AuthorityTrustChecklist.length).toBeGreaterThan(0);
  });

  it("uses unique keys and titles so seeding stays idempotent", () => {
    const keys = phase0AuthorityTrustChecklist.map((item) => item.key);
    const titles = phase0AuthorityTrustChecklist.map((item) => item.title);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("only references seeded streams and functions", () => {
    for (const item of phase0AuthorityTrustChecklist) {
      expect(SEEDED_STREAMS, `stream for ${item.key}`).toContain(item.stream);
      expect(SEEDED_FUNCTIONS, `function for ${item.key}`).toContain(item.companyFunction);
    }
  });

  it("uses valid priorities", () => {
    for (const item of phase0AuthorityTrustChecklist) {
      expect(VALID_PRIORITIES, `priority for ${item.key}`).toContain(item.priority);
    }
  });

  it("gives every item the content needed to be a useful tracked action", () => {
    for (const item of phase0AuthorityTrustChecklist) {
      expect(item.title.trim().length, `title for ${item.key}`).toBeGreaterThan(0);
      expect(item.description.trim().length, `description for ${item.key}`).toBeGreaterThan(0);
      expect(item.nextStep.trim().length, `nextStep for ${item.key}`).toBeGreaterThan(0);
    }
  });

  it("covers the four Phase 0 foundation areas", () => {
    const keys = phase0AuthorityTrustChecklist.map((item) => item.key);
    // security/privacy, clinical governance, regulatory signposting, authority engine
    expect(keys).toContain("essential-eight-baseline");
    expect(keys).toContain("clinical-safety-advisors");
    expect(keys).toContain("samd-positioning-map");
    expect(keys).toContain("posting-cadence-loop");
  });
});
