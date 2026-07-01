# Dromaios Thread Closure Action Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the Dromaios Labs thread backlog by finishing the current dirty automation work and resolving the current esbuild audit finding.

**Architecture:** Keep Dromaios Cockpit as the local control room. Finish local draft and approval-gated runners through the existing `prepareDraftAutomation(...)` and `runAutomation(...)` service paths, then verify via focused tests, browser UI proof, database persistence, and git cleanup. Treat the esbuild finding as a separate dependency/security change after proving the current dependency graph.

**Tech Stack:** Next.js, React, TypeScript, Prisma, Vitest, pnpm, Docker Compose, Codex in-app Browser, local Postgres.

---

## Current Evidence

- `git status --short --branch` shows `main...origin/main` plus dirty automation files and untracked mailroom/action-plan artifacts.
- `git log --oneline -8 --decorate` shows `168d1a5 Patch PostCSS vulnerability`, `74925cc Add local cockpit automation runners`, and `bafc67b Package local-first deployment path` pushed on `main`.
- `pnpm audit` currently fails with `GHSA-gv7w-rqvm-qjhr` and `GHSA-g7r4-m6w7-qqqr` for `esbuild`.
- `pnpm why esbuild` shows one `esbuild@0.27.7` path through `tsx`, `vite@8.0.14`, `@vitejs/plugin-react`, `vitest`, `postcss-load-config`, and `tailwindcss`.
- `node scripts\deployment-preflight.mjs` passes.

## Files

- Modify: `docs/AUTOMATIONS.md`
- Modify: `src/components/automation-registry.tsx`
- Modify: `src/components/automation-registry.test.tsx`
- Modify: `src/components/automation-starters.tsx`
- Modify: `src/components/automation-starters.test.tsx`
- Modify: `src/lib/draft-automations.ts`
- Modify: `src/lib/draft-automations.test.ts`
- Modify: `src/lib/renewal-reminders.ts`
- Modify: `src/lib/renewal-reminders.test.ts`
- Modify: `src/lib/services.ts`
- Create or keep: `src/lib/mailroom-filing.ts`
- Create or keep: `src/lib/mailroom-filing.test.ts`
- Create or keep: `docs/workflows/company-mailroom-filing.md`
- Create or keep: `docs/workflows/company-mailroom-filing.contract.json`
- Create or keep: `docs/COMPANY_BASIC_AUTOMATION_PLAN_2026-06-04.md`
- Remove if generated: `tsconfig.tsbuildinfo`
- Possible dependency files for security fix: `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`

### Task 1: Protect The Dirty Checkout

- [ ] **Step 1: Record the current state**

Run:

```powershell
git status --short --branch
git diff --stat
git ls-files --others --exclude-standard
git worktree list --porcelain
```

Expected: dirty `main` contains the automation/mailroom files listed above, plus `tsconfig.tsbuildinfo`.

- [ ] **Step 2: Create an isolation branch or Codex worktree before editing**

Run:

```powershell
git switch -c codex/dromaios-thread-closure-cleanup
```

Expected: branch switches cleanly and preserves the dirty working tree.

- [ ] **Step 3: Remove only generated cache output**

Run:

```powershell
Remove-Item -LiteralPath .\tsconfig.tsbuildinfo -ErrorAction SilentlyContinue
git status --short
```

Expected: `tsconfig.tsbuildinfo` is gone; source/doc changes remain.

### Task 2: Finish The Overlapping Automation Work

- [ ] **Step 1: Run the current focused suite before editing**

Run:

```powershell
node .\node_modules\vitest\vitest.mjs run src\lib\draft-automations.test.ts src\lib\renewal-reminders.test.ts src\lib\mailroom-filing.test.ts src\components\automation-registry.test.tsx src\components\automation-starters.test.tsx
```

Expected: either all focused tests pass, or failures identify the exact remaining daily inbox, renewal, or mailroom gap. Do not patch before reading the failure.

- [ ] **Step 2: If tests fail, apply TDD one behavior at a time**

For each failing behavior:

```powershell
node .\node_modules\vitest\vitest.mjs run <failing-test-file>
```

Expected: reproduce the same failure. Add or correct exactly one test first, verify it fails for the intended reason, implement the smallest production change, then rerun the same test file.

- [ ] **Step 3: Verify the mailroom contract**

Run:

```powershell
node .\node_modules\vitest\vitest.mjs run src\lib\mailroom-filing.test.ts src\components\automation-registry.test.tsx src\components\automation-starters.test.tsx
node -e "JSON.parse(require('fs').readFileSync('docs/workflows/company-mailroom-filing.contract.json','utf8')); console.log('mailroom contract json ok')"
```

Expected: mailroom tests pass and contract JSON parses.

- [ ] **Step 4: Verify the renewal reminder quality fix**

Run:

```powershell
node .\node_modules\vitest\vitest.mjs run src\lib\renewal-reminders.test.ts src\components\automation-registry.test.tsx
```

Expected: Xero, Lawpath, Skool, and ChatGPT July 1, 2026 renewals keep date-only values, cost, owner, risk, and credential-location notes in generated output.

- [ ] **Step 5: Verify daily inbox triage**

Run:

```powershell
node .\node_modules\vitest\vitest.mjs run src\lib\draft-automations.test.ts src\components\automation-registry.test.tsx src\components\automation-starters.test.tsx
```

Expected: `Daily inbox triage` is `DRAFT_ONLY`, targets `local cockpit`, writes a review-only run log, and does not create Gmail drafts or send email.

### Task 3: Prove The Automation UI And Persistence

- [ ] **Step 1: Start local dependencies with explicit 127.0.0.1 DB URL**

Run:

```powershell
docker compose up -d postgres
$env:DATABASE_URL='postgresql://dromaios:dromaios@127.0.0.1:5432/dromaios_cockpit?schema=public'
$env:SESSION_SECRET='local-thread-closure-proof-secret'
$env:ADMIN_EMAIL='admin@dromaios.local'
$env:ADMIN_PASSWORD='change-me-now'
pnpm exec prisma migrate deploy
pnpm exec tsx prisma/seed.ts
```

Expected: migrations and seed complete against local Postgres.

- [ ] **Step 2: Start the app on a fresh port**

Run:

```powershell
$env:DATABASE_URL='postgresql://dromaios:dromaios@127.0.0.1:5432/dromaios_cockpit?schema=public'
$env:SESSION_SECRET='local-thread-closure-proof-secret'
$env:ADMIN_EMAIL='admin@dromaios.local'
$env:ADMIN_PASSWORD='change-me-now'
pnpm exec next dev -H 127.0.0.1 -p 3014
```

Expected: `http://127.0.0.1:3014` serves the current checkout.

- [ ] **Step 3: Browser-verify Automations**

Use the Codex in-app Browser at `http://127.0.0.1:3014/automations`. Log in with `admin@dromaios.local` / `change-me-now`.

Expected:

- `Stale task summary` can prepare a local draft and shows `No webhook called`.
- `Daily inbox triage` can prepare a local draft and shows no Gmail draft or send action.
- `Company mailroom filing` is approval-gated and does not require a webhook.
- `Renewal reminder` is approval-gated and does not require a webhook.

- [ ] **Step 4: Database-verify run logs and actions**

Run a direct Prisma query through `node -e` or `pnpm exec tsx` that prints latest automation names, statuses, and response summary heads.

Expected:

- Stale and daily inbox runs are `SUCCESS` and `DRAFT_ONLY`.
- Mailroom and renewal runs are `SUCCESS` only after explicit approval.
- Renewal reminder actions are linked to launchpad systems and preserve `2026-07-01`.

### Task 4: Resolve The Current esbuild Audit Finding

- [ ] **Step 1: Reproduce and record the audit finding**

Run:

```powershell
pnpm audit
pnpm why esbuild
```

Expected: current finding mentions `esbuild@0.27.7` and patched version `>=0.28.1`.

- [ ] **Step 2: Identify the lowest-risk dependency route**

Run:

```powershell
pnpm outdated vite vitest tsx @vitejs/plugin-react esbuild
```

Expected: decide whether the fix should be a direct ecosystem upgrade or a `pnpm-workspace.yaml` override to `esbuild: 0.28.1` or newer. Do not guess; inspect peer constraints first.

- [ ] **Step 3: Make the dependency change**

Run the chosen update command. If using the override route:

```powershell
pnpm add -D esbuild@latest
pnpm install --lockfile-only
```

Expected: lockfile resolves a patched `esbuild`; no unrelated dependency churn.

- [ ] **Step 4: Verify the security fix**

Run:

```powershell
pnpm audit
pnpm why esbuild
node .\node_modules\vitest\vitest.mjs run
pnpm lint
pnpm exec next build
```

Expected: audit exits 0, one patched esbuild version remains, tests/lint/build pass.

### Task 5: Commit, Push, And Archive Remaining Threads

- [ ] **Step 1: Check final status**

Run:

```powershell
git status --short --branch
git diff --check
```

Expected: no generated cache files, no unrelated edits, no whitespace errors.

- [ ] **Step 2: Make logical commits**

Commit automation cleanup separately from security dependency work:

```powershell
git add docs\AUTOMATIONS.md src\components\automation-registry.test.tsx src\components\automation-registry.tsx src\components\automation-starters.test.tsx src\components\automation-starters.tsx src\lib\draft-automations.test.ts src\lib\draft-automations.ts src\lib\renewal-reminders.test.ts src\lib\renewal-reminders.ts src\lib\services.ts src\lib\mailroom-filing.test.ts src\lib\mailroom-filing.ts docs\workflows\company-mailroom-filing.md docs\workflows\company-mailroom-filing.contract.json docs\COMPANY_BASIC_AUTOMATION_PLAN_2026-06-04.md
git commit -m "Complete cockpit automation closure work"
git add package.json pnpm-lock.yaml pnpm-workspace.yaml
git commit -m "Patch esbuild audit finding"
```

Expected: commits include only intentional files. If the dependency fix does not touch one listed dependency file, omit it from `git add`.

- [ ] **Step 3: Push and archive**

Run:

```powershell
git push -u origin codex/dromaios-thread-closure-cleanup
```

Expected: pushed branch is ready for PR or merge. Archive the remaining open threads only after tests, UI proof, DB proof, audit, and push are complete.

## Archive Conditions

- `Add daily inbox triage runner`: archive only after browser `/automations` proof and DB persistence confirm the daily inbox local draft run.
- `Verify renewal reminder flow`: archive only after Automations, Launchpad, and Actions surfaces show the July 1, 2026 renewal flow with useful credential/cost notes.
- `Add mailroom filing automation`: archive only after mailroom tests, workflow contract docs, approval-gated UI proof, and DB run-log proof pass.
- `Add remote and push main`: archive only after current `pnpm audit` is clean and the esbuild dependency fix is committed/pushed.
