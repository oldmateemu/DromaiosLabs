import { ActivityFeedPanel } from "@/components/activity-feed-panel";
import { CompletionTrendPanel } from "@/components/completion-trend-panel";
import { getActivityData } from "@/lib/services";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const data = await getActivityData();

  return (
    <div className="space-y-6">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Operating awareness</p>
          <h1>Activity and Throughput</h1>
        </div>
        <p className="muted max-w-2xl">A single company timeline plus the weekly completion trend, so nothing important happens out of sight.</p>
      </div>
      <CompletionTrendPanel trend={data.trend} />
      <ActivityFeedPanel events={data.feed} title="Company activity" />
    </div>
  );
}
