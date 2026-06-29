import { describe, expect, it } from "vitest";
import { buildRenewalCalendar, formatRenewalCurrency } from "./renewal-calendar";

const NOW = new Date("2026-06-04T12:00:00.000Z");

describe("buildRenewalCalendar", () => {
  it("groups upcoming renewals by month and sums known costs", () => {
    const calendar = buildRenewalCalendar({
      now: NOW,
      monthsAhead: 6,
      links: [
        { id: "a", name: "Xero", group: "Money", cost: "70", renewalAt: "2026-06-20T00:00:00.000Z" },
        { id: "b", name: "Domain", group: "Admin", cost: 25, renewalAt: "2026-06-28T00:00:00.000Z" },
        { id: "c", name: "Figma", group: "Workbench", cost: "15", renewalAt: "2026-08-10T00:00:00.000Z" }
      ]
    });

    expect(calendar.months).toHaveLength(2);
    expect(calendar.months[0].label).toBe("June 2026");
    expect(calendar.months[0].items.map((item) => item.name)).toEqual(["Xero", "Domain"]);
    expect(calendar.months[0].total).toBe(95);
    expect(calendar.months[1].label).toBe("August 2026");
    expect(calendar.windowTotal).toBe(110);
    expect(calendar.windowCount).toBe(3);
  });

  it("separates overdue renewals and counts untracked costs", () => {
    const calendar = buildRenewalCalendar({
      now: NOW,
      monthsAhead: 6,
      links: [
        { id: "a", name: "Lapsed SaaS", cost: 40, renewalAt: "2026-05-30T00:00:00.000Z" },
        { id: "b", name: "Uncosted tool", cost: null, renewalAt: "2026-07-01T00:00:00.000Z" }
      ]
    });

    expect(calendar.overdue.map((item) => item.name)).toEqual(["Lapsed SaaS"]);
    expect(calendar.overdueTotal).toBe(40);
    expect(calendar.untrackedCount).toBe(1);
    expect(calendar.windowCount).toBe(1);
    expect(calendar.windowTotal).toBe(0);
  });

  it("excludes renewals beyond the horizon and links without a date", () => {
    const calendar = buildRenewalCalendar({
      now: NOW,
      monthsAhead: 3,
      links: [
        { id: "a", name: "In window", cost: 10, renewalAt: "2026-07-15T00:00:00.000Z" },
        { id: "b", name: "Too far out", cost: 99, renewalAt: "2027-01-15T00:00:00.000Z" },
        { id: "c", name: "No date", cost: 5, renewalAt: null }
      ]
    });

    expect(calendar.windowCount).toBe(1);
    expect(calendar.months[0].items[0].name).toBe("In window");
  });

  it("formats currency without forcing trailing zeros", () => {
    expect(formatRenewalCurrency(95)).toBe("$95");
    expect(formatRenewalCurrency(95.5)).toBe("$95.5");
  });
});
