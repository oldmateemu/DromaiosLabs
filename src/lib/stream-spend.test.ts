import { describe, expect, it } from "vitest";
import { buildStreamSpend } from "./stream-spend";

const streams = [
  { id: "s1", name: "ClinicBoss" },
  { id: "s2", name: "DromaiosEd" }
];

describe("buildStreamSpend", () => {
  it("sums cost per stream and computes share, largest first", () => {
    const breakdown = buildStreamSpend({
      streams,
      links: [
        { cost: "70", streamId: "s1" },
        { cost: 30, streamId: "s1" },
        { cost: "25", streamId: "s2" }
      ]
    });

    expect(breakdown.grandTotal).toBe(125);
    expect(breakdown.streams[0]).toMatchObject({ name: "ClinicBoss", total: 100, pricedCount: 2, share: 80 });
    expect(breakdown.streams[1]).toMatchObject({ name: "DromaiosEd", total: 25, share: 20 });
  });

  it("rolls stream-less and unresolved spend into Unassigned and counts unpriced links", () => {
    const breakdown = buildStreamSpend({
      streams,
      links: [
        { cost: 40, streamId: null },
        { cost: 10, streamId: "ghost" },
        { cost: null, streamId: "s1" },
        { cost: "0", streamId: "s2" }
      ]
    });

    const unassigned = breakdown.streams.find((stream) => stream.name === "Unassigned");
    expect(unassigned?.total).toBe(50);
    expect(breakdown.unpricedCount).toBe(2);
    expect(breakdown.pricedCount).toBe(2);
  });

  it("returns an empty breakdown when nothing is priced", () => {
    const breakdown = buildStreamSpend({ streams, links: [{ cost: null, streamId: "s1" }] });
    expect(breakdown.streams).toEqual([]);
    expect(breakdown.grandTotal).toBe(0);
    expect(breakdown.unpricedCount).toBe(1);
  });
});
