import { describe, expect, it } from "vitest";
import { buildActivityFeed } from "./activity-feed";

describe("buildActivityFeed", () => {
  it("merges sources into one newest-first timeline with tones and links", () => {
    const feed = buildActivityFeed({
      completedActions: [{ id: "a1", title: "Ship landing page", completedAt: "2026-06-05T10:00:00.000Z", stream: { name: "ClinicBoss" } }],
      createdActions: [{ id: "a2", title: "Draft contract", createdAt: "2026-06-04T10:00:00.000Z", source: "USER" }],
      risks: [{ id: "r1", issue: "Renewal lapse", severity: "HIGH", createdAt: "2026-06-06T10:00:00.000Z" }],
      automationRuns: [{ id: "run1", status: "BLOCKED", createdAt: "2026-06-03T10:00:00.000Z", automation: { name: "Renewal reminder" } }]
    });

    expect(feed.map((event) => event.id)).toEqual(["risk-r1", "completed-a1", "created-a2", "run-run1"]);
    expect(feed[0]).toMatchObject({ kind: "RISK_LOGGED", tone: "danger", href: "/governance" });
    expect(feed[1]).toMatchObject({ tone: "positive", href: "/actions/a1", detail: "Completed · ClinicBoss" });
    expect(feed[3]).toMatchObject({ tone: "warning", detail: "Automation Blocked" });
  });

  it("respects the limit and skips records without a usable timestamp", () => {
    const feed = buildActivityFeed(
      {
        decisions: [
          { id: "d1", decision: "Stay local-first", decidedAt: "2026-06-01T00:00:00.000Z" },
          { id: "d2", decision: "Ollama default", decidedAt: "2026-06-02T00:00:00.000Z" }
        ],
        reviews: [{ id: "rev1", type: "WEEKLY", createdAt: "2026-06-03T00:00:00.000Z" }],
        drafts: [{ id: "draft1", sourceSummary: "Quick capture", state: "READY", createdAt: "not-a-date" }]
      },
      2
    );

    expect(feed).toHaveLength(2);
    expect(feed[0].id).toBe("review-rev1");
    expect(feed.some((event) => event.id === "draft-draft1")).toBe(false);
  });
});
