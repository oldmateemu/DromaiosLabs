# ClinicBoss MVP — Build Spec (NDIS Wave-1 Launch)

> Engineering spec for the ClinicBoss MVP that the **90-day NDIS launch plan** (`../launch-plans/
> 90-day-ndis-launch.md`, Phase 1 Workstream B) depends on. Scope is deliberately the **G1 wedge**:
> **C2 Policy/Document Control, C3 Training & Competency Register, C4 Accreditation/Audit Readiness
> (NDIS Practice Standards crosswalk), C8 Dashboard**, plus **light V-SIRS and V-RP** stubs — and the
> multi-tenant + compliance foundations they all need. Module IDs are from
> `../clinicboss-module-catalogue.md`.
>
> **Non-negotiables carried from strategy:** non-SaMD (organise/track/draft compliance — never
> diagnose/triage/recommend treatment); Australian data residency; APP-compliant; clinician-in-the-
> loop on every AI output; automated-decision-making disclosure; mirrors the Cockpit `AI_CONTEXT.md`
> safety defaults (no silent execution; approval-gated AI). This spec must not introduce any feature
> that pulls ClinicBoss into TGA medical-device scope.

---

## 1. Reuse vs new — stack decisions

**Reuse the Cockpit stack and conventions verbatim** (proven, already in `package.json`):
- Next.js 15 App Router + React 19 + TypeScript; server actions (`"use server"`) as the mutation API.
- Prisma 6 + Postgres; `prisma` singleton from `src/lib/db.ts`.
- Tailwind; `lucide-react`; `clsx`; `date-fns`; `zod` for input validation.
- Vitest with **co-located `*.test.ts`** and the established pattern of **pure domain functions**
  (cf. `src/lib/renewal-reminders.ts`) that are unit-tested without a DB, called from a thin
  services/server-action layer.
- Ollama (`src/lib/ollama.ts`) as the **local-first** AI provider; cloud providers behind the same
  interface, gated (see §8).
- Date handling via the existing `dateKey()` ISO-slice convention.

**The one big new thing — multi-tenancy.** The Cockpit is a single-tenant *internal* tool (no `Org`
model; one admin per deployment). ClinicBoss is **customer-facing and multi-tenant**. Every ClinicBoss
record is scoped to an `Org` (tenant), and customer data must be isolated from the founder's internal
cockpit.

### Decision D1 — deployment topology (recommended)
Run ClinicBoss as a **separate deployable with its own Postgres database**, reusing the same repo
patterns and shared `src/lib` utilities (copy/extract, don't import across a tenancy boundary).
Rationale: keeps **customer health-adjacent data physically separated** from the internal Cockpit DB
(privacy/APP, blast-radius, and a clean story for buyers), while still reusing the stack and the
team's muscle memory. A monorepo with two apps (`apps/cockpit`, `apps/clinicboss`) + shared `packages/`
is the tidy form; the cheapest MVP form is a **second Next app + second DB** in this repo under
`clinicboss/`. *Do not* multiplex customer tenants into the existing cockpit DB.
> If speed forces a single app short-term, gate ClinicBoss behind its own route group `(clinicboss)`,
> its own auth context, and an **`orgId` on every row with enforced row-level scoping** (§3) — but
> treat that as tech debt to split before onboarding real customer #2.

---

## 2. Scope

**In (MVP / G1):** Org + membership + auth; C2, C3, C4 (NDIS crosswalk), C8; light V-SIRS + V-RP;
the AI evidence-assembler v1 + policy-generator (human-approved); audit trail; AU-resident hosting.

**Out (post-G1 / later waves — explicit):** ambient scribe (integrate, never build); any clinically-
influential/diagnostic AI; full care-management, rostering, claiming/invoicing (incumbent turf —
AlayaCare/ShiftCare/Lumary); aged-care V-CM care-minutes; GP/hospital/mining packs; billing/payments;
mobile apps; SSO/SCIM; multi-region. Tracked in the launch plan §3.

---

## 3. Tenancy, auth & RBAC

### Models (new)
- **`Org`** — the customer (an NDIS provider). `id, name, slug, registrationGroups Json, createdAt`.
- **`OrgMembership`** — user↔org with a role. `id, orgId, userId, role (OrgRole), createdAt`.
- **`OrgRole`** enum: `OWNER` (provider MD), `QUALITY_MANAGER`, `MANAGER`, `WORKER`, `AUDITOR_READONLY`.
- Reuse the Cockpit's `User`/`Session`/bcrypt + cookie auth (`src/lib/auth.ts`, `session-cookie.ts`).

### Isolation rules (hard requirements)
1. **Every ClinicBoss model carries `orgId`** and is always queried through a helper that injects the
   caller's `orgId` — never raw `prisma.x.findMany()` in a server action without org scoping.
2. A single `requireOrgContext()` (analogue of `requireUser()`) resolves `{ user, org, role }` from the
   session + active org and is called at the top of every server action.
3. **RBAC matrix** enforced in the services layer (pure, testable):

| Capability | OWNER | QUALITY_MANAGER | MANAGER | WORKER | AUDITOR_READONLY |
|---|---|---|---|---|---|
| Manage org/members | ✅ | – | – | – | – |
| Author/approve policies (C2) | ✅ | ✅ | – | – | – |
| Attest to policies (C2) | ✅ | ✅ | ✅ | ✅ | – |
| Assign/track training (C3) | ✅ | ✅ | ✅ | – | – |
| Complete training / sign competency (C3) | ✅ | ✅ | ✅(sign) | ✅(complete) | – |
| Edit crosswalk evidence (C4) | ✅ | ✅ | – | – | – |
| Log/triage incident (V-SIRS) | ✅ | ✅ | ✅ | ✅(log) | – |
| Record restrictive practice (V-RP) | ✅ | ✅ | ✅ | ✅(record) | – |
| View dashboard/export (C8) | ✅ | ✅ | ✅ | own only | ✅ |
| Run AI assist (draft) | ✅ | ✅ | – | – | – |
| Approve AI output | ✅ | ✅ | – | – | – |

`AUDITOR_READONLY` is the time-boxed external-assessor view — read + evidence export only.

---

## 4. Data model — Prisma additions

All models include `orgId String` + `@@index([orgId, ...])`. CUID ids, `createdAt/updatedAt` per repo
convention. Sketch (final field lists firm up in PR review):

```prisma
enum OrgRole { OWNER QUALITY_MANAGER MANAGER WORKER AUDITOR_READONLY }

model Org {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  registrationGroups Json?      // NDIS registration groups in scope
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  memberships OrgMembership[]
  // back-relations: policies, courses, evidence, incidents, restrictivePractices...
}

model OrgMembership {
  id        String  @id @default(cuid())
  orgId     String
  userId    String
  role      OrgRole @default(WORKER)
  createdAt DateTime @default(now())
  org  Org  @relation(fields: [orgId], references: [id], onDelete: Cascade)
  @@unique([orgId, userId])
  @@index([orgId])
}

// ---- C2 Policy / Document Control ----
enum PolicyStatus { DRAFT IN_REVIEW PUBLISHED ARCHIVED }
model Policy {
  id        String @id @default(cuid())
  orgId     String
  title     String
  category  String                // e.g. "Incident Management", "Restrictive Practices"
  status    PolicyStatus @default(DRAFT)
  reviewAt  DateTime?             // next review date -> renewal engine (reuse renewal-reminders pattern)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  versions  PolicyVersion[]
  @@index([orgId, status])
  @@index([orgId, reviewAt])
}
model PolicyVersion {
  id         String @id @default(cuid())
  policyId   String
  versionNo  Int
  body       String              // markdown
  changeNote String?
  authoredById String?
  publishedAt  DateTime?
  createdAt  DateTime @default(now())
  attestations PolicyAttestation[]
  @@unique([policyId, versionNo])
}
model PolicyAttestation {           // "I have read & understood" — audit evidence
  id        String @id @default(cuid())
  orgId     String
  policyVersionId String
  userId    String
  attestedAt DateTime @default(now())
  @@unique([policyVersionId, userId])
  @@index([orgId])
}

// ---- C3 Training & Competency Register ----
enum CompletionState { ASSIGNED IN_PROGRESS COMPLETED EXPIRED }
model Course {                      // maps to a DromaiosEd course code (N-OVA, N-REG, ...)
  id        String @id @default(cuid())
  orgId     String?               // null = global catalogue; set = org-custom
  code      String                // "N-OVA"
  title     String
  renewalMonths Int?              // annual refresher cadence
  requiresPracticalSignoff Boolean @default(false)  // N-MED/N-MAN/N-RP
  createdAt DateTime @default(now())
  @@index([orgId])
}
model TrainingAssignment {
  id        String @id @default(cuid())
  orgId     String
  courseId  String
  userId    String
  state     CompletionState @default(ASSIGNED)
  completedAt DateTime?
  expiresAt   DateTime?           // drives renewal reminders
  practicalSignedById String?     // qualified assessor for competency sign-off
  practicalSignedAt   DateTime?
  @@index([orgId, state])
  @@index([orgId, expiresAt])
}

// ---- C4 Accreditation / Audit Readiness (NDIS Practice Standards crosswalk) ----
enum EvidenceState { NOT_STARTED IN_PROGRESS READY GAP }
model StandardItem {               // crosswalk node (seeded, versioned) - NDIS Practice Standards
  id        String @id @default(cuid())
  framework String                // "NDIS_PRACTICE_STANDARDS"
  frameworkVersion String
  ref       String                // outcome/indicator reference
  title     String
  guidance  String?
  @@unique([framework, frameworkVersion, ref])
}
model EvidenceLink {               // org's evidence mapped to a StandardItem
  id        String @id @default(cuid())
  orgId     String
  standardItemId String
  state     EvidenceState @default(NOT_STARTED)
  note      String?
  // soft links to evidence sources (policy version, training, incident...)
  policyVersionId String?
  trainingCourseId String?
  attachmentUrl String?
  updatedById String?
  updatedAt DateTime @updatedAt
  @@unique([orgId, standardItemId])
  @@index([orgId, state])
}

// ---- V-SIRS (light) NDIS reportable incidents ----
enum IncidentSeverity { LOW MODERATE SERIOUS }
model Incident {
  id        String @id @default(cuid())
  orgId     String
  occurredAt DateTime
  category  String                // NDIS reportable-incident category
  severity  IncidentSeverity @default(LOW)
  reportable Boolean @default(false)
  immediateNotifyDueAt DateTime?  // 24h clock
  fiveDayFormDueAt     DateTime?  // 5-business-day form clock
  status    String @default("OPEN")
  narrative String
  loggedById String?
  createdAt DateTime @default(now())
  @@index([orgId, status])
  @@index([orgId, immediateNotifyDueAt])
}

// ---- V-RP (light) restrictive practices ----
model RestrictivePractice {
  id        String @id @default(cuid())
  orgId     String
  participantRef String            // pseudonymous reference - minimise PII (see §7)
  practiceType String              // one of the 5 regulated types
  authorised Boolean @default(false)
  authorisationState String?       // state/territory-specific
  behaviourSupportPlanRef String?
  recordedAt DateTime @default(now())
  @@index([orgId])
}

model AuditEvent {                  // cross-cutting tamper-evident audit trail
  id        String @id @default(cuid())
  orgId     String
  actorId   String?
  entity    String                 // "Policy", "Incident", ...
  entityId  String
  action    String                 // "PUBLISH", "ATTEST", "TRIAGE_AI_APPROVE", ...
  meta      Json?
  createdAt DateTime @default(now())
  @@index([orgId, entity, entityId])
  @@index([orgId, createdAt])
}
```

Reuse pattern: the **renewal/reminder engine** (`src/lib/renewal-reminders.ts`) generalises to drive
**policy `reviewAt`, training `expiresAt`, worker-screening expiry, and incident clocks** — extract it
into a pure `buildComplianceCalendar()` function and unit-test it the same way.

---

## 5. Module specs

Each module = pure domain functions (tested) + thin server actions + App Router pages. Acceptance
criteria are the G1 bar.

### C2 — Policy & Document Control
- **Workflows:** create policy → draft version (markdown) → in-review → publish → staff attestation →
  scheduled review reminder. Version history immutable; published versions never edited (new version).
- **Server actions:** `createPolicy`, `savePolicyDraft`, `submitForReview`, `publishPolicyVersion`,
  `attestPolicy`, `schedulePolicyReview`. All write an `AuditEvent`.
- **AC:** a QM can publish a versioned policy; a worker can attest; attestation % and overdue reviews
  surface in C8; every state change is in the audit trail.

### C3 — Training & Competency Register
- **Workflows:** assign course(s) to users/roles → worker completes (records completion + cert) →
  renewal reminder before `expiresAt` → **practical competency sign-off** by a qualified assessor for
  `requiresPracticalSignoff` courses (eLearning tick alone is insufficient — strategy requirement).
- Integrates DromaiosEd catalogue by `code`; SCORM/xAPI ingestion is post-MVP (MVP = completion record
  + uploaded certificate URL).
- **Server actions:** `assignTraining`, `markCourseComplete`, `signPracticalCompetency`, `bulkAssign`.
- **AC:** assignment→completion→expiry lifecycle works; a course needing practical sign-off cannot show
  "compliant" without an assessor signature; training % feeds C8 and C4 evidence.

### C4 — Accreditation & Audit Readiness ⭐ (the flagship)
- **The crosswalk engine.** Seed `StandardItem` rows for the **NDIS Practice Standards** (framework +
  version). For each, the org maintains an `EvidenceLink` with a state and soft links to the actual
  evidence (a published policy version, a training course's completion stats, an incident record, or an
  uploaded attachment).
- **Readiness scoring** (pure function `computeReadiness(evidenceLinks): { byOutcome, overall, gaps }`):
  deterministic, explainable, **no AI in the score** (keeps it non-SaMD and auditable). `% READY`,
  list of `GAP` items → each gap can spawn a tracked task (reuse the `Action`-style task pattern).
- **Auditor view:** `AUDITOR_READONLY` sees the crosswalk + one-click **evidence export** (PDF/zip).
- **Server actions:** `setEvidenceState`, `linkEvidence`, `generateEvidencePack` (assembles export),
  `createGapTask`.
- **AC:** an org can self-assess against the NDIS Practice Standards, see a readiness score + gap list,
  and export an assessor-ready evidence pack; verification vs certification pathway is reflected.

### C8 — Reporting & Evidence Dashboard
- Read-model aggregation (one server function, `getOrgComplianceSnapshot(orgId)`): audit-readiness
  score, training completion %, policy attestation %, open incidents + overdue clocks, upcoming
  renewals (from the compliance calendar), restrictive-practice register count.
- **AC:** board/manager one-screen posture; matches the underlying records; export.

### V-SIRS (light) — NDIS reportable incidents
- Capture incident → AI **triage *assist*** suggests category/severity/reportability (human confirms —
  §8) → if reportable, set **both clocks**: 24h immediate notification **and** 5-business-day form;
  surface overdue in C8. Notification *pack* generation only (no auto-submit to the regulator in MVP).
- **AC:** logging an incident sets the correct dual clocks; nothing is reported to a regulator without
  explicit human action; classification is human-confirmed.

### V-RP (light) — restrictive practices
- Register entry: practice type (one of 5), authorisation status (state-specific), behaviour-support-
  plan reference; unauthorised use flagged as a reportable incident (links to V-SIRS).
- **AC:** register records the 5 regulated types with state-specific authorisation; unauthorised use is
  surfaced; participant data minimised to a pseudonymous reference (§7).

---

## 6. NDIS Practice Standards crosswalk — data & seeding

- Stored as **seed data** (`prisma/seed-clinicboss.ts`), versioned by `frameworkVersion`, so a standards
  change ships as a new version without breaking existing evidence. **Re-verify the current Practice
  Standards version before seeding** (the strategy docs flag NDIS reforms through 2026).
- Each `StandardItem` is human-authored/AI-drafted-then-reviewed; the crosswalk content itself is a
  reviewed artifact (cf. the DromaiosEd QA checklist).
- `EvidenceState` transitions are explicit and audited; the readiness score is a **pure deterministic
  rollup**, never AI — so an assessor can trace every number to its records.

---

## 7. Privacy, data residency & the non-SaMD line (hard requirements)

- **AU data residency:** Postgres + object storage + any AI inference in an Australian region.
  Document the region in the buyer security one-pager (launch plan §8).
- **Data minimisation:** ClinicBoss is a *compliance/ops* system, not a clinical record. **Do not store
  participant clinical data.** V-RP/incidents use a **pseudonymous `participantRef`**, not identifiable
  health records. This both protects privacy and keeps ClinicBoss clearly **non-SaMD**.
- **APP compliance:** privacy policy incl. **automated-decision-making disclosure**; PIA for the AI
  triage assist before launch (launch plan G2).
- **Non-SaMD guardrail (architectural):** AI may classify a *compliance event*, draft a *document*, or
  assemble *evidence* — it must never diagnose a person, triage clinical urgency, or recommend
  treatment. Code-enforce by keeping AI outputs as **drafts requiring human approval** and never
  branching clinical care on an AI output.
- **Audit trail:** every consequential mutation writes an `AuditEvent` (tamper-evident; append-only).
- **Tenant isolation tests:** a test suite asserts no cross-org read/write is possible (negative tests).

---

## 8. AI features (v1) — non-SaMD, clinician-in-the-loop

Provider abstraction extends `src/lib/ollama.ts` into an `AssistantProvider` interface: **Ollama
(local-first, default for drafting)**; cloud providers gated behind a flag with **no identifiable
health data egress** and APP basis. Mirror the Cockpit `AssistantDraft` + approval model (draft →
human approve → apply).

1. **Evidence assembler v1 (C4):** drafts the NDIS evidence pack by mapping existing records to
   `StandardItem`s; human reviews before the pack is finalised.
2. **Policy generator (C2):** drafts/updates a policy from the standard + org context; state-localised
   where relevant; human approves the version before publish.
3. **Incident triage assist (V-SIRS):** suggests category/severity/**reportability** for a logged
   incident; human confirms. Classifies a *compliance* event, **not a patient** — stays non-SaMD.

All three: outputs are `AssistantDraft`-style records, **never auto-applied**, always audited, and
governed by the disclosure rule. No ambient scribe (integrate Heidi/Lyrebird later if ever).

---

## 9. Server-action & validation surface

- All mutations are server actions (`"use server"`) in `clinicboss/app/actions.ts`, each: (1)
  `requireOrgContext()`, (2) RBAC check (pure, tested), (3) `zod` parse of `FormData`, (4) service call,
  (5) `AuditEvent`, (6) `revalidatePath`. Mirrors `src/app/actions.ts`.
- Pure domain logic in `clinicboss/lib/*` with co-located `*.test.ts` (readiness scoring, RBAC matrix,
  clock calculations, compliance calendar) — **DB-free, fully unit-tested**.

## 10. UI / routes (App Router, `(clinicboss)` group or separate app)

```
/login                          (reuse cockpit auth UI patterns)
/                               C8 dashboard (org compliance snapshot)
/policies                       C2 list + status
/policies/[id]                  versions, publish, attestations
/training                       C3 register (assignments, expiries, sign-offs)
/accreditation                  C4 crosswalk (readiness score, gaps, evidence export)
/incidents                      V-SIRS list + clocks
/incidents/[id]                 capture + AI triage assist (human confirm)
/restrictive-practices          V-RP register
/settings/members               org members + roles (OWNER)
/audit                          AuditEvent log (QM/auditor)
```

Tailwind + the cockpit's `app-shell`/`nav-link`/`forms` components, restyled for the customer brand.

## 11. Testing & CI

- Vitest, co-located, **pure-function-first** (matches repo). Mandatory suites: RBAC matrix, tenant-
  isolation negative tests, readiness scoring, incident dual-clock math, compliance-calendar, policy
  versioning invariants.
- Reuse the repo's `lint` (eslint `--max-warnings=0`), `typecheck`, `test`, `build` gates; add a
  `db:seed-clinicboss`. Keep the same `deployment-preflight` discipline.

## 12. Build sequence (maps to the 90-day plan, Phase 1 Workstream B)

| Week | Deliverable |
|---|---|
| **W1** | Multi-tenant skeleton (D1), `Org`/`OrgMembership`/auth context, AU-region hosting, `AuditEvent`, RBAC scaffold + tests |
| **W2** | **C3** Training register + **C2** Policy/Document control (+ versioning/attestation); compliance-calendar extraction |
| **W3** | **C4** crosswalk engine + NDIS Practice Standards seed + readiness scoring + **C8** dashboard |
| **W4** | Light **V-SIRS** (dual clocks) + **V-RP** stubs; evidence-pack export; end-to-end demo seed; smoke test → **G1** |
| **Phase 2 (M3–8)** | AI evidence-assembler v1 + policy generator + triage assist (human-approved); auditor read-only + export polish; onboarding flow |

## 13. Definition of Done (G1 gate)

- A demo org can: publish a versioned policy + collect attestations; assign + complete training incl. a
  practical sign-off; self-assess against the **NDIS Practice Standards** and export an assessor-ready
  evidence pack; log a reportable incident with **both** NDIS clocks; record a restrictive practice; and
  see all of it on the C8 dashboard.
- Tenant isolation proven by negative tests; every consequential action audited; **no** AI output is
  applied without human approval; AU-resident; privacy/ADM-disclosure + non-SaMD posture documented and
  signed off (launch plan **G2**).
- `lint` + `typecheck` + `test` + `build` green; seed + preflight run clean.

## 14. Open decisions (resolve in PR review)
- **D1** topology (separate app+DB vs single app) — recommendation: separate DB now.
- Object storage choice for attachments/evidence packs (AU region).
- Exact NDIS Practice Standards version to seed (re-verify at build time).
- Whether C6 (task management) is reused from the cockpit `Action` model or a lightweight org-scoped
  `Task` — recommendation: org-scoped `Task` to preserve tenant isolation.

## 15. Out of scope (restated)
Ambient scribe; clinical/diagnostic AI; care-management/rostering/claiming; aged-care V-CM; other
segment packs; payments/billing; SSO/SCIM; native mobile; multi-region. These belong to later waves or
are deliberately ceded to incumbents (see `../00-master-strategy.md`).

---

### References
- `../launch-plans/90-day-ndis-launch.md` (Phase 1 Workstream B — what this spec builds)
- `../clinicboss-module-catalogue.md` (C2/C3/C4/C8, V-SIRS, V-RP, build sequence, AI guardrails)
- `../courses/ndis-course-outlines.md` (the DromaiosEd codes C3 assigns; competency sign-off)
- `../pathways/02-care-disability-aged-ndis.md` (the NDIS regulatory drivers this encodes)
- Cockpit `AI_CONTEXT.md`, `docs/DATA_MODEL.md` (the `Action`/safety patterns reused)
