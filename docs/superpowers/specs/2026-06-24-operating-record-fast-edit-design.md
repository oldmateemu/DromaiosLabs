# Operating Record Fast Edit Design

Date: 2026-06-24
Status: Approved for planning

## Purpose

Make Dromaios Cockpit easier to maintain as the company setup changes. The first release should make common operational metadata quick to edit: setup due dates, action dates, launchpad costs, renewal dates, owners, groups, and risk levels.

The second release should add a general linking model so records can explain each other: what a task depends on, which system a renewal belongs to, which decision created a follow-up, which risk blocks an action, and which setup item a system supports.

## Direction

Use a hybrid interaction model:

- Inline fast edits on list pages for the fields most likely to change during normal operations.
- Detail pages for deeper record editing, context, existing links, and future relationship management.

This keeps daily changes fast while giving the app a clean place to grow richer record-linking behavior.

## Phase 1 Scope: Fast Edit

Phase 1 does not require a database migration. It reuses existing `Action` and `LaunchpadLink` fields.

The `/setup` page should allow quick edits for:

- Status.
- Due date.
- Priority.
- Next step.

Setup identity, category, default description, and default next step remain defined in `src/lib/company-setup-checklist.ts`. Mutable operating state comes from the seeded `Action` row that already represents each setup item. If an action exists, its due date, priority, next step, status, and description should overlay the checklist defaults where applicable.

The `/launchpad` page should allow quick edits for:

- Cost.
- Renewal date.
- Owner.
- Risk level.
- Group.

Launchpad records should also get a focused detail page at `/launchpad/[id]` for the full editable record: name, URL, group, stream, cost, renewal date, owner, risk level, credential-location note, description, and sensitivity. Credential secrets must not be stored in the cockpit; `loginNote` remains a note about where credentials are stored.

The `/actions` page should allow quick edits for:

- Status.
- Priority.
- Due date.
- Review date.

The existing `/actions/[id]` detail page remains the full edit surface for action title, description, next step, stream, function, sensitive flag, and governance context.

## Phase 2 Scope: Linking

Phase 2 should add a generic relationship model after the fast edit experience is working.

The relationship model should support links among:

- Actions.
- Launchpad systems.
- Setup items, via their backing `Action` rows.
- Risks.
- Decisions.
- Automations.

The first relationship labels should be:

- `depends on`
- `blocks`
- `evidence for`
- `renews`
- `follow-up from`
- `supports`

Detail pages should reserve a `Linked records` section in phase 1. In phase 1 it can show existing hardcoded relations, such as an action's launchpad system, related risks, decisions, review, assistant draft, or automation. In phase 2 this section becomes the generic linking UI.

## Data Flow

Inline edits should use focused server actions that update one small record surface and revalidate the affected pages.

Setup quick edits update the existing `Action` row for the checklist item. If the row is missing, the existing self-healing setup path should recreate it before applying the edit.

Launchpad quick edits update `LaunchpadLink`. Edited `cost`, `renewalAt`, `owner`, `riskLevel`, `group`, and `loginNote` values must feed the existing launchpad health, renewal calendar, stream spend, and renewal reminder automation.

Action quick edits update `Action`. Marking an action done should preserve the existing completion timestamp behavior: set `completedAt` when first marked done, clear it when reopened.

## UX Rules

Keep the interface operational and compact.

- Inline controls should be easy to scan and should not turn rows into large forms.
- Use date inputs for date fields and select controls for enum fields.
- Use explicit save buttons for compact edit forms rather than autosave.
- Keep full edit forms available on detail pages for changes that need more context.
- Keep list pages usable on mobile without overlapping controls.

## Safety Rules

- Preserve date-only behavior for setup due dates, action due dates, review dates, and launchpad renewal dates.
- Do not store credential secrets in `loginNote`; store only the credential location or recovery-note location.
- Do not widen renewal automation into payments, cancellations, or external writes.
- Renewal reminders should continue to refresh existing open reminder actions when launchpad metadata changes.
- Seed/import files remain useful for bootstrap, but day-to-day edits should be possible from the cockpit UI.

## Testing

Phase 1 should include:

- Service tests for setup quick edits, launchpad updates, and action quick edits.
- Component tests for the inline edit controls on setup, launchpad, and actions.
- Renewal reminder tests proving edited launchpad metadata flows into refreshed reminder actions.
- Browser proof across `/setup`, `/launchpad`, `/launchpad/[id]`, `/actions`, and `/actions/[id]`.

Phase 2 should include:

- Migration tests or Prisma-level tests for relationship records.
- Service tests for creating and listing relationships.
- Component tests for relationship panels on detail pages.
- Browser proof linking at least one launchpad system, one action, one risk, and one decision.

## Out of Scope

Phase 1 does not add the generic relationship table, relationship creation UI, automation behavior changes, external credential storage, external system writes, or a new setup-item table.

Phase 2 does not replace existing direct relations immediately. Existing relations should remain useful and can be rendered alongside generic relationships until there is a clear reason to consolidate them.
