# Dromaios Mobile App 1 — MVP Scope

Date: 2026-06-09
Status: Proposed MVP scope, pending product decision
Parent: `2026-06-09-dromaios-mobile-app-strategy.md`

## Product In One Sentence

A free, worker-owned mobile companion that helps frontline NDIS, disability and aged-care workers
build de-escalation and behaviour-support knowledge through short scenario-based lessons, look up
practical guidance in the moment, and keep a private, audit-ready record of what they have learned.

## Target User (MVP)

Primary: individual frontline disability support workers and aged-care personal-care workers in
Australia, on their own phone, learning between shifts or client visits.

Secondary (read-only beneficiaries, not yet a build target): nurses chasing CPD evidence; the worker's
employer (served later via the org layer, not in MVP).

## Positioning And Claims (Hard Guardrail)

The app builds knowledge, confidence and regulatory awareness, and supports compliance.

It must never claim to be proven to reduce violence, reduce restraint, or improve clinical/patient
outcomes. Every lesson screen and the store listing carry a short non-diagnostic, educational-use
disclaimer.

## MVP Feature Set (Must-Have)

1. **Near-zero-friction onboarding**
   - Open and start a lesson with no account. Account creation is optional and only prompted when the
     user wants to save a certificate or sync across devices.
   - Pick a role (disability support / aged care / nurse / other) to lightly tailor scenario framing.
   - Designed for low digital-readiness: large tap targets, plain language, no jargon, no IT setup.

2. **Scenario-based microlearning**
   - 5–10 minute lessons, each built around a realistic "what would you do" scenario in
     de-escalation / behaviour support (e.g. responding to escalation, least-restrictive alternatives,
     recognising triggers, safe withdrawal).
   - Branching choices with feedback that explains the reasoning, not just right/wrong.
   - A short knowledge check at the end.
   - Launch with a small, high-quality set (6–10 lessons) rather than a large mediocre catalogue.

3. **In-the-moment quick reference**
   - Skimmable, offline-available guidance cards: de-escalation steps, calm-communication prompts,
     least-restrictive-practice principles, when an incident is reportable (SIRS / NDIS triggers, framed
     as awareness, not legal advice).
   - Searchable; works without signal.

4. **Worker-owned learning record + certificates**
   - On lesson completion, generate an hour-stamped, dated certificate (PDF/share).
   - A simple portfolio view of completed lessons and accrued minutes/hours.
   - The record belongs to the worker, is not visible to any employer, and can be exported.
   - Frame as evidence usable toward CPD where the worker has a CPD obligation (nurses' 20 hrs/yr;
     Victorian disability workers' voluntary 10 hrs/yr). Do not overclaim that it satisfies any specific
     regulator automatically.

5. **A reason to come back**
   - A new featured scenario each week and visible progress (lessons done, current streak or hours).
   - One gentle, opt-in reminder. No spam, no dark patterns.

6. **Trust and privacy surface**
   - A plain-English "what we collect and why" screen: minimal data, worker-owned, not sold, not shared
     with employers. Australian data residency.

## Explicitly Out Of Scope For MVP

- Employer/org dashboards, assignment, or compliance reporting (this is phase 3).
- Payments, subscriptions, or paid content (the MVP is the free funnel).
- Manual handling, infection control and other domains (content module #2 onward).
- Physical-intervention technique instruction (needs hands-on; high risk; not mobile-suitable).
- AI chat / generated advice in clinical situations (privacy + claim risk; defer and gate carefully).
- Social / community features (HIL/Skool territory; later portal module).

## Success Signals (Funnel + Credibility, Not Revenue)

- Installs and lesson-1 completion rate (does the hook convert?).
- Day-7 and Day-30 return rate against the ~4% Day-30 health-app benchmark.
- Certificates generated and exported (evidence the CPD hook lands).
- Qualitative: unsolicited shares in nurse/carer Facebook communities; provider enquiries (warm
  ClinicBoss / partnership leads).

Treat these as learning signals, not public claims.

## Content Plan For Launch

- 6–10 scenario lessons + ~15 quick-reference cards, written and reviewed by sector-experienced people
  (the DromaiosEd authority play), each citing its basis and carrying the educational-use disclaimer.
- Map each lesson to the regulatory awareness it supports (NDIS PBS / restrictive practices, aged-care
  SIRS) without claiming it discharges any specific legal duty.

## Open Decisions For The Founder

- App name and whether it is branded "DromaiosEd" or a standalone consumer name that feeds DromaiosEd.
- Whether nurses or disability support workers are the primary launch audience (affects scenario framing
  and seeding channel). Recommendation: disability support workers, because the regulatory pull and white
  space are sharpest there.
- How much of the existing cockpit's Postgres/Prisma backend to share now versus stand up a dedicated
  service (see build plan).
