import { createLaunchpadLinkAction } from "@/app/actions";
import { CollapsiblePanel, LaunchpadForm } from "@/components/forms";
import { LaunchpadHealthPanel } from "@/components/launchpad-health";
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
                <a className="action-row block" href={link.url} key={link.id} rel="noreferrer" target="_blank">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-command-ink">{link.name}</p>
                      <p className="muted">{link.description ?? link.url}</p>
                    </div>
                    <span className="meta-pill">{link.riskLevel}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {link.streamId && streamNames.has(link.streamId) ? <span className="meta-pill">{streamNames.get(link.streamId)}</span> : null}
                    {link.renewalAt ? <span className="meta-pill">Renews {link.renewalAt.toISOString().slice(0, 10)}</span> : null}
                    {link.cost ? <span className="meta-pill">${link.cost.toString()}</span> : null}
                    {link.loginNote ? <span className="meta-pill">Login note saved</span> : null}
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
