import {
  approveIntakeDocumentAction,
  archiveIntakeDocumentAction,
  fileIntakeDocumentAction,
  ingestIntakeFolderAction,
  readIntakeDocumentAction,
  rejectIntakeDocumentAction,
  setIntakeDomainAction,
  uploadIntakeDocumentAction
} from "@/app/actions";
import { getIntakeQueueData } from "@/lib/services";
import { IntakeSourceText } from "./source-text";

export const dynamic = "force-dynamic";

const DOMAINS = ["BUSINESS", "PERSONAL", "MIXED", "UNKNOWN"] as const;

function sourceLabel(source: string) {
  if (source === "FOLDER") return "Scanned folder";
  if (source === "EMAIL") return "Emailed";
  if (source === "UPLOAD") return "Uploaded";
  return source;
}

function domainLabel(domain: string) {
  return domain.charAt(0) + domain.slice(1).toLowerCase();
}

function dayKey(value: Date | string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

export default async function IntakePage({ searchParams }: { searchParams: Promise<{ skippedOversize?: string }> }) {
  const [{ pending, history, summary, streams, companyFunctions }, params] = await Promise.all([getIntakeQueueData(), searchParams]);
  const skippedOversize = Number(params.skippedOversize) || 0;

  return (
    <div className="space-y-6">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Document pathway</p>
          <h1>Intake &amp; Triage</h1>
        </div>
        <p className="muted max-w-2xl">
          Scan, upload, or email a document. It is read locally (OCR + Ollama), triaged into a Business or Personal
          domain with a proposed action, and held here for you to approve, file, or archive. Nothing leaves the box and
          no action is created until you say so.
        </p>
      </div>

      {skippedOversize > 0 ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-command-amber">
          {skippedOversize} file{skippedOversize === 1 ? "" : "s"} over the 20MB limit {skippedOversize === 1 ? "was" : "were"} skipped and left in
          the watched folder. Split or compress the document, then run ingest again.
        </p>
      ) : null}

      <section className="panel">
        <p className="eyebrow">Pipeline</p>
        <p className="muted mt-1">Scan / upload / email → captured → read &amp; triage → your review → action, file, or archive.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="meta-pill">{summary.pending} in queue</span>
          {summary.needsReview > 0 ? <span className="status-pill status-high">{summary.needsReview} need review</span> : null}
          <span className="meta-pill">{summary.captured} captured</span>
          <span className="meta-pill">Business {summary.byDomain.BUSINESS}</span>
          <span className="meta-pill">Personal {summary.byDomain.PERSONAL}</span>
          {summary.byDomain.MIXED > 0 ? <span className="meta-pill">Mixed {summary.byDomain.MIXED}</span> : null}
          {summary.failed > 0 ? <span className="status-pill status-high">{summary.failed} read failed</span> : null}
          <span className="meta-pill">{summary.filed} filed</span>
          <span className="meta-pill">{summary.archived} archived</span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="panel">
          <p className="eyebrow">Scanned / emailed</p>
          <h2 className="text-base font-semibold text-command-ink">Pull from watched folders</h2>
          <p className="muted mt-1">
            Ingests new files from the intake <code>inbox/scan</code> and <code>inbox/email</code> folders, deduplicating
            by content. Files become captured documents ready to read.
          </p>
          <form action={ingestIntakeFolderAction} className="mt-3">
            <button className="button button-secondary" type="submit">Ingest scanned folder</button>
          </form>
        </div>

        <div className="panel">
          <p className="eyebrow">Direct</p>
          <h2 className="text-base font-semibold text-command-ink">Upload a document</h2>
          <p className="muted mt-1">Drag in a PDF or photo of a document (works from your phone over VPN).</p>
          <form action={uploadIntakeDocumentAction} className="mt-3 flex flex-col gap-3">
            <input aria-label="Choose a document to upload" className="input" name="file" type="file" accept=".pdf,image/*" required />
            <div className="flex justify-end">
              <button className="button button-primary" type="submit">Upload to queue</button>
            </div>
          </form>
        </div>
      </section>

      <section className="space-y-4">
        <div className="panel">
          <p className="eyebrow">Needs judgement</p>
          <h2>{pending.length} documents in the queue</h2>
          <p className="muted mt-1">Read captured documents, then approve into an action, file, or archive each one.</p>
        </div>

        {pending.map((doc) => {
          const suggested = (doc.suggestedAction as Record<string, unknown> | null) ?? {};
          const field = (key: string, fallback = "") => (typeof suggested[key] === "string" ? String(suggested[key]) : fallback);
          const captured = doc.status === "CAPTURED";

          return (
            <article className="panel border-l-4 border-l-command-amber" key={doc.id}>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">
                    {sourceLabel(doc.source)} · {dayKey(doc.capturedAt)}
                    {doc.docType ? ` · ${doc.docType}` : ""}
                  </p>
                  <h2>{field("title", doc.originalFilename)}</h2>
                  <p className="muted">{doc.originalFilename}</p>
                </div>
                <span className="status-pill status-draft">{doc.status}</span>
              </div>

              <div className="mb-3 flex flex-wrap gap-2">
                <span className="meta-pill">Domain: {domainLabel(doc.domain)}</span>
                {doc.domainConfidence != null ? <span className="meta-pill">confidence {doc.domainConfidence}</span> : null}
                {doc.disposition ? <span className="meta-pill">{doc.disposition.toLowerCase()}</span> : null}
              </div>

              {doc.summary ? <p className="muted mb-3">{doc.summary}</p> : null}
              {doc.triageNote ? (
                <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-command-amber">{doc.triageNote}</p>
              ) : null}

              {captured ? (
                <div className="flex flex-wrap gap-2">
                  <form action={readIntakeDocumentAction}>
                    <input name="intakeId" type="hidden" value={doc.id} />
                    <button className="button button-primary" type="submit">Read &amp; triage</button>
                  </form>
                  {DOMAINS.slice(0, 2).map((domain) => (
                    <form action={setIntakeDomainAction} key={domain}>
                      <input name="intakeId" type="hidden" value={doc.id} />
                      <input name="domain" type="hidden" value={domain} />
                      <button className="button button-secondary" type="submit">Mark {domainLabel(domain)}</button>
                    </form>
                  ))}
                  <form action={rejectIntakeDocumentAction}>
                    <input name="intakeId" type="hidden" value={doc.id} />
                    <button className="button button-secondary" type="submit">Reject</button>
                  </form>
                </div>
              ) : (
                <>
                  <form action={approveIntakeDocumentAction} className="grid gap-3 md:grid-cols-2">
                    <input name="intakeId" type="hidden" value={doc.id} />
                    <label className="field-label md:col-span-2">
                      Title
                      <input className="input mt-1" name="title" defaultValue={field("title", doc.originalFilename)} required />
                    </label>
                    <label className="field-label">
                      Domain (Business / Personal)
                      <select className="select mt-1" name="domain" defaultValue={doc.domain}>
                        {DOMAINS.map((domain) => (
                          <option key={domain} value={domain}>
                            {domainLabel(domain)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field-label">
                      Priority
                      <select className="select mt-1" name="priority" defaultValue={field("priority", "MEDIUM")}>
                        {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((priority) => (
                          <option key={priority}>{priority}</option>
                        ))}
                      </select>
                    </label>
                    <label className="field-label">
                      Stream (business only)
                      <input className="input mt-1" name="stream" defaultValue={field("stream")} list="intake-streams" />
                    </label>
                    <label className="field-label">
                      Company function (business only)
                      <input className="input mt-1" name="companyFunction" defaultValue={field("companyFunction")} list="intake-functions" />
                    </label>
                    <label className="field-label">
                      Status
                      <select className="select mt-1" name="status" defaultValue="OPEN">
                        {["OPEN", "IN_PROGRESS", "BLOCKED", "WAITING"].map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </label>
                    <label className="field-label">
                      Due date
                      <input className="input mt-1" name="dueDate" type="date" defaultValue={field("dueDate")} />
                    </label>
                    <label className="field-label md:col-span-2">
                      Next step
                      <input className="input mt-1" name="nextStep" defaultValue={field("nextStep")} />
                    </label>
                    <label className="field-label md:col-span-2">
                      Description
                      <textarea className="text-area mt-1" name="description" rows={3} defaultValue={field("description")} />
                    </label>
                    <label className="field-label md:col-span-2">
                      Reviewer note
                      <input className="input mt-1" name="reviewerNote" placeholder="Optional note recorded against this document" />
                    </label>
                    <label className="flex items-center gap-2 text-sm text-command-muted">
                      <input name="sensitive" type="checkbox" defaultChecked={suggested.sensitive !== false} />
                      Sensitive
                    </label>
                    <div className="flex justify-end md:col-span-2">
                      <button className="button button-primary" type="submit">Approve into action</button>
                    </div>
                  </form>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={readIntakeDocumentAction}>
                      <input name="intakeId" type="hidden" value={doc.id} />
                      <button className="button button-secondary" type="submit">Re-read</button>
                    </form>
                    <form action={fileIntakeDocumentAction} className="flex items-center gap-1">
                      <input name="intakeId" type="hidden" value={doc.id} />
                      <select aria-label="Domain for filing" className="select" name="domain" defaultValue={doc.domain}>
                        {DOMAINS.map((domain) => (
                          <option key={domain} value={domain}>
                            {domainLabel(domain)}
                          </option>
                        ))}
                      </select>
                      <button className="button button-secondary" type="submit">File for records</button>
                    </form>
                    <form action={archiveIntakeDocumentAction} className="flex items-center gap-1">
                      <input name="intakeId" type="hidden" value={doc.id} />
                      <select aria-label="Domain for archiving" className="select" name="domain" defaultValue={doc.domain}>
                        {DOMAINS.map((domain) => (
                          <option key={domain} value={domain}>
                            {domainLabel(domain)}
                          </option>
                        ))}
                      </select>
                      <button className="button button-secondary" type="submit">Archive</button>
                    </form>
                    <form action={rejectIntakeDocumentAction}>
                      <input name="intakeId" type="hidden" value={doc.id} />
                      <button className="button button-secondary" type="submit">Reject</button>
                    </form>
                  </div>

                  <IntakeSourceText intakeId={doc.id} />
                </>
              )}
            </article>
          );
        })}

        {pending.length === 0 ? (
          <p className="empty-state">Queue is clear. Scan to the watched folder, upload a document, or run the Document intake triage automation.</p>
        ) : null}
      </section>

      <datalist id="intake-streams">
        {streams.map((stream) => (
          <option key={stream.id} value={stream.name} />
        ))}
      </datalist>
      <datalist id="intake-functions">
        {companyFunctions.map((fn) => (
          <option key={fn.id} value={fn.name} />
        ))}
      </datalist>

      <section className="panel">
        <p className="eyebrow">History</p>
        <h2>Filed, archived &amp; rejected</h2>
        <div className="mt-4 space-y-2">
          {history.map((doc) => (
            <article className="action-row" key={doc.id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium text-command-ink">{doc.action?.title ?? doc.originalFilename}</p>
                  <p className="muted">
                    {sourceLabel(doc.source)} · {domainLabel(doc.domain)} · {dayKey(doc.reviewedAt)}
                    {doc.reviewerNote ? ` · ${doc.reviewerNote}` : ""}
                  </p>
                </div>
                <span className="status-pill status-approved">{doc.status}</span>
              </div>
            </article>
          ))}
          {history.length === 0 ? <p className="empty-state">No filed or archived documents yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
