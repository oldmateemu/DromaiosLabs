import { closeRiskAction, createDecisionAction, createRiskAction, restoreRiskAction } from "@/app/actions";
import { CollapsiblePanel, DecisionForm, RiskForm } from "@/components/forms";
import { RiskRegister } from "@/components/risk-register";
import { getGovernanceData } from "@/lib/services";

export const dynamic = "force-dynamic";

export default async function GovernancePage() {
  const data = await getGovernanceData();

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

      <RiskRegister closeAction={closeRiskAction} restoreAction={restoreRiskAction} risks={data.risks} />

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
