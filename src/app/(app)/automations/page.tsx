import { createAutomationAction, runAutomationAction } from "@/app/actions";
import { AutomationRegistry } from "@/components/automation-registry";
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
      <AutomationRegistry automations={automations} runAction={runAutomationAction} />
      <AutomationForm action={createAutomationAction} />
    </div>
  );
}
