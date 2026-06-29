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
import { buildActivityFeed } from "./activity-feed";
import { AutomationBlockedError, assertAutomationCanPrepareDraft, assertAutomationCanRun } from "./automations";
import { summariseAutomationRuns } from "./automation-history";
import { buildCompletionTrend } from "./completion-trend";
import { buildCompanyPulse } from "./company-pulse";
import { buildFocusSet, buildGovernanceSummary, buildLaunchpadHealth, buildNextBestAction } from "./cockpit-insights";
import {
  buildSetupDraftContext,
  buildSetupReadiness,
  COMPANY_SETUP_CHECKLIST,
  normaliseSetupTitle,
  selectOutstandingSetupItems,
  SETUP_CHECKLIST_STREAM,
  setupDueDate,
  summariseSetupChecklist,
  type SetupActionState
} from "./company-setup-checklist";
import {
  buildDailyInboxTriageDraft,
  buildStaleTaskSummaryDraft,
  buildWeeklyReviewPrepDraft,
  getLocalDraftAutomationKind
} from "./draft-automations";
import { buildOperatingDigest } from "./operating-digest";
import { buildRenewalCalendar } from "./renewal-calendar";
import { buildReviewMomentum } from "./review-momentum";
import { buildStreamPortfolio } from "./stream-portfolio";
import { buildStreamSpend } from "./stream-spend";
import { bucketActionsForToday, mapReviewAnswersToDraftActions, normaliseQuickCaptureDraft } from "./domain";
import { buildCompanyMailroomFilingRun } from "./mailroom-filing";
import { prisma } from "./db";
import { buildQuickCaptureDraftRequest, draftActionFromQuickCapture } from "./ollama";
import { buildOperatingBrief } from "./operating-brief";
import { buildRenewalReminderRun, getLocalApprovalAutomationKind, planRenewalReminderPersistence } from "./renewal-reminders";
import { SALES_PIPELINE_STAGES, summariseSalesPipeline } from "./sales-pipeline";
import { STRATEGY_PHASE_LABELS, type StrategyChecklistPhase } from "./strategy-checklist";

export async function getReferenceData() {
  const [streams, companyFunctions] = await Promise.all([
    prisma.stream.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.companyFunction.findMany({ orderBy: { sortOrder: "asc" } })
  ]);
  return { streams, companyFunctions };
}

export async function getTodayData() {
  const [actions, links, automations, drafts, risks, decisions, setupSummary] = await Promise.all([
    prisma.action.findMany({
      orderBy: [{ priority: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
      include: { stream: true, companyFunction: true },
      take: 80
    }),
    prisma.launchpadLink.findMany({ orderBy: [{ group: "asc" }, { name: "asc" }], take: 12 }),
    prisma.automation.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.assistantDraft.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.risk.findMany({ orderBy: [{ severity: "desc" }, { nextReviewAt: "asc" }, { createdAt: "desc" }], take: 5 }),
    prisma.decision.findMany({ orderBy: { decidedAt: "desc" }, take: 5 }),
    getCompanySetupData()
  ]);

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const buckets = bucketActionsForToday(actions);
  const draftsNeedingReview = drafts.filter((draft) => draft.state !== AssistantDraftState.APPROVED).length;

  const setupReadiness = buildSetupReadiness(setupSummary);
  const setupOutstanding = selectOutstandingSetupItems(setupSummary, 3);
  const overdueFoundational = setupOutstanding.find(
    (item) => item.overdue && (item.priority === "CRITICAL" || item.priority === "HIGH")
  );

  const weekStart = startOfWeek(now);
  const pulseSince = new Date(weekStart);
  pulseSince.setUTCDate(pulseSince.getUTCDate() - 7);
  const todayStart = startOfDay(now);

  const [pulseActions, pulseRuns, pulseLinks, streamRefs, portfolioActions, portfolioRisks] = await Promise.all([
    prisma.action.findMany({
      where: {
        OR: [
          { completedAt: { gte: pulseSince } },
          { createdAt: { gte: weekStart } },
          {
            AND: [
              { status: { notIn: [ActionStatus.DONE, ActionStatus.CANCELLED] } },
              { dueAt: { lt: todayStart } }
            ]
          }
        ]
      },
      select: { status: true, createdAt: true, completedAt: true, dueAt: true }
    }),
    prisma.automationRun.findMany({ orderBy: { createdAt: "desc" }, take: 50, select: { status: true } }),
    prisma.launchpadLink.findMany({ select: { cost: true } }),
    prisma.stream.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.action.findMany({
      where: {
        OR: [{ status: { notIn: [ActionStatus.DONE, ActionStatus.CANCELLED] } }, { completedAt: { gte: weekStart } }]
      },
      select: { status: true, streamId: true, dueAt: true, completedAt: true }
    }),
    prisma.risk.findMany({
      where: { status: { notIn: ["CLOSED", "RESOLVED", "DONE"] } },
      select: { streamId: true, status: true, severity: true }
    })
  ]);

  const pulse = buildCompanyPulse({
    now,
    actions: pulseActions,
    automationRuns: pulseRuns,
    links: pulseLinks,
    openRiskCount: portfolioRisks.length
  });
  const portfolio = buildStreamPortfolio({ now, streams: streamRefs, actions: portfolioActions, risks: portfolioRisks });

  return {
    pulse,
    portfolio,
    actions,
    buckets,
    setupReadiness,
    setupOutstanding,
    nextAction: buildNextBestAction({
      buckets,
      today,
      draftCount: draftsNeedingReview,
      automationCount: automations.length,
      setupAlert: overdueFoundational
        ? { title: overdueFoundational.title, overdueCritical: true }
        : undefined
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
      completedAt: completedAtForStatus(status, null)
    }
  });
  revalidatePath("/");
  revalidatePath("/actions");
}

export async function createQuickCaptureDraft(text: string, userId: string) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Quick capture text is required.");

  const request = buildQuickCaptureDraftRequest(trimmed);
  const fallback = normaliseQuickCaptureDraft(trimmed, "").proposedAction;
  const draft = await prisma.assistantDraft.create({
    data: {
      provider: AssistantProvider.OLLAMA,
      model: request.model,
      state: AssistantDraftState.PENDING,
      sourceSummary: "Quick capture",
      sourceText: trimmed,
      prompt: request.prompt,
      output: fallback,
      createdById: userId
    }
  });

  void finaliseQuickCaptureDraft(draft.id, trimmed).catch(() => undefined);

  revalidatePath("/");
  revalidatePath("/assistant");
  return draft;
}

async function finaliseQuickCaptureDraft(draftId: string, sourceText: string) {
  const request = buildQuickCaptureDraftRequest(sourceText);

  try {
    const result = await draftActionFromQuickCapture(sourceText);
    const state = result.draft.state === "READY" ? AssistantDraftState.READY : AssistantDraftState.FAILED;

    await prisma.assistantDraft.update({
      where: { id: draftId },
      data: {
        model: result.model,
        state,
        prompt: result.prompt,
        output: result.draft.proposedAction,
        error: result.error ?? result.draft.error ?? null
      }
    });
  } catch (error) {
    await prisma.assistantDraft.update({
      where: { id: draftId },
      data: {
        model: request.model,
        state: AssistantDraftState.FAILED,
        prompt: request.prompt,
        output: normaliseQuickCaptureDraft(sourceText, "").proposedAction,
        error: error instanceof Error ? error.message : "Local assistant draft failed."
      }
    });
  }
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
      streamId: optionalString(formData, "streamId"),
      sensitive: formData.get("sensitive") === "on"
    }
  });

  revalidatePath("/launchpad");
  revalidatePath("/portfolio");
}

export async function updateLaunchpadQuickFieldsFromForm(linkId: string, formData: FormData) {
  await prisma.launchpadLink.update({
    where: { id: linkId },
    data: {
      group: stringValue(formData, "group") || "Ungrouped",
      cost: decimalValue(formData, "cost") ?? null,
      renewalAt: dateValue(formData, "renewalAt") ?? null,
      owner: optionalString(formData, "owner") ?? null,
      riskLevel: enumValue(formData, "riskLevel", RiskLevel, RiskLevel.LOW)
    }
  });

  revalidatePath("/launchpad");
  revalidatePath(`/launchpad/${linkId}`);
  revalidatePath("/");
  revalidatePath("/portfolio");
  revalidatePath("/automations");
}

export async function updateLaunchpadLinkFromForm(linkId: string, formData: FormData) {
  const name = stringValue(formData, "name");
  const url = stringValue(formData, "url");
  const group = stringValue(formData, "group");
  if (!name || !url || !group) throw new Error("Name, URL, and group are required.");

  await prisma.launchpadLink.update({
    where: { id: linkId },
    data: {
      name,
      url,
      group,
      description: optionalString(formData, "description") ?? null,
      cost: decimalValue(formData, "cost") ?? null,
      renewalAt: dateValue(formData, "renewalAt") ?? null,
      loginNote: optionalString(formData, "loginNote") ?? null,
      riskLevel: enumValue(formData, "riskLevel", RiskLevel, RiskLevel.LOW),
      owner: optionalString(formData, "owner") ?? null,
      streamId: optionalString(formData, "streamId") ?? null,
      sensitive: formData.get("sensitive") === "on"
    }
  });

  revalidatePath("/launchpad");
  revalidatePath(`/launchpad/${linkId}`);
  revalidatePath("/");
  revalidatePath("/portfolio");
  revalidatePath("/automations");
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

  const localApprovalKind = getLocalApprovalAutomationKind(automation);

  try {
    assertAutomationCanRun(automation.safetyLevel, approved);
    if (localApprovalKind === "RENEWAL_REMINDER") {
      await runRenewalReminderAutomation(automationId, userId);
      return;
    }
    if (localApprovalKind === "COMPANY_MAILROOM_FILING") {
      await runCompanyMailroomFilingAutomation(automationId, userId);
      return;
    }

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
        status: error instanceof AutomationBlockedError ? AutomationRunStatus.BLOCKED : AutomationRunStatus.FAILED,
        requestSummary: `Manual trigger for ${automation.name}`,
        error: error instanceof Error ? error.message : "Automation failed."
      }
    });
  }

  revalidatePath("/automations");
}

async function runCompanyMailroomFilingAutomation(automationId: string, userId: string) {
  const run = buildCompanyMailroomFilingRun({ now: new Date() });
  const [stream, companyFunction, existingReviewAction] = await Promise.all([
    prisma.stream.findUnique({ where: { name: "Company Core" }, select: { id: true } }),
    prisma.companyFunction.findUnique({ where: { name: "admin" }, select: { id: true } }),
    prisma.action.findFirst({
      where: {
        automationId,
        title: run.actionsToCreate[0]?.title,
        status: { notIn: [ActionStatus.DONE, ActionStatus.CANCELLED] }
      },
      select: { id: true }
    })
  ]);
  const actionsToCreate = existingReviewAction ? [] : run.actionsToCreate;

  await prisma.$transaction(async (tx) => {
    for (const action of actionsToCreate) {
      await tx.action.create({
        data: {
          title: action.title,
          description: action.description,
          status: ActionStatus.OPEN,
          priority: action.priority,
          source: ActionSource.AUTOMATION,
          dueAt: dateFromKey(action.dueAt),
          reviewAt: dateFromKey(action.reviewAt),
          nextStep: action.nextStep,
          sensitive: action.sensitive,
          createdById: userId,
          automationId,
          streamId: stream?.id,
          companyFunctionId: companyFunction?.id
        }
      });
    }

    await tx.automationRun.create({
      data: {
        automationId,
        triggeredById: userId,
        status: AutomationRunStatus.SUCCESS,
        requestSummary: "Approved local company mailroom filing run",
        responseSummary: [
          run.responseSummary,
          "",
          "Run result",
          `- Review actions created this run: ${actionsToCreate.length}`,
          `- Existing open review actions skipped: ${existingReviewAction ? 1 : 0}`
        ].join("\n")
      }
    });
  });

  revalidatePath("/");
  revalidatePath("/actions");
  revalidatePath("/automations");
}

async function runRenewalReminderAutomation(automationId: string, userId: string) {
  const now = new Date();
  const links = await prisma.launchpadLink.findMany({
    orderBy: [{ renewalAt: "asc" }, { riskLevel: "desc" }, { name: "asc" }],
    take: 100
  });
  const run = buildRenewalReminderRun({ now, links });
  const launchpadLinkIds = run.actionsToCreate.map((action) => action.launchpadLinkId);
  const existingReminders = launchpadLinkIds.length > 0
    ? await prisma.action.findMany({
      where: {
        automationId,
        launchpadLinkId: { in: launchpadLinkIds },
        status: { notIn: [ActionStatus.DONE, ActionStatus.CANCELLED] }
      },
      select: { id: true, launchpadLinkId: true }
    })
    : [];
  const { actionsToCreate, actionsToUpdate } = planRenewalReminderPersistence(run, existingReminders);

  await prisma.$transaction(async (tx) => {
    for (const action of actionsToCreate) {
      await tx.action.create({
        data: {
          title: action.title,
          description: action.description,
          status: ActionStatus.OPEN,
          priority: action.priority,
          source: ActionSource.AUTOMATION,
          dueAt: dateFromKey(action.dueAt),
          reviewAt: dateFromKey(action.reviewAt),
          nextStep: action.nextStep,
          sensitive: action.sensitive,
          createdById: userId,
          launchpadLinkId: action.launchpadLinkId,
          streamId: action.streamId,
          automationId
        }
      });
    }

    for (const action of actionsToUpdate) {
      await tx.action.update({
        where: { id: action.actionId },
        data: {
          title: action.title,
          description: action.description,
          priority: action.priority,
          dueAt: dateFromKey(action.dueAt),
          reviewAt: dateFromKey(action.reviewAt),
          nextStep: action.nextStep,
          sensitive: action.sensitive,
          launchpadLinkId: action.launchpadLinkId,
          automationId
        }
      });
    }

    await tx.automationRun.create({
      data: {
        automationId,
        triggeredById: userId,
        status: AutomationRunStatus.SUCCESS,
        requestSummary: "Approved local renewal reminder run",
        responseSummary: [
          run.responseSummary,
          "",
          "Run result",
          `- Reminder actions created this run: ${actionsToCreate.length}`,
          `- Existing open reminders refreshed this run: ${actionsToUpdate.length}`
        ].join("\n")
      }
    });
  });

  revalidatePath("/");
  revalidatePath("/actions");
  revalidatePath("/launchpad");
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
      throw new AutomationBlockedError("Inactive automations cannot prepare drafts.");
    }
    if (!kind) {
      throw new Error("No local draft runner is registered for this automation.");
    }

    const now = new Date();
    const actions = await prisma.action.findMany({
      include: { stream: true, companyFunction: true },
      orderBy: [{ priority: "asc" }, { dueAt: "asc" }, { updatedAt: "asc" }],
      take: 120
    });

    const responseSummary = kind === "WEEKLY_REVIEW_PREP"
      ? buildWeeklyReviewPrepDraft({
        now,
        actions,
        risks: await prisma.risk.findMany({
          orderBy: [{ severity: "desc" }, { nextReviewAt: "asc" }, { updatedAt: "desc" }],
          take: 50
        }),
        links: await prisma.launchpadLink.findMany({ orderBy: [{ riskLevel: "desc" }, { renewalAt: "asc" }, { name: "asc" }], take: 80 }),
        draftsNeedingReview: await prisma.assistantDraft.count({ where: { state: { not: AssistantDraftState.APPROVED } } }),
        setup: buildSetupDraftContext(await getCompanySetupData())
      })
      : kind === "STALE_TASK_SUMMARY"
        ? buildStaleTaskSummaryDraft({
        now,
        actions
      })
        : buildDailyInboxTriageDraft({
          now,
          actions
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
        status: error instanceof AutomationBlockedError ? AutomationRunStatus.BLOCKED : AutomationRunStatus.FAILED,
        requestSummary,
        error: message
      }
    });
  }

  revalidatePath("/automations");
}

export async function getActionRegisterData(filters: Record<string, string | undefined>) {
  const where = buildActionRegisterWhere(filters);

  const [actions, reference, phaseBacklog] = await Promise.all([
    prisma.action.findMany({
      where,
      include: { stream: true, companyFunction: true, assistantDraft: true },
      orderBy: [{ status: "asc" }, { priority: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }]
    }),
    getReferenceData(),
    getStrategyPhaseBacklog()
  ]);

  return { actions, phaseBacklog, ...reference };
}

export type StrategyPhaseBacklog = {
  phase: StrategyChecklistPhase;
  label: string;
  waiting: number;
};

/** Counts WAITING strategy items per later phase so the register can offer activation. */
export async function getStrategyPhaseBacklog(): Promise<StrategyPhaseBacklog[]> {
  const grouped = await prisma.action.groupBy({
    by: ["phase"],
    where: { status: ActionStatus.WAITING, phase: { not: null } },
    _count: { _all: true }
  });
  const waitingByPhase = new Map(grouped.map((row) => [row.phase, row._count._all]));

  const phases: StrategyChecklistPhase[] = [1, 2, 3];
  return phases.map((phase) => ({
    phase,
    label: STRATEGY_PHASE_LABELS[phase],
    waiting: waitingByPhase.get(phase) ?? 0
  }));
}

export async function activateStrategyPhase(phase: number) {
  if (!Number.isInteger(phase) || phase < 0 || phase > 3) {
    throw new Error("Invalid strategy phase.");
  }

  const result = await prisma.action.updateMany({
    where: { phase, status: ActionStatus.WAITING },
    data: { status: ActionStatus.OPEN }
  });

  revalidatePath("/");
  revalidatePath("/actions");
  return result.count;
}

export async function getCompanySetupData() {
  const titles = COMPANY_SETUP_CHECKLIST.map((item) => item.title);
  const actions = await prisma.action.findMany({
    where: { title: { in: titles } },
    // Oldest first so that if a title is ever duplicated, this view and
    // setSetupItemStatus deterministically resolve to the same row.
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, status: true, dueAt: true, priority: true, description: true, nextStep: true }
  });

  const stateByTitle = new Map<string, SetupActionState>();
  for (const action of actions) {
    const key = normaliseSetupTitle(action.title);
    if (stateByTitle.has(key)) continue;
    stateByTitle.set(key, {
      status: action.status as SetupActionState["status"],
      dueAt: action.dueAt,
      priority: action.priority as SetupActionState["priority"],
      description: action.description,
      nextStep: action.nextStep
    });
  }

  return summariseSetupChecklist(COMPANY_SETUP_CHECKLIST, stateByTitle);
}

export async function setSetupItemStatus(itemKey: string, status: ActionStatus, userId: string) {
  const item = COMPANY_SETUP_CHECKLIST.find((entry) => entry.key === itemKey);
  if (!item) throw new Error("Unknown setup checklist item.");

  // Oldest first, matching getCompanySetupData, so both resolve the same row.
  const existing = await prisma.action.findFirst({
    where: { title: item.title },
    orderBy: { createdAt: "asc" }
  });

  if (existing) {
    // Refresh the due date when reopening a completed item (or when one is
    // missing) so it lands back on a fresh horizon rather than instantly overdue.
    const reopening = existing.status === ActionStatus.DONE && status !== ActionStatus.DONE;
    const dueAt = status === ActionStatus.DONE
      ? existing.dueAt
      : reopening || !existing.dueAt
        ? setupDueDate(item)
        : existing.dueAt;

    await prisma.action.update({
      where: { id: existing.id },
      data: {
        status,
        dueAt,
        completedAt: status === ActionStatus.DONE ? new Date() : null
      }
    });
  } else {
    // Self-healing: if the action was never seeded (or was deleted), recreate it
    // from the checklist definition so the cockpit stays consistent.
    const [stream, companyFunction] = await Promise.all([
      prisma.stream.findUnique({ where: { name: SETUP_CHECKLIST_STREAM } }),
      prisma.companyFunction.findUnique({ where: { name: item.companyFunction } })
    ]);
    if (!stream) throw new Error(`Missing setup stream: ${SETUP_CHECKLIST_STREAM}.`);
    if (!companyFunction) throw new Error(`Missing company function: ${item.companyFunction}.`);

    await prisma.action.create({
      data: {
        title: item.title,
        description: item.description,
        nextStep: item.nextStep,
        sensitive: item.sensitive,
        priority: item.priority as Priority,
        status,
        dueAt: setupDueDate(item),
        completedAt: status === ActionStatus.DONE ? new Date() : null,
        source: ActionSource.USER,
        streamId: stream.id,
        companyFunctionId: companyFunction.id,
        createdById: userId
      }
    });
  }

  revalidatePath("/setup");
  revalidatePath("/");
  revalidatePath("/actions");
  revalidatePath("/reviews");
}

export async function updateSetupItemFromForm(itemKey: string, formData: FormData, userId: string) {
  const item = COMPANY_SETUP_CHECKLIST.find((entry) => entry.key === itemKey);
  if (!item) throw new Error("Unknown setup checklist item.");

  const status = enumValue(formData, "status", ActionStatus, ActionStatus.OPEN);
  const priority = enumValue(formData, "priority", Priority, item.priority as Priority);
  const dueAt = dateValue(formData, "dueAt") ?? null;
  const nextStep = optionalString(formData, "nextStep") ?? item.nextStep;

  const existing = await prisma.action.findFirst({
    where: { title: item.title },
    orderBy: { createdAt: "asc" }
  });

  if (existing) {
    await prisma.action.update({
      where: { id: existing.id },
      data: {
        status,
        priority,
        dueAt,
        nextStep,
        completedAt: completedAtForStatus(status, existing.completedAt)
      }
    });
  } else {
    const [stream, companyFunction] = await Promise.all([
      prisma.stream.findUnique({ where: { name: SETUP_CHECKLIST_STREAM } }),
      prisma.companyFunction.findUnique({ where: { name: item.companyFunction } })
    ]);
    if (!stream) throw new Error(`Missing setup stream: ${SETUP_CHECKLIST_STREAM}.`);
    if (!companyFunction) throw new Error(`Missing company function: ${item.companyFunction}.`);

    await prisma.action.create({
      data: {
        title: item.title,
        description: item.description,
        nextStep,
        sensitive: item.sensitive,
        priority,
        status,
        dueAt: dueAt ?? setupDueDate(item),
        completedAt: completedAtForStatus(status, null),
        source: ActionSource.USER,
        streamId: stream.id,
        companyFunctionId: companyFunction.id,
        createdById: userId
      }
    });
  }

  revalidatePath("/setup");
  revalidatePath("/");
  revalidatePath("/actions");
  revalidatePath("/reviews");
}

const HUBSPOT_DEFAULT_URL = "https://app.hubspot.com/";

export async function getSalesPipelineData() {
  const [salesActions, hubspot] = await Promise.all([
    prisma.action.findMany({
      where: {
        companyFunction: { name: { equals: "sales", mode: "insensitive" } },
        status: { notIn: [ActionStatus.DONE, ActionStatus.CANCELLED] }
      },
      include: { stream: true },
      // priority desc so the take limit keeps the highest-priority deals: the
      // Priority enum is declared LOW..CRITICAL, so desc returns CRITICAL first.
      orderBy: [{ priority: "desc" }, { dueAt: "asc" }, { createdAt: "desc" }],
      take: 50
    }),
    prisma.launchpadLink.findFirst({ where: { name: "HubSpot" } })
  ]);

  return {
    stages: SALES_PIPELINE_STAGES,
    summary: summariseSalesPipeline(salesActions),
    hubspotUrl: hubspot?.url ?? HUBSPOT_DEFAULT_URL
  };
}

export async function getLaunchpadData() {
  return prisma.launchpadLink.findMany({ orderBy: [{ group: "asc" }, { riskLevel: "desc" }, { name: "asc" }] });
}

export async function getLaunchpadDetail(id: string) {
  const [link, reference] = await Promise.all([
    prisma.launchpadLink.findUnique({
      where: { id },
      include: {
        stream: true,
        actions: {
          orderBy: [{ status: "asc" }, { priority: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
          take: 20
        }
      }
    }),
    getReferenceData()
  ]);
  return { link, ...reference };
}

export async function getReviewData() {
  const reviews = await prisma.review.findMany({ include: { actions: true }, orderBy: { createdAt: "desc" }, take: 20 });
  const lastReviewAt = reviews[0]?.createdAt ?? null;
  const sinceFilter = lastReviewAt ? { gte: lastReviewAt } : undefined;

  const [completedCount, createdCount, newRiskCount, decisionCount] = await Promise.all([
    prisma.action.count({ where: { completedAt: lastReviewAt ? { gte: lastReviewAt } : { not: null } } }),
    prisma.action.count({ where: sinceFilter ? { createdAt: sinceFilter } : undefined }),
    prisma.risk.count({ where: sinceFilter ? { createdAt: sinceFilter } : undefined }),
    prisma.decision.count({ where: sinceFilter ? { decidedAt: sinceFilter } : undefined })
  ]);

  const momentum = buildReviewMomentum({ lastReviewAt, completedCount, createdCount, newRiskCount, decisionCount });
  return { reviews, momentum };
}

export async function getAssistantDraftData() {
  return prisma.assistantDraft.findMany({ include: { action: true }, orderBy: { createdAt: "desc" }, take: 30 });
}

export async function getAutomationData() {
  return prisma.automation.findMany({ include: { runs: { orderBy: { createdAt: "desc" }, take: 5 } }, orderBy: { createdAt: "desc" } });
}

export async function getAutomationRunHistory(limit = 40) {
  const runs = await prisma.automationRun.findMany({
    include: {
      automation: { select: { name: true, targetTool: true } },
      triggeredBy: { select: { name: true } }
    },
    orderBy: { createdAt: "desc" },
    take: limit
  });
  return { runs, summary: summariseAutomationRuns(runs) };
}

export async function createRisk(formData: FormData) {
  const issue = stringValue(formData, "issue");
  if (!issue) throw new Error("Risk issue is required.");

  const actionId = optionalString(formData, "actionId");
  const streamId = optionalString(formData, "streamId");
  const companyFunctionId = optionalString(formData, "companyFunctionId");
  const actionContext = actionId && (!streamId || !companyFunctionId)
    ? await prisma.action.findUnique({
      where: { id: actionId },
      select: { streamId: true, companyFunctionId: true }
    })
    : null;

  await prisma.risk.create({
    data: {
      issue,
      severity: enumValue(formData, "severity", RiskLevel, RiskLevel.MEDIUM),
      status: stringValue(formData, "status") || "OPEN",
      mitigation: optionalString(formData, "mitigation"),
      nextReviewAt: dateValue(formData, "nextReviewAt"),
      streamId: streamId ?? actionContext?.streamId,
      companyFunctionId: companyFunctionId ?? actionContext?.companyFunctionId,
      actionId
    }
  });

  revalidatePath("/governance");
  revalidatePath("/");
  if (actionId) revalidatePath(`/actions/${actionId}`);
}

export async function updateRiskStatus(riskId: string, status: string) {
  if (!riskId) throw new Error("Risk id is required.");
  await prisma.risk.update({ where: { id: riskId }, data: { status } });
  revalidatePath("/governance");
  revalidatePath("/");
}

export async function createDecision(formData: FormData) {
  const decision = stringValue(formData, "decision");
  if (!decision) throw new Error("Decision text is required.");

  const followUpActionId = optionalString(formData, "followUpActionId");

  await prisma.decision.create({
    data: {
      decision,
      rationale: optionalString(formData, "rationale"),
      affectedArea: optionalString(formData, "affectedArea"),
      relatedDocs: optionalString(formData, "relatedDocs"),
      decidedAt: dateValue(formData, "decidedAt") ?? new Date(),
      followUpActionId
    }
  });

  revalidatePath("/governance");
  revalidatePath("/");
  if (followUpActionId) revalidatePath(`/actions/${followUpActionId}`);
}

export async function getGovernanceData() {
  const [risks, decisions, reference] = await Promise.all([
    prisma.risk.findMany({
      include: { stream: true, companyFunction: true },
      orderBy: [{ severity: "desc" }, { nextReviewAt: "asc" }, { createdAt: "desc" }]
    }),
    prisma.decision.findMany({ orderBy: { decidedAt: "desc" }, take: 50 }),
    getReferenceData()
  ]);
  return { risks, decisions, ...reference };
}

export async function getPortfolioData() {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const [streams, actions, risks, spendLinks] = await Promise.all([
    prisma.stream.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.action.findMany({
      where: {
        OR: [{ status: { notIn: [ActionStatus.DONE, ActionStatus.CANCELLED] } }, { completedAt: { gte: weekStart } }]
      },
      select: { status: true, streamId: true, dueAt: true, completedAt: true }
    }),
    prisma.risk.findMany({
      where: { status: { notIn: ["CLOSED", "RESOLVED", "DONE"] } },
      select: { streamId: true, status: true, severity: true }
    }),
    prisma.launchpadLink.findMany({ select: { cost: true, streamId: true } })
  ]);
  return {
    portfolio: buildStreamPortfolio({ now, streams, actions, risks }),
    spend: buildStreamSpend({ streams, links: spendLinks })
  };
}

export async function getActionDetail(id: string) {
  const [action, reference] = await Promise.all([
    prisma.action.findUnique({
      where: { id },
      include: {
        stream: true,
        companyFunction: true,
        assistantDraft: true,
        automation: true,
        review: true,
        launchpadLink: true,
        risks: true,
        decisions: true
      }
    }),
    getReferenceData()
  ]);
  return { action, ...reference };
}

export async function updateActionFromForm(actionId: string, formData: FormData) {
  const title = stringValue(formData, "title");
  if (!title) throw new Error("Action title is required.");

  const existing = await prisma.action.findUnique({ where: { id: actionId }, select: { completedAt: true } });
  if (!existing) throw new Error("Action not found.");

  const status = enumValue(formData, "status", ActionStatus, ActionStatus.OPEN);

  await prisma.action.update({
    where: { id: actionId },
    data: {
      title,
      description: optionalString(formData, "description") ?? null,
      status,
      priority: enumValue(formData, "priority", Priority, Priority.MEDIUM),
      dueAt: dateValue(formData, "dueAt") ?? null,
      reviewAt: dateValue(formData, "reviewAt") ?? null,
      nextStep: optionalString(formData, "nextStep") ?? null,
      streamId: optionalString(formData, "streamId") ?? null,
      companyFunctionId: optionalString(formData, "companyFunctionId") ?? null,
      sensitive: formData.get("sensitive") === "on",
      completedAt: completedAtForStatus(status, existing.completedAt)
    }
  });

  revalidatePath("/");
  revalidatePath("/actions");
  revalidatePath(`/actions/${actionId}`);
}

export async function updateActionQuickEditFromForm(actionId: string, formData: FormData) {
  const existing = await prisma.action.findUnique({ where: { id: actionId }, select: { completedAt: true } });
  if (!existing) throw new Error("Action not found.");

  const status = enumValue(formData, "status", ActionStatus, ActionStatus.OPEN);

  await prisma.action.update({
    where: { id: actionId },
    data: {
      status,
      priority: enumValue(formData, "priority", Priority, Priority.MEDIUM),
      dueAt: dateValue(formData, "dueAt") ?? null,
      reviewAt: dateValue(formData, "reviewAt") ?? null,
      completedAt: completedAtForStatus(status, existing.completedAt)
    }
  });

  revalidatePath("/");
  revalidatePath("/actions");
  revalidatePath(`/actions/${actionId}`);
}

export async function getOperatingDigest() {
  const [data, renewalLinks, digestRisks] = await Promise.all([
    getTodayData(),
    prisma.launchpadLink.findMany({ select: { id: true, name: true, group: true, cost: true, renewalAt: true, riskLevel: true } }),
    prisma.risk.findMany({
      orderBy: [{ severity: "desc" }, { nextReviewAt: "asc" }, { createdAt: "desc" }],
      select: { issue: true, severity: true, status: true }
    })
  ]);
  const closed = new Set(["CLOSED", "RESOLVED", "DONE"]);
  const calendar = buildRenewalCalendar({ links: renewalLinks });

  const active = [
    ...data.buckets.overdue,
    ...data.buckets.dueToday,
    ...data.buckets.blocked,
    ...data.buckets.waiting,
    ...data.buckets.upcoming
  ];

  const topActions = active.slice(0, 10).map((action) => ({
    title: action.title,
    status: action.status,
    priority: action.priority,
    streamName: action.stream?.name ?? null,
    dueKey: action.dueAt ? new Date(action.dueAt).toISOString().slice(0, 10) : null
  }));

  const openRisks = digestRisks
    .filter((risk) => !closed.has(risk.status.toUpperCase()))
    .map((risk) => ({ issue: risk.issue, severity: risk.severity, status: risk.status }));

  const recentDecisions = data.decisions.map((decision) => ({ decision: decision.decision, decidedAt: decision.decidedAt }));

  const renewalsDue = [...calendar.overdue, ...calendar.months.flatMap((month) => month.items)]
    .slice(0, 12)
    .map((item) => ({ name: item.name, renewalKey: item.renewalKey }));

  return buildOperatingDigest({
    generatedAt: new Date(),
    pulse: data.pulse,
    portfolio: data.portfolio,
    topActions,
    openRisks,
    recentDecisions,
    renewalsDue,
    renewalForecast: { total: calendar.windowTotal, count: calendar.windowCount, monthsAhead: calendar.monthsAhead }
  });
}

export async function getActivityData() {
  const now = new Date();
  const trendWeeks = 8;
  const trendWindowStart = startOfWeek(now);
  trendWindowStart.setUTCDate(trendWindowStart.getUTCDate() - 7 * (trendWeeks - 1));
  const [completedActions, createdActions, risks, decisions, automationRuns, drafts, reviews, completedForTrend] =
    await Promise.all([
      prisma.action.findMany({
        where: { completedAt: { not: null } },
        orderBy: { completedAt: "desc" },
        take: 20,
        select: { id: true, title: true, completedAt: true, stream: { select: { name: true } } }
      }),
      prisma.action.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, title: true, createdAt: true, source: true }
      }),
      prisma.risk.findMany({ orderBy: { createdAt: "desc" }, take: 15, select: { id: true, issue: true, severity: true, createdAt: true } }),
      prisma.decision.findMany({ orderBy: { decidedAt: "desc" }, take: 15, select: { id: true, decision: true, decidedAt: true } }),
      prisma.automationRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 15,
        select: { id: true, status: true, createdAt: true, automation: { select: { name: true } } }
      }),
      prisma.assistantDraft.findMany({ orderBy: { createdAt: "desc" }, take: 15, select: { id: true, sourceSummary: true, state: true, createdAt: true } }),
      prisma.review.findMany({ orderBy: { createdAt: "desc" }, take: 10, select: { id: true, type: true, createdAt: true } }),
      prisma.action.findMany({ where: { completedAt: { gte: trendWindowStart } }, orderBy: { completedAt: "desc" }, select: { completedAt: true } })
    ]);

  const feed = buildActivityFeed({ completedActions, createdActions, risks, decisions, automationRuns, drafts, reviews }, 40);
  const trend = buildCompletionTrend({ now, completedAts: completedForTrend.map((action) => action.completedAt), weeks: trendWeeks });
  return { feed, trend };
}

export async function getCommandPaletteItems() {
  const [actions, links] = await Promise.all([
    prisma.action.findMany({
      where: { status: { notIn: [ActionStatus.DONE, ActionStatus.CANCELLED] } },
      orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
      select: { id: true, title: true, status: true, priority: true, dueAt: true, updatedAt: true }
    }),
    prisma.launchpadLink.findMany({
      orderBy: [{ group: "asc" }, { name: "asc" }],
      take: 60,
      select: { id: true, name: true, url: true, group: true }
    })
  ]);
  const sortedActions = actions
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || dateRank(a.dueAt) - dateRank(b.dueAt) || b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 50)
    .map(({ id, title, status }) => ({ id, title, status }));

  return { actions: sortedActions, links };
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
  return value ? dateFromKey(value) : undefined;
}

function decimalValue(formData: FormData, key: string) {
  const value = optionalString(formData, key);
  return value ? value : undefined;
}

function completedAtForStatus(status: ActionStatus, existingCompletedAt?: Date | null) {
  return status === ActionStatus.DONE ? existingCompletedAt ?? new Date() : null;
}

function dateFromKey(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function priorityRank(priority: Priority) {
  const ranks: Record<Priority, number> = {
    [Priority.CRITICAL]: 0,
    [Priority.HIGH]: 1,
    [Priority.MEDIUM]: 2,
    [Priority.LOW]: 3
  };
  return ranks[priority] ?? 4;
}

function dateRank(value: Date | null) {
  return value ? value.getTime() : Number.POSITIVE_INFINITY;
}

function enumValue<T extends Record<string, string>>(formData: FormData, key: string, values: T, fallback: T[keyof T]) {
  const value = stringValue(formData, key);
  return Object.values(values).includes(value) ? (value as T[keyof T]) : fallback;
}

function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfWeek(date: Date) {
  const copy = startOfDay(date);
  const day = copy.getUTCDay();
  copy.setUTCDate(copy.getUTCDate() + (day === 0 ? -6 : 1 - day));
  return copy;
}

function buildReviewSummary(answers: Record<string, string>) {
  const populated = Object.entries(answers).filter(([, value]) => value.trim().length > 0);
  if (populated.length === 0) return "No major follow-up items were captured in this weekly review.";
  return populated.map(([key, value]) => `${key}: ${value.trim()}`).join("\n");
}
