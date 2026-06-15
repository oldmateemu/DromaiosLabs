import { createAutomationAction, prepareDraftAutomationAction, runAutomationAction } from "@/app/actions";
import { AutomationRegistry } from "@/components/automation-registry";
import { AutomationRunHistory } from "@/components/automation-run-history";
import { AutomationStarterTemplates } from "@/components/automation-starters";
import { AutomationForm, CollapsiblePanel } from "@/components/forms";
import { getAutomationData, getAutomationRunHistory } from "@/lib/services";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  const [automations, runHistory] = await Promise.all([getAutomationData(), getAutomationRunHistory()]);
  return (
    <div className="space-y-6">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Automation control room</p>
          <h1>Approval-Gated Loops</h1>
        </div>
        <p className="muted max-w-2xl">Register low-risk loops first. The cockpit logs every attempt and blocks unsafe execution.</p>
      </div>
      <AutomationStarterTemplates action={createAutomationAction} />
      <AutomationRegistry automations={automations} prepareDraftAction={prepareDraftAutomationAction} runAction={runAutomationAction} />
      <AutomationRunHistory runs={runHistory.runs} summary={runHistory.summary} />
      <CollapsiblePanel eyebrow="Control room" summary="Use custom registration after a starter template is too limited." title="Register Automation">
        <AutomationForm action={createAutomationAction} />
      </CollapsiblePanel>
    </div>
  );
}
