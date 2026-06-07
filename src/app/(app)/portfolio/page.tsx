import { StreamPortfolioPanel } from "@/components/stream-portfolio-panel";
import { StreamSpendPanel } from "@/components/stream-spend-panel";
import { getPortfolioData } from "@/lib/services";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const data = await getPortfolioData();

  return (
    <div className="space-y-6">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Company portfolio</p>
          <h1>Stream Command View</h1>
        </div>
        <p className="muted max-w-2xl">Every venture in one view, ordered by what needs a decision next. Click a stream to open its actions.</p>
      </div>
      <StreamPortfolioPanel
        portfolio={data.portfolio}
        eyebrow="Operating health"
        title="All streams"
        description="Overdue and risk-weighted so the most pressing venture is first."
      />
      <StreamSpendPanel spend={data.spend} />
    </div>
  );
}
