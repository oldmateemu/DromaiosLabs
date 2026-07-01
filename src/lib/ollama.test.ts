import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { draftActionFromQuickCapture, extractIntakeFieldsFromDocument } from "./ollama";

const originalEnv = { ...process.env };

type FetchArgs = [input: RequestInfo | URL, init?: RequestInit];

function mockFetchResponse(body: { ok: boolean; status?: number; json?: unknown }) {
  return vi.fn<(...args: FetchArgs) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>>(async () => ({
    ok: body.ok,
    status: body.status ?? (body.ok ? 200 : 500),
    json: async () => body.json ?? {}
  }));
}

beforeEach(() => {
  delete process.env.OLLAMA_MODEL;
  delete process.env.OLLAMA_BASE_URL;
});

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("draftActionFromQuickCapture", () => {
  it("returns a READY draft when Ollama responds with valid structured JSON", async () => {
    const assistantJson = JSON.stringify({ title: "Pay quarterly BAS", priority: "HIGH", status: "OPEN" });
    const fetchMock = mockFetchResponse({ ok: true, json: { response: assistantJson } });
    vi.stubGlobal("fetch", fetchMock);

    const result = await draftActionFromQuickCapture("pay the BAS this week");

    expect(result.provider).toBe("OLLAMA");
    expect(result.model).toBe("gemma3:1b");
    expect(result.error).toBeUndefined();
    expect(result.rawOutput).toBe(assistantJson);
    expect(result.draft.state).toBe("READY");
    expect(result.draft.proposedAction.title).toBe("Pay quarterly BAS");
    expect(result.draft.proposedAction.priority).toBe("HIGH");
  });

  it("posts to the configured base URL and model with JSON format", async () => {
    process.env.OLLAMA_MODEL = "llama3:8b";
    process.env.OLLAMA_BASE_URL = "http://ollama.internal:1234";
    const fetchMock = mockFetchResponse({ ok: true, json: { response: "{}" } });
    vi.stubGlobal("fetch", fetchMock);

    const result = await draftActionFromQuickCapture("something rough");

    expect(result.model).toBe("llama3:8b");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://ollama.internal:1234/api/generate");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({ "content-type": "application/json" });
    const payload = JSON.parse(init?.body as string);
    expect(payload).toMatchObject({ model: "llama3:8b", stream: false, format: "json" });
    expect(payload.prompt).toContain("something rough");
    expect(payload.prompt).toContain("Today's local date is");
    expect(payload.prompt).toContain("Do not return empty strings for omitted fields.");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("falls back to a FAILED draft when Ollama returns a non-OK status", async () => {
    const fetchMock = mockFetchResponse({ ok: false, status: 503 });
    vi.stubGlobal("fetch", fetchMock);

    const result = await draftActionFromQuickCapture("capture this");

    expect(result.error).toBe("Ollama returned HTTP 503.");
    expect(result.rawOutput).toBe("");
    expect(result.draft.state).toBe("FAILED");
    expect(result.draft.proposedAction.title).toBe("capture this");
  });

  it("falls back to a FAILED draft when the request throws", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("connection refused");
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await draftActionFromQuickCapture("offline note");

    expect(result.error).toBe("connection refused");
    expect(result.draft.state).toBe("FAILED");
    expect(result.draft.proposedAction.title).toBe("offline note");
  });

  it("treats malformed assistant JSON as a FAILED draft but keeps the raw output", async () => {
    const fetchMock = mockFetchResponse({ ok: true, json: { response: "not json at all" } });
    vi.stubGlobal("fetch", fetchMock);

    const result = await draftActionFromQuickCapture("note with bad model output");

    expect(result.error).toBeUndefined();
    expect(result.rawOutput).toBe("not json at all");
    expect(result.draft.state).toBe("FAILED");
    expect(result.draft.error).toBeDefined();
  });
});

describe("extractIntakeFieldsFromDocument", () => {
  it("returns a parsed extraction when Ollama responds with valid JSON", async () => {
    const extractionJson = JSON.stringify({ summary: "Supplier invoice", domain: "BUSINESS", amount: "$420.00", dueDate: "2026-07-15" });
    const fetchMock = mockFetchResponse({ ok: true, json: { response: extractionJson } });
    vi.stubGlobal("fetch", fetchMock);

    const result = await extractIntakeFieldsFromDocument("TAX INVOICE ...", "invoice.pdf");

    expect(result.provider).toBe("OLLAMA");
    expect(result.error).toBeUndefined();
    expect(result.extraction?.domain).toBe("BUSINESS");
    expect(result.extraction?.dueDate).toBe("2026-07-15");
  });

  it("posts the document text and filename to the configured model with JSON format", async () => {
    process.env.OLLAMA_BASE_URL = "http://ollama.internal:1234";
    const fetchMock = mockFetchResponse({ ok: true, json: { response: "{}" } });
    vi.stubGlobal("fetch", fetchMock);

    await extractIntakeFieldsFromDocument("rates notice body text", "rates.pdf");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://ollama.internal:1234/api/generate");
    const payload = JSON.parse(init?.body as string);
    expect(payload).toMatchObject({ stream: false, format: "json" });
    expect(payload.prompt).toContain("rates.pdf");
    expect(payload.prompt).toContain("rates notice body text");
  });

  it("reports an error when Ollama returns a non-OK status", async () => {
    const fetchMock = mockFetchResponse({ ok: false, status: 500 });
    vi.stubGlobal("fetch", fetchMock);

    const result = await extractIntakeFieldsFromDocument("text", "doc.pdf");

    expect(result.error).toBe("Ollama returned HTTP 500.");
    expect(result.extraction).toBeUndefined();
  });

  it("reports an error when the request throws", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("connection refused");
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await extractIntakeFieldsFromDocument("text", "doc.pdf");

    expect(result.error).toBe("connection refused");
    expect(result.extraction).toBeUndefined();
  });

  it("surfaces a parse error when the model returns malformed JSON", async () => {
    const fetchMock = mockFetchResponse({ ok: true, json: { response: "not json" } });
    vi.stubGlobal("fetch", fetchMock);

    const result = await extractIntakeFieldsFromDocument("text", "doc.pdf");

    expect(result.rawOutput).toBe("not json");
    expect(result.extraction).toBeUndefined();
    expect(result.error).toBeDefined();
  });
});
