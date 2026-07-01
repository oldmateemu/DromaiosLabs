import Link from "next/link";
import { getPersonalPipelineData } from "@/lib/services";
import { priorityLabel, statusLabel } from "@/lib/domain";

export const dynamic = "force-dynamic";

function dayKey(value: Date | string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "—";
}

function docStatusLabel(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default async function PersonalPage() {
  const { openActions, recentDocuments, actionCount, documentCount } = await getPersonalPipelineData();

  return (
    <div className="space-y-6">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Personal pipeline</p>
          <h1>Personal</h1>
        </div>
        <p className="muted max-w-2xl">
          Everything triaged into the Personal domain — household, medical, vehicle, school, and private finance. These
          are kept deliberately out of the company streams and functions; Business items flow into company ops, Personal
          stays here. Documents arrive via the same <Link href="/intake">Intake &amp; Triage</Link> review queue.
        </p>
      </div>

      <section className="panel">
        <p className="eyebrow">Overview</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="meta-pill">{openActions.length} open personal actions</span>
          <span className="meta-pill">{actionCount} personal actions total</span>
          <span className="meta-pill">{documentCount} personal documents</span>
        </div>
      </section>

      <section className="space-y-3">
        <div className="section-heading">
          <div>
            <p className="eyebrow">To do</p>
            <h2>Open personal actions</h2>
          </div>
        </div>
        {openActions.map((action) => (
          <article className="action-row" key={action.id}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Link className="font-medium text-command-ink" href={`/actions/${action.id}`}>
                  {action.title}
                </Link>
                {action.nextStep ? <p className="muted">{action.nextStep}</p> : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="meta-pill">{priorityLabel(action.priority)}</span>
                  {action.dueAt ? <span className="meta-pill">Due {dayKey(action.dueAt)}</span> : null}
                  {action.sensitive ? <span className="meta-pill">Sensitive</span> : null}
                </div>
              </div>
              <span className="status-pill status-draft">{statusLabel(action.status)}</span>
            </div>
          </article>
        ))}
        {openActions.length === 0 ? (
          <p className="empty-state">No open personal actions. Approve a Personal document in the intake queue to create one.</p>
        ) : null}
      </section>

      <section className="panel">
        <p className="eyebrow">Records</p>
        <h2>Filed &amp; archived personal documents</h2>
        <div className="mt-4 space-y-2">
          {recentDocuments.map((doc) => (
            <article className="action-row" key={doc.id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium text-command-ink">{doc.action?.title ?? doc.originalFilename}</p>
                  <p className="muted">
                    {doc.originalFilename}
                    {doc.docType ? ` · ${doc.docType}` : ""} · {dayKey(doc.reviewedAt)}
                  </p>
                </div>
                <span className="status-pill status-approved">{docStatusLabel(doc.status)}</span>
              </div>
            </article>
          ))}
          {recentDocuments.length === 0 ? <p className="empty-state">No filed or archived personal documents yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
