import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { draftActionFromQuickCapture } from "./ollama";

function mockFetchOnce(handler: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const fetchMock = vi.fn((url: string, init: RequestInit) => Promise.resolve(handler(url, init)));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function jsonResponse(body: unknown, init?: { status?: number; ok?: boolean }) {
  return {
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    json: async () => body
  } as unknown as Response;
}

describe("draftActionFromQuickCapture", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("structures a successful local model response into a ready draft", async () => {
    const assistantOutput = JSON.stringify({
      title: "Call the Perth venue about invoicing",
      priority: "HIGH",
      stream: "DromaiosEd",
      companyFunction: "delivery"
    });
    const fetchMock = mockFetchOnce(() => jsonResponse({ response: assistantOutput }));

    const result = await draftActionFromQuickCapture("Ring the venue next week and ask if they need an invoice");

    expect(result.provider).toBe("OLLAMA");
    expect(result.model).toBe("gemma3:1b");
    expect(result.error).toBeUndefined();
    expect(result.rawOutput).toBe(assistantOutput);
    expect(result.draft.state).toBe("READY");
    expect(result.draft.proposedAction.title).toBe("Call the Perth venue about invoicing");
    expect(result.draft.proposedAction.priority).toBe("HIGH");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:11434/api/generate");
    expect(init.method).toBe("POST");
    const body = JSON.parse(String(init.body));
    expect(body.model).toBe("gemma3:1b");
    expect(body.stream).toBe(false);
    expect(body.format).toBe("json");
    expect(body.prompt).toContain("Ring the venue next week and ask if they need an invoice");
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("honours OLLAMA_MODEL and OLLAMA_BASE_URL overrides", async () => {
    vi.stubEnv("OLLAMA_MODEL", "llama3:8b");
    vi.stubEnv("OLLAMA_BASE_URL", "http://ollama.internal:9000");
    const fetchMock = mockFetchOnce(() => jsonResponse({ response: JSON.stringify({ title: "Renew the domain" }) }));

    const result = await draftActionFromQuickCapture("renew domain");

    expect(result.model).toBe("llama3:8b");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://ollama.internal:9000/api/generate");
    expect(JSON.parse(String(init.body)).model).toBe("llama3:8b");
  });

  it("returns a failed draft with an HTTP error when the model server rejects the request", async () => {
    mockFetchOnce(() => jsonResponse({}, { ok: false, status: 503 }));

    const result = await draftActionFromQuickCapture("draft a follow-up");

    expect(result.error).toBe("Ollama returned HTTP 503.");
    expect(result.rawOutput).toBe("");
    expect(result.draft.state).toBe("FAILED");
    expect(result.draft.proposedAction.title).toBe("draft a follow-up");
  });

  it("returns a failed draft when the request throws (model server unreachable)", async () => {
    mockFetchOnce(() => {
      throw new Error("connect ECONNREFUSED 127.0.0.1:11434");
    });

    const result = await draftActionFromQuickCapture("capture a quick note");

    expect(result.error).toBe("connect ECONNREFUSED 127.0.0.1:11434");
    expect(result.rawOutput).toBe("");
    expect(result.draft.state).toBe("FAILED");
    expect(result.draft.proposedAction.title).toBe("capture a quick note");
  });

  it("keeps the raw output but marks the draft failed when the model returns non-JSON", async () => {
    mockFetchOnce(() => jsonResponse({ response: "I cannot help with that." }));

    const result = await draftActionFromQuickCapture("something ambiguous");

    expect(result.error).toBeUndefined();
    expect(result.rawOutput).toBe("I cannot help with that.");
    expect(result.draft.state).toBe("FAILED");
    expect(result.draft.proposedAction.title).toBe("something ambiguous");
  });

  it("falls back to a default title when the source note is empty and the model fails", async () => {
    mockFetchOnce(() => jsonResponse({}, { ok: false, status: 500 }));

    const result = await draftActionFromQuickCapture("   ");

    expect(result.draft.state).toBe("FAILED");
    expect(result.draft.proposedAction.title).toBe("Untitled captured action");
  });
});
