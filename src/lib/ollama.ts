import { normaliseQuickCaptureDraft } from "./domain";

const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";
const DEFAULT_OLLAMA_MODEL = "gemma3:1b";

export async function draftActionFromQuickCapture(sourceText: string) {
  const model = process.env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL;
  const baseUrl = process.env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_BASE_URL;
  const prompt = [
    "You are structuring a rough company operating note for Dromaios Cockpit.",
    "Return only JSON with these fields: title, description, stream, companyFunction, priority, status, dueDate, reviewDate, nextStep, sensitive.",
    "Use priority LOW, MEDIUM, HIGH, or CRITICAL. Use status OPEN, IN_PROGRESS, BLOCKED, or WAITING.",
    "Use YYYY-MM-DD dates when a date is clearly implied; omit date fields when unsure.",
    `Rough note: ${sourceText}`
  ].join("\n");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false, format: "json" }),
      signal: controller.signal
    });
    clearTimeout(timeout);

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
  }
}
