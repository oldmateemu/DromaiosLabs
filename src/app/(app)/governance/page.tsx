import { closeRiskAction, createDecisionAction, createRiskAction } from "@/app/actions";
import { CollapsiblePanel, DecisionForm, RiskForm } from "@/components/forms";
import { getGovernanceData } from "@/lib/services";

export const dynamic = "force-dynamic";

const CLOSED_STATUSES = new Set(["CLOSED", "RESOLVED", "DONE"]);

function severityClass(severity: string) {
  if (severity === "CRITICAL" || severity === "HIGH") return "status-pill status-high";
  if (severity === "MEDIUM") return "status-pill status-draft";
  return "status-pill status-approved";
}

export default async function GovernancePage() {
  const data = await getGovernanceData();
  const openRisks = data.risks.filter((risk) => !CLOSED_STATUSES.has(risk.status.toUpperCase()));
  const closedRisks = data.risks.filter((risk) => CLOSED_STATUSES.has(risk.status.toUpperCase()));

  return (
    <div className="space-y-6">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Governance</p>
          <h1>Risks and Decisions</h1>
        </div>
        <p className="muted max-w-2xl">Keep quiet risks and important calls durable instead of carrying them in your head.</p>
      </div>

      <CollapsiblePanel eyebrow="Governance" summary="Capture a risk the moment it is real, with severity and a mitigation plan." title="Log Risk">
        <RiskForm streams={data.streams} companyFunctions={data.companyFunctions} action={createRiskAction} />
      </CollapsiblePanel>

      <section className="panel overflow-x-auto">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Risk register</p>
            <h2>Open risks</h2>
          </div>
          <span className={openRisks.length > 0 ? "status-pill status-draft" : "status-pill status-approved"}>
            {openRisks.length} open
          </span>
        </div>
        {openRisks.length === 0 ? (
          <p className="empty-state">No open risks recorded. Capture one if a quiet risk is being carried in your head.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Risk</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Area</th>
                <th>Next review</th>
                <th>Control</th>
              </tr>
            </thead>
            <tbody>
              {openRisks.map((risk) => (
                <tr key={risk.id}>
                  <td>
                    <p className="font-medium text-command-ink">{risk.issue}</p>
                    {risk.mitigation ? <p className="muted">{risk.mitigation}</p> : null}
                  </td>
                  <td><span className={severityClass(risk.severity)}>{risk.severity}</span></td>
                  <td>{risk.status}</td>
                  <td>{risk.companyFunction?.name ?? risk.stream?.name ?? "—"}</td>
                  <td>{risk.nextReviewAt ? risk.nextReviewAt.toISOString().slice(0, 10) : "No date"}</td>
                  <td>
                    <form action={closeRiskAction}>
                      <input name="riskId" type="hidden" value={risk.id} />
                      <input name="status" type="hidden" value="CLOSED" />
                      <button className="button button-secondary" type="submit">Close</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {closedRisks.length > 0 ? (
          <p className="muted mt-4">{closedRisks.length} closed {closedRisks.length === 1 ? "risk" : "risks"} retained for the record.</p>
        ) : null}
      </section>

      <CollapsiblePanel eyebrow="Governance" summary="Record the call, the rationale, and what it affected so the decision stays durable." title="Record Decision">
        <DecisionForm action={createDecisionAction} />
      </CollapsiblePanel>

      <section className="panel space-y-3">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Decision log</p>
            <h2>Recent decisions</h2>
          </div>
          <span className="meta-pill">{data.decisions.length} recorded</span>
        </div>
        {data.decisions.length === 0 ? (
          <p className="empty-state">No decisions recorded yet. Keep important calls durable as you make them.</p>
        ) : (
          data.decisions.map((decision) => (
            <article className="action-row" key={decision.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-command-ink">{decision.decision}</p>
                  {decision.rationale ? <p className="muted">{decision.rationale}</p> : null}
                  {decision.relatedDocs ? <p className="muted">Refs: {decision.relatedDocs}</p> : null}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="meta-pill">{decision.decidedAt.toISOString().slice(0, 10)}</span>
                  {decision.affectedArea ? <span className="meta-pill">{decision.affectedArea}</span> : null}
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
