import { createAutomationAction, runAutomationAction } from "@/app/actions";
import { AutomationForm } from "@/components/forms";
import { getAutomationData } from "@/lib/services";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  const automations = await getAutomationData();
  return (
    <div className="space-y-6">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Automation control room</p>
          <h1>Approval-Gated Loops</h1>
        </div>
        <p className="muted max-w-2xl">Register low-risk loops first. The cockpit logs every attempt and blocks unsafe execution.</p>
      </div>
      <AutomationForm action={createAutomationAction} />
      <section className="grid gap-5 lg:grid-cols-2">
        {automations.map((automation) => (
          <article className="panel" key={automation.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">{automation.targetTool}</p>
                <h2>{automation.name}</h2>
                <p className="muted">{automation.description}</p>
              </div>
              <span className="meta-pill">{automation.safetyLevel.replaceAll("_", " ")}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="meta-pill">{automation.status}</span>
              <span className="meta-pill">{automation.trigger}</span>
            </div>
            <form action={runAutomationAction} className="mt-4">
              <input name="automationId" type="hidden" value={automation.id} />
              <input name="approved" type="hidden" value="true" />
              <button className="button button-primary" type="submit">Run with approval</button>
            </form>
            <div className="mt-4 space-y-2">
              {automation.runs.map((run) => (
                <div className="action-row" key={run.id}>
                  <p className="font-medium">{run.status}</p>
                  <p className="muted">{run.error ?? run.responseSummary ?? run.requestSummary}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
