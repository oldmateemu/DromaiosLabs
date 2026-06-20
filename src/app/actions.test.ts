import { ActionStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, servicesMock, redirectMock } = vi.hoisted(() => ({
  authMock: {
    loginWithPassword: vi.fn(),
    logout: vi.fn(),
    requireUser: vi.fn()
  },
  servicesMock: {
    approveAssistantDraft: vi.fn(),
    completeWeeklyReview: vi.fn(),
    createActionFromForm: vi.fn(),
    createAutomation: vi.fn(),
    createLaunchpadLink: vi.fn(),
    createQuickCaptureDraft: vi.fn(),
    prepareDraftAutomation: vi.fn(),
    runAutomation: vi.fn(),
    updateActionStatus: vi.fn()
  },
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  })
}));

vi.mock("@/lib/auth", () => authMock);
vi.mock("@/lib/services", () => servicesMock);
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

const actions = await import("./actions");

function form(values: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(values)) fd.set(key, value);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.requireUser.mockResolvedValue({ id: "user-1" });
});

describe("loginAction", () => {
  it("redirects home on success", async () => {
    authMock.loginWithPassword.mockResolvedValue({ ok: true });

    await expect(actions.loginAction(form({ email: "a@b.c", password: "pw" }))).rejects.toThrow("REDIRECT:/");
    expect(authMock.loginWithPassword).toHaveBeenCalledWith("a@b.c", "pw");
  });

  it("redirects back with an error flag on failure", async () => {
    authMock.loginWithPassword.mockResolvedValue({ ok: false });

    await expect(actions.loginAction(form({ email: "a@b.c", password: "bad" }))).rejects.toThrow("REDIRECT:/login?error=1");
  });
});

describe("logoutAction", () => {
  it("logs out and redirects to login", async () => {
    await expect(actions.logoutAction()).rejects.toThrow("REDIRECT:/login");
    expect(authMock.logout).toHaveBeenCalledTimes(1);
  });
});

describe("authenticated form actions", () => {
  it("quickCaptureAction creates a draft and redirects to it", async () => {
    servicesMock.createQuickCaptureDraft.mockResolvedValue({ id: "draft-9" });

    await expect(actions.quickCaptureAction(form({ text: "rough note" }))).rejects.toThrow("REDIRECT:/assistant?draft=draft-9");
    expect(authMock.requireUser).toHaveBeenCalled();
    expect(servicesMock.createQuickCaptureDraft).toHaveBeenCalledWith("rough note", "user-1");
  });

  it("createActionAction forwards the form and redirects to the register", async () => {
    await expect(actions.createActionAction(form({ title: "Do it" }))).rejects.toThrow("REDIRECT:/actions");
    expect(servicesMock.createActionFromForm).toHaveBeenCalledWith(expect.any(FormData), "user-1");
  });

  it("completeActionAction marks the action DONE", async () => {
    await expect(actions.completeActionAction(form({ actionId: "a-1" }))).rejects.toThrow("REDIRECT:/actions");
    expect(servicesMock.updateActionStatus).toHaveBeenCalledWith("a-1", ActionStatus.DONE);
  });

  it("approveDraftAction approves and redirects to the register", async () => {
    await expect(actions.approveDraftAction(form({ draftId: "d-1", title: "T" }))).rejects.toThrow("REDIRECT:/actions");
    expect(servicesMock.approveAssistantDraft).toHaveBeenCalledWith(expect.any(FormData), "user-1");
  });

  it("createLaunchpadLinkAction creates a link and redirects to launchpad", async () => {
    await expect(actions.createLaunchpadLinkAction(form({ name: "Xero" }))).rejects.toThrow("REDIRECT:/launchpad");
    expect(servicesMock.createLaunchpadLink).toHaveBeenCalledWith(expect.any(FormData));
  });

  it("weeklyReviewAction completes the review and redirects", async () => {
    await expect(actions.weeklyReviewAction(form({ finance: "x" }))).rejects.toThrow("REDIRECT:/reviews");
    expect(servicesMock.completeWeeklyReview).toHaveBeenCalledWith(expect.any(FormData), "user-1");
  });

  it("createAutomationAction registers an automation and redirects", async () => {
    await expect(actions.createAutomationAction(form({ name: "Loop" }))).rejects.toThrow("REDIRECT:/automations");
    expect(servicesMock.createAutomation).toHaveBeenCalledWith(expect.any(FormData));
  });

  it("runAutomationAction passes the parsed approval flag", async () => {
    await expect(actions.runAutomationAction(form({ automationId: "auto-1", approved: "true" }))).rejects.toThrow(
      "REDIRECT:/automations"
    );
    expect(servicesMock.runAutomation).toHaveBeenCalledWith("auto-1", true, "user-1");
  });

  it("runAutomationAction defaults approval to false when not 'true'", async () => {
    await expect(actions.runAutomationAction(form({ automationId: "auto-1" }))).rejects.toThrow("REDIRECT:/automations");
    expect(servicesMock.runAutomation).toHaveBeenCalledWith("auto-1", false, "user-1");
  });

  it("prepareDraftAutomationAction prepares a draft and redirects", async () => {
    await expect(actions.prepareDraftAutomationAction(form({ automationId: "auto-1" }))).rejects.toThrow(
      "REDIRECT:/automations"
    );
    expect(servicesMock.prepareDraftAutomation).toHaveBeenCalledWith("auto-1", "user-1");
  });
});
