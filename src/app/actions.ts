"use server";

import { ActionStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { loginWithPassword, logout, requireUser } from "@/lib/auth";
import {
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
  updateActionStatus,
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

export async function approveDraftAction(formData: FormData) {
  const user = await requireUser();
  await approveAssistantDraft(formData, user.id);
  redirect("/actions");
}

export async function createLaunchpadLinkAction(formData: FormData) {
  await requireUser();
  await createLaunchpadLink(formData);
  redirect("/launchpad");
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
  const status = String(formData.get("status") ?? "CLOSED");
  await updateRiskStatus(riskId, status);
  redirect("/governance");
}

export async function createDecisionAction(formData: FormData) {
  await requireUser();
  await createDecision(formData);
  redirect("/governance");
}

export async function prepareDraftAutomationAction(formData: FormData) {
  const user = await requireUser();
  const automationId = String(formData.get("automationId") ?? "");
  await prepareDraftAutomation(automationId, user.id);
  redirect("/automations");
}
