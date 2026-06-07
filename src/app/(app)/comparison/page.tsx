type PmsRow = {
  product: string;
  fit: string;
  entry: string;
  scales: string;
  admin: string;
  claiming: string;
  note: string;
};

type ScribeRow = {
  product: string;
  price: string;
  distribution: string;
  note: string;
};

// Source: docs/strategy/content/clinicboss-comparison-page.md
// Figures verified against 2025-2026 sources; confirm on live vendor pages
// before any external use (prices change; several pages block automated fetch).
const pmsRows: PmsRow[] = [
  {
    product: "Cliniko",
    fit: "Allied health, solo to mid",
    entry: "~$45 (1 practitioner)",
    scales: "Banded by practitioner: ~$95 (2-5), ~$145 (6-8), ~$195 (9-12), ~$295 (13-25), ~$395 (26-200)",
    admin: "Free, unlimited",
    claiming: "Via integration (Tyro for Medicare/DVA; HealthPoint for funds) — not native",
    note: "Polished and well-supported, all features in every tier. Steps up in bands, not a flat per-seat rate."
  },
  {
    product: "Halaxy",
    fit: "Allied health, psychology, NDIS",
    entry: "Core platform free",
    scales: "Free core; monetised via credits (pay-as-you-go ~$0.15/use; subscription add-ons from ~$25/mo)",
    admin: "Free (core is free)",
    claiming: "Available (credit-based)",
    note: "Real cost is in credits/add-ons — model your actual volume. De-identified data may be used for research/training under its policy; it states it never sells identifiable data."
  },
  {
    product: "Nookal",
    fit: "Physio, multi-practitioner allied",
    entry: "~$55/practitioner",
    scales: "Per practitioner",
    admin: "Free, unlimited",
    claiming: "Native Medicare (~30c/successful claim)",
    note: "Strong clinical notes. Cost rises steadily as practitioners are added."
  },
  {
    product: "Power Diary → Zanda",
    fit: "Allied & mental health",
    entry: "Starter ~$19 (1 prac + 1 admin)",
    scales: "Growth ~$49/mo + ~$19 per extra practitioner",
    admin: "Free & unlimited on Growth",
    claiming: "Available",
    note: "Rebranded from Power Diary to Zanda in late 2024 (now zandahealth.com) — same team and product."
  },
  {
    product: "Coreplus",
    fit: "Allied & mental health, Medicare/NDIS",
    entry: "from ~$35/practitioner (tiers ~$5 / ~$25 / ~$45 per user)",
    scales: "Per user / tier",
    admin: "Free, unlimited",
    claiming: "Native real-time Medicare/DVA",
    note: "No lock-in contracts; HealthLink secure messaging. Confirm current tier labels on vendor page."
  },
  {
    product: "Splose",
    fit: "NDIS allied health (OT, speech, physio)",
    entry: "~$27/practitioner",
    scales: "Per practitioner; AI add-on +~$27/user",
    admin: "Non-practitioner roles free",
    claiming: "External Medicare integration",
    note: "Fast-growing, AI-native, NDIS-focused (raised $46M Series A, 2025). AI and SMS are paid add-ons."
  }
];

const scribeRows: ScribeRow[] = [
  {
    product: "Heidi Health",
    price: "Free tier (10 Pro actions/mo); Clinician ~US$150/mo; Practice ~US$99/user — priced in USD",
    distribution: "Direct; very large adoption",
    note: "Backed by a US$65M Series B (~US$465M valuation, 2025). Reliability complaints (lost sessions, occasional hallucinations) appear in current user reviews. Verify any review score on the live page before citing."
  },
  {
    product: "Lyrebird Health",
    price: "AU: Free tier; Pro ~$2,400/yr (~$200/mo) full-time, ~$1,200/yr part-time",
    distribution: "Free, embedded in Best Practice (Bp Premier); data processed and stored in Australia",
    note: "The Bp embed is its key moat with GPs. Vendor/press cite the 'majority of Australian GPs'; treat the largest reach figures as marketing."
  }
];

const positioning = [
  {
    title: "Compliance and accreditation built into the workflow — not bolted on",
    body: "Today, practice-management software, training/LMS, and accreditation evidence live in three separate places, stitched together by hand before an audit. We are designing the evidence trail — training completions, incidents, policies — to map to the actual standards as you work."
  },
  {
    title: "You own your data — one-click, audit-ready export",
    body: "Some incumbents make it genuinely hard to get full records out. Easy export is not a feature to us; it is a principle."
  },
  {
    title: "Australian-hosted, with human, Australian-timezone support",
    body: "Support quality is the single most common complaint across this market. We treat it as core, not overhead."
  },
  {
    title: "Transparent, predictable pricing",
    body: "No surprise credit balances, no per-seat penalty for growing your team. You should be able to predict your bill."
  },
  {
    title: "Built for the aged-care + NDIS + allied-health reality",
    body: "Designed around the 2025 strengthened standards — not retrofitted from a generalist tool."
  }
];

export default function ComparisonPage() {
  return (
    <div className="space-y-6">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Market intelligence</p>
          <h1>Competitor Comparison</h1>
        </div>
        <p className="muted max-w-2xl">
          A neutral, current side-by-side of Australian practice-management software and adjacent AI scribes,
          plus where our operational-software direction is built to be different.
        </p>
      </div>

      <section className="panel panel-muted">
        <p className="eyebrow">Amber — internal review only</p>
        <p className="muted mt-2">
          This page names competitors and quotes pricing, so it is not cleared for external publishing under the
          public-posting guardrail. Treat the product-direction points below as problems we design around, not proven
          outcomes, and keep the working product name flexible until trademark clearance. Confirm every price on the
          live vendor page (and date-stamp it) before anything goes outward.
        </p>
      </section>

      <section className="panel overflow-x-auto">
        <p className="eyebrow">Practice-management software (Australia)</p>
        <table className="data-table mt-3">
          <thead>
            <tr>
              <th>Product</th>
              <th>Best fit</th>
              <th>Entry price (AUD/mo)</th>
              <th>How price scales</th>
              <th>Admin users</th>
              <th>Native claiming</th>
              <th>Worth knowing</th>
            </tr>
          </thead>
          <tbody>
            {pmsRows.map((row) => (
              <tr key={row.product}>
                <td className="font-semibold text-command-ink">{row.product}</td>
                <td>{row.fit}</td>
                <td>{row.entry}</td>
                <td>{row.scales}</td>
                <td>{row.admin}</td>
                <td>{row.claiming}</td>
                <td className="muted">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel overflow-x-auto">
        <p className="eyebrow">AI medical scribes (adjacent, often bought alongside)</p>
        <table className="data-table mt-3">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Distribution</th>
              <th>Worth knowing</th>
            </tr>
          </thead>
          <tbody>
            {scribeRows.map((row) => (
              <tr key={row.product}>
                <td className="font-semibold text-command-ink">{row.product}</td>
                <td>{row.price}</td>
                <td>{row.distribution}</td>
                <td className="muted">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="space-y-4">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Where we are built to be different</p>
            <h2 className="text-xl font-semibold text-command-ink">The gaps this points to</h2>
          </div>
          <p className="muted max-w-2xl">Keep these at problem and principle level until pilots and evidence exist.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {positioning.map((item) => (
            <article className="panel" key={item.title}>
              <p className="font-semibold text-command-ink">{item.title}</p>
              <p className="muted mt-2">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Sources</p>
        <p className="muted mt-2">
          Full competitor profiles, the verification log, and the wider strategy live in{" "}
          <span className="font-medium text-command-ink">docs/strategy/</span> — see
          {" "}clinicboss-comparison-page.md and 2026-06-07-competitive-analysis-path-to-no1.md.
        </p>
      </section>
    </div>
  );
}
