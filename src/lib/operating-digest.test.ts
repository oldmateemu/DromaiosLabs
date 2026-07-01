import { describe, expect, it } from "vitest";
import { buildOperatingDigest } from "./operating-digest";
import type { CompanyPulse } from "./company-pulse";
import type { StreamHealth } from "./stream-portfolio";

const pulse: CompanyPulse = {
  weekStart: "2026-06-01",
  completedThisWeek: 3,
  completedLastWeek: 1,
  createdThisWeek: 2,
  overdueOpen: 1,
  openRiskCount: 2,
  automationRunCount: 4,
  automationSuccessRate: 75,
  trackedSpend: 120,
  pricedSystems: 3,
  metrics: [{ key: "completed", label: "Completed this week", value: "3", detail: "Up 2 on last week (1).", tone: "positive", trend: "up" }]
};

const portfolio: StreamHealth[] = [
  {
    id: "s1",
    name: "ClinicBoss",
    openActions: 4,
    overdue: 1,
    blocked: 0,
    dueThisWeek: 2,
    completedThisWeek: 1,
    openRisks: 1,
    highRisks: 0,
    attentionScore: 8,
    tone: "danger",
    headline: "1 overdue action needs a decision"
  }
];

describe("buildOperatingDigest", () => {
  it("renders every section with headings and data", () => {
    const digest = buildOperatingDigest({
      generatedAt: new Date("2026-06-04T00:00:00.000Z"),
      pulse,
      portfolio,
      topActions: [{ title: "Renew domain", status: "OPEN", priority: "HIGH", streamName: "Company Core", dueKey: "2026-06-05" }],
      openRisks: [{ issue: "Renewal lapse", severity: "HIGH", status: "OPEN" }],
      recentDecisions: [{ decision: "Stay local-first", decidedAt: "2026-05-29T00:00:00.000Z" }],
      renewalsDue: [{ name: "Xero", renewalKey: "2026-06-10" }],
      renewalForecast: { total: 1200, count: 5, monthsAhead: 6 }
    });

    expect(digest).toContain("# Dromaios Labs — Operating Digest");
    expect(digest).toContain("Generated 2026-06-04 · week of 2026-06-01");
    expect(digest).toContain("**Completed this week:** 3");
    expect(digest).toContain("**ClinicBoss:** 1 overdue action needs a decision");
    expect(digest).toContain("- [ ] Renew domain (HIGH · Company Core · due 2026-06-05)");
    expect(digest).toContain("**HIGH** — Renewal lapse (OPEN)");
    expect(digest).toContain("Xero — 2026-06-10");
    expect(digest).toContain("Forecast: $1,200 across 5 renewals in the next 6 months.");
    expect(digest).toContain("Stay local-first (2026-05-29)");
  });

  it("uses graceful placeholders when sections are empty", () => {
    const digest = buildOperatingDigest({
      generatedAt: new Date("2026-06-04T00:00:00.000Z"),
      pulse,
      portfolio: [],
      topActions: [],
      openRisks: [],
      recentDecisions: [],
      renewalsDue: []
    });

    expect(digest).toContain("_No streams recorded._");
    expect(digest).toContain("_No open actions._");
    expect(digest).toContain("_No open risks._");
    expect(digest).toContain("_No renewals need attention._");
    expect(digest).toContain("_No decisions recorded._");
  });
});
