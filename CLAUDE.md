# CLAUDE.md

Guidance for Claude Code (and other AI sessions) working in this repository.

## Start here

This repo is the **Dromaios Cockpit** — a private Next.js operating dashboard for
Dromaios Labs. Before changing the app, read `AI_CONTEXT.md`, then the design
spec and `docs/OPERATING_MODEL.md` / `docs/DATA_MODEL.md` it points to.

## Safety defaults (non-negotiable)

- Do not send sensitive company, financial, legal, patient/client, IP, or
  regulatory data to cloud AI by default.
- No silent execution for payments, legal filings, credential changes, public
  publishing, or clinical/regulatory claims. New automations start draft-only or
  approval-required.
- Keep the UI tidy, readable, operational, and command-and-control.

## Public-facing content must pass the posting guardrail

Any copy that references Dromaios Labs, ClinicBoss, Bakermed, or future medtech
is governed by `Dromaios_Labs_public_posting_guardrail.md`. Named-competitor
comparisons, pricing, traction/outcome numbers, and clinical/AI/regulatory
language are Amber or Red.

Run drafts through the in-repo checker before treating anything as publishable —
it is the same logic the cockpit's Assistant uses:

```ts
import { checkPublicPostingDraft } from "@/lib/posting-guardrail";
// overallSeverity must be GREEN before external use
```

Strategy, research, and content drafts live in `docs/strategy/` (with public-ready
content under `docs/strategy/content/`). Items there flagged Amber/Red are
internal ammunition only until reviewed.

Before posting anything externally, run the publish gate and work through
`docs/strategy/content/PUBLISH_CHECKLIST.md`:

```bash
pnpm check:publish path/to/draft.md   # external drafts must be GREEN to pass
```

Drafts declare `<!-- publish-intent: external|internal -->` on their first lines;
the gate fails (non-zero exit) on any AMBER/RED in an external draft.

## Verify before claiming done

- `pnpm lint` (zero warnings) · `pnpm test` (vitest) · `pnpm build` ·
  `node scripts/deployment-preflight.mjs` · `pnpm smoke:compose`
- Database work: `pnpm db:generate`, `pnpm db:migrate` (dev) / `pnpm db:deploy`,
  `pnpm db:seed`, and `pnpm db:seed:roadmap` (loads the Path-to-#1 roadmap
  milestones as Action records; idempotent by title+stream).

## Running and rendering the app in this remote workspace

The session runs in an **ephemeral cloud container** — commit and push anything
worth keeping. A few notes that save time here:

- **Local Postgres for verification.** Docker is not available, but a local
  Postgres 16 cluster is: `sudo pg_ctlcluster 16 main start`, create a
  `dromaios`/`dromaios` role + `dromaios_cockpit` DB, then set
  `DATABASE_URL=postgresql://dromaios:dromaios@localhost:5432/dromaios_cockpit?schema=public`,
  `SESSION_SECRET` (24+ chars), `ADMIN_EMAIL`/`ADMIN_PASSWORD`, and
  `COOKIE_SECURE=false`. Run `pnpm db:deploy && pnpm db:seed` before `pnpm start`.
  Drop the DB and stop the cluster when done.
- **The network policy blocks browser-binary CDNs.** Playwright's CDN,
  Google's chrome-for-testing storage, and apt's real Chromium all return 403;
  only the npm registry is reachable. To screenshot a page, pull a Chromium that
  ships *inside* an npm tarball (e.g. `@sparticuz/chromium@119.0.2`, whose
  `bin/chromium.br` is bundled) and drive it with Playwright via
  `executablePath: await chromium.executablePath()` + `args: [...chromium.args,
  "--no-sandbox"]`. Import Playwright from the `playwright` package, not
  `playwright-core` (pnpm doesn't hoist the latter). These are render-only aids —
  do not commit them to `package.json`.
- If repeatable in-browser rendering matters, the environment's network policy
  would need the browser CDNs allowlisted. See
  https://code.claude.com/docs/en/claude-code-on-the-web for how environments and
  network policies are configured.

## Git

Work on the assigned feature branch, commit with clear messages, and
`git push -u origin <branch>` (retry with backoff on network errors). Do not open
pull requests unless explicitly asked.
