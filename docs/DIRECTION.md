# Direction & SWOT — Dromaios Labs

> **Status:** Advisory evaluation, produced 2026-07-01 (repo state at commit `073bcc1`).
> **Audience:** The founder, and every future AI session working in this repo.
> **How to use:** Read this after `AI_CONTEXT.md` and before starting any new
> feature. Section 7 (guardrails) is binding on AI sessions. Sections 5–6
> (direction) are the recommended operating direction; adopting or amending it
> is a founder decision recorded in `docs/DECISIONS.md`.
> **Keep it honest:** Update this doc when a SWOT item is resolved, a gate is
> passed, or the direction changes — stale direction docs misroute AI sessions.

---

## 1. Verdict

The engineering is excellent and the strategy is excellent — and they are
currently two different companies. Five weeks of effort (~18k LOC, 55 commits)
produced a genuinely well-built internal cockpit with a code-enforced safety
spine, while the strategy corpus commits Dromaios Labs to external revenue
(DromaiosEd courses, ClinicBoss SaaS) anchored to a regulatory window whose
first cliff — NDIS mandatory registration — landed **1 July 2026, the day of
this evaluation**. Zero revenue-product code, course content, or customer
artifacts exist in the repo. The cockpit has become the perfect procrastination
surface: every session produces visible, tested, safety-compliant progress on a
product with exactly one user. The single highest-leverage act available is to
repoint the proven founder-plus-AI execution engine from internal tooling to
revenue artifacts, and to write that repointing into the decision register so
future sessions inherit it.

## 2. Where things stand (2026-07-01)

- **Product:** Dromaios Cockpit — single-user, local/VPN-first Next.js 15 +
  Prisma/Postgres app. 14 authenticated surfaces (13 route directories plus the
  Today board), 6 approval-gated automations, local OCR document intake, Ollama
  local-first AI drafts.
- **Quality:** 45 co-located test files, ratcheting coverage floors
  (85/71/82/86), zero-warning lint, strict TS, SHA-pinned CI running
  lint/typecheck/coverage/flow-tests/build/preflight. Newest code
  (document intake) is the strongest — quality is rising, not decaying.
- **Strategy:** 2,561-line corpus (`docs/strategy/`) covering 8 AU healthcare
  segments, a regulatory sales calendar 2025–2028, module/course catalogues,
  and a 90-day NDIS launch plan whose assumed start date has already passed.
- **Company:** Registered and operating (Xero, Airwallex, Lawpath live), but
  the setup checklist's own critical items are open: professional indemnity
  insurance, privacy policy/APP compliance, NDB response plan, TGA/SaMD
  boundary memo.
- **Revenue:** None, and no revenue-facing artifact in the repo.

## 3. SWOT

### Strengths — protect these

1. **Safety spine enforced in code, not just docs.** All automation gate logic
   is centralized in `src/lib/automations.ts` (`canAutomationRun` /
   `canAutomationPrepareDraft` + assert wrappers); refusals are recorded as
   `BLOCKED`, not errors. All six automations run at `DRAFT_ONLY` or
   `APPROVAL_REQUIRED`. Public posting is gated by
   `src/lib/posting-guardrail.ts`.
2. **Local-first privacy is a code-level guarantee.** `src/lib/ollama.ts`
   refuses off-box Ollama for intake extraction unless
   `INTAKE_ALLOW_REMOTE_OLLAMA=true` (fail-safe URL parsing, tested with a
   no-network assertion); intake documents default `sensitive=true`; all binds
   default to loopback. In an AU health/NDIS market this is a differentiator,
   not hygiene.
3. **Enforced layered architecture.** Exactly two files import Prisma
   (`services.ts`, `auth.ts`); all 32 Server Actions are thin
   requireUser-delegate-redirect wrappers; ~28 framework-free pure helpers each
   carry a co-located test. Auth coverage was hand-verified complete: every
   authenticated action calls `requireUser()`, and `/digest` is gated.
4. **A quality ratchet rare for a 5-week-old solo AI-built repo.** Behavioral
   tests (race guards, domain-reclassification contracts, privacy no-fetch
   assertions), coverage floors, zero-warning lint, SHA-pinned CI.
5. **Docs-as-contract culture with high doc-to-code fidelity.** All six
   automations match their docs name-for-name; implementation plans were
   executed with commit messages matching the plan verbatim; workflow
   contracts exist in prose + JSON with quantified promotion rules.
6. **History-preserving data model.** Action as hub; optional FKs with
   `SetNull` everywhere history matters; 15 enums backing state machines;
   clean, never-edited migrations.
7. **An honest, source-flagged strategy corpus** with confidence labels,
   applied self-corrections, and claims discipline enforced in software.
8. **The repo is purpose-built for AI operation** — read-first docs, session
   hooks, pinned deps, why-comments on invariants — and git history proves
   plans get executed same-day. This is the company's first real proof of its
   own "AI does the building" thesis.

### Weaknesses — fix or accept deliberately

Ranked by how much they hurt over the next 6–12 months.

1. **The revenue product does not exist.** No ClinicBoss, no DromaiosEd
   content, no LMS, no multi-tenant schema (no `Organisation`/tenant model in
   `prisma/schema.prisma`). The 90-day plan's Week-1 milestone was a
   multi-tenant skeleton; nothing has started.
2. **No real backup/restore story.** One manual `pg_dump` command in the
   Hetzner runbook writing to the same VPS disk; no cron, no off-site copy, no
   documented restore; the `intake_data` volume (OCR'd, plausibly sensitive
   documents) is covered by nothing. Migrations are declared non-reversible,
   and migrate+seed run on every container boot. **This is the largest
   irreversible-loss risk in the company.**
3. **`src/lib/services.ts` is a 2,031-line god module** (46 exports, 22
   commits — twice the churn of the next file). Every AI session appends to
   it; its 1,585-line mirror test asserts exact Prisma call shapes, raising
   the cost of the split it needs.
4. **Governance-by-docs is decaying.** `docs/DECISIONS.md` has 3 entries, all
   2026-05-29, despite decision-grade changes shipping since (Business/Personal
   domain split, TRUSTED_LOOP promotion rule, HubSpot as CRM of record).
   CLAUDE.md was stale on arrival (lists 7 of 14 surfaces, ~10 of ~28 lib
   modules). The register that gates safety-rule changes is dormant.
5. **Scope sprawl against the founder's own "Thin Custom Cockpit" decision.**
   7 documented surfaces have become 14 (portfolio, activity, governance,
   intake, personal, pipeline, setup…) without the decision ever being
   revisited.
6. **CI never exercises the deployment path.** No Postgres service, no
   `migrate deploy`, no seed run, no `smoke:compose`; a broken migration
   first surfaces as a crash-looping VPS.
7. **Identity-by-mutable-name coupling.** The seed matches checklist actions
   by `title` (`prisma/seed.ts:140`) and re-runs every boot — renaming a
   seeded action recreates it. Two automation runners still dispatch by
   name-substring; renaming an automation silently changes which code runs.
8. **UTC date semantics for a Sydney operator.** `dateKey` uses
   `toISOString().slice(0, 10)` (`src/lib/domain.ts:178`; same pattern in ~15
   lib files), so "due today," renewal windows, and trend buckets can be off
   by one day for up to 11 hours daily — in a tool whose pitch is "never miss
   a deadline."
9. **No error boundaries or pending states anywhere.** Zero `error.tsx` /
   `loading.tsx`; no `useFormStatus`; slow Ollama actions (45–60s) give no
   feedback and invite the double submissions the intake race-guards exist to
   absorb.
10. **Security is one misconfiguration deep.** Preflight validates
    `COCKPIT_BIND_IP` and `POSTGRES_BIND_IP` but not `APP_BIND_IP`;
    `DEPLOYMENT_MODE` defaults to `local`, silently skipping all production
    checks while seeding published default credentials; no login throttling on
    the single admin account; in-repo Caddyfile is plain HTTP; the automation
    webhook fetch has no timeout or scheme allowlist; container runs as root.
    Tolerable behind a VPN today; not customer-grade.
11. **Duplication with no drift guards.** `dateKey`/`addDays` locally
    redefined across ~10 modules despite a "kept central" comment;
    `Risk.status` is a bare string with its closed-set hardcoded in 4 files;
    the "machine-readable" workflow contracts are never machine-read.
12. **Test blind spots at the boundaries.** ~13 of 32 Server Actions tested;
    8 of 22 components untested; no e2e layer (Playwright is referenced in
    config but not installed); the Prisma mock's blanket `updateMany` return
    could mask removal of a concurrency guard.

### Opportunities — in priority order

1. **The Wave-1 NDIS window is open right now.** Registration reform is live
   as of 1 Jul 2026; only ~7% of ~269k NDIS providers are registered; the repo
   already contains a week-by-week executable launch plan with gates. Selling
   education requires **zero new software** — 12 build-ready course outlines
   with standards mappings exist, and Skool is already live.
2. **One schema investment (tenancy) converts the cockpit into the ClinicBoss
   skeleton.** The module catalogue explicitly calls ClinicBoss "the
   externally-facing, multi-tenant evolution" of this data model. The missing
   primitive is an `Organisation` model + scoping — bounded work that reuses
   ~18k LOC of battle-tested code. (Gated: see §5.)
3. **Code-enforced local-first AI is a sellable trust story** for APP-bound
   NDIS/health customers, aligned with the 10 Dec 2026 Privacy Act
   automated-decision disclosure deadline. Turning the existing guard +
   contracts into a public trust page is a small, high-value artifact.
4. **The intake pipeline is the seed of ClinicBoss's evidence vault** (C3/C4).
   The hard engineering (OCR, dedupe, race-safe approval) is done; relabeling
   document types to accreditation standards is a crosswalk, not a rebuild.
5. **The setup-checklist engine is a lead magnet in waiting.** Swap the
   38-item AU company checklist data for "NDIS registration readiness" and the
   existing scoring/status engine becomes both a C2 module prototype and a
   free scored self-assessment timed to the cliff.
6. **The approval-gated automation framework is sellable governance IP** —
   documented human-in-the-loop AI control is exactly what accreditors and the
   Privacy Act ADM obligation will demand of AU health orgs.
7. **Cloud-AI and external-engine extension points already exist in schema**
   (`AssistantProvider` enums, `Automation.webhookUrl`) — capability can grow
   without renegotiating the safety architecture.
8. **A few hours refreshing CLAUDE.md/AI_CONTEXT.md** (routes, lib inventory,
   pointer to `docs/strategy/`) directly multiplies AI build velocity — the
   load-bearing Phase-A assumption.

### Threats — ranked by likelihood × impact

1. **Market-window slippage (already occurring).** The cliff the whole Wave-1
   thesis is anchored to arrived today with no product. Each missed cliff
   (next: Privacy Act ADM 10 Dec 2026; ACSQHC ART Jan 2027) hands the demand
   spike to incumbents.
2. **The meta-work trap (already sprung).** Five weeks → 18k LOC of internal
   tooling, dual-format contracts, Wave-3 research for markets 12–30 months
   out — and zero customer artifacts. High build quality makes it *more*
   seductive.
3. **Solo-founder bus factor.** One human, one admin account, one VPS, one
   `.env` as the credential of record. Founder incapacity = nobody can
   operate or even locate the company's memory.
4. **Data loss.** Same-disk manual backups, nothing covering `intake_data`,
   no restore procedure, migrate+seed on every boot. A single VPS failure
   loses the company's entire operating history.
5. **Regulatory exposure while foundations are open.** Sensitive health/NDIS
   documents are already being ingested while insurance, APP compliance, NDB
   plan, and the TGA/SaMD boundary memo are unfinished. A breach with no NDB
   plan is potentially business-ending; the non-SaMD bet is undocumented.
6. **Security drift.** One mis-bind (`APP_BIND_IP=0.0.0.0`) or forgotten
   `DEPLOYMENT_MODE=production` exposes an unthrottled plain-HTTP login
   guarding health-sector data.
7. **AI-tooling dependence.** Velocity, the business model, and codebase
   coherence all assume continued cheap capable AI sessions; the PR #1–#3
   reconciliation and ~12 abandoned `claude/*` branches show the sprawl cost.
8. **Dependency churn.** Whole stack exact-pinned one major behind (Next 15,
   Tailwind 3, Prisma 6, zod 3, bcryptjs 2.4.3); floating base-image tags. The
   eventual multi-major migration is a dead-stop for one founder.
9. **Governance decay compounds everything above** — the dormant decision
   register is the mechanism meant to catch all of it.

## 4. The core tension

The founder's compounding asset (a beautifully engineered internal cockpit)
and the company's stated revenue engine (education + compliance SaaS sold into
a 2025–2027 regulatory window) are **different artifacts**, and every hour of
cockpit polish is drawn from a time-boxed market window that is expiring now.
The "ClinicBoss is the evolution of the cockpit" claim is true but dangerous:
it lets internal work masquerade as product groundwork indefinitely. The
tiebreaker is behavioral, not strategic: this founder-plus-AI system
demonstrably ships whatever it is pointed at — plans in this repo were executed
same-day, commit-for-commit. Point it at revenue.

## 5. Recommended direction

**Education-first revenue sprint with a hard cockpit feature freeze, opened
with a two-week sales probe.** (To activate: record the freeze in
`docs/DECISIONS.md` with a revisit condition — first paying education org or
Day 90.)

This is the strategy the founder already wrote: education is the designated
wedge, and the M0–3 milestone is "catalogue live; first paid education orgs."
It monetizes the NDIS window while it is hot, needs zero new software, and
finally tests the Phase-A assumption that AI can author sellable content.

**The 90-day shape:**

1. **Weeks 1–2 — probe before building.** Guardrail-compliant one-pager +
   landing page; 20–30 discovery calls into the SIL/platform and unregistered
   long-tail NDIS providers hit by the registration change; test the
   synthesized price points directly; pre-sell refundable course seats.
   Set kill/pivot thresholds up front (e.g. <3 paid commitments of any kind by
   Day 30 forces a strategy-revision entry in DECISIONS.md).
2. **Weeks 2–6 — clear the compliance gate (G2) for an education-only offer:**
   professional indemnity insurance, privacy policy/APP compliance + NDB plan,
   non-SaMD boundary memo. Re-verify every NDIS instrument version cited in
   the course outlines against primary sources (the outlines themselves demand
   this post-1-Jul-2026).
3. **Weeks 3–10 — author against demand.** AI-author, then sanity-check, 3–5
   of the 12 Tier 0/1 NDIS courses (OVA, worker screening/code of conduct,
   incident/SIRS basics first); publish on Skool or an off-the-shelf LMS.
   No custom code.
4. **Throughout — point the cockpit at the launch.** Seed the 90-day plan's
   gates and weekly milestones as cockpit Actions under the DromaiosEd stream;
   track pipeline in HubSpot, mirroring stage in `/pipeline`.
5. **Gate for ClinicBoss build (Direction 2):** paying education orgs or
   signed pilot commitments (G3 evidence). Only then does multi-tenanting the
   cockpit become an asset instead of a displacement activity — and only after
   the customer-grade security gate in §7 is met.

**Explicitly stopped during the freeze:**

- New cockpit routes, panels, dashboards, or aggregation views.
- Fast-edit phase 2, TRUSTED_LOOP scheduler, Gmail/Drive/Xero connectors
  (deferred, not cancelled — pull in only if admin load demonstrably blocks
  selling, time-boxed).
- Wave-2/Wave-3 research deepening.
- Parallel AI sessions on overlapping scope; triage or delete the stale
  `claude/*` branches.
- Any ClinicBoss SaaS build ahead of the G3 gate.

## 6. Engineering allowed during the freeze

Small, bounded, and defensive only — roughly in this order:

1. **Backups (do first):** nightly `pg_dump` + `intake_data` copy, shipped
   off-VPS (object storage), with a **tested, documented restore**. This
   closes the company's largest irreversible risk in a day of work.
2. **Preflight hardening:** validate `APP_BIND_IP`; warn loudly when
   `DEPLOYMENT_MODE != production` skips checks.
3. **Webhook fetch hardening:** AbortController timeout + http/https scheme
   allowlist in `runAutomation`.
4. **Timezone correctness:** route all date keying through a single
   `APP_TIMEZONE`-aware `dateKey` in `domain.ts`; delete the ~14 local copies.
5. **Seed/dispatch identity:** persist the checklist's stable `key` (not
   title-matching); exact-name matching for all automation runners.
6. **Docs debt:** refresh CLAUDE.md's route/module inventory; backfill the
   four missing DECISIONS.md entries (control-room-not-engine + TRUSTED_LOOP
   rule, Business/Personal split, HubSpot as CRM of record, GStack verdict).
7. **Session revocation:** document `DELETE FROM "Session"` in the rotation
   runbook (or add a seed-time flag).
8. **Only if/when ClinicBoss is gated in:** split `services.ts` into
   per-domain modules *before* adding tenancy; add error boundaries and
   pending states; stand up the customer-grade security items.

## 7. Guardrails for future AI sessions (binding)

1. **Never relax the safety spine** (AI output is a draft; approval-gated
   automations; blocked-by-default payments/legal/publishing/clinical/
   credential actions) without a dated entry in `docs/DECISIONS.md`. Treat the
   register as live: every durable decision gets an entry.
2. **Never send sensitive data to cloud AI.** Ollama stays default;
   `INTAKE_ALLOW_REMOTE_OLLAMA` stays default-false; the on-box guard in
   `src/lib/ollama.ts` must not be weakened.
3. **Non-SaMD is the load-bearing regulatory bet.** Nothing may diagnose,
   triage, or recommend treatment, or be marketed as clinically-influential-
   but-TGA-exempt. Clinical-adjacent features require external legal review
   first; the conservative position wins.
4. **All public copy passes `src/lib/posting-guardrail.ts`:** no "trusted by"
   or user counts until named users exist; pilots framed as pilots; ClinicBoss
   treated as a non-final name until trademark clearance.
5. **No new cockpit surfaces without a DECISIONS.md entry** revisiting the
   2026-05-29 thin-cockpit decision. Default answer to "should the cockpit
   also show X?" is **no**.
6. **No customer/client data in this deployment** until the hard security
   gate is met: TLS, automated tested off-site backups (Postgres **and**
   `intake_data`), login rate limiting, `APP_BIND_IP` preflight validation,
   non-root container. Current posture is founder-only.
7. **All automation execution goes through `src/lib/automations.ts` gates.**
   New automations start `DRAFT_ONLY`/`APPROVAL_REQUIRED`; TRUSTED_LOOP only
   after 30 days or 20 clean runs plus a written rollback check; exact-name
   dispatch for new runners (never substring).
8. **No Wave-2/Wave-3 work until Wave-1 revenue gates are met.** The waves
   gate spend; "serve any inbound lead" is not a licence to build ahead.
9. **Re-verify every regulatory date/instrument against its primary source**
   before it appears in any campaign, course, or claim.
10. **Do not append to `services.ts` as a dumping ground.** New domains get
    their own service module; preserve the invariant that only the services
    layer and `auth.ts` import Prisma.
11. **One branch, one line of work at a time.** No parallel AI sessions on
    overlapping scope; triage stale branches instead of accumulating them.
12. **Do not trust CLAUDE.md's inventory as complete** — verify against
    `src/`, and update docs in the same PR as any behavior change.
13. **Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` before
    declaring work done.** Never lower coverage thresholds or relax the
    zero-warning policy to make work pass.

## 8. Update triggers for this doc

Re-open and amend this doc when any of the following happens:

- A freeze/direction decision is recorded, amended, or expires in
  `docs/DECISIONS.md`.
- The first paying customer (education or pilot) lands — re-run the direction
  choice with real revenue data.
- The G3 gate is met and ClinicBoss build is greenlit (§5.5 and §6.8 activate).
- Any item in §3 Weaknesses 1–4 or §6.1–6.3 is resolved (strike it through
  with a date rather than deleting it).
- A quarter passes without any of the above — that itself is a signal the
  direction is not being executed; say so here.
