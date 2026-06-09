# Dromaios Labs Mobile App Strategy

Date: 2026-06-09
Status: Research-backed strategy, pending product decision

## Purpose

Decide what high-quality Android + iOS app Dromaios Labs should build **first** as a
credibility-builder and top-of-funnel acquisition channel ("an avenue that gets people in"),
and how that first app sequences into the founder's longer-term vision of one app per stream
plus a fuller Dromaios Labs portal app.

The goal for the first app is **credibility and funnel**, not immediate revenue.

This document is the strategy layer. The companion specs hold the buildable detail:

- `2026-06-09-dromaios-mobile-mvp-scope.md` — MVP scope and feature list for App 1.
- `2026-06-09-dromaios-mobile-build-plan.md` — lean build plan (stack, data model, screens, architecture).

## The Recommendation

Build a **free, worker-owned de-escalation and behaviour-support companion**: a scenario-based
microlearning plus quick-reference mobile app for frontline NDIS, disability and aged-care workers,
with CPD-stamped certificates as the acquisition hook.

It is anchored in DromaiosEd's authority, fills a real and almost-empty white space, gets users in for
free, keeps every public claim defensible under the brand guardrail, and is the natural first module
of the eventual Dromaios Labs portal — without competing head-on with the category incumbent (Ausmed).

Working name placeholder: **DromaiosEd "Safer Practice" companion**.

## Why This, And Not Something Else

### The market is large, regulation-driven, and tailwind-heavy

- ~549,000 aged-care workers (2023), ~414k in direct care (AIHW GEN / 2023 Aged Care Provider
  Workforce Survey).
- ~325,000 NDIS disability support workers within a ~722k disability/social-assistance sector
  (HumanAbility; NDIS Review).
- 512,332 registered nurses and midwives (NMBA, June 2024) — the largest single health profession.
- Strong 2025–2026 regulatory tailwinds: new Aged Care Act + Strengthened Quality Standards
  (commenced 1 Nov 2025); NDIS Worker Screening clearances begin expiring Feb 2026; aged-care worker
  screening commences mid-2026; disability-worker mandatory registration expands from 1 July 2026.

Caveats: no authoritative Australia-specific market-size figure exists for care-sector e-learning/LMS
(do not publish a TAM number). The NDIS disability workforce-demand trajectory is contested (reform may
shrink participant numbers) — frame disability as a compliance/safety play, not a growth play.

### The competitive gap is specific — and it is not CPD logging

The market is overwhelmingly admin-LMS / compliance-dashboard software sold to organisations
(Altura, eTrainu, iinduct, Sentrient, Go1, ELMO, LearnUpon, Litmos). To them the worker is a completion
record, not the customer.

The one player who already owns the worker-facing niche is **Ausmed** — free CPD app plus the free,
employer-portable Ausmed Passport. **Therefore do not lead with generic CPD logging or a training
passport; Ausmed owns that.** Differentiate on content type and frontline UX instead.

Genuine white space (medium-to-high confidence, based on absence of evidence across targeted searches —
confirm with a final App/Play Store scan before claiming "first"):

1. Mobile microlearning + scenario practice, versus long desktop compliance modules.
2. In-the-moment de-escalation / OVA / restrictive-practice reference and practice on mobile — almost
   nonexistent. Incumbents (Maybo, CPI/MAPA, Resolution Education) deliver classroom + ~2-hour eLearning
   blends; the one Australian innovation is Dementia Australia's VR "D-Esc", not a pocket companion.
3. The unregistered aged-care/disability workforce (the ~95% who are not AHPRA nurses) is under-served
   by CPD tooling built around nurse registration.

### De-escalation / behaviour support is the strongest content wedge

- **Clearest worker pain.** Health and social assistance is a top-two industry for occupational
  violence; the majority of nurses and aged-care workers experience OVA each year. The "violence is not
  part of the job" framing carries real brand resonance.
- **Cleanest regulatory pull.** Restrictive practices is the NDIS Commission's stated #1 priority for
  2025–26 (mandatory monthly reporting; unauthorised use is reportable), mirrored in aged care by SIRS
  and the Aged Care Act 2024 rules. The Aged Care Royal Commission explicitly blamed restrictive-practice
  overuse on worker knowledge gaps — a textbook education mandate.
- **Lowest brand-claim risk.** De-escalation training has weak/mixed outcome evidence: the Price et al.
  (2015) review and the 2024 NIHR EDITION trial found no model proven to reduce violence in rigorous
  trials; benefit appears in knowledge, confidence and coping, not incident rates. Microlearning evidence
  is positive but preliminary. This forces exactly the honest claims the brand guardrail already requires.

Why not manual handling first: biggest injury-cost category, but generic regulatory pull, less
brand-distinctive, and physical technique needs hands-on practice — weaker fit for a mobile-only first
product. Keep it as content module #2.

### The acquisition hook that works for this audience

- Lead mechanic: microlearning — best-evidenced format for this workforce, fits a phone-in-pocket,
  between-shifts reality.
- The free hook is CPD evidence: 5–10-minute modules that generate hour-stamped, audit-ready
  certificates in a worker-owned portfolio. Serves nurses' mandatory 20 CPD hrs/yr (5-year retention)
  and Victorian disability workers' voluntary 10 hrs/yr, and pre-positions unregistered workers for the
  2026+ registration/portability shift.
- Design constraints that make or break it:
  - ~1 in 6 aged-care workers lacks or never uses a personal internet device, and ~12% are low
    digital-readiness. Onboarding must be near-zero-skill; do not assume 100% BYOD reach.
  - Be explicitly non-extractive: worker-owned records (not employer surveillance), minimal data
    collection. Privacy/trust is a documented adoption gate — and this dovetails with Dromaios's existing
    "don't push sensitive data to cloud AI" stance.
  - Plan for the retention cliff (~4% Day-30 for health apps) with a recurring reason to return
    (accruing CPD hours, certificate progress, weekly scenario).
  - Seed via nurse/carer Facebook communities for organic discovery.

## Sequencing Into The Portal

Deliberately not a "super-app" on day one — Western "everything apps" have a poor track record. Treat
"portal" as a deferred architecture outcome, not a launch goal.

1. **App 1 — the wedge** (above). Build it as a feature module behind shared identity + a shared design
   system, so it is portal-ready without over-engineering.
2. **Broaden DromaiosEd** — add manual handling, infection control, restrictive-practice modules; turn
   the certificate portfolio into the recurring habit. Credibility compounds; ClinicBoss leads get warm.
3. **Add the org/provider layer** — the same worker records, surfaced to employers as a compliance/
   evidence view. This is the natural B2B revenue bridge and the ClinicBoss on-ramp.
4. **The Dromaios Labs portal** — once two or three streams have real users, unify under shared auth as
   the fuller-features app.

This reaches the "one app per stream + a fuller portal" end-state by shipping one genuinely excellent
product first rather than a thin everything-app.

## Build Approach (Summary)

- Use Expo / React Native — maximises reuse of the existing Next.js / TypeScript / React / Prisma skills
  and code, gives native polish (lowest Apple Guideline 4.2 rejection risk), and EAS Build/Update are
  production-mature with over-the-air updates. Capacitor wrapping Next.js is the faster-reuse fallback
  but must add real native features to clear review; a bare PWA is the highest iOS-rejection risk.
- Sell any paid courses/subscriptions via your own Stripe web checkout, not in-app purchase — the 2025
  US external-link ruling and the reader-app exemption avoid the 15–30% app-store cut. Status outside the
  US storefront differs; verify before relying on it internationally.
- Bake in Australian privacy early: APP 8 data-residency (prefer AU regions for Postgres/push providers),
  and clear non-diagnostic disclaimers to avoid Apple's 1.4.1 health-app scrutiny. Enforcement is
  tightening (OAIC; Privacy Act 2024 amendments).
- Realistic MVP: a tightly-scoped, polished cross-platform education MVP is roughly 1–3 months for a
  small team.

See `2026-06-09-dromaios-mobile-build-plan.md` for detail.

## Brand Guardrail Checklist (Before Anything Goes Public)

- Claim only knowledge / confidence / regulatory-awareness / compliance-support for de-escalation.
  Never "proven to reduce violence or restraint."
- Re-pull exact statistics (Safe Work Australia OVA percentages, NDIS restrictive-practice volumes, the
  "1 in 6 no device" figure) from primary PDFs — several came via indexed summaries because government
  sites blocked direct fetch.
- Do a final App Store / Google Play scan to confirm "first mobile de-escalation companion" before
  asserting it.
- Do not quote an Australian care-training market size — no credible source found.

## Evidence Confidence Summary

- High: workforce sizes, regulatory drivers and timelines, the admin-LMS vs worker-first market shape,
  Ausmed's incumbency, the weak de-escalation outcome evidence base, NMBA CPD requirements, the Expo/
  external-link/privacy build facts.
- Medium: exact OVA and restrictive-practice percentages, microlearning effect sizes, retention
  benchmarks (consumer-app aggregates), the "no mobile de-escalation companion exists" gap (absence of
  evidence).
- Low / not found: Australia-specific care-training market size; whether unregistered workers will
  voluntarily build a CPD portfolio absent a mandate.

## Source Appendix

Selected primary and high-value sources (full set captured in the research session):

- AIHW GEN Aged Care workforce data: https://www.gen-agedcaredata.gov.au/topics/aged-care-workforce
- NMBA registrant statistics: https://www.nursingmidwiferyboard.gov.au/about/statistics.aspx
- NMBA CPD standard: https://www.nursingmidwiferyboard.gov.au/Registration-Standards/Understanding-CPD-for-nurses-and-midwives.aspx
- Strengthened Aged Care Quality Standards (ACQSC): https://www.agedcarequality.gov.au/providers/quality-standards/strengthened-aged-care-quality-standards
- NDIS behaviour support and restrictive practices rules: https://www.ndiscommission.gov.au/rules-and-standards/behaviour-support-and-restrictive-practices/rules-behaviour-support-and
- Aged care SIRS (ACQSC): https://www.agedcarequality.gov.au/providers/serious-incident-response-scheme/about-serious-incident-response-scheme-sirs
- Safe Work Australia, work-related violence and aggression: https://data.safeworkaustralia.gov.au/report/work-related-violence-aggression-australia
- Price et al. 2015, de-escalation training review: https://pubmed.ncbi.nlm.nih.gov/26034178/
- NIHR EDITION review/trial (2024): https://www.ncbi.nlm.nih.gov/books/NBK600229/
- JMIR Medical Education microlearning scoping review: https://mededu.jmir.org/2019/2/e13997/
- JMIR Aging, aged-care digital readiness/device access (2025): https://aging.jmir.org/2025/1/e54143
- Victorian Disability Worker Commission CPD: https://www.vdwc.vic.gov.au/registration/CPD
- Ausmed (incumbent reference): https://www.ausmed.com/
- Apple App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple external-link change (2025): https://9to5mac.com/2025/05/01/apple-app-store-guidelines-external-links/
- Expo EAS Update: https://docs.expo.dev/eas-update/introduction/
- OAIC Australian Privacy Principles: https://www.oaic.gov.au/privacy/australian-privacy-principles
