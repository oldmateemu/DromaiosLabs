import { normaliseQuickCaptureDraft } from "./domain";
import { parseIntakeExtraction, type IntakeExtraction } from "./document-intake";

const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";
const DEFAULT_OLLAMA_MODEL = "gemma3:1b";

// Ollama endpoints treated as "on the box": loopback and the Docker host alias
// (Ollama running on the same physical host as the container). Anything else —
// e.g. a VPN IP pointing at another machine — is off-box.
const ON_BOX_OLLAMA_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]", "host.docker.internal"]);

/**
 * True when the Ollama base URL points at this machine. Used to keep intake
 * document text on the box: OCR'd invoices/medical/ID text must not be sent to a
 * remote Ollama unless the operator explicitly opts in.
 */
export function isOnBoxOllamaUrl(baseUrl: string): boolean {
  try {
    return ON_BOX_OLLAMA_HOSTS.has(new URL(baseUrl).hostname.toLowerCase());
  } catch {
    return false; // Unparseable URL: fail safe (treat as off-box).
  }
}

export function buildQuickCaptureDraftRequest(sourceText: string) {
  const model = process.env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL;
  const baseUrl = process.env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_BASE_URL;
  const localDate = currentLocalDateKey();
  const prompt = [
    "You are structuring a rough company operating note for Dromaios Cockpit.",
    `Today's local date is ${localDate}. Resolve relative dates like tomorrow from that date.`,
    "Return only JSON with these fields: title, description, stream, companyFunction, priority, status, dueDate, reviewDate, nextStep, sensitive.",
    "Use priority LOW, MEDIUM, HIGH, or CRITICAL. Use status OPEN, IN_PROGRESS, BLOCKED, or WAITING.",
    "Use YYYY-MM-DD dates when a date is clearly implied; omit date fields when unsure. Do not return empty strings for omitted fields.",
    `Rough note: ${sourceText}`
  ].join("\n");

  return { baseUrl, model, prompt };
}

/**
 * Shared local-Ollama call: POSTs a JSON-format generate request with an abort
 * timeout and uniform error handling. Both quick-capture drafting and document
 * intake extraction use this so request behaviour stays consistent in one place.
 * The abort timer is always cleared (including the throw path) so a failed
 * request never leaves a pending timer keeping the process/test worker alive.
 */
async function callOllamaGenerate({
  baseUrl,
  model,
  prompt,
  timeoutMs
}: {
  baseUrl: string;
  model: string;
  prompt: string;
  timeoutMs: number;
}): Promise<{ rawOutput: string; error?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false, format: "json" }),
      signal: controller.signal
    });

    if (!response.ok) {
      return { rawOutput: "", error: `Ollama returned HTTP ${response.status}.` };
    }

    const payload = (await response.json()) as { response?: string };
    return { rawOutput: payload.response ?? "" };
  } catch (error) {
    return { rawOutput: "", error: error instanceof Error ? error.message : "Ollama request failed." };
  } finally {
    clearTimeout(timeout);
  }
}

export async function draftActionFromQuickCapture(sourceText: string) {
  const { baseUrl, model, prompt } = buildQuickCaptureDraftRequest(sourceText);
  const { rawOutput, error } = await callOllamaGenerate({ baseUrl, model, prompt, timeoutMs: 45_000 });

  return {
    model,
    provider: "OLLAMA" as const,
    prompt,
    rawOutput,
    draft: normaliseQuickCaptureDraft(sourceText, rawOutput),
    error
  };
}

export type IntakeExtractionResult = {
  model: string;
  provider: "OLLAMA";
  prompt: string;
  rawOutput: string;
  extraction?: IntakeExtraction;
  error?: string;
};

/**
 * Asks the local Ollama model to extract structured fields from already-OCR'd
 * document text. Local-only by design: this never sends document text to a
 * cloud provider. Output is a draft proposal; it is reconciled with the
 * heuristic triage and held for human approval, never acted on automatically.
 */
export async function extractIntakeFieldsFromDocument(text: string, filename: string): Promise<IntakeExtractionResult> {
  const model = process.env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL;
  const baseUrl = process.env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_BASE_URL;

  // Privacy guarantee: intake document text stays on the box. If OLLAMA_BASE_URL
  // points off-box, skip AI extraction rather than send OCR'd invoices/medical/ID
  // text to another machine — the heuristic triage still runs and stands on its
  // own. Operators who run a self-hosted Ollama elsewhere on their VPN can opt in
  // with INTAKE_ALLOW_REMOTE_OLLAMA=true.
  if (process.env.INTAKE_ALLOW_REMOTE_OLLAMA !== "true" && !isOnBoxOllamaUrl(baseUrl)) {
    return {
      model,
      provider: "OLLAMA",
      prompt: "",
      rawOutput: "",
      error: "AI extraction skipped: OLLAMA_BASE_URL is off-box and INTAKE_ALLOW_REMOTE_OLLAMA is not set. Heuristic triage was used to keep document text on the box."
    };
  }

  const localDate = currentLocalDateKey();
  const trimmed = text.slice(0, 8000);
  const prompt = [
    "You are reading a scanned business or personal document for Dromaios Cockpit.",
    `Today's local date is ${localDate}. Resolve relative dates from that date.`,
    "Return only JSON with these optional fields: summary, docType, domain, party, amount, documentDate, dueDate, suggestedTitle, suggestedNextStep, sensitive.",
    "domain must be BUSINESS, PERSONAL, MIXED, or UNKNOWN. Use BUSINESS for company/finance/supplier/client documents and PERSONAL for household, medical, vehicle, school, or private finance documents.",
    "Use YYYY-MM-DD for documentDate and dueDate only when clearly stated; omit otherwise. Do not invent values. Keep summary under 80 words.",
    "Set sensitive to true for anything financial, legal, medical, identity, or client/patient related.",
    `Filename: ${filename}`,
    `Document text:\n${trimmed}`
  ].join("\n");

  const { rawOutput, error } = await callOllamaGenerate({ baseUrl, model, prompt, timeoutMs: 60_000 });
  if (error) {
    return { model, provider: "OLLAMA", prompt, rawOutput: "", error };
  }

  const { extraction, error: parseError } = parseIntakeExtraction(rawOutput);
  return { model, provider: "OLLAMA", prompt, rawOutput, extraction, error: parseError };
}

function currentLocalDateKey() {
  const timeZone = process.env.APP_TIMEZONE ?? "Australia/Sydney";
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
