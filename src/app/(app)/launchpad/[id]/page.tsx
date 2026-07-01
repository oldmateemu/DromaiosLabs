import Link from "next/link";
import { notFound } from "next/navigation";
import { updateLaunchpadLinkAction } from "@/app/actions";
import { LaunchpadEditForm } from "@/components/quick-edit-forms";
import { humanizeEnum, priorityLabel, statusLabel } from "@/lib/domain";
import { getLaunchpadDetail } from "@/lib/services";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function LaunchpadDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const data = await getLaunchpadDetail(id);
  if (!data.link) notFound();
  const link = data.link;

  return (
    <div className="space-y-6">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Launchpad system</p>
          <h1>{link.name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="button button-secondary" href={link.url} rel="noreferrer" target="_blank">Open system</a>
          <Link className="button button-secondary" href="/launchpad">Back to launchpad</Link>
        </div>
      </div>

      <section className="panel">
        <div className="flex flex-wrap gap-2">
          <span className="meta-pill">Group: {link.group}</span>
          <span className="meta-pill">Risk: {humanizeEnum(link.riskLevel)}</span>
          <span className="meta-pill">Owner: {link.owner ?? "Unassigned"}</span>
          <span className="meta-pill">Stream: {link.stream?.name ?? "Shared"}</span>
          <span className="meta-pill">Renewal: {link.renewalAt ? link.renewalAt.toISOString().slice(0, 10) : "No date"}</span>
          <span className="meta-pill">Cost: {link.cost ? link.cost.toString() : "No cost"}</span>
          {link.sensitive ? <span className="status-pill status-draft">Sensitive</span> : null}
        </div>
        {link.description ? <p className="mt-3 whitespace-pre-line text-sm text-command-ink">{link.description}</p> : null}
        {link.loginNote ? <p className="muted mt-3">Credential note: {link.loginNote}</p> : null}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Edit</p>
            <h2>Update system</h2>
          </div>
          <p className="muted">Store credential locations only. Keep passwords, tokens, and recovery codes in the password manager.</p>
        </div>
        <LaunchpadEditForm action={updateLaunchpadLinkAction} link={link} streams={data.streams} />
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Linked records</p>
            <h2>Existing linked actions</h2>
          </div>
          <p className="muted">This phase shows existing hard links. Generic record linking belongs to the next implementation phase.</p>
        </div>
        {link.actions.length === 0 ? (
          <p className="empty-state">No actions are linked to this system yet.</p>
        ) : (
          <div className="space-y-2">
            {link.actions.map((action) => (
              <Link className="action-row block" href={`/actions/${action.id}`} key={action.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-command-ink">{action.title}</p>
                    {action.nextStep ? <p className="muted">{action.nextStep}</p> : null}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <span className="meta-pill">{statusLabel(action.status)}</span>
                    <span className="meta-pill">{priorityLabel(action.priority)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
