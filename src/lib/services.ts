import {
  ActionSource,
  ActionStatus,
  AssistantDraftState,
  AssistantProvider,
  AutomationRunStatus,
  AutomationSafetyLevel,
  Priority,
  RiskLevel,
  ReviewType
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { buildActionRegisterWhere } from "./action-filters";
import { assertAutomationCanPrepareDraft, assertAutomationCanRun } from "./automations";
import { buildFocusSet, buildGovernanceSummary, buildLaunchpadHealth, buildNextBestAction } from "./cockpit-insights";
import { buildWeeklyReviewPrepDraft, getLocalDraftAutomationKind } from "./draft-automations";
import { bucketActionsForToday, mapReviewAnswersToDraftActions } from "./domain";
import { prisma } from "./db";
import { draftActionFromQuickCapture } from "./ollama";
import { buildOperatingBrief } from "./operating-brief";

export async function getReferenceData() {
  const [streams, companyFunctions] = await Promise.all([
    prisma.stream.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.companyFunction.findMany({ orderBy: { sortOrder: "asc" } })
  ]);
  return { streams, companyFunctions };
}

export async function getTodayData() {
  const [actions, links, automations, drafts, risks, decisions] = await Promise.all([
    prisma.action.findMany({
      orderBy: [{ priority: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
      include: { stream: true, companyFunction: true },
      take: 80
    }),
    prisma.launchpadLink.findMany({ orderBy: [{ group: "asc" }, { name: "asc" }], take: 12 }),
    prisma.automation.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.assistantDraft.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.risk.findMany({ orderBy: [{ severity: "desc" }, { nextReviewAt: "asc" }, { createdAt: "desc" }], take: 5 }),
    prisma.decision.findMany({ orderBy: { decidedAt: "desc" }, take: 5 })
  ]);

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const buckets = bucketActionsForToday(actions);
  const draftsNeedingReview = drafts.filter((draft) => draft.state !== AssistantDraftState.APPROVED).length;

  return {
    actions,
    buckets,
    nextAction: buildNextBestAction({
      buckets,
      today,
      draftCount: draftsNeedingReview,
      automationCount: automations.length
    }),
    focusSet: buildFocusSet(buckets),
    brief: buildOperatingBrief({
      now,
      overdueCount: buckets.overdue.length,
      blockedCount: buckets.blocked.length,
      draftCount: draftsNeedingReview,
      automationCount: automations.length
    }),
    launchpadHealth: buildLaunchpadHealth(links, now),
    governanceSummary: buildGovernanceSummary({ risks, decisions }),
    links,
    automations,
    drafts,
    risks,
    decisions
  };
}

export async function createActionFromForm(formData: FormData, userId: string) {
  const title = stringValue(formData, "title");
  if (!title) throw new Error("Action title is required.");

  await prisma.action.create({
    data: {
      title,
      description: optionalString(formData, "description"),
      status: enumValue(formData, "status", ActionStatus, ActionStatus.OPEN),
      priority: enumValue(formData, "priority", Priority, Priority.MEDIUM),
      source: ActionSource.USER,
      dueAt: dateValue(formData, "dueAt"),
      reviewAt: dateValue(formData, "reviewAt"),
      nextStep: optionalString(formData, "nextStep"),
      streamId: optionalString(formData, "streamId"),
      companyFunctionId: optionalString(formData, "companyFunctionId"),
      sensitive: formData.get("sensitive") === "on",
      createdById: userId
    }
  });

  revalidatePath("/");
  revalidatePath("/actions");
}

export async function updateActionStatus(actionId: string, status: ActionStatus) {
  await prisma.action.update({
    where: { id: actionId },
    data: {
      status,
      completedAt: status === ActionStatus.DONE ? new Date() : null
    }
  });
  revalidatePath("/");
  revalidatePath("/actions");
}

export async function createQuickCaptureDraft(text: string, userId: string) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Quick capture text is required.");

  const result = await draftActionFromQuickCapture(trimmed);
  const state = result.draft.state === "READY" ? AssistantDraftState.READY : AssistantDraftState.FAILED;

  return prisma.assistantDraft.create({
    data: {
      provider: AssistantProvider.OLLAMA,
      model: result.model,
      state,
      sourceSummary: "Quick capture",
      sourceText: trimmed,
      prompt: result.prompt,
      output: result.draft.proposedAction,
      error: result.error ?? result.draft.error,
      createdById: userId
    }
  });
}

export async function approveAssistantDraft(formData: FormData, userId: string) {
  const draftId = stringValue(formData, "draftId");
  const title = stringValue(formData, "title");
  if (!draftId || !title) throw new Error("Draft and title are required.");

  const streamName = optionalString(formData, "stream");
  const functionName = optionalString(formData, "companyFunction");
  const stream = streamName ? await prisma.stream.findUnique({ where: { name: streamName } }) : null;
  const companyFunction = functionName
    ? await prisma.companyFunction.findUnique({ where: { name: functionName } })
    : null;

  await prisma.$transaction(async (tx) => {
    await tx.action.create({
      data: {
        title,
        description: optionalString(formData, "description"),
        status: enumValue(formData, "status", ActionStatus, ActionStatus.OPEN),
        priority: enumValue(formData, "priority", Priority, Priority.MEDIUM),
        source: ActionSource.ASSISTANT,
        dueAt: dateValue(formData, "dueDate"),
        reviewAt: dateValue(formData, "reviewDate"),
        nextStep: optionalString(formData, "nextStep"),
        sensitive: formData.get("sensitive") === "on",
        streamId: stream?.id,
        companyFunctionId: companyFunction?.id,
        assistantDraftId: draftId,
        createdById: userId
      }
    });
    await tx.assistantDraft.update({
      where: { id: draftId },
      data: { state: AssistantDraftState.APPROVED, approvedAt: new Date() }
    });
  });

  revalidatePath("/");
  revalidatePath("/assistant");
  revalidatePath("/actions");
}

export async function createLaunchpadLink(formData: FormData) {
  const name = stringValue(formData, "name");
  const url = stringValue(formData, "url");
  const group = stringValue(formData, "group");
  if (!name || !url || !group) throw new Error("Name, URL, and group are required.");

  await prisma.launchpadLink.create({
    data: {
      name,
      url,
      group,
      description: optionalString(formData, "description"),
      cost: decimalValue(formData, "cost"),
      renewalAt: dateValue(formData, "renewalAt"),
      loginNote: optionalString(formData, "loginNote"),
      riskLevel: enumValue(formData, "riskLevel", RiskLevel, RiskLevel.LOW),
      owner: optionalString(formData, "owner"),
      sensitive: formData.get("sensitive") === "on"
    }
  });

  revalidatePath("/launchpad");
}

export async function completeWeeklyReview(formData: FormData, userId: string) {
  const answers = {
    finance: stringValue(formData, "finance"),
    compliance: stringValue(formData, "compliance"),
    sales: stringValue(formData, "sales"),
    delivery: stringValue(formData, "delivery"),
    product: stringValue(formData, "product"),
    governance: stringValue(formData, "governance"),
    founderWorkload: stringValue(formData, "founderWorkload")
  };
  const generatedActions = mapReviewAnswersToDraftActions(answers);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        type: ReviewType.WEEKLY,
        periodStart: startOfWeek(now),
        periodEnd: now,
        answers,
        assistantSummary: buildReviewSummary(answers),
        createdById: userId
      }
    });

    for (const draft of generatedActions) {
      const fn = await tx.companyFunction.findUnique({ where: { name: draft.companyFunction } });
      await tx.action.create({
        data: {
          title: draft.title,
          priority: Priority.MEDIUM,
          source: ActionSource.REVIEW,
          status: ActionStatus.OPEN,
          reviewId: review.id,
          companyFunctionId: fn?.id,
          createdById: userId
        }
      });
    }
  });

  revalidatePath("/reviews");
  revalidatePath("/");
}

export async function createAutomation(formData: FormData) {
  const name = stringValue(formData, "name");
  if (!name) throw new Error("Automation name is required.");

  await prisma.automation.create({
    data: {
      name,
      description: optionalString(formData, "description"),
      trigger: stringValue(formData, "trigger") || "Manual",
      targetTool: stringValue(formData, "targetTool") || "webhook",
      webhookUrl: optionalString(formData, "webhookUrl"),
      safetyLevel: enumValue(formData, "safetyLevel", AutomationSafetyLevel, AutomationSafetyLevel.APPROVAL_REQUIRED),
      rollbackNote: optionalString(formData, "rollbackNote")
    }
  });

  revalidatePath("/automations");
}

export async function runAutomation(automationId: string, approved: boolean, userId: string) {
  const automation = await prisma.automation.findUnique({ where: { id: automationId } });
  if (!automation) throw new Error("Automation not found.");

  try {
    assertAutomationCanRun(automation.safetyLevel, approved);
    if (!automation.webhookUrl) {
      throw new Error("Automation has no webhook URL configured.");
    }

    const response = await fetch(automation.webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ automationId, name: automation.name, triggeredAt: new Date().toISOString() })
    });
    const text = await response.text();

    await prisma.automationRun.create({
      data: {
        automationId,
        triggeredById: userId,
        status: response.ok ? AutomationRunStatus.SUCCESS : AutomationRunStatus.FAILED,
        requestSummary: `Manual trigger for ${automation.name}`,
        responseSummary: text.slice(0, 1000),
        error: response.ok ? null : `HTTP ${response.status}`
      }
    });
  } catch (error) {
    await prisma.automationRun.create({
      data: {
        automationId,
        triggeredById: userId,
        status: error instanceof Error && error.message.includes("cannot execute") ? AutomationRunStatus.BLOCKED : AutomationRunStatus.FAILED,
        requestSummary: `Manual trigger for ${automation.name}`,
        error: error instanceof Error ? error.message : "Automation failed."
      }
    });
  }

  revalidatePath("/automations");
}

export async function prepareDraftAutomation(automationId: string, userId: string) {
  const automation = await prisma.automation.findUnique({ where: { id: automationId } });
  if (!automation) throw new Error("Automation not found.");

  const requestSummary = `Local draft prep for ${automation.name}`;
  const kind = getLocalDraftAutomationKind(automation);

  try {
    assertAutomationCanPrepareDraft(automation.safetyLevel);
    if (automation.status !== "ACTIVE") {
      throw new Error("Paused automations cannot prepare drafts.");
    }
    if (kind !== "WEEKLY_REVIEW_PREP") {
      throw new Error("No local draft runner is registered for this automation.");
    }

    const [actions, risks, links, draftsNeedingReview] = await Promise.all([
      prisma.action.findMany({
        include: { stream: true, companyFunction: true },
        orderBy: [{ priority: "asc" }, { dueAt: "asc" }, { updatedAt: "asc" }],
        take: 120
      }),
      prisma.risk.findMany({
        orderBy: [{ severity: "desc" }, { nextReviewAt: "asc" }, { updatedAt: "desc" }],
        take: 50
      }),
      prisma.launchpadLink.findMany({ orderBy: [{ riskLevel: "desc" }, { renewalAt: "asc" }, { name: "asc" }], take: 80 }),
      prisma.assistantDraft.count({ where: { state: { not: AssistantDraftState.APPROVED } } })
    ]);

    const responseSummary = buildWeeklyReviewPrepDraft({
      now: new Date(),
      actions,
      risks,
      links,
      draftsNeedingReview
    });

    await prisma.automationRun.create({
      data: {
        automationId,
        triggeredById: userId,
        status: AutomationRunStatus.SUCCESS,
        requestSummary,
        responseSummary
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Draft automation failed.";
    await prisma.automationRun.create({
      data: {
        automationId,
        triggeredById: userId,
        status: message.includes("draft-only") || message.includes("Blocked") || message.includes("Paused")
          ? AutomationRunStatus.BLOCKED
          : AutomationRunStatus.FAILED,
        requestSummary,
        error: message
      }
    });
  }

  revalidatePath("/automations");
}

export async function getActionRegisterData(filters: Record<string, string | undefined>) {
  const where = buildActionRegisterWhere(filters);

  const [actions, reference] = await Promise.all([
    prisma.action.findMany({
      where,
      include: { stream: true, companyFunction: true, assistantDraft: true },
      orderBy: [{ status: "asc" }, { priority: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }]
    }),
    getReferenceData()
  ]);

  return { actions, ...reference };
}

export async function getLaunchpadData() {
  return prisma.launchpadLink.findMany({ orderBy: [{ group: "asc" }, { riskLevel: "desc" }, { name: "asc" }] });
}

export async function getReviewData() {
  return prisma.review.findMany({ include: { actions: true }, orderBy: { createdAt: "desc" }, take: 20 });
}

export async function getAssistantDraftData() {
  return prisma.assistantDraft.findMany({ include: { action: true }, orderBy: { createdAt: "desc" }, take: 30 });
}

export async function getAutomationData() {
  return prisma.automation.findMany({ include: { runs: { orderBy: { createdAt: "desc" }, take: 5 } }, orderBy: { createdAt: "desc" } });
}

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalString(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  return value.length > 0 ? value : undefined;
}

function dateValue(formData: FormData, key: string) {
  const value = optionalString(formData, key);
  return value ? new Date(`${value}T00:00:00`) : undefined;
}

function decimalValue(formData: FormData, key: string) {
  const value = optionalString(formData, key);
  return value ? value : undefined;
}

function enumValue<T extends Record<string, string>>(formData: FormData, key: string, values: T, fallback: T[keyof T]) {
  const value = stringValue(formData, key);
  return Object.values(values).includes(value) ? (value as T[keyof T]) : fallback;
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function buildReviewSummary(answers: Record<string, string>) {
  const populated = Object.entries(answers).filter(([, value]) => value.trim().length > 0);
  if (populated.length === 0) return "No major follow-up items were captured in this weekly review.";
  return populated.map(([key, value]) => `${key}: ${value.trim()}`).join("\n");
}
