# Dromaios Labs — Healthcare Market Pathways

Go-to-market pathway plans for entering **every** Australian healthcare market rapidly, at low cost
and low regulatory risk, without discriminating between segments — leveraging AI now and the
founder's clinician network once revenue allows.

## The thesis in one paragraph

~80% of every healthcare provider's compliance burden is identical (incidents, policies, mandatory-
training evidence, worker credentials, accreditation prep). Build that **horizontal engine once**
(DromaiosEd education + ClinicBoss compliance/ops), ship a **thin vertical pack** per segment, lead
with the **cheapest credible product per segment** (mixed wedge), and **time each push to that
segment's regulatory cliff**. Keep ClinicBoss **non-SaMD**, onshore, and clinician-in-the-loop so
entry stays cheap and fast; medtech remains a deliberately-later, evidence-led chapter.

## Read in this order

1. **[`00-master-strategy.md`](00-master-strategy.md)** — the operating thesis, non-discriminatory
   entry doctrine, market sequencing (3 waves), per-segment wedge, the regulatory-calendar-as-sales-
   calendar, pricing architecture, channel strategy, the AI-now/clinicians-later operating model,
   financial logic, and risks.
2. **[`clinicboss-module-catalogue.md`](clinicboss-module-catalogue.md)** — the reusable ClinicBoss
   function/module library (core C1–C9, vertical packs V-*, AI features, build sequence).
3. **[`dromaiosed-course-catalogue.md`](dromaiosed-course-catalogue.md)** — the reusable course
   library (universal stack, flagships incl. OVA, sector electives, accreditation roadmap).
4. **Pathways** (`pathways/`) — one plan per market, same template throughout:

   | # | Pathway | Streams covered | Wave | Lead wedge |
   |---|---------|-----------------|------|------------|
   | 01 | [Primary Care: GP + AMS](pathways/01-primary-care-gp-ams.md) | Community clinics/GPs; Aboriginal Medical Services/ACCHOs | 2 | Education → accreditation pack |
   | 02 | [Care & Disability](pathways/02-care-disability-aged-ndis.md) | Aged care (residential + home); NDIS providers | 1 | Aged care: ClinicBoss-led · NDIS: education-led |
   | 03 | [Allied Health](pathways/03-allied-health.md) | Physio, OT, psych, podiatry, dietetics, speech, etc. | 1 | Software/CPD self-serve |
   | 04 | [Hospitals & Health Services](pathways/04-hospitals-health-services.md) | Public LHDs/HHSs; private hospitals; **day surgeries** | 3 | Education (OVA) → day-surgery NSQHS pack |
   | 05 | [Mining / Occupational Health](pathways/05-mining-occupational-health.md) | Mine-site/FIFO/occupational & remote health | 2 | Education (safety training) |
   | 06 | [Outliers](pathways/06-outliers.md) | Dental, pharmacy, optometry, justice, defence, telehealth, niches | 3 | Mixed (pharmacy compliance-led; dental/optometry CPD-led) |
   | 07 | [Corporatised High-Compliance Niches](pathways/07-diagnostics-cosmetic-fertility.md) | Diagnostic imaging, pathology, cosmetic/aesthetic, IVF/ART | 3 | Win-the-HQ: accreditation/QMS-led (+ advertising-compliance for cosmetic) |

## Grouping rationale

- **GP + AMS** share the RACGP 5th-ed accreditation pathway (AMS adds organisational accreditation,
  nKPI/OSR, Indigenous data sovereignty).
- **Aged care + NDIS** share a regulator-driven compliance posture (SIRS, restrictive practices,
  worker screening, per-bed/per-participant pricing) — wedge differs, engine is shared.
- **Day surgeries** sit with **hospitals** (shared NSQHS), not with outliers.
- **Imaging, pathology, cosmetic & IVF** are split into their own **Pathway 07** because they share a
  distinct shape — consolidated corporate-HQ buyers, mandatory-accreditation/QMS hooks, and live
  2024–27 regulatory shocks — different enough from the fragmented "outliers" to warrant one plan.

## Execution

- **[`launch-plans/90-day-ndis-launch.md`](launch-plans/90-day-ndis-launch.md)** — an executable
  30/60/90 plan turning the strategy into first paying customers via the NDIS education-led wedge
  (Wave 1 beachhead), building the horizontal engine that every other pathway reuses. Re-pointable to
  aged care or allied health.

## Each pathway answers your four asks

- **ClinicBoss rollout + functions required** — §F (phased, mapped to module IDs).
- **Education modules/courses required** — §G (mapped to course codes).
- **Entry point & market fit** — §D (fit) + §E (wedge).
- **Strategy to move through the stream** — §J/§I (phased land-and-expand + channel).

## Status & maintenance

- Built from a **June 2026** multi-source research sweep (AU government, regulators, peak bodies,
  accreditation agencies, industry). Each pathway's §M lists sources and **confidence flags**.
- Most SaaS list pricing in AU health is quote-gated; pricing ranges are synthesised benchmarks.
- Living document: feed the master-strategy regulatory calendar into the Cockpit quarterly review as
  campaign triggers; refresh confidence-flagged figures before each campaign.
