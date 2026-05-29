import { approveDraftAction } from "@/app/actions";
import { getAssistantDraftData } from "@/lib/services";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const drafts = await getAssistantDraftData();
  const reviewDrafts = drafts.filter((draft) => draft.state !== "APPROVED");
  const historyDrafts = drafts.filter((draft) => draft.state === "APPROVED");

  return (
    <div className="space-y-6">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Assistant workbench</p>
          <h1>Assistant Draft Review</h1>
        </div>
        <p className="muted max-w-2xl">AI can draft structure. You decide what becomes company work.</p>
      </div>
      <section className="space-y-4">
        <div className="panel">
          <p className="eyebrow">Needs judgement</p>
          <h2>{reviewDrafts.length} drafts awaiting approval</h2>
          <p className="muted mt-1">Failed local-AI drafts stay editable so your original note is never lost.</p>
        </div>

        {reviewDrafts.map((draft) => {
          const output = draft.output as Record<string, string | boolean> | null;
          return (
            <article className="panel border-l-4 border-l-command-amber" key={draft.id}>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">{draft.provider} / {draft.model}</p>
                  <h2>{String(output?.title ?? draft.sourceSummary)}</h2>
                  <p className="muted">{draft.state} - {draft.sourceText}</p>
                </div>
                <span className="status-pill status-draft">{draft.state}</span>
              </div>
              {draft.error ? <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-command-amber">{draft.error}</p> : null}
              <form action={approveDraftAction} className="grid gap-3 md:grid-cols-2">
                <input name="draftId" type="hidden" value={draft.id} />
                <label className="field-label md:col-span-2">
                  Title
                  <input className="input mt-1" name="title" defaultValue={String(output?.title ?? draft.sourceText ?? "")} required />
                </label>
                <label className="field-label">
                  Stream
                  <input className="input mt-1" name="stream" defaultValue={String(output?.stream ?? "Company Core")} />
                </label>
                <label className="field-label">
                  Company function
                  <input className="input mt-1" name="companyFunction" defaultValue={String(output?.companyFunction ?? "admin")} />
                </label>
                <label className="field-label">
                  Priority
                  <select className="select mt-1" name="priority" defaultValue={String(output?.priority ?? "MEDIUM")}>
                    {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((priority) => <option key={priority}>{priority}</option>)}
                  </select>
                </label>
                <label className="field-label">
                  Status
                  <select className="select mt-1" name="status" defaultValue={String(output?.status ?? "OPEN")}>
                    {["OPEN", "IN_PROGRESS", "BLOCKED", "WAITING"].map((status) => <option key={status}>{status}</option>)}
                  </select>
                </label>
                <label className="field-label">
                  Due date
                  <input className="input mt-1" name="dueDate" type="date" defaultValue={String(output?.dueDate ?? "")} />
                </label>
                <label className="field-label">
                  Review date
                  <input className="input mt-1" name="reviewDate" type="date" defaultValue={String(output?.reviewDate ?? "")} />
                </label>
                <label className="field-label md:col-span-2">
                  Next step
                  <input className="input mt-1" name="nextStep" defaultValue={String(output?.nextStep ?? "")} />
                </label>
                <label className="field-label md:col-span-2">
                  Description
                  <textarea className="text-area mt-1" name="description" rows={3} defaultValue={String(output?.description ?? "")} />
                </label>
                <label className="flex items-center gap-2 text-sm text-command-muted">
                  <input name="sensitive" type="checkbox" defaultChecked={output?.sensitive === true} />
                  Sensitive
                </label>
                <div className="flex justify-end md:col-span-2">
                  <button className="button button-primary" type="submit">Approve into action</button>
                </div>
              </form>
            </article>
          );
        })}

        {reviewDrafts.length === 0 ? <p className="empty-state">No drafts need approval. Use quick capture from Today when a rough note needs structure.</p> : null}

        <div className="panel">
          <p className="eyebrow">History</p>
          <h2>Approved draft trail</h2>
          <div className="mt-4 space-y-2">
            {historyDrafts.map((draft) => (
              <article className="action-row" key={draft.id}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-command-ink">{draft.action?.title ?? draft.sourceSummary}</p>
                    <p className="muted">{draft.provider} / {draft.model} - {draft.sourceText}</p>
                  </div>
                  <span className="status-pill status-approved">APPROVED</span>
                </div>
              </article>
            ))}
            {historyDrafts.length === 0 ? <p className="empty-state">No approved drafts yet.</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
