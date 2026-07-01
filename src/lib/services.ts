import {
  ActionSource,
  ActionStatus,
  AssistantDraftState,
  AssistantProvider,
  AutomationRunStatus,
  AutomationSafetyLevel,
  IntakeDisposition,
  IntakeDomain,
  IntakeSource,
  IntakeStatus,
  Prisma,
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
import {
  buildDocumentIntakeRun,
  buildIntakeTriage,
  mergeExtractionIntoTriage,
  suggestRouting,
  summariseIntakeQueueFromCounts,
  type IntakeProposedAction
} from "./document-intake";
import { extractDocumentText } from "./document-read";
import {
  collectInboxCandidates,
  copyInboxCandidateToStore,
  discardInboxFile,
  hashContent,
  moveToArchive,
  storeUploadedFile
} from "./document-intake-store";
import { buildOperatingDigest } from "./operating-digest";
import { buildRenewalCalendar } from "./renewal-calendar";
import { buildReviewMomentum } from "./review-momentum";
import { buildStreamPortfolio } from "./stream-portfolio";
import { buildStreamSpend } from "./stream-spend";
import { bucketActionsForToday, mapReviewAnswersToDraftActions, normaliseQuickCaptureDraft } from "./domain";
import { buildCompanyMailroomFilingRun } from "./mailroom-filing";
import { prisma } from "./db";
import { buildQuickCaptureDraftRequest, draftActionFromQuickCapture, extractIntakeFieldsFromDocument } from "./ollama";
import { buildOperatingBrief } from "./operating-brief";
import { buildRenewalReminderRun, getLocalApprovalAutomationKind, planRenewalReminderPersistence } from "./renewal-reminders";
import { SALES_PIPELINE_STAGES, summariseSalesPipeline } from "./sales-pipeline";

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
    if (localApprovalKind === "DOCUMENT_INTAKE_TRIAGE") {
      await runDocumentIntakeTriageAutomation(automationId, userId);
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

// ---------------------------------------------------------------------------
// Document intake & triage pathway
//
// Scan/upload/email -> captured -> read (local OCR + Ollama) -> triaged into a
// Business/Personal/Mixed domain -> human review -> action, file, or archive.
// Reading is local-only; no document bytes or text leave the box, and no Action
// is created from a document without explicit human approval.
// ---------------------------------------------------------------------------

// Rows that need the human in the loop: already read/triaged/in-review, or a
// failed read that needs attention. These are fetched and shown ahead of
// not-yet-read CAPTURED rows so a large captured backlog can never push
// review-ready work out of the display cap.
const INTAKE_REVIEW_READY_STATUSES = [IntakeStatus.READ, IntakeStatus.TRIAGED, IntakeStatus.IN_REVIEW, IntakeStatus.FAILED];
const INTAKE_HISTORY_STATUSES = [IntakeStatus.FILED, IntakeStatus.ARCHIVED, IntakeStatus.REJECTED];
const INTAKE_FINALISED_STATUSES = [IntakeStatus.FILED, IntakeStatus.ARCHIVED, IntakeStatus.REJECTED];
const MAX_INTAKE_UPLOAD_BYTES = 20 * 1024 * 1024;

// The queue/history cards render only these columns. Selecting them explicitly
// keeps the heavy columns (ocrText, up to 200k chars, plus the signals JSON) out
// of a query that can return hundreds of pending rows, so opening /intake never
// pulls tens of MB of OCR text that the UI does not display.
const INTAKE_CARD_SELECT = {
  id: true,
  source: true,
  status: true,
  domain: true,
  domainConfidence: true,
  disposition: true,
  docType: true,
  originalFilename: true,
  summary: true,
  triageNote: true,
  reviewerNote: true,
  suggestedAction: true,
  capturedAt: true,
  reviewedAt: true,
  action: { select: { id: true, title: true } }
} as const;

export async function getIntakeQueueData() {
  // Review-ready, captured, and history are fetched separately so a captured
  // backlog can never push review-ready approvals out of the display cap, and the
  // summary is computed from a full groupBy so counts stay accurate regardless of
  // any display limit.
  const [reviewReady, captured, history, grouped, reference] = await Promise.all([
    prisma.intakeDocument.findMany({
      where: { status: { in: INTAKE_REVIEW_READY_STATUSES } },
      orderBy: [{ status: "asc" }, { capturedAt: "desc" }],
      select: INTAKE_CARD_SELECT,
      take: 300
    }),
    prisma.intakeDocument.findMany({
      where: { status: IntakeStatus.CAPTURED },
      orderBy: { capturedAt: "desc" },
      select: INTAKE_CARD_SELECT,
      take: 300
    }),
    prisma.intakeDocument.findMany({
      where: { status: { in: INTAKE_HISTORY_STATUSES } },
      orderBy: { reviewedAt: "desc" },
      select: INTAKE_CARD_SELECT,
      take: 40
    }),
    prisma.intakeDocument.groupBy({ by: ["status", "domain"], _count: true }),
    getReferenceData()
  ]);

  // Review-ready rows first, then captured, bounded to 300 total for the page so
  // the human-in-the-loop work is always visible ahead of the read backlog.
  const pending = [...reviewReady, ...captured].slice(0, 300);

  const summary = summariseIntakeQueueFromCounts(grouped.map((row) => ({ status: row.status, domain: row.domain, count: row._count })));

  return { pending, history, summary, ...reference };
}

/**
 * Pulls newly scanned/emailed files from the watched inbox folders into the
 * review queue as CAPTURED documents, deduplicating by content hash. No reading
 * or action creation happens here.
 */
export async function ingestIntakeFolder(): Promise<{ ingested: number; duplicates: number }> {
  const candidates = await collectInboxCandidates();
  let ingested = 0;
  let duplicates = 0;

  for (const candidate of candidates) {
    const existing = await prisma.intakeDocument.findFirst({ where: { contentHash: candidate.contentHash }, select: { id: true } });
    if (existing) {
      await discardInboxFile(candidate);
      duplicates += 1;
      continue;
    }

    // Copy to the store but keep the inbox original until the capture row
    // exists, so a crash between the two never orphans the document.
    const stored = await copyInboxCandidateToStore(candidate);
    try {
      await prisma.intakeDocument.create({
        data: {
          source: candidate.source as IntakeSource,
          status: IntakeStatus.CAPTURED,
          originalFilename: stored.filename,
          storedPath: stored.storedPath,
          contentHash: stored.contentHash,
          mimeType: stored.mimeType,
          byteSize: stored.byteSize,
          receivedAt: candidate.source === "EMAIL" ? new Date() : null
        }
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        // Lost a race with a concurrent capture of the same bytes; the unique
        // contentHash constraint is the atomic dedupe guarantee.
        await discardInboxFile(candidate);
        duplicates += 1;
        continue;
      }
      // Leave the inbox original in place so the next ingest can retry it.
      throw error;
    }

    await discardInboxFile(candidate);
    ingested += 1;
  }

  revalidatePath("/intake");
  return { ingested, duplicates };
}

export async function uploadIntakeDocument(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Choose a document to upload.");

  // Reject oversized uploads before materialising the buffer (defence in depth
  // alongside the Next.js server-action body limit) so a large payload cannot
  // spike memory or amplify OCR work.
  if (file.size > MAX_INTAKE_UPLOAD_BYTES) {
    throw new Error(`Document exceeds the ${Math.round(MAX_INTAKE_UPLOAD_BYTES / (1024 * 1024))}MB upload limit.`);
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  // Hash first and only write bytes to the store when the document is new, so a
  // re-uploaded duplicate never leaves an untracked file behind.
  const contentHash = hashContent(bytes);
  const existing = await prisma.intakeDocument.findFirst({ where: { contentHash }, select: { id: true } });
  if (!existing) {
    const stored = await storeUploadedFile(file.name, bytes, file.type);
    try {
      await prisma.intakeDocument.create({
        data: {
          source: IntakeSource.UPLOAD,
          status: IntakeStatus.CAPTURED,
          originalFilename: stored.filename,
          storedPath: stored.storedPath,
          contentHash: stored.contentHash,
          mimeType: stored.mimeType,
          byteSize: stored.byteSize
        }
      });
    } catch (error) {
      // The unique contentHash constraint makes dedupe atomic: a concurrent
      // upload of the same bytes is treated as a no-op rather than a failure.
      if (!isUniqueConstraintError(error)) throw error;
    }
  }

  revalidatePath("/intake");
}

/**
 * Reads a captured document locally (OCR) and triages it (heuristics enriched
 * by a local Ollama extraction). Updates the document with the extracted text,
 * proposed domain, document type, disposition, and a proposed Action draft. It
 * never creates an Action; the result waits for human approval.
 */
export async function readAndTriageIntakeDocument(intakeId: string) {
  const doc = await prisma.intakeDocument.findUnique({ where: { id: intakeId } });
  if (!doc) throw new Error("Intake document not found.");
  // A stale re-read must not resurrect a filed/archived/rejected document.
  if ((INTAKE_FINALISED_STATUSES as string[]).includes(doc.status)) {
    throw new Error("This document has already been filed, archived, or rejected.");
  }

  try {
    const read = await extractDocumentText({ storedPath: doc.storedPath, mimeType: doc.mimeType, filename: doc.originalFilename });
    const text = read.text ?? "";

    let extractionError: string | undefined;
    let extraction;
    if (text.trim().length > 0) {
      const result = await extractIntakeFieldsFromDocument(text, doc.originalFilename);
      extraction = result.extraction;
      extractionError = result.error;
    }

    const triage = mergeExtractionIntoTriage(buildIntakeTriage({ filename: doc.originalFilename, text, now: new Date() }), extraction);
    const note = [
      read.error,
      extractionError,
      read.truncated ? "Long document: only the first pages were read (OCR page limit) — check later pages manually." : null
    ]
      .filter(Boolean)
      .join(" | ");

    // Respect a domain the operator manually corrected, but let a re-read update
    // a domain that only a prior heuristic set. A human override is detectable
    // because setIntakeDomain changes `domain` without touching `suggestedDomain`,
    // so a human-locked row has domain !== suggestedDomain; a heuristic row has
    // them equal. The fresh heuristic is always recorded as suggestedDomain.
    const humanLocked = doc.domain !== IntakeDomain.UNKNOWN && doc.domain !== doc.suggestedDomain;
    const preserved = humanLocked ? (doc.domain as IntakeDomain) : null;
    const effectiveDomain = preserved ?? (triage.domain as IntakeDomain);
    let proposedAction = triage.proposedAction;
    if (preserved && preserved !== triage.domain) {
      const routing = suggestRouting({ docType: triage.docType, domain: preserved });
      proposedAction = { ...proposedAction, domain: preserved, stream: routing.stream, companyFunction: routing.companyFunction };
    }

    // Guard the writeback: OCR/Ollama can take many seconds, during which the
    // operator may file/archive/reject the document from another tab. Only write
    // back if it is still pending, so triage never resurrects a finalised row.
    await prisma.intakeDocument.updateMany({
      where: { id: intakeId, status: { notIn: INTAKE_FINALISED_STATUSES } },
      data: {
        status: IntakeStatus.TRIAGED,
        ocrText: text.length > 0 ? text : null,
        ocrEngine: read.engine,
        summary: triage.summary,
        docType: triage.docType,
        disposition: triage.disposition as IntakeDisposition,
        domain: effectiveDomain,
        suggestedDomain: triage.domain as IntakeDomain,
        domainConfidence: triage.domainConfidence,
        signals: triage.signals,
        suggestedAction: proposedAction,
        triageNote: note.length > 0 ? note : null,
        sensitive: proposedAction.sensitive,
        readAt: new Date(),
        triagedAt: new Date()
      }
    });
  } catch (error) {
    await prisma.intakeDocument.updateMany({
      where: { id: intakeId, status: { notIn: INTAKE_FINALISED_STATUSES } },
      data: {
        status: IntakeStatus.FAILED,
        readAt: new Date(),
        triageNote: error instanceof Error ? error.message : "Read and triage failed."
      }
    });
  }

  revalidatePath("/intake");
}

/**
 * Human approval: turns a triaged document into a tracked Action carrying the
 * chosen Business/Personal/Mixed domain, then files the document. Mirrors the
 * assistant draft approval flow. Source is ASSISTANT (AI proposed, human
 * approved) so no new ActionSource value is needed.
 */
export async function approveIntakeDocument(formData: FormData, userId: string) {
  const intakeId = stringValue(formData, "intakeId");
  const title = stringValue(formData, "title");
  if (!intakeId || !title) throw new Error("Document and title are required.");

  // Default to UNKNOWN (not BUSINESS) so an omitted/invalid value never silently
  // attaches company context. Only Business/Mixed documents route into a company
  // stream and function; Personal/Unknown stay out of company ops.
  const domain = enumValue(formData, "domain", IntakeDomain, IntakeDomain.UNKNOWN);
  // Everything except Personal routes into company ops. Business/Mixed/Unknown
  // get a stream + function (Unknown lands in Company Core/admin for review per
  // the workflow contract); Personal stays out of company streams entirely.
  const attachesCompanyContext = domain !== IntakeDomain.PERSONAL;

  // Resolve the company route. An UNKNOWN (uncertain) domain is forced to the
  // Company Core/admin fallback and deliberately ignores any route the form
  // pre-filled from the original suggestion: when the operator downgrades a
  // finance/legal suggestion to "unsure", the action must not still be filed
  // into finance/legal as if it were confidently Business (the form inputs keep
  // their stale defaults with no client JS to clear them). Business/Mixed honour
  // the operator's route, deriving docType defaults only for a left-blank field.
  let streamName = optionalString(formData, "stream");
  let functionName = optionalString(formData, "companyFunction");
  if (domain === IntakeDomain.UNKNOWN) {
    const routing = suggestRouting({ docType: "unknown", domain });
    streamName = routing.stream;
    functionName = routing.companyFunction;
  } else if (attachesCompanyContext && (!streamName || !functionName)) {
    const doc = await prisma.intakeDocument.findUnique({ where: { id: intakeId }, select: { docType: true } });
    const routing = suggestRouting({ docType: doc?.docType ?? "unknown", domain });
    streamName = streamName ?? routing.stream;
    functionName = functionName ?? routing.companyFunction;
  }

  const stream = attachesCompanyContext && streamName ? await prisma.stream.findUnique({ where: { name: streamName } }) : null;
  const companyFunction =
    attachesCompanyContext && functionName ? await prisma.companyFunction.findUnique({ where: { name: functionName } }) : null;

  await prisma.$transaction(async (tx) => {
    // Atomically claim the row with a single guarded UPDATE: only a not-yet-filed,
    // not-yet-finalised, unlinked document is moved to FILED. A concurrent or
    // stale resubmit (double-click, back-button, another tab that archived it)
    // matches nothing, so no duplicate/orphan Action is created.
    const claim = await tx.intakeDocument.updateMany({
      where: { id: intakeId, actionId: null, status: { notIn: INTAKE_FINALISED_STATUSES } },
      data: {
        status: IntakeStatus.FILED,
        domain,
        disposition: IntakeDisposition.ACTION,
        reviewedById: userId,
        reviewedAt: new Date(),
        reviewerNote: optionalString(formData, "reviewerNote")
      }
    });
    if (claim.count === 0) return;

    const action = await tx.action.create({
      data: {
        title,
        description: optionalString(formData, "description"),
        status: enumValue(formData, "status", ActionStatus, ActionStatus.OPEN),
        priority: enumValue(formData, "priority", Priority, Priority.MEDIUM),
        source: ActionSource.ASSISTANT,
        domain,
        dueAt: dateValue(formData, "dueDate"),
        reviewAt: dateValue(formData, "reviewDate"),
        nextStep: optionalString(formData, "nextStep"),
        sensitive: formData.get("sensitive") === "on",
        streamId: stream?.id,
        companyFunctionId: companyFunction?.id,
        createdById: userId
      }
    });

    await tx.intakeDocument.update({ where: { id: intakeId }, data: { actionId: action.id } });
  });

  revalidatePath("/");
  revalidatePath("/intake");
  revalidatePath("/actions");
}

/**
 * Files a document for records without creating an action (the FILE disposition
 * path). The stored copy is kept in place; the document moves to FILED with no
 * linked action, distinct from ARCHIVED, so filed-vs-archived metrics stay clean.
 */
export async function fileIntakeDocument(formData: FormData, userId: string) {
  const intakeId = stringValue(formData, "intakeId");
  if (!intakeId) throw new Error("Document is required.");

  // Atomically file only a not-yet-finalised document, so a stale form cannot
  // turn an archived/rejected/action-filed record into a records-only file.
  const updated = await prisma.intakeDocument.updateMany({
    where: { id: intakeId, status: { notIn: INTAKE_FINALISED_STATUSES } },
    data: {
      status: IntakeStatus.FILED,
      disposition: IntakeDisposition.FILE,
      domain: enumValue(formData, "domain", IntakeDomain, IntakeDomain.UNKNOWN),
      reviewedById: userId,
      reviewedAt: new Date(),
      reviewerNote: optionalString(formData, "reviewerNote")
    }
  });
  if (updated.count === 0) throw new Error("This document has already been filed, archived, or rejected.");

  revalidatePath("/intake");
}

export async function archiveIntakeDocument(formData: FormData, userId: string) {
  const intakeId = stringValue(formData, "intakeId");
  if (!intakeId) throw new Error("Document is required.");
  const doc = await prisma.intakeDocument.findUnique({ where: { id: intakeId } });
  if (!doc) throw new Error("Intake document not found.");
  // Guard against re-archiving an already finalised document, which would move a
  // file that has already moved and could clobber the stored path with a stale one.
  if ((INTAKE_FINALISED_STATUSES as string[]).includes(doc.status)) {
    throw new Error("This document has already been filed, archived, or rejected.");
  }

  const archivedPath = await moveToArchive(doc.storedPath);
  // Guarded: if another tab finalised the document while the file was moving,
  // don't overwrite that state (moveToArchive is idempotent on a later retry).
  await prisma.intakeDocument.updateMany({
    where: { id: intakeId, status: { notIn: INTAKE_FINALISED_STATUSES } },
    data: {
      status: IntakeStatus.ARCHIVED,
      storedPath: archivedPath,
      disposition: IntakeDisposition.ARCHIVE,
      domain: enumValue(formData, "domain", IntakeDomain, doc.domain),
      reviewedById: userId,
      reviewedAt: new Date(),
      reviewerNote: optionalString(formData, "reviewerNote")
    }
  });

  revalidatePath("/intake");
}

export async function rejectIntakeDocument(formData: FormData, userId: string) {
  const intakeId = stringValue(formData, "intakeId");
  if (!intakeId) throw new Error("Document is required.");

  // Guarded so a stale form cannot reject an already filed/archived/rejected
  // document (which could detach it from an action created in another tab).
  const updated = await prisma.intakeDocument.updateMany({
    where: { id: intakeId, status: { notIn: INTAKE_FINALISED_STATUSES } },
    data: {
      status: IntakeStatus.REJECTED,
      reviewedById: userId,
      reviewedAt: new Date(),
      reviewerNote: optionalString(formData, "reviewerNote")
    }
  });
  if (updated.count === 0) throw new Error("This document has already been filed, archived, or rejected.");

  revalidatePath("/intake");
}

export async function setIntakeDomain(formData: FormData) {
  const intakeId = stringValue(formData, "intakeId");
  if (!intakeId) throw new Error("Document is required.");
  const domain = enumValue(formData, "domain", IntakeDomain, IntakeDomain.UNKNOWN);

  const doc = await prisma.intakeDocument.findUnique({ where: { id: intakeId }, select: { suggestedAction: true } });
  const suggested = (doc?.suggestedAction as IntakeProposedAction | null) ?? null;

  // Guarded so a stale "Mark Business/Personal" cannot rewrite the domain of a
  // document another tab already filed/archived/rejected.
  const updated = await prisma.intakeDocument.updateMany({
    where: { id: intakeId, status: { notIn: INTAKE_FINALISED_STATUSES } },
    data: {
      domain,
      suggestedAction: suggested ? { ...suggested, domain } : suggested ?? undefined
    }
  });
  if (updated.count === 0) throw new Error("This document has already been filed, archived, or rejected.");

  revalidatePath("/intake");
}

async function runDocumentIntakeTriageAutomation(automationId: string, userId: string) {
  const { ingested, duplicates } = await ingestIntakeFolder();
  const run = buildDocumentIntakeRun({ now: new Date(), ingested, duplicates });

  const [stream, companyFunction] = await Promise.all([
    prisma.stream.findUnique({ where: { name: "Company Core" }, select: { id: true } }),
    prisma.companyFunction.findUnique({ where: { name: "admin" }, select: { id: true } })
  ]);

  await prisma.$transaction(async (tx) => {
    // Dedupe inside the transaction so two overlapping runs can't both create
    // the review action.
    const existingReviewAction = await tx.action.findFirst({
      where: {
        automationId,
        title: run.actionsToCreate[0]?.title,
        status: { notIn: [ActionStatus.DONE, ActionStatus.CANCELLED] }
      },
      select: { id: true }
    });
    const actionsToCreate = existingReviewAction ? [] : run.actionsToCreate;

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
        requestSummary: "Approved local document intake triage run",
        responseSummary: [
          run.responseSummary,
          "",
          "Cockpit result",
          `- Review actions created this run: ${actionsToCreate.length}`,
          `- Existing open review actions skipped: ${existingReviewAction ? 1 : 0}`
        ].join("\n")
      }
    });
  });

  revalidatePath("/");
  revalidatePath("/actions");
  revalidatePath("/intake");
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

// P2002 = Prisma unique-constraint violation. Used to treat a lost dedupe race
// (two captures of the same content hash) as a duplicate rather than an error.
function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
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
