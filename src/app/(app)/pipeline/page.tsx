import Link from "next/link";
import { getSalesPipelineData } from "@/lib/services";
import { priorityLabel, statusLabel } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const { stages, summary, hubspotUrl } = await getSalesPipelineData();

  return (
    <div className="space-y-6">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Sales pipeline</p>
          <h1>Pipeline Command</h1>
        </div>
        <p className="muted max-w-2xl">
          HubSpot is the CRM system of record for leads and deals. This is the command view: the stage playbook and
          your active sales follow-ups, with the live deal data one click away in HubSpot.
        </p>
      </div>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">System of record</p>
            <h2>HubSpot CRM</h2>
          </div>
          <a className="button button-primary" href={hubspotUrl} rel="noreferrer" target="_blank">
            Open HubSpot
          </a>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="meta-pill">{summary.total} active follow-ups</span>
          <span className="meta-pill">{summary.open} open</span>
          <span className="meta-pill">{summary.inProgress} in progress</span>
          <span className="meta-pill">{summary.waiting} waiting</span>
          {summary.blocked > 0 ? <span className="status-pill status-high">{summary.blocked} blocked</span> : null}
          {summary.overdue > 0 ? <span className="status-pill status-high">{summary.overdue} overdue</span> : null}
        </div>
      </section>

      <section>
        <p className="eyebrow mb-3">Stage playbook</p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stages.map((stage, index) => (
            <div className="panel" key={stage.key}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-command-ink">{stage.name}</h3>
                <span className="count-pill count-neutral">{index + 1}</span>
              </div>
              <p className="muted mt-2">{stage.description}</p>
              <p className="mt-3 text-sm text-command-ink">
                <span className="font-medium">Moves forward when:</span> {stage.exitCriterion}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Cockpit</p>
            <h2>Active sales follow-ups</h2>
          </div>
          <Link className="button button-secondary" href="/actions?companyFunction=sales">
            Open in actions
          </Link>
        </div>
        <div className="space-y-2">
          {summary.followUps.length === 0 ? (
            <p className="empty-state">
              No active sales follow-ups in the cockpit. Capture next steps as actions, and keep deals in HubSpot.
            </p>
          ) : (
            summary.followUps.map((followUp) => (
              <article className="action-row" key={followUp.id}>
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-command-ink">{followUp.title}</p>
                  <span
                    className={
                      followUp.priority === "HIGH" || followUp.priority === "CRITICAL"
                        ? "status-pill status-high"
                        : "meta-pill"
                    }
                  >
                    {priorityLabel(followUp.priority)}
                  </span>
                </div>
                {followUp.nextStep ? (
                  <p className="muted mt-1">
                    <span className="font-medium">Next:</span> {followUp.nextStep}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="meta-pill">{statusLabel(followUp.status)}</span>
                  {followUp.stream ? <span className="meta-pill">{followUp.stream}</span> : null}
                  {followUp.overdue ? (
                    <span className="status-pill status-high">Overdue</span>
                  ) : followUp.dueAt ? (
                    <span className="meta-pill">Due {new Date(followUp.dueAt).toISOString().slice(0, 10)}</span>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
