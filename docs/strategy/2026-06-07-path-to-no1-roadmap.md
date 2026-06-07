# Dromaios Labs — Path-to-#1 Roadmap

**Status:** Internal planning document. Derived from `docs/strategy/2026-06-07-competitive-analysis-path-to-no1.md`.
**Date:** 7 June 2026
**Companion:** `prisma/seed-roadmap.ts` loads every milestone below into the cockpit as `Action` records (run `pnpm db:seed:roadmap`). Owners and metrics travel with each action.

> **Owner key.** This is a founder-led company, so "Founder" is the default driver. `Founder+Contractor` = needs a hired build/clinical/SEO resource. `Partner` = needs an external org (university/RTO/customer). Re-assign in the cockpit once the team grows.

---

## Sequencing logic

The strategy thesis is: **lead with the one claim nobody else can honestly make (evidence-led, outcome-measured de-escalation), let that trust pull through compliance-native software and an owned community.** So the roadmap front-loads *credibility and content* (cheap, on-brand, no regulatory exposure), then builds the *wedge product*, then the *durable moat*. Each phase produces proof the next phase needs.

| Phase | Window | Goal | Exit criteria |
|---|---|---|---|
| **0 — Foundations** | Now → 1 mo | Don't trip the guardrails; set up to measure | Posting guardrail check + outcome-metric definitions agreed |
| **1 — Quick wins** | 0–6 mo | Own attention + credibility cheaply | Flagship article live, NDIS/Standards content cluster started, community open, first reviews |
| **2 — Moats** | 6–18 mo | Build the compliance-native wedge + proof | ClinicBoss pilot live with audit-readiness; de-escalation outcome study running |
| **3 — Durable #1** | 18 mo+ | Fuse the system; build the data network effect | Unified training+compliance+ops reference customer; proprietary benchmark dataset |

---

## Phase 0 — Foundations (now → 1 month)

| # | Milestone | Stream | Function | Owner | Priority | Success measure |
|---|---|---|---|---|---|---|
| 0.1 | Run the public-posting guardrail pass on the flagship article + comparison page before anything goes outward (named-competitor + evidence claims are Amber/Red) | Company Core | compliance | Founder | HIGH | Both drafts pass the Quick Pre-Post Check in the guardrail doc |
| 0.2 | Define the de-escalation outcome metrics we will measure and publish (incident rate, restraint/Code-Black frequency, staff confidence pre/post) | DromaiosEd | research | Founder | HIGH | Written measurement protocol agreed |
| 0.3 | Stand up an evidence/source library for every public claim (so "evidence-led" is operationally true, not a slogan) | Medtech Direction | research | Founder | MEDIUM | Source register exists and is linked from drafts |

## Phase 1 — Quick wins (0–6 months)

| # | Milestone | Stream | Function | Owner | Priority | Success measure |
|---|---|---|---|---|---|---|
| 1.1 | Publish the flagship article: *"What the evidence actually says about de-escalation training"* — honest, cited, ends on what works + our commitment to measure | DromaiosEd | marketing | Founder | CRITICAL | Article live; ranks for "de-escalation training evidence Australia"; used in 1+ sales conversation |
| 1.2 | Build the NDIS + Strengthened-Standards content cluster (mandatory-training requirements, SIRS 24-hr rules, Action 2.9.6, NDIS Practice Standards, RACGP 6th-ed migration) — continuously updated | DromaiosEd | marketing | Founder+Contractor | HIGH | 5+ cornerstone pages live; organic impressions trending up |
| 1.3 | Launch a free provider-owner community (HIL/Skool) as funnel + design-partner pool + review flywheel | HIL/Skool | marketing | Founder | HIGH | Community open; 50+ members; 3+ design-partner leads |
| 1.4 | Publish the neutral competitor-comparison hub (third-party-feeling, factual, kept current) | ClinicBoss | marketing | Founder+Contractor | MEDIUM | Comparison page live; ranks for "[competitor] alternative" terms |
| 1.5 | Adopt transparent flat pricing as a public stance (contrast credit/per-seat models) — softened per guardrails | ClinicBoss | marketing | Founder | MEDIUM | Pricing principle published |
| 1.6 | Start a disciplined review-generation habit from every pilot/interaction (market review counts are very low — rank fast) | DromaiosEd | delivery | Founder | MEDIUM | 10+ verified reviews across aggregators in 6 mo |
| 1.7 | Target the "Power Diary / Zanda alternative" SEO vacuum created by the rebrand | ClinicBoss | marketing | Founder+Contractor | LOW | Page live and indexed |

## Phase 2 — Moats (6–18 months)

| # | Milestone | Stream | Function | Owner | Priority | Success measure |
|---|---|---|---|---|---|---|
| 2.1 | Build ClinicBoss as a compliance-native PMS: audit-readiness baked into daily workflow (auto-link training, incidents, policies to specific Standard outcomes) | ClinicBoss | product | Founder+Contractor | CRITICAL | Pilot clinic passes/prepares for an audit using one-click evidence map |
| 2.2 | Ship guaranteed one-click data export ("you own your data") — weaponises Helix/MediRecords export-failure complaints | ClinicBoss | product | Founder+Contractor | HIGH | Export feature shipped; demonstrated in pilot |
| 2.3 | Guarantee Australian data residency + human AU-timezone support (the #1 complaint everywhere) | ClinicBoss | product | Founder+Contractor | HIGH | AU hosting documented; support SLA defined |
| 2.4 | Run a measured de-escalation outcome study with a university / ISCRR-type partner | DromaiosEd | research | Partner | CRITICAL | Study underway; pre/post data being collected |
| 2.5 | Build dual-sector audit-ready compliance mapping (Aged Care Quality Standards + NDIS Practice Standards in one product) | ClinicBoss | product | Founder+Contractor | HIGH | Dual mapping shipped; validated against both rule sets |
| 2.6 | Prototype a compliance-grade AI documentation tool that writes the NDIS/allied-health note *with funding justification* — kept on the TGA Excluded/Exempt side | HIL/Skool | product | Founder+Contractor | MEDIUM | Working prototype; intended-purpose statement reviewed against TGA rules |
| 2.7 | Lock the medtech regulatory guardrails: tight intended-purpose statements, human-in-the-loop, consent capture, AHPRA alignment | Medtech Direction | compliance | Founder | HIGH | Documented intended-purpose + governance statement for each tool |

## Phase 3 — Durable #1 (18 months+)

| # | Milestone | Stream | Function | Owner | Priority | Success measure |
|---|---|---|---|---|---|---|
| 3.1 | Fuse training + compliance + operations into one evidence-linked source of truth | ClinicBoss | product | Founder+Contractor | CRITICAL | 1+ reference customer running all three through Dromaios |
| 3.2 | Build the proprietary Australian benchmark dataset (utilisation, incidents, claim turnaround, de-escalation outcomes) into a recurring data-report asset | HIL/Skool | research | Founder+Contractor | HIGH | First published benchmark report; inbound links/citations |
| 3.3 | Convert the de-escalation outcome study into published, defensible proof + a reference case | DromaiosEd | research | Partner | HIGH | Results published; cited in sales |
| 3.4 | Establish the responsible-medtech credibility narrative as the brand moat (evidence-first procurement filter) | Medtech Direction | marketing | Founder | MEDIUM | Positioning consistently reflected across public channels |

---

## Dependencies & critical path

- **1.1 → 2.4 → 3.3**: the evidence-led flag is only durable once a real outcome study backs it. Article first (commitment), study next (proof), publication last (moat).
- **1.3 (community) → 2.1 (pilot)**: the community is the design-partner pool for the ClinicBoss pilot.
- **0.2 (metrics) → 2.4 (study)**: can't run the study without an agreed measurement protocol.
- **2.7 (regulatory guardrails) → 2.6 (AI tool) → 3.1 (fused system)**: keep everything Excluded/Exempt before any AI documentation ships.

## How this lands in the cockpit

`prisma/seed-roadmap.ts` upserts each milestone above as an `Action` (idempotent by title+stream), tagged to the right `Stream` and `CompanyFunction`, with priority set, owner + success-measure in `nextStep`, and `source = USER`. Re-running it updates rather than duplicates. Run with `pnpm db:seed:roadmap`.
