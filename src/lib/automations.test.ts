import { describe, expect, it } from "vitest";
import { assertAutomationCanRun, canAutomationRun } from "./automations";

describe("canAutomationRun", () => {
  it("blocks draft-only and blocked automations", () => {
    expect(canAutomationRun("DRAFT_ONLY", true)).toEqual({ allowed: false, reason: "Draft-only automations cannot execute." });
    expect(canAutomationRun("BLOCKED", true)).toEqual({ allowed: false, reason: "This automation is blocked without explicit review." });
  });

  it("requires approval for approval-required automations", () => {
    expect(canAutomationRun("APPROVAL_REQUIRED", false)).toEqual({ allowed: false, reason: "Approval is required before this automation can run." });
    expect(canAutomationRun("APPROVAL_REQUIRED", true)).toEqual({ allowed: true });
  });

  it("allows trusted loops without per-run approval", () => {
    expect(canAutomationRun("TRUSTED_LOOP", false)).toEqual({ allowed: true });
  });
});

describe("assertAutomationCanRun", () => {
  it("throws with a user-readable message when blocked", () => {
    expect(() => assertAutomationCanRun("DRAFT_ONLY", true)).toThrow("Draft-only automations cannot execute.");
  });
});
