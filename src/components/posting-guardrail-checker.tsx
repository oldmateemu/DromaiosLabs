"use client";

import { Ban, Clipboard, Search, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { humanizeEnum } from "@/lib/domain";
import {
  checkPublicPostingDraft,
  type PostingGuardrailFlag,
  type PostingGuardrailResult,
  type PostingGuardrailSeverity
} from "@/lib/posting-guardrail";

export function PostingGuardrailChecker() {
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<PostingGuardrailResult | null>(null);
  const [copied, setCopied] = useState(false);
  const canCheck = draft.trim().length > 0;

  function handleCheck() {
    setResult(checkPublicPostingDraft(draft));
    setCopied(false);
  }

  async function copyRewrite() {
    if (!result?.suggestedRewrite) return;
    await navigator.clipboard.writeText(result.suggestedRewrite);
    setCopied(true);
  }

  return (
    <section className="panel panel-muted">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Public copy guardrail</p>
          <h2>Draft Posting Checker</h2>
          <p className="muted max-w-2xl">
            Paste draft LinkedIn, website, or founder copy. The checker flags guardrail risks and produces review copy only.
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <span className="status-pill status-draft">Draft Only</span>
          <button className="button button-secondary" disabled type="button">
            <Ban aria-hidden="true" size={16} />
            No publish action
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="space-y-3">
          <label className="field-label" htmlFor="posting-draft">
            Draft post or website snippet
          </label>
          <textarea
            className="text-area min-h-72"
            id="posting-draft"
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Paste public draft copy here..."
            value={draft}
          />
          <div className="flex flex-wrap gap-2">
            <button className="button button-primary" disabled={!canCheck} onClick={handleCheck} type="button">
              <Search aria-hidden="true" size={16} />
              Check draft
            </button>
            <button className="button button-secondary" disabled={!result?.suggestedRewrite} onClick={copyRewrite} type="button">
              <Clipboard aria-hidden="true" size={16} />
              {copied ? "Rewrite copied" : "Copy rewrite"}
            </button>
          </div>
          <p className="muted">
            Local draft review only: this does not post, schedule, submit, or send copy to an external publishing tool.
          </p>
        </div>

        <div className="space-y-4">
          {result ? <PostingGuardrailResultView result={result} /> : <EmptyCheckerState />}
        </div>
      </div>
    </section>
  );
}

function EmptyCheckerState() {
  return (
    <div className="empty-state flex items-start gap-3">
      <ShieldAlert aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
      <span>Paste draft public copy, then check it before any separate manual publishing step.</span>
    </div>
  );
}

function PostingGuardrailResultView({ result }: { result: PostingGuardrailResult }) {
  return (
    <>
      <div className="action-row">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">Review result</p>
            <h3>Guardrail status</h3>
            <p className="muted">{result.flags.length === 0 ? "No red or amber claims were detected." : `${result.flags.length} claim flags need review.`}</p>
          </div>
          <span className={severityClass(result.overallSeverity)}>{humanizeEnum(result.overallSeverity)}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="meta-pill">Safety: {humanizeEnum(result.safetyLevel)}</span>
          <span className="meta-pill">Publishing: disabled</span>
        </div>
      </div>

      {result.flags.length > 0 ? (
        <div className="space-y-2">
          {result.flags.map((flag) => (
            <FlagRow flag={flag} key={flag.id} />
          ))}
        </div>
      ) : (
        <p className="empty-state">Still review manually before posting. This checker is a draft aid, not legal, trademark, patent, or TGA advice.</p>
      )}

      <div className="action-row">
        <p className="eyebrow">Review copy</p>
        <h3>Suggested softened rewrite</h3>
        <div className="mt-3 whitespace-pre-wrap rounded-md border border-command-line bg-command-panel p-3 text-sm leading-6 text-command-ink" data-testid="softened-rewrite">
          {result.suggestedRewrite}
        </div>
      </div>
    </>
  );
}

function FlagRow({ flag }: { flag: PostingGuardrailFlag }) {
  return (
    <article className="action-row border-l-4 border-l-command-amber">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={severityClass(flag.severity)}>{humanizeEnum(flag.severity)}</span>
            <span className="meta-pill">{flag.category}</span>
          </div>
          <p className="mt-2 text-sm font-medium text-command-ink">{flag.guidance}</p>
          <p className="muted mt-1">Matched draft wording: {flag.matchedText}</p>
        </div>
      </div>
    </article>
  );
}

function severityClass(severity: PostingGuardrailSeverity) {
  if (severity === "RED") return "status-pill status-high";
  if (severity === "AMBER") return "status-pill status-draft";
  return "status-pill status-approved";
}
