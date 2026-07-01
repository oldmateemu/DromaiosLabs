import { normaliseQuickCaptureDraft } from "./domain";
import { parseIntakeExtraction, type IntakeExtraction } from "./document-intake";

const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";
const DEFAULT_OLLAMA_MODEL = "gemma3:1b";

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

export async function draftActionFromQuickCapture(sourceText: string) {
  const { baseUrl, model, prompt } = buildQuickCaptureDraftRequest(sourceText);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false, format: "json" }),
      signal: controller.signal
    });

    if (!response.ok) {
      return {
        model,
        provider: "OLLAMA" as const,
        prompt,
        rawOutput: "",
        draft: normaliseQuickCaptureDraft(sourceText, ""),
        error: `Ollama returned HTTP ${response.status}.`
      };
    }

    const payload = (await response.json()) as { response?: string };
    const rawOutput = payload.response ?? "";
    return {
      model,
      provider: "OLLAMA" as const,
      prompt,
      rawOutput,
      draft: normaliseQuickCaptureDraft(sourceText, rawOutput),
      error: undefined
    };
  } catch (error) {
    return {
      model,
      provider: "OLLAMA" as const,
      prompt,
      rawOutput: "",
      draft: normaliseQuickCaptureDraft(sourceText, ""),
      error: error instanceof Error ? error.message : "Ollama request failed."
    };
  } finally {
    // Always clear the abort timer, including the throw path, so a failed
    // request never leaves a 45s timer pending (which would keep the process
    // or a test worker alive).
    clearTimeout(timeout);
  }
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false, format: "json" }),
      signal: controller.signal
    });

    if (!response.ok) {
      return { model, provider: "OLLAMA", prompt, rawOutput: "", error: `Ollama returned HTTP ${response.status}.` };
    }

    const payload = (await response.json()) as { response?: string };
    const rawOutput = payload.response ?? "";
    const { extraction, error } = parseIntakeExtraction(rawOutput);
    return { model, provider: "OLLAMA", prompt, rawOutput, extraction, error };
  } catch (error) {
    return {
      model,
      provider: "OLLAMA",
      prompt,
      rawOutput: "",
      error: error instanceof Error ? error.message : "Ollama request failed."
    };
  } finally {
    clearTimeout(timeout);
  }
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
