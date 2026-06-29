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
      streamId: "stream-1",
      companyFunctionId: "function-1",
      dueAt: { lte: new Date("2026-06-01T23:59:59.999") },
      reviewAt: { lte: new Date("2026-06-07T23:59:59.999") }
    });
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

    expect(where).toEqual({});
  });

  it("maps a valid phase filter, including phase 0", () => {
    expect(buildActionRegisterWhere({ phase: "0" })).toEqual({ phase: 0 });
    expect(buildActionRegisterWhere({ phase: "2" })).toEqual({ phase: 2 });
  });

  it("ignores ALL, empty, out-of-range, and non-numeric phase filters", () => {
    expect(buildActionRegisterWhere({ phase: "ALL" })).toEqual({});
    expect(buildActionRegisterWhere({ phase: "" })).toEqual({});
    expect(buildActionRegisterWhere({ phase: "4" })).toEqual({});
    expect(buildActionRegisterWhere({ phase: "-1" })).toEqual({});
    expect(buildActionRegisterWhere({ phase: "two" })).toEqual({});
  });

  it("supports saved-view company function slugs when no id is available", () => {
    const where = buildActionRegisterWhere({
      companyFunction: "founder workload"
    });

    expect(where).toEqual({
      companyFunction: {
        name: {
          equals: "founder workload",
          mode: "insensitive"
        }
      }
    });
  });
});
