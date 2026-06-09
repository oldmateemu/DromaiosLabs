# Dromaios Mobile App 1 — Lean Build Plan

Date: 2026-06-09
Status: Proposed build plan, pending product decision
Parent: `2026-06-09-dromaios-mobile-app-strategy.md`
Scope: `2026-06-09-dromaios-mobile-mvp-scope.md`

This is a strategy-level build plan, not final engineering. It exists to make the first app
buildable, reuse the team's existing TypeScript skills, and stay portal-ready without over-engineering.

## Stack Decision

- **Mobile app: Expo (React Native) + TypeScript.** Maximises reuse of the existing Next.js / React /
  TypeScript skill set; native polish; EAS Build (no Mac needed) and EAS Update (over-the-air fixes).
- **Shared language and types with the web/cockpit:** TypeScript end-to-end; share Zod schemas and API
  client types between the app and any backend.
- **Backend: reuse the existing Next.js + Prisma + Postgres foundation**, exposing a small dedicated API
  surface (route handlers) for the app. Keep the app's data logically separate from cockpit data; do not
  couple the consumer app to the private company cockpit.
- **Local-first storage on device:** `expo-sqlite` (or a light wrapper) so lessons and quick-reference
  cards work offline; sync the learning record when online and signed in.
- **Auth: optional, lazy.** Anonymous use by default; lightweight email or passkey sign-in only when the
  user saves/syncs. Design the identity boundary now so it can become the portal's shared auth later.
- **Payments (not in MVP, but decided): Stripe web checkout**, not in-app purchase, to avoid the
  15–30% store cut (US external-link ruling + reader-app exemption). Verify per-storefront before relying
  on it outside the US.
- **Notifications:** `expo-notifications` with your own APNs/FCM credentials for the single opt-in
  weekly reminder.

Fallback if speed beats polish: Capacitor wrapping the existing Next.js. Cheaper reuse, but must add
real native features to clear Apple Guideline 4.2, and gives a less native feel — not recommended for a
credibility-first launch.

## Architecture (Portal-Ready, Not Over-Built)

- **Monorepo, modular monolith.** One repo, clear module boundaries; defer micro-frontends/micro-services
  until team size and release independence justify them.
- Suggested shape:
  - `apps/mobile` — the Expo app.
  - `apps/web` — existing Next.js cockpit (and later the public web surface).
  - `packages/ui` — shared design system / tokens (portal-ready).
  - `packages/core` — shared types, Zod schemas, domain logic.
  - `packages/api-client` — typed client for the app/backend boundary.
- **Build App 1 as a feature module** behind a shared identity + design system, so additional DromaiosEd
  domains and, later, other streams slot in as modules rather than rewrites.
- Invest early only in: shared auth/identity, shared design system, and a clean module boundary. Do not
  build portal/super-app infrastructure before there are real users in two or three streams.

## Data Model (MVP Sketch)

Worker-owned, minimal, privacy-first. Indicative Prisma-style entities:

- `Learner` — optional account. `id`, `createdAt`, `role` (disability / aged care / nurse / other),
  `email?` (only if they sign in), `pushOptIn`. No employer linkage in MVP.
- `Lesson` — content. `id`, `slug`, `title`, `domain` (de-escalation / behaviour support),
  `estimatedMinutes`, `scenarioJson` (branching scenario + feedback), `published`, `version`,
  `sourceNote` (evidence basis), `disclaimer`.
- `ReferenceCard` — quick reference. `id`, `slug`, `title`, `bodyMarkdown`, `tags`, `offline` (always
  true for MVP), `version`.
- `LessonCompletion` — the record. `id`, `learnerId?` (nullable for anonymous/local-only), `lessonId`,
  `completedAt`, `minutesCredited`, `score?`, `certificateId?`.
- `Certificate` — `id`, `learnerId?`, `lessonId`, `issuedAt`, `hoursCredited`, `pdfRef`.
- `ContentPackVersion` — supports offline bundling and OTA content refresh: `id`, `version`,
  `publishedAt`, `manifest`.

Notes:
- Anonymous-first: completions and certificates can live purely on-device until the user signs in, then
  sync up. The server never needs employer identifiers.
- Content (`Lesson`, `ReferenceCard`) ships bundled for offline and refreshes via `ContentPackVersion`.

## Screen Map (MVP)

1. **Home** — featured weekly scenario, continue-where-you-left-off, progress (lessons/hours/streak).
2. **Lesson player** — scenario intro, branching choices with reasoned feedback, knowledge check,
   completion + certificate prompt.
3. **Quick reference** — searchable offline cards (de-escalation steps, least-restrictive principles,
   reportable-incident awareness).
4. **My record** — portfolio of completions, accrued hours, certificate list, export/share.
5. **About & privacy** — plain-English data practices, educational-use/non-diagnostic disclaimer,
   sector-expert content provenance.
6. **(Lazy) Sign-in** — only surfaced when saving/syncing; email or passkey.

Design direction: calm, accessible, large tap targets, plain language, high contrast — built for the
~12% low-digital-readiness tail, not power users.

## Compliance And Risk Checklist (Build-Time)

- Australian data residency for Postgres and any push/analytics provider (APP 8). Prefer AU regions.
- Non-diagnostic, educational-use disclaimer on lesson screens and the store listing (Apple 1.4.1).
- Minimal data collection; worker-owned records; no employer visibility in MVP; clear privacy policy.
- No "proven to reduce violence/restraint/outcomes" copy anywhere in-app or in store metadata.
- Confirm with an App Store / Play Store scan that no equivalent mobile de-escalation companion exists
  before using "first/only" language.

## Suggested Sequencing

1. Repo + monorepo scaffold; shared `ui`/`core` packages; Expo app shell with offline content bundle.
2. Lesson player + 2 finished scenarios + 5 reference cards (vertical slice, offline, no account).
3. Local learning record + certificate generation (still anonymous).
4. Optional sign-in + sync; weekly reminder; about/privacy.
5. Polish, accessibility pass, content to 6–10 lessons, store listings, closed beta via carer/nurse
   communities.

Realistic target for a small team: a polished MVP in roughly 1–3 months.

## What Is Deliberately Deferred

- Org/provider compliance dashboards (phase 3, the B2B + ClinicBoss bridge).
- Paid content / Stripe checkout (turn on after the free funnel proves traction).
- Additional domains (manual handling, infection control) as content modules.
- The unified Dromaios Labs portal (after two or three streams have real users).
