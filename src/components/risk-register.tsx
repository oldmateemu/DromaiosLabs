const CLOSED_STATUSES = new Set(["CLOSED", "RESOLVED", "DONE"]);

export type RiskRegisterRisk = {
  id: string;
  issue: string;
  severity: string;
  status: string;
  mitigation: string | null;
  nextReviewAt: Date | null;
  stream: { name: string } | null;
  companyFunction: { name: string } | null;
};

export function RiskRegister({
  risks,
  closeAction,
  restoreAction
}: {
  risks: RiskRegisterRisk[];
  closeAction: (formData: FormData) => Promise<void>;
  restoreAction: (formData: FormData) => Promise<void>;
}) {
  const openRisks = risks.filter((risk) => !isClosedRisk(risk));
  const closedRisks = risks.filter(isClosedRisk);

  return (
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

      <RiskTable
        action={closeAction}
        actionLabel="Close"
        emptyText="No open risks recorded. Capture one if a quiet risk is being carried in your head."
        risks={openRisks}
      />

      <div className="section-heading mt-6">
        <div>
          <p className="eyebrow">Risk archive</p>
          <h2>Closed risks</h2>
        </div>
        <span className="meta-pill">
          {closedRisks.length} closed
        </span>
      </div>

      <RiskTable
        action={restoreAction}
        actionLabel="Restore"
        emptyText="No closed risks retained."
        risks={closedRisks}
      />
    </section>
  );
}

function RiskTable({
  risks,
  action,
  actionLabel,
  emptyText
}: {
  risks: RiskRegisterRisk[];
  action: (formData: FormData) => Promise<void>;
  actionLabel: "Close" | "Restore";
  emptyText: string;
}) {
  if (risks.length === 0) {
    return <p className="empty-state">{emptyText}</p>;
  }

  return (
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
        {risks.map((risk) => (
          <tr key={risk.id}>
            <td>
              <p className="font-medium text-command-ink">{risk.issue}</p>
              {risk.mitigation ? <p className="muted">{risk.mitigation}</p> : null}
            </td>
            <td><span className={severityClass(risk.severity)}>{risk.severity}</span></td>
            <td>{risk.status}</td>
            <td>{risk.companyFunction?.name ?? risk.stream?.name ?? "-"}</td>
            <td>{risk.nextReviewAt ? risk.nextReviewAt.toISOString().slice(0, 10) : "No date"}</td>
            <td>
              <form action={action}>
                <input name="riskId" type="hidden" value={risk.id} />
                <button className="button button-secondary" type="submit">{actionLabel}</button>
              </form>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function isClosedRisk(risk: RiskRegisterRisk) {
  return CLOSED_STATUSES.has(risk.status.toUpperCase());
}

function severityClass(severity: string) {
  if (severity === "CRITICAL" || severity === "HIGH") return "status-pill status-high";
  if (severity === "MEDIUM") return "status-pill status-draft";
  return "status-pill status-approved";
}
