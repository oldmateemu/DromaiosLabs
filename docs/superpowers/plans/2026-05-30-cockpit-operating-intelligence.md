# Cockpit Operating Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the cockpit a decision-oriented operating surface while keeping the interface calm and governed.

**Architecture:** Add a pure `cockpit-insights` module and a small set of presentational components. Reuse existing Prisma models and server actions. Avoid migrations.

**Tech Stack:** Next.js App Router, TypeScript, Prisma, Tailwind CSS, Vitest, Testing Library.

---

### Task 1: Insight Functions

**Files:**
- Create: `src/lib/cockpit-insights.ts`
- Create: `src/lib/cockpit-insights.test.ts`

- [ ] Write tests for next-best-action priority order: overdue beats due today, due today beats blocked, drafts beat automation setup, and calm daily lane appears when no urgent signal exists.
- [ ] Write tests for launchpad health: renewals due, renewals soon, missing owners, missing costs, high-risk links, and credential notes.
- [ ] Implement the pure functions with explicit typed inputs and no database imports.
- [ ] Run the targeted test and confirm it passes.

### Task 2: Today Command Surface

**Files:**
- Modify: `src/components/today-board.tsx`
- Modify: `src/components/today-board.test.tsx`
- Create: `src/components/governance-summary.tsx`
- Modify: `src/app/(app)/page.tsx`
- Modify: `src/lib/services.ts`

- [ ] Extend the Today test to expect the next-best-action strip, focus set, and contextual empty states.
- [ ] Add a governance summary component test through the Today page surfaces where practical.
- [ ] Fetch recent risks and decisions in `getTodayData`.
- [ ] Pass next action, focus set, risks, decisions, and launchpad health to the Today UI.
- [ ] Keep Quick Capture visible but secondary.

### Task 3: Actions Saved Views and Collapsed Controls

**Files:**
- Modify: `src/components/forms.tsx`
- Create: `src/components/forms.test.tsx`
- Modify: `src/app/(app)/actions/page.tsx`

- [ ] Test saved action view chips render the expected routes.
- [ ] Test filters and new-action forms can render inside collapsible sections.
- [ ] Move the action table above the creation form.
- [ ] Keep filters easy to find and open them automatically when filters are active.

### Task 4: Launchpad Health

**Files:**
- Create: `src/components/launchpad-health.tsx`
- Create: `src/components/launchpad-health.test.tsx`
- Modify: `src/app/(app)/launchpad/page.tsx`

- [ ] Test health cards and the top risk list.
- [ ] Show system health before grouped links.
- [ ] Collapse the add-link form.
- [ ] Preserve existing grouped link behavior.

### Task 5: Automation Starters

**Files:**
- Create: `src/components/automation-starters.tsx`
- Create: `src/components/automation-starters.test.tsx`
- Modify: `src/app/(app)/automations/page.tsx`

- [ ] Test the four starter templates render hidden fields with safe defaults.
- [ ] Add one-click forms for weekly review prep, stale task summary, renewal reminder, and lead follow-up draft.
- [ ] Keep the custom automation form collapsed.

### Task 6: Navigation Polish

**Files:**
- Create: `src/components/nav-link.tsx`
- Modify: `src/components/app-shell.tsx`
- Create: `src/components/nav-link.test.tsx`

- [ ] Test active matching for root and nested paths.
- [ ] Apply active styling in desktop and compact navigation.
- [ ] Keep labels and icons unchanged.

### Task 7: Verification

**Commands:**
- `node node_modules/vitest/vitest.mjs run`
- `node node_modules/eslint/bin/eslint.js . --max-warnings=0`
- `node --test scripts/*.test.mjs`
- `node node_modules/next/dist/bin/next build`

- [ ] Run all commands with the bundled Node runtime if the local PowerShell `pnpm` shim reports access denied.
- [ ] Click through Today, Actions, Launchpad, Automations, and Assistant in the in-app browser.
- [ ] Check mobile Today and Actions layouts.
- [ ] Report any residual risks honestly.
