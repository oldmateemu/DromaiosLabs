import { describe, expect, it } from "vitest";
import {
  AutomationBlockedError,
  assertAutomationCanPrepareDraft,
  assertAutomationCanRun,
  canAutomationPrepareDraft,
  canAutomationRun
} from "./automations";

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

  it("throws a typed AutomationBlockedError so callers can distinguish policy blocks from failures", () => {
    expect(() => assertAutomationCanRun("APPROVAL_REQUIRED", false)).toThrow(AutomationBlockedError);
    expect(() => assertAutomationCanPrepareDraft("BLOCKED")).toThrow(AutomationBlockedError);
  });
});

describe("canAutomationPrepareDraft", () => {
  it("allows draft-only local prep without allowing external execution", () => {
    expect(canAutomationPrepareDraft("DRAFT_ONLY")).toEqual({ allowed: true });
    expect(canAutomationRun("DRAFT_ONLY", true)).toEqual({ allowed: false, reason: "Draft-only automations cannot execute." });
  });

  it("blocks non-draft local prep paths", () => {
    expect(canAutomationPrepareDraft("APPROVAL_REQUIRED")).toEqual({
      allowed: false,
      reason: "Only draft-only automations can prepare local drafts."
    });
    expect(canAutomationPrepareDraft("TRUSTED_LOOP")).toEqual({
      allowed: false,
      reason: "Only draft-only automations can prepare local drafts."
    });
    expect(canAutomationPrepareDraft("BLOCKED")).toEqual({
      allowed: false,
      reason: "Blocked automations cannot prepare drafts."
    });
  });
});

describe("assertAutomationCanPrepareDraft", () => {
  it("throws when a non-draft automation tries to prepare local output", () => {
    expect(() => assertAutomationCanPrepareDraft("APPROVAL_REQUIRED")).toThrow("Only draft-only automations can prepare local drafts.");
  });
});
