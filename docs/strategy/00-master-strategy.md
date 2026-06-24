# Dromaios Labs — Healthcare Market Pathways: Master Strategy

> **Purpose.** A single operating thesis for entering **every** Australian healthcare market
> rapidly, at low cost and low regulatory risk, without having to pick favourites — then expanding
> from a cheap education/compliance beachhead toward operational software and, eventually,
> responsible medtech. Pathway-specific plans live in `docs/strategy/pathways/`. Reusable product
> building blocks live in `clinicboss-module-catalogue.md` and `dromaiosed-course-catalogue.md`.
>
> **Research base.** Built on a June 2026 multi-source research sweep of AU government, regulator,
> peak-body, accreditation-agency and industry sources. Figures carry confidence flags in the
> pathway docs; SaaS list pricing is largely quote-gated in this market, so pricing ranges are
> synthesised benchmarks, not quotes. Treat as a living document.

---

## 1. The core problem and the core insight

**Problem the customer actually has:** Australian healthcare providers — in every segment — are
under a hardening, deadline-driven compliance regime that ties their *funding and licence to
operate* to their ability to **evidence** safe practice and a trained workforce. They are doing
this with fragmented tools, manual spreadsheets, and generic training.

**Insight that lets us enter all markets at once:** ~80% of that compliance burden is **identical
across segments** — incidents, policies, mandatory training evidence, worker credentials,
accreditation prep. Only the *standard* it maps to and a few fields differ. So we build **one
horizontal engine** (education + compliance-evidence) and ship **thin vertical packs**. We don't
discriminate against markets because the marginal cost of opening a new market is a crosswalk and
a few course electives — not a new product.

**Why now:** A rare cluster of regulatory cliff-edges is forcing spend in 2025–2027 (see §6).

---

## 2. Portfolio map — how the three streams stack

```
        DromaiosEd (education)        →  fast, recurring, non-SaMD, budgeted door-opener
              │  pulls through
              ▼
        ClinicBoss (compliance + ops) →  land-and-expand SaaS; the evidence layer
              │  generates real-world workflow + (de-identified) signal
              ▼
        Medtech direction             →  long-term, evidence-led, regulated; NOT now
```

- **DromaiosEd** is the wedge: low price, short cycle, legally forced, sold into all eight
  segments from day one.
- **ClinicBoss** is the anchor: the training record is its first module; from there it expands
  into incidents, policy, credentialing, and the flagship **accreditation-readiness** engine.
- **Medtech** stays a *direction*, not a product. The company statements and AI guardrails are
  explicit: no premature medtech/clinical claims. ClinicBoss must remain **non-SaMD** to keep
  entry cheap and fast; medtech is a later, deliberately-regulated chapter funded by the cash the
  first two streams throw off.

---

## 3. The non-discriminatory entry doctrine

Three rules that let us say "yes" to any segment without spreading thin:

1. **One catalogue, one engine.** Every segment is sold the same Tier 0/1 DromaiosEd stack and the
   same ClinicBoss core (C1–C8). New segment = new C4 crosswalk + 1–2 electives + 1 vertical pack.
2. **Lead with the cheapest credible product per segment (mixed wedge).** Sometimes that's
   education (mining, hospitals, NDIS long tail, AMS); sometimes it's a ClinicBoss compliance pack
   (aged care, pharmacy); sometimes self-serve software (allied health). The *wedge* differs; the
   *engine* doesn't. (Per-segment wedge table in §5.)
3. **Ride the regulator's calendar.** Time each segment's push to its compliance cliff (§6). The
   deadline does the selling.

---

## 4. Market sequencing (where to point effort first)

Prioritised by: sharpness of regulatory trigger × low sales friction × fit with a small AI-first
team and a care-sector clinician network × revenue speed.

| Wave | Window | Segments | Rationale |
|------|--------|----------|-----------|
| **Wave 1** | 0–9 mo | **NDIS**, **Aged Care**, **Allied Health** | Sharpest cliffs (NDIS mandatory registration 1 Jul 2026; new Aged Care Act + strengthened Standards live since 1 Nov 2025). Huge price-sensitive long tail hungry for cheap training + compliance. Allied health is self-serve and overlaps NDIS/aged-care revenue. Best fit for a care-sector clinician network. |
| **Wave 2** | 6–18 mo | **GP / community clinics**, **AMS/ACCHO**, **Mining** | Accreditation is the gate to funding (GP/AMS) with dedicated grant budgets and PHN/NACCHO channels. Mining has the highest willingness-to-pay; enter via safety training (OVA/fatigue/D&A). |
| **Wave 3** | 12–30 mo | **Hospitals & day surgeries**, **Outliers** (dental, pharmacy, optometry, justice, defence), **Corporatised high-compliance niches** (imaging, pathology, cosmetic, IVF) | Longest cycles / entrenched incumbents (RLDatix in hospitals). Enter hospitals via OVA training + day-surgery accreditation packs; outliers via banner/franchise + peak-body channels and the QCPP→QSPP (pharmacy) deadline; imaging/pathology/cosmetic/IVF via the **win-the-HQ** accreditation/QMS wedge timed to their live regulatory shocks (ISO 15189 transition now complete → ongoing QMS, MHR Jul 2026, ACSQHC ART testing 2027 → transition 2028, cosmetic advertising crackdown). |

> Sequencing is about *emphasis*, not exclusion. Because the engine is horizontal, an inbound
> lead from any segment can be served from day one — we just don't *spend* ahead of the waves.

---

## 5. Per-segment entry wedge (mixed, as chosen)

| Segment | Lead wedge | Anchor expand | Lead product |
|---------|-----------|---------------|--------------|
| NDIS | Education-led (freemium-ish, long tail) | Registration/audit pack | DromaiosEd + ClinicBoss V-SIRS/V-RP |
| Aged Care | **ClinicBoss compliance-led** (funding tied to evidence = high WTP) | Care minutes + SIRS + training | ClinicBoss V-CM/V-SIRS/V-RP + DromaiosEd |
| Allied Health | Software/CPD self-serve | CPD + supervision + NDIS docs | DromaiosEd CPD + ClinicBoss V-AH |
| GP / community | Education-led opener → **accreditation pack anchor** | RACGP 5th-ed readiness | DromaiosEd F03/U02 + ClinicBoss V-GP |
| AMS / ACCHO | Education-led (cultural safety + OVA, trust) | nKPI/OSR + dual accreditation | DromaiosEd F05/F01 + ClinicBoss V-AMS |
| Mining | Education-led (safety training, high WTP) | Fitness-for-work + contractor | DromaiosEd F01/S08/S09 + ClinicBoss V-MINE |
| Hospitals / day surgery | Education-led (OVA crowbar) | NSQHS accreditation + credentialing | DromaiosEd F01 + ClinicBoss V-HOSP |
| Outliers | Mixed (pharmacy compliance-led; dental/optometry CPD-led) | Segment accreditation pack | per-niche |

---

## 6. The regulatory calendar = the sales calendar

High-confidence dates (cross-corroborated across multiple authoritative sources):

| Date | Event | Sells |
|------|-------|-------|
| **1 Nov 2025** | New **Aged Care Act 2024** + **strengthened Aged Care Quality Standards (7)** + **Support at Home** commence; SIRS extends to home care | Aged-care training refresh, SIRS/RP packs, care-minutes evidence |
| FY2025–26 | Externally-audited **Care Minutes Performance Statement** required | ClinicBoss V-CM |
| **Feb 2026** | First wave of 5-year **NDIS worker-screening** checks expire | Credentialing (C5) renewal spike |
| **1 Jul 2026** | **NDIS mandatory registration** for SIL & platform providers (intent to extend) | Registration/audit-readiness packs + training |
| **2 Sep 2025** | **AHPRA non-surgical cosmetic guidelines** (eff. 2 Sep 2025) — separately, the **TGA injectables-advertising enforcement** is an ongoing 2025 action (not tied to this exact date), with penalties to A$16.5m/breach (the "98/100 non-compliant" figure is from the third-party OPRED website study, not a regulator audit) | Cosmetic advertising-compliance + consent + CPD (Pathway 07) |
| **Complete (May 2026)** | **ISO 15189:2022** pathology transition finished (NATA, ~670 labs; SAD effective Feb 2026) | Shift to **ongoing QMS/surveillance** + MHR (V-DIAG) — not a one-off cliff |
| **1 Jul 2026** | **My Health Record "sharing by default"** for path/imaging reports | Privacy training; interoperability positioning; MHR upload assurance |
| **1 Jun 2026** | Mining **QLD RSHLA Act 2024 critical-controls** compliance deadline (safety-critical-role competencies transition to **1 Jun 2030**) | Mining critical-controls assurance + induction/SHMS + V-MINE |
| ~2026 | **QCPP → QSPP** pharmacy accreditation transition (QCPP elements phased out by Sep 2029) | V-PHARM + F03 |
| **10 Dec 2026** | Privacy Act: automated-decision-making **disclosure** obligation | Our own AI governance posture (table stakes) |
| **Jan 2027 → Dec 2028** | **ACSQHC national ART accreditation**: draft standards for **testing from Jan 2027**, all providers transitioned by **Dec 2028** (RTAC continues meanwhile; post-Monash reforms) | IVF/ART accreditation-transition + chain-of-custody + embryologist CPD (Pathway 07) |
| **2027** | **CHSP** transitions into Support at Home (no earlier than 1 Jul 2027); **ADF Health Services Contract** re-tender (1 Jul 2027) | Aged-care home-care expansion; defence subcontracting opportunity |
| 2028+ | **NSQHS 3rd edition** released (assessment ~2030) | Hospital slow-burn; not an immediate trigger |

> **Citations & traceability:** this calendar is a *summary*; the authoritative source instrument and
> URL for each date lives in the relevant pathway doc's **§M (Sources & confidence)** — e.g. NDIS
> registration (NDIS Commission) and worker screening in `pathways/02`; aged-care Act/Support-at-Home
> (health.gov.au/ACQSC) in `pathways/02`; MHR sharing-by-default (health.gov.au) and ISO 15189 (NATA),
> ART (ACSQHC) in `pathways/07`; RSHLA (RSHQ) in `pathways/05`; BBPIP/PIP (health.gov.au) in
> `pathways/01`. **Re-verify each date against its primary source before running a campaign** (several
> shifted in 2026 — e.g. Support-at-Home price caps deferred, ISO 15189 transition completed).

> Run the company's quarterly review (existing Cockpit rhythm) against this calendar. Each cliff is
> a campaign trigger.

---

## 7. Pricing architecture

Defensible pricing axes in AU health (from benchmark research):

| Product | Unit | Benchmark / our position |
|---------|------|--------------------------|
| DromaiosEd catalogue | per learner / year | ~A$25–60 market; price to **undercut Ausmed/Altura on the long tail**, premium for CPD-accredited flagships |
| Instructor-led OVA/PBS | per cohort or per participant/day | quote; network-delivered (Tier 3) |
| ClinicBoss core (small site) | per site / month | low monthly, self-serve for clinics/allied health |
| ClinicBoss residential aged care | per bed / month | ~A$8–25 compliance tier (vs $50–200 full clinical) |
| ClinicBoss home care / NDIS | per participant / month | ~A$12–20 |
| ClinicBoss multi-site / group | **flat unlimited-user / year** | differentiator vs per-seat creep (6clicks model: ~A$19k–120k/yr bands) |
| Hospital / mining enterprise | per-site/network, quote | six-/seven-figure enterprise deals |
| Implementation | one-off | ~A$3–10k; data migration $2–5k |

**The land motion is a bundle:** *"Compliance + Capability"* = ClinicBoss core (C2/C3/C4/C8) +
DromaiosEd catalogue, priced per learner/year or per bed/participant, with implementation waived
for early reference customers. Flat-unlimited pricing is the wedge for consolidating multi-site
buyers (aged-care roll-ups, corporate GP/dental/optometry, allied-health groups like Healthia).

---

## 8. Channel strategy (cheapest credible routes)

| Channel | Use for | Why |
|---------|---------|-----|
| **PHNs (31)** | GP, AMS, allied health | They *fund and commission pilots* (e.g. HNECC funded Heidi) and amplify to member practices — a subsidised beachhead |
| **AAPM** | GP / private practice | Reaches the *practice manager* — the actual compliance/training buyer |
| **Ageing Australia** (ex-ACCPA) | Aged care | The aged-care exhibition; affiliate listing is low-cost entry |
| **NDS** | NDIS / disability | Partner-content model (cf. etrainu Workforce Essentials) + member discount = endorsement |
| **NACCHO + state affiliates** | AMS | Collective procurement, trust, cultural endorsement — essential, relationship-led |
| **AusIMM / AMMA, contractor platforms** | Mining | Procurement-driven; contractor compliance bar creates supply-chain land-and-expand |
| **Banner/franchise HQs** | Pharmacy, optometry, dental | One sale → many sites |
| **HIC / Australian Healthcare Week** | All (credibility) | Digital-health credibility for the software story |

Sales-motion summary: **bottom-up self-serve** for allied health and the NDIS/clinic long tail;
**peak-body + PHN-channel** for GP/AMS/aged care; **procurement/tender** for hospitals, mining,
defence/justice — pursued last and via a training/day-surgery beachhead.

---

## 9. AI operating model — "AI now, clinicians once money rolls"

This directly answers the founder's stated posture.

**Phase A — AI-leveraged, near-solo (now → first revenue):**
- AI **authors and localises** the DromaiosEd catalogue (state variations, accessible formats,
  assessment items) — a full catalogue from a tiny team.
- AI **drafts** ClinicBoss policy templates, standards crosswalks, evidence packs, and report
  drafts (nKPI/OSR, PIP-QI) — the product's margin engine.
- AI runs **marketing, self-serve onboarding, and first-line support**.
- AI does **market/competitor monitoring** against the regulatory calendar.

**Phase B — clinician network engaged (post-revenue):**
- Clinicians **validate and badge** content → unlock **CPD accreditation** (the durable moat).
- Clinicians **deliver** instructor-led Tier 3 OVA/PBS (high margin) and act as **implementation
  consultants / channel** into their own segments.
- Clinicians form the **clinical governance** backbone required for the eventual medtech step.

**Non-negotiable AI guardrails (also in both catalogues):**
- **Non-SaMD**: organise/track/draft compliance; never diagnose, triage, or recommend treatment.
  Do not market clinically-influential AI as TGA-exempt (Feb 2026 guidance closed that path).
- **Onshore data residency**; **APP-compliant**; no identifiable health data into third-party LLMs
  without a compliant basis; honour the overseas-transfer limits (Privacy Act 2024 reforms).
- **Automated-decision disclosure** in privacy policy by **10 Dec 2026**.
- **Patient consent + clinician oversight** if any scribe is bundled — preferred posture is to
  *integrate* Heidi/Lyrebird, not build one.
- **Indigenous Data Sovereignty** for AMS engagements.
- Mirrors the existing Cockpit `AI_CONTEXT.md` safety defaults (no silent execution of
  clinical/regulatory/publishing actions; approval-gated automation).

---

## 10. Financial logic & milestones

- **Cash-flow shape:** education revenue (fast, recurring, low-COGS with AI authoring) funds
  ClinicBoss build; ClinicBoss subscriptions (sticky, higher ACV) fund the clinician network and,
  later, medtech R&D.
- **Reference-customer strategy:** waive implementation for 2–3 lighthouse customers per Wave-1
  segment in exchange for case studies and named references (note the company guardrail: no
  "trusted by clinics" claims until there are *named* users/pilots).
- **Rough milestone ladder:**
  - M0–3: catalogue live; ClinicBoss MVP (C2/C3/C4/C8); first paid education orgs (NDIS/aged care).
  - M3–9: 3+ paying ClinicBoss bundle customers; CPD accreditation for F01/F03; NDS/Ageing
    Australia affiliations.
  - M9–18: GP/AMS via PHN/NACCHO; mining training; AI evidence layer shipped; clinician network
    delivering Tier 3.
  - M18–30: hospital/day-surgery beachhead; outliers via banners; evaluate medtech direction
    against accumulated workflow evidence.

---

## 11. Top risks & mitigations

| Risk | Mitigation |
|------|------------|
| **Free government OVA/mandatory training** undercuts education | Differentiate on healthcare-specific, competency-assessed, **CPD-accredited**, multi-state, blended delivery; bundle with ClinicBoss evidence |
| **Incumbent lock-in** (RLDatix hospitals; BP/Communicare clinical; Ausmed/Altura LMS) | Don't fight clinical systems; **integrate** (FHIR/Halo Connect) and win the *evidence/accreditation* white space they under-serve |
| **Quote-gated pricing opacity** → mispricing | Lead with transparent, low, flat pricing as a *differentiator*; validate with first deals |
| **Scope creep across 8 segments** dilutes a small team | The waves (§4) gate spend; the horizontal engine caps marginal cost |
| **AI/regulatory misstep** (TGA SaMD, Privacy Act, AMS data) | Hard guardrails (§9); non-SaMD posture; onshore; legal review before any clinical-adjacent feature |
| **Margin squeeze in NDIS/allied health** (frozen prices) | Position as the *cost-saving* compliance/efficiency tool; price low; rely on volume + education attach |
| **Over-claiming** vs company guardrails | Keep all public claims aligned to proof; pilots framed as pilots |

---

## 12. How to use these docs

- Start here, then read the two catalogues, then the relevant `pathways/` file.
- Each pathway follows the same template: Snapshot · Market fit · Entry wedge · ClinicBoss rollout
  & functions · DromaiosEd modules · Pricing & packaging · Channel & sales motion · Strategy to
  move through the stream · AI plays & guardrails · Risks · Sources & confidence.
- Feed the §6 calendar into the Cockpit quarterly review as campaign triggers.

### Pathway index
1. `pathways/01-primary-care-gp-ams.md` — Community clinics/GPs + AMS/ACCHOs
2. `pathways/02-care-disability-aged-ndis.md` — Aged Care + NDIS
3. `pathways/03-allied-health.md` — Allied Health
4. `pathways/04-hospitals-health-services.md` — Hospitals & day surgeries
5. `pathways/05-mining-occupational-health.md` — Mining / remote / occupational health
6. `pathways/06-outliers.md` — Dental, pharmacy, optometry, justice, defence, telehealth & niches
7. `pathways/07-diagnostics-cosmetic-fertility.md` — Diagnostic imaging, pathology, cosmetic/aesthetic, IVF/ART (corporatised, win-the-HQ)
