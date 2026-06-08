# ClinicBoss Module Catalogue

> Shared reference for all market pathway plans. Each pathway in `docs/strategy/pathways/`
> selects modules from this catalogue rather than re-defining them. ClinicBoss is positioned
> as a **healthcare compliance & operations platform** — explicitly **non-SaMD** (not a
> Software-as-a-Medical-Device), Australian-data-resident, and clinician-in-the-loop. This
> keeps regulatory risk low and entry fast across every segment.

## Design principles

1. **Horizontal core, thin vertical packs.** ~80% of every healthcare provider's compliance
   burden is the same (incidents, policies, training evidence, accreditation prep, worker
   credentials). Build that once; bolt a small, high-value pack onto each segment. This is how
   we enter **all** markets rapidly without discriminating — the engine is reused, only the
   standards crosswalk and a few fields change.
2. **Evidence, not features.** The buyer's real job-to-be-done is "survive the audit and keep
   the funding." Every module ends in **audit-ready evidence** mapped to the segment's standard.
3. **Non-SaMD by design.** ClinicBoss organises, tracks, reminds, and generates compliance
   documents with a human in the loop. It does **not** diagnose, triage, or recommend
   treatment. This avoids TGA medical-device obligations (which tightened via the Feb 2026
   AI-SaMD guidance) and keeps the build cheap and the sale low-friction.
4. **Builds on the existing Cockpit data model.** The Cockpit's `Action`, `Review`, `Risk`,
   `Decision`, `Automation`, and `LaunchpadLink` records are the same primitives a compliance
   platform needs. ClinicBoss is the externally-facing, multi-tenant evolution of the same core.

---

## Core platform modules (every segment)

| ID | Module | What it does | Displaces / competes with |
|----|--------|--------------|----------------------------|
| **C1** | **Incident & Risk Management** | Capture incidents/hazards/complaints/near-misses; configurable severity; investigation workflow; risk register; corrective actions → tasks; trend analytics. | RiskMan/RLDatix, Riskonnect, Aspirico, Donesafe |
| **C2** | **Policy & Document Control** | Version-controlled policies/procedures/forms; review-date reminders; staff distribution + read-attestation; audit trail; template library. | RLDatix PROMPT/PolicyStat, PolicyConnect |
| **C3** | **Training & Competency Register** | Tracks who must do what by when; assigns DromaiosEd (or any SCORM) courses; completion evidence; renewal reminders; **competency-based practical sign-off** (not just eLearning ticks). | Ausmed, Altura, etrainu |
| **C4** | **Accreditation & Audit Readiness** ⭐ | The flagship. A **standards-mapping engine** that maps the org's evidence (from C1–C3, C5) to the segment's standard, runs self-assessment, surfaces gaps, prepares mock audits, and keeps the org **continuously "short-notice ready."** Crosswalks shipped per segment. | The white space — most incumbents do one silo; few stitch evidence to standards. |
| **C5** | **Worker Screening & Credentialing** | Register of staff/contractors: AHPRA registration, police/worker-screening clearances, CPR, immunisations, scope of practice, expiries → renewal reminders + lock-outs. | cGov, RLDatix Credentialing |
| **C6** | **Action & Task Management** | Every gap/finding/corrective action becomes a tracked Action with owner/due/status. Inherits the Cockpit `Action` model. | (native strength) |
| **C7** | **Compliance Calendar & Renewals** | Single calendar of every recurring obligation (accreditation cycle, CPD year, clearance expiry, fridge log, drill, reportable-incident clock). Drives notifications. | (native strength) |
| **C8** | **Reporting & Evidence Dashboard** | Board/manager view of compliance posture, training %, open incidents, audit readiness score; one-click evidence export for assessors. | Varies |
| **C9** | **Open Disclosure & Complaints** | Structured open-disclosure workflow + complaints handling tied to incidents. | RLDatix, manual |

---

## Vertical packs (selected per pathway)

| ID | Pack | Modules / fields added | Primary segment(s) |
|----|------|------------------------|--------------------|
| **V-OVA** | **Occupational Violence & Aggression** | OVA incident type, body-map, post-incident support workflow, hotspot analytics, links to OVA training (DromaiosEd flagship). | All — esp. hospital, aged care, justice, ED |
| **V-SIRS** | **Serious / Reportable Incident** | Aged-care SIRS (8 categories, P1 ≤24h / P2 ≤30d / final ≤60d clocks) and NDIS reportable-incident workflows; regulator-ready notification packs. | Aged care, NDIS |
| **V-RP** | **Restrictive Practices & Behaviour Support** | RP register, authorisation tracking (state-specific), behaviour-support-plan linkage, reporting. | Aged care, NDIS |
| **V-CM** | **Care Minutes & Rostering** | Care-minute capture vs 215/44-RN target, roster-to-target, externally-auditable Care Minutes Performance Statement support. | Residential aged care |
| **V-GP** | **General Practice Pack** | Cold-chain/vaccine-fridge logs, recall/reminder safety register, PIP-QI data extract helper, RACGP 5th-ed crosswalk. | GP, AMS |
| **V-AMS** | **ACCHO Pack** | nKPI (20 indicators) + OSR reporting helpers, CTG/kinship/cultural-safety fields, dual-accreditation crosswalk (RACGP + QIC/ISO), Indigenous data-sovereignty controls. | AMS/ACCHO |
| **V-HOSP** | **Hospital / Day-Procedure Pack** | NSQHS 2nd-ed (8 standards) crosswalk, credentialing & scope-of-practice committee workflow, hand-hygiene/IPC audit, short-notice-assessment readiness. | Hospitals, day surgeries |
| **V-MINE** | **Fitness-for-Work & Site Safety** | Fitness-for-work + health-surveillance records (CMWHS/dust), D&A program (AS/NZS 4308/4760), fatigue, statutory competency/induction, contractor pre-qual & site-access gating. | Mining, occupational health |
| **V-AH** | **Allied Health Pack** | CPD logbook, clinical-supervision logs (provisional psychologists/new grads/students), NDIS/aged-care documentation helpers. | Allied health |
| **V-PHARM** | **Pharmacy Pack** | QCPP→QSPP accreditation crosswalk, professional-service program documentation (MedsChecks, DAAs, vax), cold-chain/SOP. | Community pharmacy |
| **V-DENT** | **Dental Pack** | IPC/sterilisation reprocessing logs, radiation-apparatus licensing, NSQHS day-procedure crosswalk (sedation/surgical). | Dental |
| **V-DIAG** | **Diagnostics QMS Pack** | DIAS crosswalk (imaging) + NATA/RCPA **ISO 15189:2022** crosswalk (pathology); radiation dose monitoring vs NDRLs; QMS (document control, internal audit, CAPA/nonconformance, management review); equipment QA/calibration logs; **My Health Record upload assurance** (1 Jul 2026). | Diagnostic imaging, pathology |
| **V-COSMETIC** | **Cosmetic / Aesthetic Pack** | **Advertising-compliance monitoring** (TGA injectables + AHPRA rules); aesthetic **digital consent** (two-consult rule, BDD screening, cooling-off); injection-mapping & before/after photo governance; NSQHS Cosmetic Surgery Standards crosswalk; scope-of-practice/CPD under the 2025 non-surgical guidelines. | Cosmetic surgery & non-surgical/injectables |
| **V-ART** | **Fertility / ART Pack** | **Chain-of-custody / electronic-witnessing** integration (RI Witness/IMT Matcher); incident management & transparency; **RTAC → ACSQHC (2027) accreditation** crosswalk; embryologist/nurse/counsellor credentialing & CPD; donor-conception registry integration. | IVF / ART clinics |

---

## AI features (cross-cutting, all non-SaMD, clinician-in-the-loop, onshore)

These are the **safe, sellable** AI plays identified in the research — they automate
*compliance and documentation*, never clinical decisions:

- **Evidence assembler** — drafts the accreditation evidence pack by mapping existing records to
  the standard (human reviews before submission). Reported 50–70% audit-prep time reduction in
  analogous tools (US evidence — flag).
- **Policy & document generator** — drafts/updates policies from the standard + the org's context;
  human approves. Localises by state (e.g. restrictive-practice authorisation differs per state).
- **Incident triage assist** — suggests category/severity/regulator-reportability for a logged
  incident; human confirms. (Stays non-SaMD: it classifies a *compliance* event, not a patient.)
- **nKPI/OSR & PIP-QI report drafting** (AMS/GP) — assembles the funding-linked report from CIS
  data for human sign-off.
- **Content authoring engine** (internal) — the same AI that lets a small team author and localise
  the DromaiosEd catalogue fast (see `dromaiosed-course-catalogue.md`).

### Hard guardrails (apply everywhere — see master strategy §AI)
- Australian data residency; APP-compliant; no identifiable health data into third-party LLMs
  without a compliant basis.
- No autonomous clinical decision-making; nothing marketed as TGA-exempt that "influences
  clinical decisions."
- Automated-decision-making disclosure in privacy policy before **10 Dec 2026** (Privacy Act).
- AMS: Indigenous Data Sovereignty / community data governance.
- If an AI scribe is ever bundled, it requires documented patient consent + clinician oversight
  (AHPRA/RACGP Aug-2024 guidance) — but the recommended posture is to **integrate** third-party
  scribes (Heidi/Lyrebird) rather than build one, avoiding SaMD exposure.

---

## Build sequence (cheapest path to revenue)

1. **MVP wedge (Months 0–4):** C3 (Training register) + C2 (Policy) + C4 (Accreditation
   readiness, one crosswalk) + C8 (Dashboard). This is sellable to *any* segment and pairs with
   the DromaiosEd catalogue as a "Compliance + Capability" bundle. Lowest build cost, no SaMD,
   onshore.
2. **Land expander (Months 3–8):** C1 (Incidents) + C5 (Credentialing) + C7 (Calendar) +
   first two vertical packs for the launch segments (V-SIRS/V-RP for care & disability; V-AH for
   allied health).
3. **Vertical breadth (Months 6–18):** add V-GP/V-AMS, V-HOSP, V-MINE, V-PHARM/V-DENT as each
   pathway opens.
4. **AI evidence layer (Months 6–18, in parallel):** evidence assembler + policy generator +
   report drafting — the margin and differentiation engine.

> Pricing for these modules is set in `00-master-strategy.md` (§Pricing architecture) and applied
> per segment in each pathway doc.
