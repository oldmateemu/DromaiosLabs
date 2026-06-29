"use server";

import { ActionStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { loginWithPassword, logout, requireUser } from "@/lib/auth";
import {
  activateStrategyPhase,
  approveAssistantDraft,
  completeWeeklyReview,
  createActionFromForm,
  createAutomation,
  createDecision,
  createLaunchpadLink,
  createQuickCaptureDraft,
  createRisk,
  prepareDraftAutomation,
  runAutomation,
  setSetupItemStatus,
  updateActionFromForm,
  updateActionQuickEditFromForm,
  updateActionStatus,
  updateLaunchpadLinkFromForm,
  updateLaunchpadQuickFieldsFromForm,
  updateSetupItemFromForm,
  updateRiskStatus
} from "@/lib/services";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const result = await loginWithPassword(email, password);
  if (!result.ok) redirect("/login?error=1");
  redirect("/");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}

export async function quickCaptureAction(formData: FormData) {
  const user = await requireUser();
  const text = String(formData.get("text") ?? "");
  const draft = await createQuickCaptureDraft(text, user.id);
  redirect(`/assistant?draft=${draft.id}`);
}

export async function createActionAction(formData: FormData) {
  const user = await requireUser();
  await createActionFromForm(formData, user.id);
  redirect("/actions");
}

export async function completeActionAction(formData: FormData) {
  await requireUser();
  const actionId = String(formData.get("actionId") ?? "");
  await updateActionStatus(actionId, ActionStatus.DONE);
  redirect("/actions");
}

export async function activatePhaseAction(formData: FormData) {
  await requireUser();
  const phase = Number(formData.get("phase"));
  await activateStrategyPhase(phase);
  redirect("/actions");
}

export async function updateActionAction(formData: FormData) {
  await requireUser();
  const actionId = String(formData.get("actionId") ?? "").trim();
  await updateActionFromForm(actionId, formData);
  redirect(`/actions/${actionId}`);
}

export async function updateActionQuickEditAction(formData: FormData) {
  await requireUser();
  const actionId = String(formData.get("actionId") ?? "").trim();
  if (!actionId) throw new Error("Action id is required.");
  await updateActionQuickEditFromForm(actionId, formData);
  redirect("/actions");
}

export async function approveDraftAction(formData: FormData) {
  const user = await requireUser();
  await approveAssistantDraft(formData, user.id);
  redirect("/actions");
}

const SETUP_STATUS_TRANSITIONS = new Set<ActionStatus>([
  ActionStatus.OPEN,
  ActionStatus.IN_PROGRESS,
  ActionStatus.WAITING,
  ActionStatus.BLOCKED,
  ActionStatus.DONE
]);

export async function setSetupItemStatusAction(formData: FormData) {
  const user = await requireUser();
  const itemKey = String(formData.get("itemKey") ?? "");
  if (!itemKey) throw new Error("Missing setup item key.");

  const requested = String(formData.get("status") ?? "");
  if (!SETUP_STATUS_TRANSITIONS.has(requested as ActionStatus)) {
    throw new Error(`Invalid setup status: ${requested}`);
  }

  await setSetupItemStatus(itemKey, requested as ActionStatus, user.id);
  redirect("/setup");
}

export async function updateSetupItemAction(formData: FormData) {
  const user = await requireUser();
  const itemKey = String(formData.get("itemKey") ?? "").trim();
  if (!itemKey) throw new Error("Missing setup item key.");
  await updateSetupItemFromForm(itemKey, formData, user.id);
  redirect("/setup");
}

export async function createLaunchpadLinkAction(formData: FormData) {
  await requireUser();
  await createLaunchpadLink(formData);
  redirect("/launchpad");
}

export async function updateLaunchpadQuickEditAction(formData: FormData) {
  await requireUser();
  const linkId = String(formData.get("linkId") ?? "").trim();
  if (!linkId) throw new Error("Launchpad link id is required.");
  await updateLaunchpadQuickFieldsFromForm(linkId, formData);
  redirect("/launchpad");
}

export async function updateLaunchpadLinkAction(formData: FormData) {
  await requireUser();
  const linkId = String(formData.get("linkId") ?? "").trim();
  if (!linkId) throw new Error("Launchpad link id is required.");
  await updateLaunchpadLinkFromForm(linkId, formData);
  redirect(`/launchpad/${encodeURIComponent(linkId)}`);
}

export async function weeklyReviewAction(formData: FormData) {
  const user = await requireUser();
  await completeWeeklyReview(formData, user.id);
  redirect("/reviews");
}

export async function createAutomationAction(formData: FormData) {
  await requireUser();
  await createAutomation(formData);
  redirect("/automations");
}

export async function runAutomationAction(formData: FormData) {
  const user = await requireUser();
  const automationId = String(formData.get("automationId") ?? "");
  const approved = formData.get("approved") === "true";
  await runAutomation(automationId, approved, user.id);
  redirect("/automations");
}

export async function createRiskAction(formData: FormData) {
  await requireUser();
  await createRisk(formData);
  redirect("/governance");
}

export async function closeRiskAction(formData: FormData) {
  await requireUser();
  const riskId = String(formData.get("riskId") ?? "");
  await updateRiskStatus(riskId, "CLOSED");
  redirect("/governance");
}

export async function restoreRiskAction(formData: FormData) {
  await requireUser();
  const riskId = String(formData.get("riskId") ?? "");
  await updateRiskStatus(riskId, "OPEN");
  redirect("/governance");
}

export async function createDecisionAction(formData: FormData) {
  await requireUser();
  await createDecision(formData);
  redirect("/governance");
}

export async function addRiskToActionAction(formData: FormData) {
  await requireUser();
  const actionId = String(formData.get("actionId") ?? "").trim();
  if (!actionId) throw new Error("Action id is required.");
  await createRisk(formData);
  redirect(`/actions/${encodeURIComponent(actionId)}`);
}

export async function addDecisionToActionAction(formData: FormData) {
  await requireUser();
  const actionId = String(formData.get("followUpActionId") ?? "").trim();
  if (!actionId) throw new Error("Action id is required.");
  await createDecision(formData);
  redirect(`/actions/${encodeURIComponent(actionId)}`);
}

export async function prepareDraftAutomationAction(formData: FormData) {
  const user = await requireUser();
  const automationId = String(formData.get("automationId") ?? "");
  await prepareDraftAutomation(automationId, user.id);
  redirect("/automations");
}
