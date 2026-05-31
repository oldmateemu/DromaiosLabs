# Cockpit Operating Intelligence Design

Date: 2026-05-30
Status: Approved by implementation request

## Purpose

Upgrade the Dromaios Cockpit from a tidy CRUD dashboard into a sharper operating surface that answers: what needs my attention now, what can safely wait, and what company control is missing?

The work should make the product feel 10x more useful without adding visual noise, charts, gamification, or a persistent assistant feed.

## Product Direction

The cockpit should lead with judgement, not raw data entry. The first screen should show one next best action, a small daily focus set, urgent work buckets, operating checks, system health, and governance signals.

Forms should remain available, but they should no longer dominate the first viewport of secondary pages. Creation and filtering controls should be collapsed or moved behind deliberate actions unless they are the primary workflow.

## Scope

Implement these upgrades:

- Next best action banner on Today.
- Daily focus set using existing streams and company functions.
- Contextual empty states instead of generic filler copy.
- Saved action view chips for common operating lenses.
- Collapsed creation and filter panels on Actions, Launchpad, and Automations.
- Launchpad system health panel using existing cost, renewal, risk, owner, and credential metadata.
- Risks and decisions summary on Today using existing Prisma models.
- Automation starter templates that create draft-only or approval-required loops from hidden form data.
- Active navigation state for desktop and compact navigation.

## Architecture

Add a pure `cockpit-insights` module that derives recommendations from existing data. UI components consume those derived objects and stay mostly presentational.

No database migration is required. The existing `Action`, `LaunchpadLink`, `Risk`, `Decision`, `Automation`, and `AssistantDraft` models already contain enough structure for this upgrade.

## Data Flow

`getTodayData` fetches actions, launchpad links, automations, assistant drafts, risks, and decisions. It builds buckets with the existing domain function, then derives next action, focus set, launchpad health, and governance summary.

Secondary pages use the same component patterns:

- Actions: saved views, table first, collapsible filters and action creation.
- Launchpad: health first, grouped links second, collapsible creation.
- Automations: starter templates and registry first, custom registration collapsed.

## UI Rules

- Keep typography, color, and spacing restrained.
- Use semantic pills, summary strips, and compact action links rather than large decorative cards.
- Do not add charts, gradients, large hero areas, or dashboard theatre.
- Preserve desktop-first density and keep mobile legible with no overlapping controls.

## Testing

Add pure unit tests for insight ranking and launchpad health. Add component tests for the Today board, saved views, collapsed panels, launchpad health panel, and automation starter templates.

Verify with unit tests, lint, build, script tests, and a browser click-through across Today, Actions, Launchpad, Automations, and mobile Today.
