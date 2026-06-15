# AI Context: Dromaios Cockpit

Start here before changing the cockpit.

## What This App Is

Dromaios Cockpit is the private operating dashboard for Dromaios Labs. It keeps daily actions, weekly company reviews, software links, assistant drafts, and approval-gated automations in one command-and-control workspace.

Operating surfaces:

- Today shows the command brief, focus set, a Company Pulse (weekly completions, overdue load, open risks, automation success rate, tracked spend), the top streams needing attention, and a one-click operating digest download.
- Portfolio (`/portfolio`) rolls every stream up into an attention-ranked operating-health view plus a spend-by-stream breakdown; cards link to that stream's filtered actions.
- Actions have detail pages (`/actions/[id]`) for inline editing, to see linked risks/decisions and the action's origin, and to log a risk or record a decision directly against that action.
- Reviews (`/reviews`) open with a "since last review" momentum panel (completions, new actions, new risks, decisions since the prior review).
- Activity (`/activity`) is a single company timeline across actions, governance, automations, drafts, and reviews, plus a weekly completion-trend chart.
- Launchpad (`/launchpad`) includes a renewals + spend forecast: upcoming renewals grouped by month with cost totals, overdue renewals, and untracked-cost gaps.
- Governance (`/governance`) manages the risk register and decision log directly.
- Automations include a cross-loop run history with success/failure/blocked counts.
- A command palette (Cmd/Ctrl+K) jumps to any page, open action, or launchpad system.
- `/digest` returns a board/records-ready Markdown operating digest (auth-gated download).

Pure, unit-tested operating-intelligence helpers live in `src/lib`: `company-pulse`, `stream-portfolio`, `stream-spend`, `automation-history`, `renewal-calendar`, `review-momentum`, `completion-trend`, `activity-feed`, and `operating-digest`. Keep new aggregation logic in pure helpers with tests, and assemble data in `src/lib/services.ts`.

## Read First

1. `docs/superpowers/specs/2026-05-29-dromaios-company-cockpit-design.md` for the approved product design.
2. `docs/OPERATING_MODEL.md` for streams, functions, and review rhythm.
3. `docs/DATA_MODEL.md` for the core records.
4. `docs/AUTOMATIONS.md` before changing any automation behavior.
5. `docs/AI_GUIDE.md` before changing assistant/model behavior.

## Safety Defaults

- Do not send sensitive company, financial, legal, patient/client, IP, or regulatory data to cloud AI by default.
- Do not add silent execution for payments, legal filings, credential changes, public publishing, or clinical/regulatory claims.
- All new automation types start as draft-only or approval-required.
- Keep the UI tidy, readable, operational, and command-and-control.
