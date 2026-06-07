import {
  ActionSource,
  ActionStatus,
  AssistantDraftState,
  AssistantProvider,
  AutomationRunStatus,
  AutomationSafetyLevel,
  Priority,
  ReviewType,
  RiskLevel
} from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    stream: { findMany: vi.fn(), findUnique: vi.fn() },
    companyFunction: { findMany: vi.fn(), findUnique: vi.fn() },
    action: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    launchpadLink: { findMany: vi.fn(), create: vi.fn() },
    automation: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    automationRun: { create: vi.fn() },
    assistantDraft: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    review: { create: vi.fn(), findMany: vi.fn() },
    risk: { findMany: vi.fn() },
    decision: { findMany: vi.fn() },
    $transaction: vi.fn()
  }
}));

vi.mock("./db", () => ({ prisma: prismaMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("./ollama", () => ({ draftActionFromQuickCapture: vi.fn() }));

const { revalidatePath } = await import("next/cache");
const { draftActionFromQuickCapture } = await import("./ollama");
const services = await import("./services");

function form(values: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(values)) fd.set(key, value);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  // Sensible defaults: every read returns empty, every write resolves with an id.
  for (const model of [
    prismaMock.stream,
    prismaMock.companyFunction,
    prismaMock.action,
    prismaMock.launchpadLink,
    prismaMock.automation,
    prismaMock.assistantDraft,
    prismaMock.risk,
    prismaMock.decision,
    prismaMock.review
  ] as Array<{ findMany?: ReturnType<typeof vi.fn> }>) {
    model.findMany?.mockResolvedValue([]);
  }
  prismaMock.stream.findUnique.mockResolvedValue(null);
  prismaMock.companyFunction.findUnique.mockResolvedValue(null);
  prismaMock.automation.findUnique.mockResolvedValue(null);
  prismaMock.assistantDraft.count.mockResolvedValue(0);
  prismaMock.action.create.mockResolvedValue({ id: "action-1" });
  prismaMock.action.update.mockResolvedValue({ id: "action-1" });
  prismaMock.launchpadLink.create.mockResolvedValue({ id: "link-1" });
  prismaMock.automation.create.mockResolvedValue({ id: "auto-1" });
  prismaMock.automationRun.create.mockResolvedValue({ id: "run-1" });
  prismaMock.assistantDraft.create.mockResolvedValue({ id: "draft-1" });
  prismaMock.assistantDraft.update.mockResolvedValue({ id: "draft-1" });
  prismaMock.review.create.mockResolvedValue({ id: "review-1" });
  prismaMock.$transaction.mockImplementation(async (cb: (tx: typeof prismaMock) => unknown) => cb(prismaMock));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createActionFromForm", () => {
  it("requires a title", async () => {
    await expect(services.createActionFromForm(form({}), "user-1")).rejects.toThrow("Action title is required.");
    expect(prismaMock.action.create).not.toHaveBeenCalled();
  });

  it("parses form fields, coerces dates, and revalidates the relevant pages", async () => {
    await services.createActionFromForm(
      form({
        title: "  Pay BAS  ",
        description: "Quarterly business activity statement",
        status: "IN_PROGRESS",
        priority: "HIGH",
        dueAt: "2026-07-01",
        nextStep: "Reconcile accounts",
        sensitive: "on"
      }),
      "user-1"
    );

    expect(prismaMock.action.create).toHaveBeenCalledTimes(1);
    const data = prismaMock.action.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      title: "Pay BAS",
      description: "Quarterly business activity statement",
      status: ActionStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      source: ActionSource.USER,
      nextStep: "Reconcile accounts",
      sensitive: true,
      createdById: "user-1"
    });
    expect(data.dueAt.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(data.reviewAt).toBeUndefined();
    expect(data.streamId).toBeUndefined();
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/actions");
  });

  it("falls back to default enums for missing or invalid values", async () => {
    await services.createActionFromForm(form({ title: "Untyped", status: "NONSENSE", priority: "" }), "user-1");

    const data = prismaMock.action.create.mock.calls[0][0].data;
    expect(data.status).toBe(ActionStatus.OPEN);
    expect(data.priority).toBe(Priority.MEDIUM);
    expect(data.sensitive).toBe(false);
  });
});

describe("updateActionStatus", () => {
  it("stamps completedAt when an action is marked DONE", async () => {
    await services.updateActionStatus("action-9", ActionStatus.DONE);

    const call = prismaMock.action.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: "action-9" });
    expect(call.data.status).toBe(ActionStatus.DONE);
    expect(call.data.completedAt).toBeInstanceOf(Date);
  });

  it("clears completedAt for non-DONE statuses", async () => {
    await services.updateActionStatus("action-9", ActionStatus.BLOCKED);

    expect(prismaMock.action.update.mock.calls[0][0].data.completedAt).toBeNull();
  });
});

describe("createQuickCaptureDraft", () => {
  it("requires non-empty capture text", async () => {
    await expect(services.createQuickCaptureDraft("   ", "user-1")).rejects.toThrow("Quick capture text is required.");
  });

  it("persists a READY draft from a successful assistant run", async () => {
    vi.mocked(draftActionFromQuickCapture).mockResolvedValue({
      model: "gemma3:1b",
      provider: "OLLAMA",
      prompt: "prompt-text",
      rawOutput: "{}",
      draft: {
        state: "READY",
        sourceText: "pay bas",
        proposedAction: { title: "Pay BAS", status: "OPEN", priority: "HIGH", source: "ASSISTANT", sensitive: false }
      },
      error: undefined
    });

    await services.createQuickCaptureDraft("  pay bas  ", "user-1");

    const data = prismaMock.assistantDraft.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      provider: AssistantProvider.OLLAMA,
      model: "gemma3:1b",
      state: AssistantDraftState.READY,
      sourceText: "pay bas",
      prompt: "prompt-text"
    });
    expect(data.output).toMatchObject({ title: "Pay BAS" });
  });

  it("persists a FAILED draft and surfaces the assistant error", async () => {
    vi.mocked(draftActionFromQuickCapture).mockResolvedValue({
      model: "gemma3:1b",
      provider: "OLLAMA",
      prompt: "prompt-text",
      rawOutput: "",
      draft: {
        state: "FAILED",
        sourceText: "broken",
        error: "Assistant output was not valid JSON.",
        proposedAction: { title: "broken", status: "OPEN", priority: "MEDIUM", source: "ASSISTANT", sensitive: false }
      },
      error: "Ollama returned HTTP 503."
    });

    await services.createQuickCaptureDraft("broken", "user-1");

    const data = prismaMock.assistantDraft.create.mock.calls[0][0].data;
    expect(data.state).toBe(AssistantDraftState.FAILED);
    expect(data.error).toBe("Ollama returned HTTP 503.");
  });
});

describe("approveAssistantDraft", () => {
  it("requires a draft id and title", async () => {
    await expect(services.approveAssistantDraft(form({ draftId: "d1" }), "user-1")).rejects.toThrow(
      "Draft and title are required."
    );
  });

  it("creates an action and approves the draft inside one transaction", async () => {
    prismaMock.stream.findUnique.mockResolvedValue({ id: "stream-1" });
    prismaMock.companyFunction.findUnique.mockResolvedValue({ id: "function-1" });

    await services.approveAssistantDraft(
      form({
        draftId: "draft-7",
        title: "Approved action",
        stream: "Money",
        companyFunction: "Finance",
        priority: "CRITICAL",
        dueDate: "2026-08-15"
      }),
      "user-1"
    );

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    const actionData = prismaMock.action.create.mock.calls[0][0].data;
    expect(actionData).toMatchObject({
      title: "Approved action",
      source: ActionSource.ASSISTANT,
      priority: Priority.CRITICAL,
      assistantDraftId: "draft-7",
      streamId: "stream-1",
      companyFunctionId: "function-1",
      createdById: "user-1"
    });
    expect(actionData.dueAt.toISOString()).toBe("2026-08-15T00:00:00.000Z");
    expect(prismaMock.assistantDraft.update).toHaveBeenCalledWith({
      where: { id: "draft-7" },
      data: { state: AssistantDraftState.APPROVED, approvedAt: expect.any(Date) }
    });
  });
});

describe("createLaunchpadLink", () => {
  it("requires name, url, and group", async () => {
    await expect(services.createLaunchpadLink(form({ name: "Xero", url: "https://x" }))).rejects.toThrow(
      "Name, URL, and group are required."
    );
  });

  it("creates a link with an enum risk fallback and passes through cost", async () => {
    await services.createLaunchpadLink(
      form({ name: "Xero", url: "https://xero.com", group: "Money", cost: "$70/mo", riskLevel: "BOGUS" })
    );

    const data = prismaMock.launchpadLink.create.mock.calls[0][0].data;
    expect(data).toMatchObject({ name: "Xero", url: "https://xero.com", group: "Money", riskLevel: RiskLevel.LOW, cost: "$70/mo" });
    expect(revalidatePath).toHaveBeenCalledWith("/launchpad");
  });
});

describe("completeWeeklyReview", () => {
  it("records the review and generates an action per populated answer", async () => {
    prismaMock.companyFunction.findUnique.mockResolvedValue({ id: "fn-finance" });

    await services.completeWeeklyReview(form({ finance: "Chase overdue invoice", sales: "Send proposal" }), "user-1");

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    const reviewData = prismaMock.review.create.mock.calls[0][0].data;
    expect(reviewData).toMatchObject({ type: ReviewType.WEEKLY, createdById: "user-1" });
    expect(reviewData.assistantSummary).toContain("finance: Chase overdue invoice");
    expect(reviewData.periodStart).toBeInstanceOf(Date);
    // Two populated answers -> two review actions.
    expect(prismaMock.action.create).toHaveBeenCalledTimes(2);
    const firstAction = prismaMock.action.create.mock.calls[0][0].data;
    expect(firstAction).toMatchObject({ source: ActionSource.REVIEW, reviewId: "review-1", createdById: "user-1" });
  });

  it("writes a placeholder summary when no answers are provided", async () => {
    await services.completeWeeklyReview(form({}), "user-1");

    const reviewData = prismaMock.review.create.mock.calls[0][0].data;
    expect(reviewData.assistantSummary).toBe("No major follow-up items were captured in this weekly review.");
    expect(prismaMock.action.create).not.toHaveBeenCalled();
  });
});

describe("createAutomation", () => {
  it("requires a name", async () => {
    await expect(services.createAutomation(form({}))).rejects.toThrow("Automation name is required.");
  });

  it("applies safe defaults for trigger, target tool, and safety level", async () => {
    await services.createAutomation(form({ name: "Renewal reminder" }));

    const data = prismaMock.automation.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      name: "Renewal reminder",
      trigger: "Manual",
      targetTool: "webhook",
      safetyLevel: AutomationSafetyLevel.APPROVAL_REQUIRED
    });
  });
});

describe("runAutomation", () => {
  it("throws when the automation does not exist", async () => {
    prismaMock.automation.findUnique.mockResolvedValue(null);
    await expect(services.runAutomation("missing", true, "user-1")).rejects.toThrow("Automation not found.");
  });

  it("records a BLOCKED run for draft-only automations", async () => {
    prismaMock.automation.findUnique.mockResolvedValue({
      id: "auto-1",
      name: "Draft only loop",
      safetyLevel: AutomationSafetyLevel.DRAFT_ONLY
    });

    await services.runAutomation("auto-1", true, "user-1");

    const run = prismaMock.automationRun.create.mock.calls[0][0].data;
    expect(run.status).toBe(AutomationRunStatus.BLOCKED);
    expect(run.error).toBe("Draft-only automations cannot execute.");
  });

  it("records a BLOCKED run when approval is required but not granted", async () => {
    prismaMock.automation.findUnique.mockResolvedValue({
      id: "auto-1",
      name: "Approval loop",
      safetyLevel: AutomationSafetyLevel.APPROVAL_REQUIRED
    });

    await services.runAutomation("auto-1", false, "user-1");

    const run = prismaMock.automationRun.create.mock.calls[0][0].data;
    expect(run.status).toBe(AutomationRunStatus.BLOCKED);
    expect(run.error).toBe("Approval is required before this automation can run.");
  });

  it("records a BLOCKED run for an automation gated at the BLOCKED safety level", async () => {
    prismaMock.automation.findUnique.mockResolvedValue({
      id: "auto-1",
      name: "Gated loop",
      safetyLevel: AutomationSafetyLevel.BLOCKED,
      webhookUrl: "https://hooks.test/run"
    });

    await services.runAutomation("auto-1", true, "user-1");

    const run = prismaMock.automationRun.create.mock.calls[0][0].data;
    expect(run.status).toBe(AutomationRunStatus.BLOCKED);
    expect(run.error).toBe("This automation is blocked without explicit review.");
  });

  it("calls the webhook and records a SUCCESS run", async () => {
    prismaMock.automation.findUnique.mockResolvedValue({
      id: "auto-1",
      name: "Trusted loop",
      safetyLevel: AutomationSafetyLevel.TRUSTED_LOOP,
      webhookUrl: "https://hooks.test/run"
    });
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200, text: async () => "webhook accepted" }));
    vi.stubGlobal("fetch", fetchMock);

    await services.runAutomation("auto-1", false, "user-1");

    expect(fetchMock).toHaveBeenCalledWith("https://hooks.test/run", expect.objectContaining({ method: "POST" }));
    const run = prismaMock.automationRun.create.mock.calls[0][0].data;
    expect(run.status).toBe(AutomationRunStatus.SUCCESS);
    expect(run.responseSummary).toBe("webhook accepted");
    expect(run.error).toBeNull();
  });

  it("records a FAILED run when the webhook returns a non-OK status", async () => {
    prismaMock.automation.findUnique.mockResolvedValue({
      id: "auto-1",
      name: "Trusted loop",
      safetyLevel: AutomationSafetyLevel.TRUSTED_LOOP,
      webhookUrl: "https://hooks.test/run"
    });
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500, text: async () => "boom" })));

    await services.runAutomation("auto-1", false, "user-1");

    const run = prismaMock.automationRun.create.mock.calls[0][0].data;
    expect(run.status).toBe(AutomationRunStatus.FAILED);
    expect(run.error).toBe("HTTP 500");
  });

  it("records a FAILED run when a runnable automation has no webhook URL", async () => {
    prismaMock.automation.findUnique.mockResolvedValue({
      id: "auto-1",
      name: "Trusted loop",
      safetyLevel: AutomationSafetyLevel.TRUSTED_LOOP,
      webhookUrl: null
    });

    await services.runAutomation("auto-1", false, "user-1");

    const run = prismaMock.automationRun.create.mock.calls[0][0].data;
    expect(run.status).toBe(AutomationRunStatus.FAILED);
    expect(run.error).toBe("Automation has no webhook URL configured.");
  });

  it("runs the local renewal reminder and skips links with existing open reminders", async () => {
    prismaMock.automation.findUnique.mockResolvedValue({
      id: "auto-renew",
      name: "Launchpad renewal reminder",
      safetyLevel: AutomationSafetyLevel.APPROVAL_REQUIRED
    });
    const soon = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    prismaMock.launchpadLink.findMany.mockResolvedValue([
      { id: "link-a", name: "Xero", group: "Money", renewalAt: soon, riskLevel: "HIGH", owner: "Founder", cost: "$70", sensitive: false },
      { id: "link-b", name: "Domain", group: "Web", renewalAt: soon, riskLevel: "LOW", owner: "Founder", cost: "$20", sensitive: false }
    ]);
    // link-a already has an open reminder, so only link-b should be created.
    prismaMock.action.findMany.mockResolvedValue([{ launchpadLinkId: "link-a" }]);

    await services.runAutomation("auto-renew", true, "user-1");

    const createdLinkIds = prismaMock.action.create.mock.calls.map((call) => call[0].data.launchpadLinkId);
    expect(createdLinkIds).toEqual(["link-b"]);
    const run = prismaMock.automationRun.create.mock.calls[0][0].data;
    expect(run.status).toBe(AutomationRunStatus.SUCCESS);
    expect(run.responseSummary).toContain("Reminder actions created this run: 1");
    expect(run.responseSummary).toContain("Existing open reminders skipped: 1");
  });
});

describe("prepareDraftAutomation", () => {
  it("throws when the automation does not exist", async () => {
    prismaMock.automation.findUnique.mockResolvedValue(null);
    await expect(services.prepareDraftAutomation("missing", "user-1")).rejects.toThrow("Automation not found.");
  });

  it("produces a weekly review prep draft for an active draft-only automation", async () => {
    prismaMock.automation.findUnique.mockResolvedValue({
      id: "auto-wr",
      name: "Weekly review prep",
      status: "ACTIVE",
      safetyLevel: AutomationSafetyLevel.DRAFT_ONLY
    });

    await services.prepareDraftAutomation("auto-wr", "user-1");

    const run = prismaMock.automationRun.create.mock.calls[0][0].data;
    expect(run.status).toBe(AutomationRunStatus.SUCCESS);
    expect(run.responseSummary).toContain("Weekly review prep - draft only");
  });

  it("produces a stale task summary draft", async () => {
    prismaMock.automation.findUnique.mockResolvedValue({
      id: "auto-stale",
      name: "Stale task summary",
      status: "ACTIVE",
      safetyLevel: AutomationSafetyLevel.DRAFT_ONLY
    });

    await services.prepareDraftAutomation("auto-stale", "user-1");

    const run = prismaMock.automationRun.create.mock.calls[0][0].data;
    expect(run.status).toBe(AutomationRunStatus.SUCCESS);
    expect(run.responseSummary).toContain("Stale task summary - draft only");
  });

  it("records a BLOCKED run for a paused automation", async () => {
    prismaMock.automation.findUnique.mockResolvedValue({
      id: "auto-wr",
      name: "Weekly review prep",
      status: "PAUSED",
      safetyLevel: AutomationSafetyLevel.DRAFT_ONLY
    });

    await services.prepareDraftAutomation("auto-wr", "user-1");

    const run = prismaMock.automationRun.create.mock.calls[0][0].data;
    expect(run.status).toBe(AutomationRunStatus.BLOCKED);
    expect(run.error).toBe("Paused automations cannot prepare drafts.");
  });

  it("records a BLOCKED run when the safety level is not draft-only", async () => {
    prismaMock.automation.findUnique.mockResolvedValue({
      id: "auto-wr",
      name: "Weekly review prep",
      status: "ACTIVE",
      safetyLevel: AutomationSafetyLevel.APPROVAL_REQUIRED
    });

    await services.prepareDraftAutomation("auto-wr", "user-1");

    const run = prismaMock.automationRun.create.mock.calls[0][0].data;
    expect(run.status).toBe(AutomationRunStatus.BLOCKED);
  });

  it("records a FAILED run when no local draft runner matches", async () => {
    prismaMock.automation.findUnique.mockResolvedValue({
      id: "auto-x",
      name: "Unmapped automation",
      status: "ACTIVE",
      safetyLevel: AutomationSafetyLevel.DRAFT_ONLY
    });

    await services.prepareDraftAutomation("auto-x", "user-1");

    const run = prismaMock.automationRun.create.mock.calls[0][0].data;
    expect(run.status).toBe(AutomationRunStatus.FAILED);
    expect(run.error).toBe("No local draft runner is registered for this automation.");
  });
});

describe("read aggregators", () => {
  it("composes today data from the underlying queries", async () => {
    const today = await services.getTodayData();
    expect(today).toHaveProperty("nextAction");
    expect(today).toHaveProperty("brief");
    expect(today).toHaveProperty("launchpadHealth");
    expect(today.actions).toEqual([]);
  });

  it("builds the action register query from filters", async () => {
    await services.getActionRegisterData({ status: "OPEN" });
    const call = prismaMock.action.findMany.mock.calls.at(-1)?.[0];
    expect(call.where).toEqual({ status: "OPEN" });
  });

  it("loads reference, launchpad, review, draft, and automation data", async () => {
    await services.getReferenceData();
    await services.getLaunchpadData();
    await services.getReviewData();
    await services.getAssistantDraftData();
    await services.getAutomationData();

    expect(prismaMock.stream.findMany).toHaveBeenCalled();
    expect(prismaMock.launchpadLink.findMany).toHaveBeenCalled();
    expect(prismaMock.automation.findMany).toHaveBeenCalled();
  });
});
