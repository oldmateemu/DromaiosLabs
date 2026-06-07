# CLAUDE.md

Guidance for AI assistants (Claude Code and others) working in this repository.

## What This Is

**Dromaios Cockpit** is the private company command-and-control dashboard for
Dromaios Labs. It keeps daily actions, weekly/monthly company reviews, external
system links, AI-assistant drafts, and approval-gated automations in one
operational workspace. It is a *thin* custom operating layer over specialist
tools (Xero, Airwallex, Lawpath, Skool, GitHub, n8n/Activepieces) — not a
replacement for them.

The package name is `dromaios-company-cockpit`. The repo directory is
`DromaiosLabs`.

## Read-First Order For Any Change

Before changing behavior, read the relevant doc — these are authoritative and
kept current:

1. `AI_CONTEXT.md` — entry point and safety defaults.
2. `docs/OPERATING_MODEL.md` — streams, company functions, daily/weekly rhythm.
3. `docs/DATA_MODEL.md` — core records and the approval rule.
4. `docs/AUTOMATIONS.md` — **read before touching any automation behavior.**
5. `docs/AI_GUIDE.md` — **read before changing assistant/model behavior.**
6. `docs/CHANGE_GUIDES.md` — step-by-step recipes (add a stream, automation, etc.).
7. `docs/DECISIONS.md` — durable architectural decisions and their rationale.
8. `docs/superpowers/specs/` and `docs/superpowers/plans/` — approved product design.

## Tech Stack

- **Next.js 15** (App Router, React 19, Server Components + Server Actions)
- **TypeScript** (strict mode), path alias `@/*` → `src/*`
- **Tailwind CSS 3** (custom utility classes in `src/app/globals.css`)
- **Prisma 6** ORM over **PostgreSQL**
- **Ollama** for local-first assistant drafts (no cloud AI by default)
- **Vitest** + Testing Library (jsdom) for unit/component tests
- **node:test** for `scripts/*.test.mjs`
- **Docker Compose** + Caddy for local/VPN-first deployment
- Package manager: **pnpm** (see `pnpm-workspace.yaml`, `pnpm-lock.yaml`)

## Commands

```bash
pnpm install              # install deps
pnpm dev                  # start dev server (scripts/start-next-dev.mjs, default 127.0.0.1:3000)
pnpm build                # prisma generate && next build
pnpm start                # next start (production)
pnpm lint                 # eslint . --max-warnings=0  (zero-warning policy)
pnpm test                 # vitest run (all src/**/*.test.ts(x))
pnpm test:watch           # vitest watch
pnpm test:run-flow        # node --test scripts/*.test.mjs
pnpm db:generate          # prisma generate
pnpm db:migrate           # prisma migrate dev
pnpm db:deploy            # prisma migrate deploy (production)
pnpm db:seed              # tsx prisma/seed.ts
pnpm deploy:preflight     # node scripts/deployment-preflight.mjs
pnpm smoke:compose        # docker compose config
```

**Before declaring work done, run:** `pnpm lint`, `pnpm test`, and `pnpm build`.
For deployment-touching changes also run `pnpm deploy:preflight` and
`pnpm smoke:compose`.

## Local Setup

1. Copy `.env.example` to `.env`.
2. Set `SESSION_SECRET` (≥24 chars), `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
   Keep `COOKIE_SECURE=false` for local/VPN HTTP; set `true` only behind HTTPS.
3. `docker compose up -d postgres`
4. `pnpm install` → `pnpm db:generate` → `pnpm db:migrate` → `pnpm db:seed`
5. `pnpm dev`

## Architecture & Layout

```
src/
  app/
    layout.tsx               # root layout
    actions.ts               # ALL Server Actions ("use server") — thin wrappers
    login/page.tsx           # unauthenticated login
    (app)/                   # authenticated route group
      layout.tsx             # requireUser() gate + AppShell; export dynamic = "force-dynamic"
      page.tsx               # Today command board (/)
      actions/page.tsx       # Actions register
      launchpad/page.tsx     # external systems + health
      reviews/page.tsx       # guided weekly/monthly reviews
      assistant/page.tsx     # assistant drafts review/approval
      automations/page.tsx   # automation control room
      docs/page.tsx          # in-app AI docs
    globals.css              # Tailwind + custom classes (panel, action-row, eyebrow, sidebar-link, etc.)
  components/                # React components, each with a co-located *.test.tsx
  lib/                       # business logic, each with a co-located *.test.ts
prisma/                      # schema.prisma, migrations, seed.ts, launchpad metadata
scripts/                     # dev launcher + deployment preflight (.mjs, with .test.mjs)
docs/                        # operating model, data model, automations, AI guide, decisions, deployment
```

### Layered request flow

`Page (Server Component)` → calls a getter in `src/lib/services.ts` for data;
forms post to a **Server Action** in `src/app/actions.ts`, which authenticates
with `requireUser()` and delegates to `src/lib/services.ts`, which orchestrates
**pure helpers** in `src/lib/*` and Prisma via `src/lib/db.ts`.

- **`src/app/actions.ts`** — every Server Action lives here. Keep them thin:
  read `FormData`, call `requireUser()`, delegate to `services.ts`, then
  `redirect()`. Do not put business logic here.
- **`src/lib/services.ts`** — the orchestration layer. Talks to Prisma,
  calls `revalidatePath`, composes the pure helper modules.
- **`src/lib/*` pure helpers** — `automations.ts`, `action-filters.ts`,
  `domain.ts`, `cockpit-insights.ts`, `operating-brief.ts`,
  `draft-automations.ts`, `renewal-reminders.ts`, `posting-guardrail.ts`,
  `launchpad-system-metadata.ts`, `session-cookie.ts`. These are
  framework-free, deterministic, and the primary place for unit tests.
- **`src/lib/db.ts`** — singleton `PrismaClient` (global in dev to avoid hot-reload leaks).
- **`src/lib/auth.ts`** — `server-only`. HMAC-signed session cookie
  (`dromaios_session`), bcrypt password check, `getCurrentUser` / `requireUser`.
- **`src/lib/ollama.ts`** — local assistant calls; always returns a safe
  fallback draft on error (never throws to the UI).

## Data Model (Prisma)

The central record is **`Action`**. Everything else creates, explains, groups,
or triggers actions. Key models: `User`, `Session`, `Stream`,
`CompanyFunction`, `Action`, `LaunchpadLink`, `Review`, `Risk`, `Decision`,
`AssistantDraft`, `Automation`, `AutomationRun`. See `docs/DATA_MODEL.md` and
`prisma/schema.prisma` for the full definitions and enums.

- IDs are `cuid()`. Most foreign keys are optional with `onDelete: SetNull`
  (history is preserved); `Session`/`AutomationRun` cascade on parent delete.
- After editing `schema.prisma`: `pnpm db:migrate` (dev) to create a migration,
  then `pnpm db:generate`. Never hand-edit generated client or applied migrations.

## Safety Rules (Non-Negotiable)

These are the product's reason for existing. Do not relax them without an
explicit decision recorded in `docs/DECISIONS.md`.

- **Local-first / privacy:** Do not send sensitive company, financial, legal,
  patient/client, IP (ClinicBoss/medtech), or regulatory data to cloud AI by
  default. Ollama is the default provider; cloud AI is opt-in and only for
  non-sensitive strategy, public copy, code help, or doc review.
- **AI output is a draft.** It becomes company work only after explicit user
  approval. The one allowed exception is low-risk action creation inside the
  guided weekly review.
- **Automation safety levels** (`AutomationSafetyLevel`): every new automation
  starts `DRAFT_ONLY` or `APPROVAL_REQUIRED`. The gate logic is in
  `src/lib/automations.ts` (`canAutomationRun`, `canAutomationPrepareDraft`,
  and their `assert*` wrappers) — enforce through these, never bypass.
- **Blocked by default:** payments/banking, legal filings, credential changes,
  public publishing, clinical/regulatory claims, sensitive-data transmission to
  cloud, and destructive data changes. No silent execution of any of these.
- **Public posting** must pass `src/lib/posting-guardrail.ts`. See
  `Dromaios_Labs_public_posting_guardrail.md`.

## Conventions

- **Server Components by default;** mark client components with `"use client"`
  only when needed. Authenticated pages export `const dynamic = "force-dynamic"`.
- **Forms use Server Actions**, not client fetch. Mutations end with
  `redirect(...)`; services call `revalidatePath(...)` where needed.
- **Imports** use the `@/` alias. Enum values come from `@prisma/client`.
- **Tests are co-located** (`foo.ts` → `foo.test.ts`). Prefer testing pure
  helpers in `src/lib`; the bulk of logic lives there precisely so it is
  testable without a DB or network. Per `docs/CHANGE_GUIDES.md`, update pure
  parsing tests *first* when changing assistant behavior, and keep Ollama
  fallbacks safe.
- **Styling** uses Tailwind plus the custom classes defined in
  `src/app/globals.css` (e.g. `panel`, `action-row`, `eyebrow`, `muted`,
  `empty-state`, `meta-pill`, `sidebar-link`, `button`/`button-secondary`).
  Reuse these rather than inventing new patterns.
- **Lint is zero-warning** (`--max-warnings=0`). Keep it clean.

## Deployment

Local/VPN-first via Docker Compose (`Dockerfile`, `docker-compose.yml`,
`Caddyfile`). The app container runs `scripts/deployment-preflight.mjs` (which
rejects placeholder secrets, weak passwords, and broad network binds when
`DEPLOYMENT_MODE=production`) before `db:deploy`, `db:seed`, and `start`.
Start from `docs/deployment/HETZNER_RUNBOOK.md` and
`docs/deployment/ENV_CHECKLIST.md`; use `.env.hetzner.example` as the template.
Public-domain hardening (OAuth, multi-tenant, external monitoring) is
deliberately deferred — keep it a separate effort.

## Git Workflow

- Develop on the assigned feature branch; create it locally if missing.
- Commit with clear, descriptive messages; push with
  `git push -u origin <branch>`.
- Do **not** open a pull request unless explicitly asked.
- Keep docs in `docs/` and this file updated when behavior, the data model, or
  workflows change — the docs are treated as authoritative by future sessions.

## When Adding Features

Follow the recipes in `docs/CHANGE_GUIDES.md` (add a stream, launchpad group,
automation, import launchpad metadata, change assistant behavior). The general
pattern: add/adjust a pure helper in `src/lib` (+ tests) → wire it through
`services.ts` → add a Server Action in `app/actions.ts` → render it in the
relevant `(app)/*/page.tsx` → update the matching doc.
