import { activatePhaseAction, createActionAction, completeActionAction } from "@/app/actions";
import { ActionForm, ActionRegisterFilters, ActionSavedViews, CollapsiblePanel, PhaseActivation } from "@/components/forms";
import { getActionRegisterData } from "@/lib/services";
import { priorityLabel, statusLabel } from "@/lib/domain";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function ActionsPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = (await searchParams) ?? {};
  const data = await getActionRegisterData(params);
  const today = new Date();
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);
  const hasFilters = Object.values(params).some((value) => value && value !== "ALL");

  return (
    <div className="space-y-6">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Action register</p>
          <h1>Company Actions</h1>
        </div>
        <p className="muted max-w-2xl">One action system across every stream and function.</p>
      </div>
      <ActionSavedViews today={today.toISOString().slice(0, 10)} weekEnd={weekEnd.toISOString().slice(0, 10)} />
      <PhaseActivation phases={data.phaseBacklog} action={activatePhaseAction} />
      <CollapsiblePanel defaultOpen={hasFilters} eyebrow="Find the right work" summary="Open only when the saved views are not specific enough." title="Filters">
        <ActionRegisterFilters streams={data.streams} companyFunctions={data.companyFunctions} values={params} />
      </CollapsiblePanel>
      <section className="panel overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Stream</th>
              <th>Function</th>
              <th>Phase</th>
              <th>Due</th>
              <th>Control</th>
            </tr>
          </thead>
          <tbody>
            {data.actions.map((action) => (
              <tr key={action.id}>
                <td>
                  <p className="font-medium text-command-ink">{action.title}</p>
                  {action.nextStep ? <p className="muted">{action.nextStep}</p> : null}
                </td>
                <td>{statusLabel(action.status)}</td>
                <td>{priorityLabel(action.priority)}</td>
                <td>{action.stream?.name ?? "Unassigned"}</td>
                <td>{action.companyFunction?.name ?? "Unassigned"}</td>
                <td>{action.phase === null ? "-" : `Phase ${action.phase}`}</td>
                <td>{action.dueAt ? action.dueAt.toISOString().slice(0, 10) : "No date"}</td>
                <td>
                  {action.status !== "DONE" ? (
                    <form action={completeActionAction}>
                      <input name="actionId" type="hidden" value={action.id} />
                      <button className="button button-secondary" type="submit">Done</button>
                    </form>
                  ) : (
                    <span className="status-pill status-approved">Done</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <CollapsiblePanel eyebrow="Capture" summary="Use quick capture for messy notes; use this form when the action is already clear." title="New Action">
        <ActionForm streams={data.streams} companyFunctions={data.companyFunctions} action={createActionAction} />
      </CollapsiblePanel>
    </div>
  );
}
