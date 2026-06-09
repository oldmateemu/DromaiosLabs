# 90-Day Launch Plan — NDIS Education-Led Wedge (Wave 1 Beachhead)

> **What this is.** An executable, week-by-week plan to go from the strategy docs to **first paying
> customers** in one market in 90 days, using the AI-first / near-solo operating model, and building
> the **horizontal engine** (DromaiosEd catalogue + ClinicBoss MVP) that every other pathway reuses.
> Start date assumed **early June 2026**; the **1 July 2026 NDIS mandatory registration** cliff lands
> in Week 3, which is why NDIS is the beachhead.
>
> **Why NDIS first** (from `00-master-strategy.md` §4): sharpest, most imminent regulatory cliff;
> huge fragmented price-sensitive long tail that buys self-serve; education-led entry = no TGA/SaMD
> risk and a short cycle; lowest capital; and the engine built here serves inbound **aged care** and
> **allied health** (Wave 1) on day one. See `pathways/02-care-disability-aged-ndis.md` for the full
> market analysis this plan executes.
>
> **Re-pointable.** If you'd rather lead with aged care (ClinicBoss-compliance-led) or allied health
> (self-serve CPD), the workstream structure holds; swap the crosswalk, courses, channel and pricing.

---

## 1. The Day-90 objective (definition of success)

A single headline + supporting gates. Set the exact numbers yourself; these are the recommended
shape, grounded in the benchmarks in the research (price-sensitive long tail; ShiftCare ~A$99/mo
reference; NDS member-discount channel model).

**Headline:** *By Day 90, Dromaios has a live, compliant, AU-resident NDIS "Compliance + Capability"
offer with paying customers and a repeatable acquisition channel.*

| Gate | Target (recommended, founder to confirm) |
|------|------------------------------------------|
| **G1 — Product live** | DromaiosEd NDIS catalogue published; ClinicBoss MVP (C2/C3/C4 + V-SIRS/V-RP) usable end-to-end |
| **G2 — Compliance bar met** | AU data residency, APP/privacy posture, AI-governance guardrails, and claims discipline signed off **before any sale** |
| **G3 — First revenue** | ≥ 5–10 paying education orgs **and/or** 2–3 ClinicBoss bundle pilots (≥ 1 a *named, referenceable* lighthouse) |
| **G4 — Channel proven** | ≥ 1 repeatable acquisition channel showing CAC < first-year ACV; NDS-style partner conversation live |
| **G5 — Reusability proven** | ≥ 1 inbound aged-care or allied-health lead served from the same engine (validates the horizontal thesis) |

> Keep all public claims aligned to proof (company guardrail): no "trusted by" language until you
> have **named** reference customers; pilots are described as pilots.

---

## 2. Operating model for these 90 days

- **You (founder):** strategy, sales conversations, clinician/credibility relationships, final sign-off
  on all clinical/compliance content and claims.
- **AI (the force-multiplier):** drafts the entire course catalogue and assessments, generates
  ClinicBoss policy templates + the NDIS Practice Standards crosswalk, builds marketing/site copy,
  powers self-serve onboarding and first-line support, runs competitor/reg monitoring. **Human review
  before publish** on anything clinical, compliance, or claims-bearing.
- **Fractional/contract (engage only as cash allows):** a part-time dev to harden the ClinicBoss MVP;
  a compliance/privacy reviewer (few hours) for G2 sign-off; **1–2 clinicians from your network** for
  *content validation only* at this stage (paid micro-engagements, not full involvement yet — the
  network scales in the next quarter once revenue is rolling).
- **Cockpit synergy:** run this plan as Actions/Reviews in the existing Dromaios Cockpit; keep
  automations **draft-only/approval-gated** per `AI_CONTEXT.md` safety defaults.

---

## 3. Scope — in and out (discipline = speed)

**In scope (the MVP wedge):**
- DromaiosEd NDIS catalogue: universal mandatory stack + flagship OVA + NDIS registration-readiness.
- ClinicBoss MVP: **C2** Policy/Document Control, **C3** Training & Competency Register, **C4**
  Accreditation/Audit Readiness (NDIS Practice Standards crosswalk), **C8** Dashboard, plus light
  **V-SIRS** (reportable-incident workflow) and **V-RP** (restrictive-practice register) stubs.
- One transparent, self-serve-friendly pricing model and a "Compliance + Capability" bundle.
- One primary acquisition channel + one partner conversation (NDS-style).

**Explicitly OUT (resist until after Day 90):**
- Building an ambient scribe (integrate third-party later; SaMD/consent risk).
- Any clinically-influential AI, anything that could be read as TGA SaMD.
- Full care-management / rostering / claiming (that's incumbent turf — AlayaCare/ShiftCare/Lumary).
- Aged-care V-CM care-minutes engine, hospital/mining packs — later waves.
- Bespoke enterprise deals requiring long procurement — take inbound, don't chase.

---

## 4. The launch offer & pricing

- **DromaiosEd NDIS catalogue** — **per learner/year**, priced to undercut Ausmed/Altura on the long
  tail; complements (does not duplicate) the free NDIS Worker Orientation Module. Flagship **OVA** and
  **NDIS registration-readiness** courses are the differentiated, premium-leaning items.
- **ClinicBoss "Compliance + Capability" bundle** — ClinicBoss MVP + catalogue, **low monthly
  per-site** for the long tail / **per-participant** for SIL/SDA; implementation **waived** for the
  first 2–3 lighthouse customers in exchange for a named case study.
- **Channel pricing** — mirror the NDS/etrainu model: a member/partner discount to win an endorsement.
- Anchor the value to the **1 Jul 2026 registration** and **verification/certification audit** pain,
  and to the frozen-NDIS-price margin squeeze (sell *cost-saving compliance*, not premium spend).

---

## 5. The 30 / 60 / 90 plan

### PHASE 1 — Foundations & Compliance Bar (Days 1–30)
*Goal: a publishable product and a green compliance light. Build the engine; don't sell yet.*

**Workstream A — DromaiosEd catalogue (AI-built, human-reviewed)**
- W1: Lock the NDIS course list — Tier 0 mandatory stack (U01–U09), **F01 OVA**, **F03 NDIS
  Registration-Ready**, **S05 NDIS Worker Capability**. AI drafts learning outcomes + assessment items
  mapped to NDIS Practice Standards & Code of Conduct.
- W2–3: AI authors course content + knowledge-check assessments; **clinician micro-review** of OVA +
  any clinical content for accuracy; build accessible formats.
- W4: Publish catalogue on the LMS/delivery surface; smoke-test enrolment → completion → certificate
  → evidence record.

**Workstream B — ClinicBoss MVP**
- W1: Stand up multi-tenant skeleton on the existing Next.js/Prisma/Postgres stack (reuse the Cockpit
  `Action` model for C6 tasks). AU-region hosting confirmed.
- W2: **C3** Training & Competency Register (assign courses, track completion, renewal reminders) +
  **C2** Policy/Document Control (versioning, attestation).
- W3: **C4** Accreditation Readiness with the **NDIS Practice Standards crosswalk** (AI-generated
  draft, human-verified) + **C8** Dashboard (readiness score, training %).
- W4: Light **V-SIRS** (reportable-incident capture + 24h clock) and **V-RP** (restrictive-practice
  register) stubs; end-to-end demo data.

**Workstream C — Compliance / legal / AI governance (the G2 gate — blocks all selling)**
- W1–2: AU data-residency confirmed; APP/Privacy-Act posture documented; privacy policy incl.
  **automated-decision-making disclosure** (ahead of 10 Dec 2026).
- W2–3: AI-use guardrails written down — non-SaMD scope, no identifiable health data into third-party
  LLMs without basis, human-in-the-loop on compliance outputs. Map to `AI_CONTEXT.md` safety defaults.
- W3–4: Light external privacy/compliance review; **claims register** (every marketing claim ↔ its
  proof) per company guardrails. **Terms, DPA, security one-pager** drafted for buyers.
- **GATE G2 at end of W4: no outbound sales until this is signed off.**

**Workstream D — GTM groundwork (no selling yet)**
- W2–4: Landing page + the bundle offer (AI-drafted, claims-checked); set up analytics/CRM; define
  ICP (the SIL/SDA + price-sensitive long-tail provider facing 1 Jul registration); draft NDS-style
  partner pitch; line up 10–15 warm provider conversations for Phase 2.

**Phase 1 exit criteria:** G1 (product live) + G2 (compliance bar) met.

---

### PHASE 2 — Launch & First Revenue (Days 31–60)
*Goal: convert the cliff into first paying customers and a working channel.*

**Workstream A — Demand generation**
- W5: Soft launch to the warm list; publish reform-timed content ("NDIS registration 1 July — are
  your workers' training and Practice-Standards evidence ready?"). LinkedIn founder-led posts (within
  guardrails).
- W5–8: Run the primary channel experiment(s): (a) direct outreach to the warm ICP list;
  (b) **NDS-style partner** conversation toward an endorsement/member discount; (c) low-cost
  reform-deadline webinar/checklist lead magnet. Measure CAC vs ACV per channel.

**Workstream B — Sales & onboarding**
- W5–6: Convert education-only buyers (fast, low-friction, budgeted) — target the first **5–10 paying
  orgs**.
- W6–8: Stand up **2–3 ClinicBoss bundle pilots**; waive implementation for **1+ named lighthouse**;
  AI-assisted self-serve onboarding + founder-led white-glove for the lighthouse.

**Workstream C — Product hardening**
- W5–8: Fix friction found in real onboarding; ship the **AI evidence-assembler v1** (drafts the NDIS
  Practice-Standards evidence pack from C2/C3 records — the differentiation + margin engine), strictly
  human-reviewed before any submission.

**Workstream D — Proof & credibility**
- W7–8: Capture the first **named case study / reference** (with permission); pursue **CPD-style
  endorsement** path for the OVA + registration-readiness flagships (durable moat).

**Phase 2 exit criteria:** G3 (first revenue) on track; ≥ 1 channel showing healthy CAC:ACV.

---

### PHASE 3 — Convert, Prove Repeatability & Scale-Prep (Days 61–90)
*Goal: lock the lighthouse, prove the channel repeats, validate the horizontal thesis.*

**Workstream A — Convert & expand**
- W9–10: Convert pilots to paid; upsell education customers to the ClinicBoss bundle ahead of their
  audit/registration milestones.
- W9–12: Double down on the best channel; formalise the **NDS-style partner** deal if it converted.

**Workstream B — Reusability proof (the strategic unlock)**
- W10–12: Serve ≥ 1 **inbound aged-care or allied-health** lead from the *same* engine (swap crosswalk
  + a couple of electives) — proves the non-discriminatory horizontal thesis and de-risks Wave 1's
  next legs.

**Workstream C — Clinician-network on-ramp**
- W10–12: Convert the content-validation clinicians into a light **advisory + delivery** arrangement
  (instructor-led OVA, CPD badging) — the start of the "clinicians once money's rolling" phase.

**Workstream D — Measure & decide**
- W12: Compile the Day-90 scorecard against G1–G5; write the **Day-91 decision** (below).

**Phase 3 exit criteria:** G3–G5 met; a documented, funded plan for the next 90 days.

---

## 6. Metrics & instrumentation

Track weekly in the Cockpit (reuse `Review`/`Action`):

| Metric | Why |
|--------|-----|
| Paying education orgs / learner seats | Core revenue + the wedge working |
| ClinicBoss pilots → paid conversion | Land-and-expand proof |
| Named reference customers | Unlocks compliant marketing claims |
| CAC by channel vs first-year ACV | Channel viability (G4) |
| Audit-readiness score uplift (per customer) | The value story, evidenced |
| Time-to-first-value (signup → first evidence pack) | Onboarding friction |
| Inbound leads by segment | Validates horizontal reuse (G5) |
| Gross margin (esp. AI-authored content) | The AI-leverage thesis |

---

## 7. Lean budget envelope (illustrative — set your own)

Bias to AI + sweat equity; spend only where it unblocks a gate.

- **Build/host:** cloud (AU region), LMS/delivery surface, domain/email, dev tooling — modest monthly.
- **AI:** API/subscription spend for authoring + product features — the biggest "labour substitute".
- **Compliance:** a few hours of external privacy/compliance review (gates G2) — highest-ROI spend.
- **Clinician micro-engagements:** paid content-validation hours (small, fixed-scope).
- **Channel:** one low-cost webinar/lead magnet; NDS membership/affiliate where it buys endorsement.
- **Fractional dev:** engage **only after first revenue** to harden the MVP.

> Funding shape (master strategy §10): education revenue (fast, low-COGS) funds the ClinicBoss build;
> avoid fixed costs before G3.

---

## 8. Pre-sale compliance checklist (the G2 gate — do not skip)

- [ ] AU data residency confirmed for all customer/learner data.
- [ ] Privacy policy + APP compliance; **automated-decision-making disclosure** included.
- [ ] AI guardrails documented: **non-SaMD**; human-in-the-loop on compliance outputs; no identifiable
      health data into third-party LLMs without a compliant basis.
- [ ] No clinically-influential / diagnostic feature shipped (keeps us out of TGA device regulation).
- [ ] Claims register: every marketing claim mapped to evidence; no "trusted by" without named users.
- [ ] Buyer-facing terms, DPA, and a security one-pager ready.
- [ ] Cockpit automations remain draft-only / approval-gated.

---

## 9. Risks & kill/pivot criteria

| Risk | Mitigation | Kill/pivot signal |
|------|-----------|-------------------|
| Free NDIS Worker Orientation Module sets a price floor | Differentiate: competency-assessed, CPD-style, the compliance *record* | If buyers won't pay above free → reposition on ClinicBoss evidence value, not training alone |
| Long tail too price-sensitive / frozen NDIS prices | Low self-serve pricing; cost-saving framing | If ACV can't beat CAC in any channel by Day 60 → switch lead segment to aged care (higher WTP) |
| Registration cliff slips/changes | Sell durable audit-readiness, not just the deadline | If 1 Jul registration is materially deferred → lean on verification/certification audit pain instead |
| Solo bandwidth | AI does the heavy lifting; fractional dev post-revenue | If product can't reach G1 by W4 → cut scope to catalogue + C3 only |
| Compliance/AI misstep | G2 gate blocks selling until signed off | Any unresolved privacy/SaMD question → pause outbound, fix first |
| Incumbents (ShiftCare/Lumary/Ausmed) | Don't compete on care-mgmt/LMS breadth; own accreditation-evidence + OVA | — |

---

## 10. Day-91 decision gate

With the scorecard in hand, choose the next 90 days:
- **Scale NDIS** (channel works, CAC<ACV) — deepen V-SIRS/V-RP, formalise NDS partnership, pursue
  SIL/SDA certification-driven accounts.
- **Open Aged Care** (Wave 1 leg 2) — reuse the engine; add the **strengthened Standards crosswalk**
  + **V-CM care-minutes** for the high-WTP residential buyer (see `pathways/02`).
- **Lean into Allied Health** (Wave 1 leg 3) — self-serve CPD/supervision (`pathways/03`) if inbound
  signalled demand.
- **Engage the clinician network** in earnest for CPD accreditation + instructor-led delivery.

> The point of the 90 days is not just first revenue — it's a **validated, repeatable, horizontal
> engine** you can re-point at any market without rebuilding. That is the whole non-discriminatory
> thesis, proven in one segment.

---

### References
- `../00-master-strategy.md` (waves, wedge, pricing, AI model, reform calendar)
- `../pathways/02-care-disability-aged-ndis.md` (NDIS market analysis this plan executes)
- `../clinicboss-module-catalogue.md` (C2/C3/C4/C8, V-SIRS, V-RP, build sequence)
- `../dromaiosed-course-catalogue.md` (U-stack, F01, F03, S05)
