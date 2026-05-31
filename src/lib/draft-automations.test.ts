import { describe, expect, it } from "vitest";
import { buildWeeklyReviewPrepDraft } from "./draft-automations";

describe("buildWeeklyReviewPrepDraft", () => {
  it("builds a local draft-only weekly review brief from cockpit state", () => {
    const draft = buildWeeklyReviewPrepDraft({
      now: new Date("2026-05-31T01:00:00.000Z"),
      draftsNeedingReview: 2,
      actions: [
        {
          id: "action-1",
          title: "Bakermed legal/IP review",
          status: "OPEN",
          priority: "HIGH",
          dueAt: new Date("2026-05-27T00:00:00.000Z"),
          updatedAt: new Date("2026-05-24T00:00:00.000Z"),
          nextStep: "Confirm whether any public wording needs to change.",
          stream: { name: "Company Core" },
          companyFunction: { name: "legal" }
        },
        {
          id: "action-2",
          title: "ClinicBoss trademark clearance",
          status: "WAITING",
          priority: "CRITICAL",
          dueAt: null,
          updatedAt: new Date("2026-05-10T00:00:00.000Z"),
          nextStep: null,
          stream: { name: "ClinicBoss" },
          companyFunction: { name: "legal" }
        },
        {
          id: "action-3",
          title: "Refresh company statements",
          status: "OPEN",
          priority: "MEDIUM",
          dueAt: new Date("2026-06-02T00:00:00.000Z"),
          updatedAt: new Date("2026-05-30T00:00:00.000Z"),
          nextStep: null,
          stream: { name: "Company Core" },
          companyFunction: { name: "marketing" }
        }
      ],
      risks: [
        {
          id: "risk-1",
          issue: "Public TGA/SaMD overclaiming",
          severity: "HIGH",
          status: "OPEN",
          nextReviewAt: new Date("2026-05-30T00:00:00.000Z")
        }
      ],
      links: [
        {
          id: "link-1",
          name: "Lawpath",
          group: "Legal/Admin",
          renewalAt: new Date("2026-05-31T00:00:00.000Z"),
          cost: null,
          owner: "",
          riskLevel: "HIGH",
          loginNote: null,
          sensitive: false
        }
      ]
    });

    expect(draft).toContain("Weekly review prep - draft only");
    expect(draft).toContain("Generated locally: 2026-05-31");
    expect(draft).toContain("No webhook called");
    expect(draft).toContain("Overdue: 1");
    expect(draft).toContain("Waiting: 1");
    expect(draft).toContain("Assistant drafts needing review: 2");
    expect(draft).toContain("Stale open actions: 2");
    expect(draft).toContain("Bakermed legal/IP review");
    expect(draft).toContain("ClinicBoss trademark clearance");
    expect(draft).toContain("Public TGA/SaMD overclaiming");
    expect(draft).toContain("Lawpath");
    expect(draft).toContain("Draft actions to consider");
  });
});
