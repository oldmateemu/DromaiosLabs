import { describe, expect, it } from "vitest";
import { buildActionRegisterWhere } from "./action-filters";

describe("buildActionRegisterWhere", () => {
  it("maps combined register filters into a Prisma where object", () => {
    const where = buildActionRegisterWhere({
      status: "OPEN",
      priority: "HIGH",
      source: "ASSISTANT",
      streamId: "stream-1",
      companyFunctionId: "function-1",
      dueBefore: "2026-06-01",
      reviewBefore: "2026-06-07"
    });

    expect(where).toEqual({
      status: "OPEN",
      priority: "HIGH",
      source: "ASSISTANT",
      domain: { not: "PERSONAL" },
      streamId: "stream-1",
      companyFunctionId: "function-1",
      dueAt: { lte: new Date("2026-06-01T23:59:59.999") },
      reviewAt: { lte: new Date("2026-06-07T23:59:59.999") }
    });
  });

  it("excludes Personal-domain actions by default and honours an explicit domain filter", () => {
    expect(buildActionRegisterWhere({})).toEqual({ domain: { not: "PERSONAL" } });
    expect(buildActionRegisterWhere({ domain: "PERSONAL" })).toEqual({ domain: "PERSONAL" });
    expect(buildActionRegisterWhere({ domain: "BUSINESS" })).toEqual({ domain: "BUSINESS" });
  });

  it("ignores empty, ALL, and invalid enum filters", () => {
    const where = buildActionRegisterWhere({
      status: "ALL",
      priority: "URGENT",
      source: "",
      streamId: "",
      companyFunctionId: undefined,
      dueBefore: "not-a-date"
    });

    // Personal is still excluded by default even when every other filter is empty.
    expect(where).toEqual({ domain: { not: "PERSONAL" } });
  });

  it("supports saved-view company function slugs when no id is available", () => {
    const where = buildActionRegisterWhere({
      companyFunction: "founder workload"
    });

    expect(where).toEqual({
      domain: { not: "PERSONAL" },
      companyFunction: {
        name: {
          equals: "founder workload",
          mode: "insensitive"
        }
      }
    });
  });
});
