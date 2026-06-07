import Link from "next/link";
import { quickCaptureAction } from "@/app/actions";
import { CompanyPulsePanel } from "@/components/company-pulse-panel";
import { GovernanceSummaryPanel } from "@/components/governance-summary";
import { LaunchpadHealthPanel } from "@/components/launchpad-health";
import { OperatingBriefPanel } from "@/components/operating-brief-panel";
import { StreamPortfolioPanel } from "@/components/stream-portfolio-panel";
import { TodayBoard } from "@/components/today-board";
import { getTodayData } from "@/lib/services";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getTodayData();

  return (
    <div className="space-y-6">
      <TodayBoard buckets={data.buckets} focusSet={data.focusSet} nextAction={data.nextAction} quickCaptureAction={quickCaptureAction} />
      <div className="flex justify-end">
        <Link className="button button-secondary" href="/digest" prefetch={false}>Download operating digest</Link>
      </div>
      <CompanyPulsePanel pulse={data.pulse} />
      <StreamPortfolioPanel portfolio={data.portfolio} limit={3} eyebrow="Portfolio" title="Streams needing attention" showViewAll />
      <OperatingBriefPanel brief={data.brief} />
      <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <LaunchpadHealthPanel health={data.launchpadHealth} />
        <GovernanceSummaryPanel summary={data.governanceSummary} />
      </section>
      <section className="grid gap-5 lg:grid-cols-3">
        <div className="panel">
          <p className="eyebrow">Launchpad</p>
          <h2>Frequently used systems</h2>
          <div className="mt-4 space-y-2">
            {data.links.map((link) => (
              <a className="action-row block" href={link.url} key={link.id} rel="noreferrer" target="_blank">
                <p className="font-medium">{link.name}</p>
                <p className="muted">{link.group}</p>
              </a>
            ))}
          </div>
        </div>
        <div className="panel">
          <p className="eyebrow">Assistant drafts</p>
          <h2>Recent proposals</h2>
          <div className="mt-4 space-y-2">
            {data.drafts.map((draft) => (
              <article className="action-row" key={draft.id}>
                <p className="font-medium">{draft.sourceSummary}</p>
                <p className="muted">{draft.state} via {draft.model}</p>
              </article>
            ))}
            {data.drafts.length === 0 ? <p className="empty-state">No assistant drafts yet.</p> : null}
          </div>
        </div>
        <div className="panel">
          <p className="eyebrow">Automations</p>
          <h2>Control room</h2>
          <div className="mt-4 space-y-2">
            {data.automations.map((automation) => (
              <article className="action-row" key={automation.id}>
                <p className="font-medium">{automation.name}</p>
                <p className="muted">{automation.safetyLevel.replaceAll("_", " ")}</p>
              </article>
            ))}
            {data.automations.length === 0 ? <p className="empty-state">Register low-risk loops as you prove them.</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
