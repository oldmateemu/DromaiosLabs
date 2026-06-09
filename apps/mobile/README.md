# Dromaios Safer Practice (mobile)

Free, worker-owned mobile companion for frontline NDIS, disability and aged-care workers:
scenario-based microlearning + quick reference on de-escalation and behaviour support, with
CPD-style certificates kept privately on the worker's own device.

This is **App 1** from the mobile strategy. See:

- `docs/superpowers/specs/2026-06-09-dromaios-mobile-app-strategy.md`
- `docs/superpowers/specs/2026-06-09-dromaios-mobile-mvp-scope.md`
- `docs/superpowers/specs/2026-06-09-dromaios-mobile-build-plan.md`

## Stack

- Expo (React Native) + TypeScript.
- `@dromaios/core` — shared, framework-free domain model + lesson/reference content (validated
  with Zod) + a pure scenario engine. Reusable by the future web portal.
- `@dromaios/ui` — shared design system (tokens + accessible React Native components).
- Learning record stored on-device via AsyncStorage (offline, anonymous, worker-owned).

## Run it

From the repo root (pnpm workspace):

```bash
pnpm install
pnpm --filter @dromaios/mobile start      # then press i / a, or scan with Expo Go
```

Content tests (validate every lesson's schema + scenario graph):

```bash
pnpm --filter @dromaios/core test
```

## What's here (MVP vertical slice)

- Role-aware onboarding (no account required).
- Home: progress, featured weekly scenario, lesson list.
- Lesson player: branching scenario steps (scene / decision / knowledge-check / end) with reasoned
  feedback, then a saved certificate.
- Quick reference: searchable, offline guidance cards.
- My record: certificates + accrued hours, worker-owned, clearable.
- About: plain-English privacy summary + the educational-use disclaimer.

## Deliberately deferred (see build plan)

Account sync, PDF certificate export, org/provider dashboards, payments (Stripe web checkout, not
in-app purchase), additional domains, and the unified Dromaios Labs portal.

## Guardrail

Copy claims only **knowledge / confidence / regulatory awareness / compliance support** — never
"proven to reduce violence or restraint". The disclaimer is enforced in `@dromaios/core` and shown
on every lesson and reference card.
