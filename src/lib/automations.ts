export type AutomationSafetyLevel = "DRAFT_ONLY" | "APPROVAL_REQUIRED" | "TRUSTED_LOOP" | "BLOCKED";

export type AutomationRunDecision =
  | { allowed: true; reason?: never }
  | { allowed: false; reason: string };

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

export function assertAutomationCanRun(level: AutomationSafetyLevel, approved: boolean) {
  const decision = canAutomationRun(level, approved);
  if (!decision.allowed) {
    throw new Error(decision.reason);
  }
}
