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
    action: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn() },
    launchpadLink: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    automation: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    automationRun: { findMany: vi.fn(), create: vi.fn() },
    assistantDraft: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    review: { create: vi.fn(), findMany: vi.fn() },
    risk: { findMany: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn() },
    decision: { findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
    intakeDocument: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), groupBy: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn()
  }
}));

vi.mock("./db", () => ({ prisma: prismaMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("./ollama", () => ({
  buildQuickCaptureDraftRequest: vi.fn((sourceText: string) => ({
    baseUrl: "http://localhost:11434",
    model: "gemma3:1b",
    prompt: `prompt:${sourceText}`
  })),
  draftActionFromQuickCapture: vi.fn(),
  extractIntakeFieldsFromDocument: vi.fn()
}));
vi.mock("./document-intake-store", () => ({
  collectInboxCandidates: vi.fn(),
  copyInboxCandidateToStore: vi.fn(),
  discardInboxFile: vi.fn(),
  hashContent: vi.fn(() => "hash-abc"),
  moveToArchive: vi.fn(async (path: string) => `/archive/${path}`),
  storeUploadedFile: vi.fn()
}));
vi.mock("./document-read", () => ({ extractDocumentText: vi.fn() }));

const { revalidatePath } = await import("next/cache");
const { draftActionFromQuickCapture, extractIntakeFieldsFromDocument } = await import("./ollama");
const store = await import("./document-intake-store");
const read = await import("./document-read");
const services = await import("./services");

function form(values: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(values)) fd.set(key, value);
  return fd;
}

// jsdom's File does not implement arrayBuffer(), so provide a real File instance
// (to satisfy `instanceof File`) with a working arrayBuffer() for upload tests.
function fileWithBytes(name: string, content: string): File {
  const file = new File([content], name, { type: "application/pdf" });
  Object.defineProperty(file, "arrayBuffer", { value: async () => new TextEncoder().encode(content).buffer });
  return file;
}

async function waitForBackgroundTasks() {
  await new Promise((resolve) => setTimeout(resolve, 0));
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
    prismaMock.automationRun,
    prismaMock.review
  ] as Array<{ findMany?: ReturnType<typeof vi.fn> }>) {
    model.findMany?.mockResolvedValue([]);
  }
  prismaMock.stream.findUnique.mockResolvedValue(null);
  prismaMock.companyFunction.findUnique.mockResolvedValue(null);
  prismaMock.action.findFirst.mockResolvedValue(null);
  prismaMock.action.findUnique.mockResolvedValue(null);
  prismaMock.action.count.mockResolvedValue(0);
  prismaMock.launchpadLink.findFirst.mockResolvedValue(null);
  prismaMock.launchpadLink.findUnique.mockResolvedValue(null);
  prismaMock.automation.findUnique.mockResolvedValue(null);
  prismaMock.assistantDraft.count.mockResolvedValue(0);
  prismaMock.risk.count.mockResolvedValue(0);
  prismaMock.decision.count.mockResolvedValue(0);
  prismaMock.action.create.mockResolvedValue({ id: "action-1" });
  prismaMock.action.update.mockResolvedValue({ id: "action-1" });
  prismaMock.launchpadLink.create.mockResolvedValue({ id: "link-1" });
  prismaMock.launchpadLink.update.mockResolvedValue({ id: "link-1" });
  prismaMock.automation.create.mockResolvedValue({ id: "auto-1" });
  prismaMock.automationRun.create.mockResolvedValue({ id: "run-1" });
  prismaMock.assistantDraft.create.mockResolvedValue({ id: "draft-1" });
  prismaMock.assistantDraft.update.mockResolvedValue({ id: "draft-1" });
  prismaMock.review.create.mockResolvedValue({ id: "review-1" });
  prismaMock.risk.create.mockResolvedValue({ id: "risk-1" });
  prismaMock.risk.update.mockResolvedValue({ id: "risk-1" });
  prismaMock.decision.create.mockResolvedValue({ id: "decision-1" });
  prismaMock.intakeDocument.findFirst.mockResolvedValue(null);
  prismaMock.intakeDocument.findUnique.mockResolvedValue(null);
  prismaMock.intakeDocument.groupBy.mockResolvedValue([]);
  prismaMock.intakeDocument.create.mockResolvedValue({ id: "intake-1" });
  prismaMock.intakeDocument.update.mockResolvedValue({ id: "intake-1" });
  prismaMock.intakeDocument.updateMany.mockResolvedValue({ count: 1 });
  const storedFile = { storedPath: "/store/hash-abc.pdf", filename: "doc.pdf", contentHash: "hash-abc", mimeType: "application/pdf", byteSize: 3 };
  vi.mocked(store.collectInboxCandidates).mockResolvedValue([]);
  vi.mocked(store.storeUploadedFile).mockResolvedValue(storedFile);
  vi.mocked(store.copyInboxCandidateToStore).mockResolvedValue(storedFile);
  vi.mocked(store.hashContent).mockReturnValue("hash-abc");
  vi.mocked(read.extractDocumentText).mockResolvedValue({ text: "", engine: "none" });
  vi.mocked(extractIntakeFieldsFromDocument).mockResolvedValue({ model: "gemma3:1b", provider: "OLLAMA", prompt: "", rawOutput: "", extraction: undefined });
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

describe("updateSetupItemFromForm", () => {
  it("updates the backing setup action with mutable operating fields", async () => {
    prismaMock.action.findFirst.mockResolvedValue({
      id: "setup-action-1",
      status: ActionStatus.OPEN,
      dueAt: null,
      completedAt: null
    });

    await services.updateSetupItemFromForm(
      "legal-asic-current",
      form({
        status: "IN_PROGRESS",
        priority: "CRITICAL",
        dueAt: "2026-07-15",
        nextStep: "Call accountant"
      }),
      "user-1"
    );

    expect(prismaMock.action.update).toHaveBeenCalledWith({
      where: { id: "setup-action-1" },
      data: expect.objectContaining({
        status: ActionStatus.IN_PROGRESS,
        priority: Priority.CRITICAL,
        nextStep: "Call accountant",
        completedAt: null
      })
    });
    expect(prismaMock.action.update.mock.calls[0][0].data.dueAt.toISOString()).toBe("2026-07-15T00:00:00.000Z");
    expect(revalidatePath).toHaveBeenCalledWith("/setup");
    expect(revalidatePath).toHaveBeenCalledWith("/actions");
  });

  it("clears the backing setup action due date when the quick edit value is blank", async () => {
    prismaMock.action.findFirst.mockResolvedValue({
      id: "setup-action-1",
      status: ActionStatus.OPEN,
      dueAt: new Date("2026-07-15T00:00:00.000Z"),
      completedAt: null
    });

    await services.updateSetupItemFromForm(
      "legal-asic-current",
      form({ status: "OPEN", priority: "HIGH", dueAt: "", nextStep: "Call accountant" }),
      "user-1"
    );

    expect(prismaMock.action.update.mock.calls[0][0].data.dueAt).toBeNull();
  });

  it("self-heals a missing setup action before applying quick edit values", async () => {
    prismaMock.action.findFirst.mockResolvedValue(null);
    prismaMock.stream.findUnique.mockResolvedValue({ id: "stream-company-core" });
    prismaMock.companyFunction.findUnique.mockResolvedValue({ id: "function-legal" });

    await services.updateSetupItemFromForm(
      "legal-asic-current",
      form({ status: "WAITING", priority: "HIGH", dueAt: "2026-08-01", nextStep: "Wait for ASIC extract" }),
      "user-1"
    );

    const data = prismaMock.action.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      title: "Confirm ASIC company details are current",
      status: ActionStatus.WAITING,
      priority: Priority.HIGH,
      nextStep: "Wait for ASIC extract",
      streamId: "stream-company-core",
      companyFunctionId: "function-legal",
      createdById: "user-1"
    });
    expect(data.dueAt.toISOString()).toBe("2026-08-01T00:00:00.000Z");
  });
});

describe("updateActionQuickEditFromForm", () => {
  it("updates only status, priority, due date, and review date", async () => {
    prismaMock.action.findUnique.mockResolvedValue({ completedAt: null });

    await services.updateActionQuickEditFromForm(
      "action-1",
      form({ status: "DONE", priority: "HIGH", dueAt: "2026-07-20", reviewAt: "2026-07-25" })
    );

    const call = prismaMock.action.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: "action-1" });
    expect(call.data).toMatchObject({
      status: ActionStatus.DONE,
      priority: Priority.HIGH
    });
    expect(call.data.dueAt.toISOString()).toBe("2026-07-20T00:00:00.000Z");
    expect(call.data.reviewAt.toISOString()).toBe("2026-07-25T00:00:00.000Z");
    expect(call.data.completedAt).toBeInstanceOf(Date);
    expect(call.data.title).toBeUndefined();
  });

  it("clears completedAt when an action is reopened from quick edit", async () => {
    prismaMock.action.findUnique.mockResolvedValue({ completedAt: new Date("2026-07-01T00:00:00.000Z") });

    await services.updateActionQuickEditFromForm("action-1", form({ status: "OPEN", priority: "MEDIUM" }));

    expect(prismaMock.action.update.mock.calls[0][0].data.completedAt).toBeNull();
  });
});

describe("launchpad update services", () => {
  it("updates quick-edit launchpad metadata and revalidates dependent views", async () => {
    await services.updateLaunchpadQuickFieldsFromForm(
      "link-1",
      form({
        group: "Money",
        cost: "99.00",
        renewalAt: "2026-09-01",
        owner: "Callum",
        riskLevel: "HIGH"
      })
    );

    const call = prismaMock.launchpadLink.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: "link-1" });
    expect(call.data).toMatchObject({
      group: "Money",
      cost: "99.00",
      owner: "Callum",
      riskLevel: RiskLevel.HIGH
    });
    expect(call.data.renewalAt.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(revalidatePath).toHaveBeenCalledWith("/launchpad");
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/portfolio");
    expect(revalidatePath).toHaveBeenCalledWith("/automations");
  });

  it("clears nullable launchpad quick-edit fields when form values are blank", async () => {
    await services.updateLaunchpadQuickFieldsFromForm(
      "link-1",
      form({
        group: "Money",
        cost: "",
        renewalAt: "",
        owner: "",
        riskLevel: "LOW"
      })
    );

    const data = prismaMock.launchpadLink.update.mock.calls[0][0].data;
    expect(data).toMatchObject({
      cost: null,
      renewalAt: null,
      owner: null
    });
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("updates the full launchpad detail record", async () => {
    await services.updateLaunchpadLinkFromForm(
      "link-1",
      form({
        name: "Xero",
        url: "https://xero.com",
        group: "Money",
        streamId: "stream-1",
        cost: "88.00",
        renewalAt: "2026-10-01",
        owner: "Callum",
        riskLevel: "CRITICAL",
        loginNote: "Password manager entry",
        description: "Accounting source of truth",
        sensitive: "on"
      })
    );

    expect(prismaMock.launchpadLink.update).toHaveBeenCalledWith({
      where: { id: "link-1" },
      data: expect.objectContaining({
        name: "Xero",
        url: "https://xero.com",
        group: "Money",
        streamId: "stream-1",
        cost: "88.00",
        owner: "Callum",
        riskLevel: RiskLevel.CRITICAL,
        loginNote: "Password manager entry",
        description: "Accounting source of truth",
        sensitive: true
      })
    });
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("clears nullable launchpad detail fields when optional form values are blank", async () => {
    await services.updateLaunchpadLinkFromForm(
      "link-1",
      form({
        name: "Xero",
        url: "https://xero.com",
        group: "Money",
        description: "",
        cost: "",
        renewalAt: "",
        loginNote: "",
        owner: "",
        streamId: "",
        riskLevel: "LOW"
      })
    );

    expect(prismaMock.launchpadLink.update.mock.calls[0][0].data).toMatchObject({
      description: null,
      cost: null,
      renewalAt: null,
      loginNote: null,
      owner: null,
      streamId: null
    });
  });

  it("loads launchpad detail with linked actions and reference data", async () => {
    prismaMock.launchpadLink.findUnique.mockResolvedValue({
      id: "link-1",
      name: "Xero",
      actions: [{ id: "action-1", title: "Review Xero renewal" }]
    });

    const detail = await services.getLaunchpadDetail("link-1");

    expect(prismaMock.launchpadLink.findUnique).toHaveBeenCalledWith({
      where: { id: "link-1" },
      include: {
        stream: true,
        actions: {
          orderBy: [{ status: "asc" }, { priority: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
          take: 20
        }
      }
    });
    expect(detail.link?.name).toBe("Xero");
  });
});

describe("createQuickCaptureDraft", () => {
  it("requires non-empty capture text", async () => {
    await expect(services.createQuickCaptureDraft("   ", "user-1")).rejects.toThrow("Quick capture text is required.");
  });

  it("persists a pending draft immediately when the local assistant is still generating", async () => {
    vi.mocked(draftActionFromQuickCapture).mockReturnValue(new Promise(() => {}));
    prismaMock.assistantDraft.create.mockResolvedValue({ id: "draft-pending" });

    const result = await Promise.race([
      services.createQuickCaptureDraft("  call supplier  ", "user-1"),
      new Promise((resolve) => setTimeout(() => resolve("timed out"), 25))
    ]);

    expect(result).toMatchObject({ id: "draft-pending" });
    const data = prismaMock.assistantDraft.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      provider: AssistantProvider.OLLAMA,
      model: "gemma3:1b",
      state: AssistantDraftState.PENDING,
      sourceSummary: "Quick capture",
      sourceText: "call supplier",
      createdById: "user-1"
    });
    expect(draftActionFromQuickCapture).toHaveBeenCalledWith("call supplier");
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
    await waitForBackgroundTasks();

    const created = prismaMock.assistantDraft.create.mock.calls[0][0].data;
    expect(created).toMatchObject({
      provider: AssistantProvider.OLLAMA,
      model: "gemma3:1b",
      state: AssistantDraftState.PENDING,
      sourceText: "pay bas",
      prompt: "prompt:pay bas"
    });
    const update = prismaMock.assistantDraft.update.mock.calls[0][0];
    expect(update).toMatchObject({
      where: { id: "draft-1" },
      data: {
        model: "gemma3:1b",
        state: AssistantDraftState.READY,
        prompt: "prompt-text",
        error: null
      }
    });
    expect(update.data.output).toMatchObject({ title: "Pay BAS" });
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
    await waitForBackgroundTasks();

    const created = prismaMock.assistantDraft.create.mock.calls[0][0].data;
    expect(created.state).toBe(AssistantDraftState.PENDING);
    const update = prismaMock.assistantDraft.update.mock.calls[0][0];
    expect(update.data.state).toBe(AssistantDraftState.FAILED);
    expect(update.data.error).toBe("Ollama returned HTTP 503.");
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

  it("runs the local renewal reminder and refreshes links with existing open reminders", async () => {
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
    // link-a already has an open reminder, so link-b is created and link-a is refreshed.
    prismaMock.action.findMany.mockResolvedValue([{ id: "action-link-a", launchpadLinkId: "link-a" }]);

    await services.runAutomation("auto-renew", true, "user-1");

    const createdLinkIds = prismaMock.action.create.mock.calls.map((call) => call[0].data.launchpadLinkId);
    expect(createdLinkIds).toEqual(["link-b"]);
    expect(prismaMock.action.update).toHaveBeenCalledWith({
      where: { id: "action-link-a" },
      data: expect.objectContaining({
        launchpadLinkId: "link-a",
        automationId: "auto-renew",
        nextStep: expect.stringContaining("Review Xero renewal decision before")
      })
    });
    const run = prismaMock.automationRun.create.mock.calls[0][0].data;
    expect(run.status).toBe(AutomationRunStatus.SUCCESS);
    expect(run.responseSummary).toContain("Reminder actions created this run: 1");
    expect(run.responseSummary).toContain("Existing open reminders refreshed this run: 1");
  });

  it("runs the local company mailroom filing control without calling a webhook", async () => {
    prismaMock.automation.findUnique.mockResolvedValue(companyMailroomAutomation({ webhookUrl: "https://hooks.test/mailroom" }));
    prismaMock.stream.findUnique.mockResolvedValue({ id: "stream-company-core" });
    prismaMock.companyFunction.findUnique.mockResolvedValue({ id: "function-admin" });
    prismaMock.action.findFirst.mockResolvedValue(null);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await services.runAutomation("auto-mailroom", true, "user-1");

    const action = prismaMock.action.create.mock.calls[0][0].data;
    expect(action).toMatchObject({
      title: "Review Company mailroom filing setup and exceptions",
      status: ActionStatus.OPEN,
      priority: Priority.HIGH,
      source: ActionSource.AUTOMATION,
      sensitive: true,
      createdById: "user-1",
      automationId: "auto-mailroom",
      streamId: "stream-company-core",
      companyFunctionId: "function-admin"
    });
    expect(action.description).toContain("Workflow contract: docs/workflows/company-mailroom-filing.md");
    expect(action.description).toContain("No payment execution, bank rules, BAS/tax lodgement, or Xero writes are permitted.");
    const run = prismaMock.automationRun.create.mock.calls[0][0].data;
    expect(run).toMatchObject({
      automationId: "auto-mailroom",
      triggeredById: "user-1",
      status: AutomationRunStatus.SUCCESS,
      requestSummary: "Approved local company mailroom filing run"
    });
    expect(run.responseSummary).toContain("Company mailroom filing - approved setup run");
    expect(run.responseSummary).toContain("Cockpit did not contact Gmail, Drive, Sheets, OCR, payment, tax, accounting, or Xero systems.");
    expect(run.responseSummary).toContain("Review actions created this run: 1");
    expect(run.responseSummary).toContain("Existing open review actions skipped: 0");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps an existing open mailroom review action and logs the skipped duplicate", async () => {
    prismaMock.automation.findUnique.mockResolvedValue(companyMailroomAutomation());
    prismaMock.stream.findUnique.mockResolvedValue({ id: "stream-company-core" });
    prismaMock.companyFunction.findUnique.mockResolvedValue({ id: "function-admin" });
    prismaMock.action.findFirst.mockResolvedValue({ id: "action-existing" });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await services.runAutomation("auto-mailroom", true, "user-1");

    expect(prismaMock.action.create).not.toHaveBeenCalled();
    const run = prismaMock.automationRun.create.mock.calls[0][0].data;
    expect(run.status).toBe(AutomationRunStatus.SUCCESS);
    expect(run.responseSummary).toContain("Review actions created this run: 0");
    expect(run.responseSummary).toContain("Existing open review actions skipped: 1");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

function companyMailroomAutomation({ webhookUrl = null }: { webhookUrl?: string | null } = {}) {
  return {
    id: "auto-mailroom",
    name: "Company mailroom filing",
    safetyLevel: AutomationSafetyLevel.APPROVAL_REQUIRED,
    trigger: "Manual Gmail/Drive/Sheets filing review",
    targetTool: "Gmail Processor / Apps Script",
    webhookUrl
  };
}

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
    expect(run.error).toBe("Inactive automations cannot prepare drafts.");
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

describe("document intake", () => {
  const candidate = {
    absPath: "/inbox/scan/a.pdf",
    filename: "a.pdf",
    source: "FOLDER" as const,
    mimeType: "application/pdf",
    byteSize: 3,
    contentHash: "h1",
    bytes: Buffer.from("abc")
  };

  it("builds the queue summary from a full groupBy, not a capped list", async () => {
    prismaMock.intakeDocument.findMany
      .mockResolvedValueOnce([{ id: "p1", status: "CAPTURED", domain: "UNKNOWN", action: null }])
      .mockResolvedValueOnce([{ id: "h1", status: "FILED", domain: "BUSINESS", action: { id: "a1", title: "Filed" } }]);
    prismaMock.intakeDocument.groupBy.mockResolvedValue([
      { status: "CAPTURED", domain: "UNKNOWN", _count: 1 },
      { status: "FILED", domain: "BUSINESS", _count: 2 }
    ]);

    const data = await services.getIntakeQueueData();
    expect(data.pending).toHaveLength(1);
    expect(data.history).toHaveLength(1);
    expect(data.summary.total).toBe(3);
    expect(data.summary.byDomain.BUSINESS).toBe(2);
    // History is ordered by reviewedAt.
    expect(prismaMock.intakeDocument.findMany.mock.calls[1][0].orderBy).toEqual({ reviewedAt: "desc" });
  });

  it("ingests a new candidate, creating the row before discarding the inbox original", async () => {
    vi.mocked(store.collectInboxCandidates).mockResolvedValue([candidate]);
    prismaMock.intakeDocument.findFirst.mockResolvedValue(null);

    const result = await services.ingestIntakeFolder();

    expect(result).toEqual({ ingested: 1, duplicates: 0 });
    expect(store.copyInboxCandidateToStore).toHaveBeenCalledWith(candidate);
    expect(prismaMock.intakeDocument.create).toHaveBeenCalled();
    // Order matters: the DB row is created before the inbox original is removed.
    const createOrder = prismaMock.intakeDocument.create.mock.invocationCallOrder[0];
    const discardOrder = vi.mocked(store.discardInboxFile).mock.invocationCallOrder[0];
    expect(createOrder).toBeLessThan(discardOrder);
  });

  it("skips a duplicate inbox candidate without creating a row", async () => {
    vi.mocked(store.collectInboxCandidates).mockResolvedValue([candidate]);
    prismaMock.intakeDocument.findFirst.mockResolvedValue({ id: "existing" });

    const result = await services.ingestIntakeFolder();

    expect(result).toEqual({ ingested: 0, duplicates: 1 });
    expect(store.discardInboxFile).toHaveBeenCalledWith(candidate.absPath);
    expect(prismaMock.intakeDocument.create).not.toHaveBeenCalled();
  });

  it("uploads a new document, hashing before writing to the store", async () => {
    const fd = new FormData();
    fd.set("file", fileWithBytes("invoice.pdf", "pdf-bytes"));
    prismaMock.intakeDocument.findFirst.mockResolvedValue(null);

    await services.uploadIntakeDocument(fd);

    expect(store.hashContent).toHaveBeenCalled();
    expect(store.storeUploadedFile).toHaveBeenCalled();
    expect(prismaMock.intakeDocument.create).toHaveBeenCalled();
  });

  it("rejects an oversized upload before reading its bytes", async () => {
    const file = new File(["x"], "big.pdf", { type: "application/pdf" });
    const arrayBuffer = vi.fn(async () => new TextEncoder().encode("x").buffer);
    Object.defineProperty(file, "arrayBuffer", { value: arrayBuffer });
    Object.defineProperty(file, "size", { value: 21 * 1024 * 1024 });
    const fd = new FormData();
    fd.set("file", file);

    await expect(services.uploadIntakeDocument(fd)).rejects.toThrow(/upload limit/);
    // The oversized file is rejected before its bytes are ever materialized.
    expect(arrayBuffer).not.toHaveBeenCalled();
    expect(store.storeUploadedFile).not.toHaveBeenCalled();
  });

  it("does not store bytes for a duplicate upload", async () => {
    const fd = new FormData();
    fd.set("file", fileWithBytes("invoice.pdf", "pdf-bytes"));
    prismaMock.intakeDocument.findFirst.mockResolvedValue({ id: "existing" });

    await services.uploadIntakeDocument(fd);

    expect(store.storeUploadedFile).not.toHaveBeenCalled();
    expect(prismaMock.intakeDocument.create).not.toHaveBeenCalled();
  });

  it("reads and triages a captured document into TRIAGED", async () => {
    prismaMock.intakeDocument.findUnique.mockResolvedValue({
      id: "d1",
      storedPath: "/store/x.pdf",
      mimeType: "application/pdf",
      originalFilename: "acme-invoice.pdf",
      domain: "UNKNOWN"
    });
    vi.mocked(read.extractDocumentText).mockResolvedValue({ text: "TAX INVOICE ABN GST amount due", engine: "pdftotext" });

    await services.readAndTriageIntakeDocument("d1");

    const updateArg = prismaMock.intakeDocument.updateMany.mock.calls.at(-1)?.[0];
    expect(updateArg.data.status).toBe("TRIAGED");
    expect(updateArg.data.docType).toBe("invoice");
    expect(updateArg.data.domain).toBe("BUSINESS");
    // Writeback is guarded so a concurrently-finalised doc is never resurrected.
    expect(updateArg.where.status).toEqual({ notIn: ["FILED", "ARCHIVED", "REJECTED"] });
  });

  it("preserves a human-locked domain when re-triaging (domain != suggestedDomain)", async () => {
    prismaMock.intakeDocument.findUnique.mockResolvedValue({
      id: "d1",
      storedPath: "/store/x.pdf",
      mimeType: "application/pdf",
      originalFilename: "acme-invoice.pdf",
      domain: "PERSONAL",
      suggestedDomain: "UNKNOWN"
    });
    vi.mocked(read.extractDocumentText).mockResolvedValue({ text: "tax invoice abn gst", engine: "pdftotext" });

    await services.readAndTriageIntakeDocument("d1");

    const updateArg = prismaMock.intakeDocument.updateMany.mock.calls.at(-1)?.[0];
    expect(updateArg.data.domain).toBe("PERSONAL");
    expect(updateArg.data.suggestedDomain).toBe("BUSINESS");
  });

  it("updates a heuristic-set domain on re-read (domain == suggestedDomain)", async () => {
    prismaMock.intakeDocument.findUnique.mockResolvedValue({
      id: "d1",
      storedPath: "/store/x.pdf",
      mimeType: "application/pdf",
      originalFilename: "acme-invoice.pdf",
      domain: "PERSONAL",
      suggestedDomain: "PERSONAL"
    });
    vi.mocked(read.extractDocumentText).mockResolvedValue({ text: "tax invoice abn gst", engine: "pdftotext" });

    await services.readAndTriageIntakeDocument("d1");

    const updateArg = prismaMock.intakeDocument.updateMany.mock.calls.at(-1)?.[0];
    expect(updateArg.data.domain).toBe("BUSINESS");
  });

  it("marks a failed read as FAILED", async () => {
    prismaMock.intakeDocument.findUnique.mockResolvedValue({
      id: "d1",
      storedPath: "/store/x.pdf",
      mimeType: "application/pdf",
      originalFilename: "x.pdf",
      domain: "UNKNOWN"
    });
    vi.mocked(read.extractDocumentText).mockRejectedValue(new Error("boom"));

    await services.readAndTriageIntakeDocument("d1");

    const updateArg = prismaMock.intakeDocument.updateMany.mock.calls.at(-1)?.[0];
    expect(updateArg.data.status).toBe("FAILED");
  });

  it("approves a triaged document into an action via an atomic claim", async () => {
    prismaMock.intakeDocument.updateMany.mockResolvedValue({ count: 1 });

    await services.approveIntakeDocument(form({ intakeId: "d1", title: "Pay invoice", domain: "BUSINESS" }), "user-1");

    const claimArg = prismaMock.intakeDocument.updateMany.mock.calls.at(-1)?.[0];
    expect(claimArg.data.status).toBe("FILED");
    expect(prismaMock.action.create).toHaveBeenCalled();
    const updateArg = prismaMock.intakeDocument.update.mock.calls.at(-1)?.[0];
    expect(updateArg.data.actionId).toBe("action-1");
  });

  it("does not create an action when the claim matches nothing (already finalized)", async () => {
    prismaMock.intakeDocument.updateMany.mockResolvedValue({ count: 0 });

    await services.approveIntakeDocument(form({ intakeId: "d1", title: "Pay invoice", domain: "BUSINESS" }), "user-1");

    expect(prismaMock.action.create).not.toHaveBeenCalled();
  });

  it("files a document for records without creating an action", async () => {
    prismaMock.intakeDocument.updateMany.mockResolvedValue({ count: 1 });

    await services.fileIntakeDocument(form({ intakeId: "d1", domain: "PERSONAL" }), "user-1");

    const arg = prismaMock.intakeDocument.updateMany.mock.calls.at(-1)?.[0];
    expect(arg.data.status).toBe("FILED");
    expect(arg.data.disposition).toBe("FILE");
    expect(prismaMock.action.create).not.toHaveBeenCalled();
  });

  it("refuses to file an already-finalized document", async () => {
    prismaMock.intakeDocument.updateMany.mockResolvedValue({ count: 0 });

    await expect(services.fileIntakeDocument(form({ intakeId: "d1", domain: "PERSONAL" }), "user-1")).rejects.toThrow(/already been filed/);
  });

  it("refuses to re-read a finalized document", async () => {
    prismaMock.intakeDocument.findUnique.mockResolvedValue({
      id: "d1",
      storedPath: "/store/x.pdf",
      mimeType: "application/pdf",
      originalFilename: "x.pdf",
      domain: "BUSINESS",
      status: "ARCHIVED"
    });

    await expect(services.readAndTriageIntakeDocument("d1")).rejects.toThrow(/already been filed/);
  });

  it("archives a pending document and rejects re-archiving a finalised one", async () => {
    prismaMock.intakeDocument.findUnique.mockResolvedValue({ status: "TRIAGED", storedPath: "/store/x.pdf", domain: "BUSINESS" });
    await services.archiveIntakeDocument(form({ intakeId: "d1" }), "user-1");
    expect(store.moveToArchive).toHaveBeenCalledWith("/store/x.pdf");

    prismaMock.intakeDocument.findUnique.mockResolvedValue({ status: "ARCHIVED", storedPath: "/x", domain: "BUSINESS" });
    await expect(services.archiveIntakeDocument(form({ intakeId: "d1" }), "user-1")).rejects.toThrow(/already been filed/);
  });

  it("rejects a document and updates the intake domain", async () => {
    prismaMock.intakeDocument.updateMany.mockResolvedValue({ count: 1 });
    await services.rejectIntakeDocument(form({ intakeId: "d1" }), "user-1");
    expect(prismaMock.intakeDocument.updateMany.mock.calls.at(-1)?.[0].data.status).toBe("REJECTED");

    prismaMock.intakeDocument.findUnique.mockResolvedValue({ suggestedAction: { domain: "UNKNOWN", title: "x" } });
    prismaMock.intakeDocument.updateMany.mockResolvedValue({ count: 1 });
    await services.setIntakeDomain(form({ intakeId: "d1", domain: "PERSONAL" }));
    expect(prismaMock.intakeDocument.updateMany.mock.calls.at(-1)?.[0].data.domain).toBe("PERSONAL");
  });

  it("refuses to reject an already-finalized document", async () => {
    prismaMock.intakeDocument.updateMany.mockResolvedValue({ count: 0 });
    await expect(services.rejectIntakeDocument(form({ intakeId: "d1" }), "user-1")).rejects.toThrow(/already been filed/);
  });

  it("runs the document intake triage automation on approval", async () => {
    prismaMock.automation.findUnique.mockResolvedValue({
      id: "auto-di",
      name: "Document intake triage",
      safetyLevel: "APPROVAL_REQUIRED",
      status: "ACTIVE",
      trigger: "Manual scan triage",
      targetTool: "local cockpit"
    });

    await services.runAutomation("auto-di", true, "user-1");

    expect(store.collectInboxCandidates).toHaveBeenCalled();
    const runArg = prismaMock.automationRun.create.mock.calls.at(-1)?.[0];
    expect(runArg.data.status).toBe("SUCCESS");
    expect(runArg.data.responseSummary).toContain("Document intake triage");
  });
});
