"use client";

import { useState } from "react";
import { getIntakeDocumentTextAction } from "@/app/actions";

type LoadState = "idle" | "loading" | "loaded" | "error";

/**
 * Lets a reviewer inspect the full extracted (OCR + AI) text for a document
 * before approving, filing, or archiving it. The text is loaded on demand so the
 * queue query never carries every document's 200k-character OCR body.
 */
export function IntakeSourceText({ intakeId }: { intakeId: string }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<LoadState>("idle");
  const [text, setText] = useState("");
  const [engine, setEngine] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (state === "loaded") return;
    setState("loading");
    try {
      const result = await getIntakeDocumentTextAction(intakeId);
      setText(result.text);
      setEngine(result.engine);
      setTruncated(result.truncated);
      setState("loaded");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="mt-3">
      <button aria-expanded={open} className="button button-secondary" onClick={toggle} type="button">
        {open ? "Hide extracted text" : "View extracted text"}
      </button>
      {open ? (
        <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3">
          {state === "loading" ? <p className="muted">Loading extracted text…</p> : null}
          {state === "error" ? <p className="muted">Could not load the extracted text. Try re-reading the document.</p> : null}
          {state === "loaded" && text.length === 0 ? (
            <p className="muted">No text was extracted from this document — review the original source before deciding.</p>
          ) : null}
          {state === "loaded" && text.length > 0 ? (
            <>
              <p className="eyebrow mb-2">
                Extracted locally by {engine ?? "unknown"}
                {truncated ? " · truncated to the first 200k characters" : ""}
              </p>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-sm text-command-ink">{text}</pre>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
