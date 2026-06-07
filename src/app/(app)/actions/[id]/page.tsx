import Link from "next/link";
import { notFound } from "next/navigation";
import { updateActionAction } from "@/app/actions";
import { ActionEditForm } from "@/components/forms";
import { priorityLabel, statusLabel } from "@/lib/domain";
import { getActionDetail } from "@/lib/services";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

function riskSeverityClass(severity: string) {
  if (severity === "CRITICAL" || severity === "HIGH") return "status-pill status-high";
  if (severity === "MEDIUM") return "status-pill status-draft";
  return "status-pill status-approved";
}

export default async function ActionDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const data = await getActionDetail(id);
  if (!data.action) notFound();
  const action = data.action;

  return (
    <div className="space-y-6">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Action detail</p>
          <h1>{action.title}</h1>
        </div>
        <Link className="button button-secondary" href="/actions">Back to actions</Link>
      </div>

      <section className="panel">
        <div className="flex flex-wrap gap-2">
          <span className="meta-pill">Status: {statusLabel(action.status)}</span>
          <span className="meta-pill">Priority: {priorityLabel(action.priority)}</span>
          <span className="meta-pill">Source: {action.source}</span>
          <span className="meta-pill">Stream: {action.stream?.name ?? "Unassigned"}</span>
          <span className="meta-pill">Function: {action.companyFunction?.name ?? "Unassigned"}</span>
          <span className="meta-pill">Due: {action.dueAt ? action.dueAt.toISOString().slice(0, 10) : "No date"}</span>
          {action.sensitive ? <span className="status-pill status-draft">Sensitive</span> : null}
        </div>
        {action.nextStep ? <p className="muted mt-3">Next step: {action.nextStep}</p> : null}
        {action.description ? <p className="mt-3 whitespace-pre-line text-sm text-command-ink">{action.description}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {action.launchpadLink ? <Link className="button button-secondary" href="/launchpad">System: {action.launchpadLink.name}</Link> : null}
          {action.automation ? <Link className="button button-secondary" href="/automations">Automation: {action.automation.name}</Link> : null}
          {action.review ? <Link className="button button-secondary" href="/reviews">From a review</Link> : null}
          {action.assistantDraft ? <Link className="button button-secondary" href="/assistant">From assistant draft</Link> : null}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="panel">
          <p className="eyebrow">Linked governance</p>
          <h2>Related risks</h2>
          <div className="mt-3 space-y-2">
            {action.risks.length === 0 ? (
              <p className="empty-state">No risks linked to this action.</p>
            ) : (
              action.risks.map((risk) => (
                <article className="action-row" key={risk.id}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-command-ink">{risk.issue}</p>
                    <span className={riskSeverityClass(risk.severity)}>{risk.severity}</span>
                  </div>
                  {risk.mitigation ? <p className="muted">{risk.mitigation}</p> : null}
                </article>
              ))
            )}
          </div>
        </div>
        <div className="panel">
          <p className="eyebrow">Linked governance</p>
          <h2>Follow-up decisions</h2>
          <div className="mt-3 space-y-2">
            {action.decisions.length === 0 ? (
              <p className="empty-state">No decisions reference this action.</p>
            ) : (
              action.decisions.map((decision) => (
                <article className="action-row" key={decision.id}>
                  <p className="font-medium text-command-ink">{decision.decision}</p>
                  {decision.rationale ? <p className="muted">{decision.rationale}</p> : null}
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Edit</p>
            <h2>Update action</h2>
          </div>
          <p className="muted">Marking it Done stamps the completion time and feeds the weekly pulse.</p>
        </div>
        <ActionEditForm action={action} streams={data.streams} companyFunctions={data.companyFunctions} updateAction={updateActionAction} />
      </section>
    </div>
  );
}
