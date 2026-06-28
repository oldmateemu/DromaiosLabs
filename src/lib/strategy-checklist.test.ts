import { describe, expect, it } from "vitest";
import { authorityTrustChecklist } from "./strategy-checklist";

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
const VALID_PHASES = [0, 1, 2, 3];

describe("authorityTrustChecklist", () => {
  it("is a non-empty checklist", () => {
    expect(authorityTrustChecklist.length).toBeGreaterThan(0);
  });

  it("uses unique keys and titles so seeding stays idempotent", () => {
    const keys = authorityTrustChecklist.map((item) => item.key);
    const titles = authorityTrustChecklist.map((item) => item.title);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("only references seeded streams and functions", () => {
    for (const item of authorityTrustChecklist) {
      expect(SEEDED_STREAMS, `stream for ${item.key}`).toContain(item.stream);
      expect(SEEDED_FUNCTIONS, `function for ${item.key}`).toContain(item.companyFunction);
    }
  });

  it("uses valid priorities and phases", () => {
    for (const item of authorityTrustChecklist) {
      expect(VALID_PRIORITIES, `priority for ${item.key}`).toContain(item.priority);
      expect(VALID_PHASES, `phase for ${item.key}`).toContain(item.phase);
    }
  });

  it("gives every item the content needed to be a useful tracked action", () => {
    for (const item of authorityTrustChecklist) {
      expect(item.title.trim().length, `title for ${item.key}`).toBeGreaterThan(0);
      expect(item.description.trim().length, `description for ${item.key}`).toBeGreaterThan(0);
      expect(item.nextStep.trim().length, `nextStep for ${item.key}`).toBeGreaterThan(0);
    }
  });

  it("covers all four roadmap phases", () => {
    for (const phase of VALID_PHASES) {
      expect(
        authorityTrustChecklist.some((item) => item.phase === phase),
        `at least one item for phase ${phase}`
      ).toBe(true);
    }
  });

  it("covers the four Phase 0 foundation areas", () => {
    const phase0Keys = authorityTrustChecklist.filter((item) => item.phase === 0).map((item) => item.key);
    // security/privacy, clinical governance, regulatory signposting, authority engine
    expect(phase0Keys).toContain("essential-eight-baseline");
    expect(phase0Keys).toContain("clinical-safety-advisors");
    expect(phase0Keys).toContain("samd-positioning-map");
    expect(phase0Keys).toContain("posting-cadence-loop");
  });

  it("anchors each later phase on its defining move", () => {
    const keysFor = (phase: number) =>
      authorityTrustChecklist.filter((item) => item.phase === phase).map((item) => item.key);
    expect(keysFor(1)).toContain("scale-dromaiosed-delivery");
    expect(keysFor(2)).toContain("iso-27001-certification");
    expect(keysFor(2)).toContain("first-clinicboss-pilots");
    expect(keysFor(3)).toContain("advance-medtech-quality-path");
  });
});
