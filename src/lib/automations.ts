export type AutomationSafetyLevel = "DRAFT_ONLY" | "APPROVAL_REQUIRED" | "TRUSTED_LOOP" | "BLOCKED";

export type AutomationRunDecision =
  | { allowed: true; reason?: never }
  | { allowed: false; reason: string };

/**
 * Raised when a safety policy refuses to run or prepare an automation. Callers
 * use the type (not the message text) to record a run as BLOCKED rather than
 * FAILED, keeping policy refusals distinct from genuine execution failures.
 */
export class AutomationBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AutomationBlockedError";
  }
}

export function canAutomationRun(level: AutomationSafetyLevel, approved: boolean): AutomationRunDecision {
  if (level === "DRAFT_ONLY") {
    return { allowed: false, reason: "Draft-only automations cannot execute." };
  }
  if (level === "BLOCKED") {
    return { allowed: false, reason: "This automation is blocked without explicit review." };
  }
  if (level === "APPROVAL_REQUIRED" && !approved) {
    return { allowed: false, reason: "Approval is required before this automation can run." };
  }
  return { allowed: true };
}

export function canAutomationPrepareDraft(level: AutomationSafetyLevel): AutomationRunDecision {
  if (level === "DRAFT_ONLY") {
    return { allowed: true };
  }
  if (level === "BLOCKED") {
    return { allowed: false, reason: "Blocked automations cannot prepare drafts." };
  }
  return { allowed: false, reason: "Only draft-only automations can prepare local drafts." };
}

export function assertAutomationCanRun(level: AutomationSafetyLevel, approved: boolean) {
  const decision = canAutomationRun(level, approved);
  if (!decision.allowed) {
    throw new AutomationBlockedError(decision.reason);
  }
}

export function assertAutomationCanPrepareDraft(level: AutomationSafetyLevel) {
  const decision = canAutomationPrepareDraft(level);
  if (!decision.allowed) {
    throw new AutomationBlockedError(decision.reason);
  }
}
