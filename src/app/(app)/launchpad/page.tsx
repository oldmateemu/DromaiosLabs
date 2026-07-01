import Link from "next/link";
import { createLaunchpadLinkAction, updateLaunchpadQuickEditAction } from "@/app/actions";
import { CollapsiblePanel, LaunchpadForm } from "@/components/forms";
import { LaunchpadHealthPanel } from "@/components/launchpad-health";
import { LaunchpadQuickEditForm } from "@/components/quick-edit-forms";
import { RenewalCalendarPanel } from "@/components/renewal-calendar-panel";
import { buildLaunchpadHealth } from "@/lib/cockpit-insights";
import { buildRenewalCalendar } from "@/lib/renewal-calendar";
import { getLaunchpadData, getReferenceData } from "@/lib/services";

export const dynamic = "force-dynamic";

export default async function LaunchpadPage() {
  const [links, reference] = await Promise.all([getLaunchpadData(), getReferenceData()]);
  const streamNames = new Map(reference.streams.map((stream) => [stream.id, stream.name]));
  const health = buildLaunchpadHealth(links);
  const renewalCalendar = buildRenewalCalendar({ links });
  const grouped = links.reduce<Record<string, typeof links>>((groups, link) => {
    groups[link.group] ??= [];
    groups[link.group].push(link);
    return groups;
  }, {});

  return (
    <div className="space-y-6">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Company launchpad</p>
          <h1>Systems and Links</h1>
        </div>
        <p className="muted max-w-2xl">Group every tool you use, then tie it to cost, renewal, risk, and recurring checks.</p>
      </div>
      <LaunchpadHealthPanel health={health} />
      <RenewalCalendarPanel calendar={renewalCalendar} />
      <CollapsiblePanel eyebrow="Systems" summary="Add new systems deliberately, with owner, cost, renewal, and risk context where known." title="Add Launchpad Link">
        <LaunchpadForm action={createLaunchpadLinkAction} streams={reference.streams} />
      </CollapsiblePanel>
      <section className="grid gap-5 lg:grid-cols-2">
        {Object.entries(grouped).map(([group, groupLinks]) => (
          <div className="panel" key={group}>
            <p className="eyebrow">{group}</p>
            <div className="mt-4 space-y-3">
              {groupLinks.map((link) => (
                <article className="action-row" key={link.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link className="font-semibold text-command-ink hover:text-command-navy hover:underline" href={`/launchpad/${link.id}`}>
                        {link.name}
                      </Link>
                      <p className="muted">{link.description ?? link.url}</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <span className="meta-pill">{link.riskLevel}</span>
                      <a className="button button-secondary px-3 py-1 text-xs" href={link.url} rel="noreferrer" target="_blank">
                        Open
                      </a>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {link.streamId && streamNames.has(link.streamId) ? <span className="meta-pill">{streamNames.get(link.streamId)}</span> : null}
                    {link.renewalAt ? <span className="meta-pill">Renews {link.renewalAt.toISOString().slice(0, 10)}</span> : null}
                    {link.cost ? <span className="meta-pill">${link.cost.toString()}</span> : null}
                    {link.loginNote ? <span className="meta-pill">Login note saved</span> : null}
                  </div>
                  <div className="mt-3">
                    <LaunchpadQuickEditForm
                      action={updateLaunchpadQuickEditAction}
                      link={{
                        id: link.id,
                        group: link.group,
                        cost: link.cost,
                        renewalAt: link.renewalAt,
                        owner: link.owner,
                        riskLevel: link.riskLevel
                      }}
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
