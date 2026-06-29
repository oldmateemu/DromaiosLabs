# Change Guides

## Add A Stream

1. Add it to `prisma/seed.ts`.
2. Run `pnpm db:seed`.
3. Confirm it appears in action creation forms.
4. Update `docs/OPERATING_MODEL.md`.

## Edit A Setup Item

1. Open `/setup`.
2. Use the row quick-edit controls to change status, due date, priority, or next step.
3. The checklist definition still controls item identity, category, and default wording.
4. The backing Action row controls mutable operating state, so edits flow into Today, Actions, and weekly review surfaces.

## Add A Launchpad Group

1. Create a link with the new group in the Launchpad page.
2. Add seed entries only if the group should exist for every environment.
3. Update `docs/OPERATING_MODEL.md` if it changes how the company is run.

## Edit Launchpad System Metadata

1. For normal day-to-day changes, edit cost, renewal date, owner, group, and risk directly on `/launchpad`.
2. For full record edits, open the system detail page from `/launchpad` and update name, URL, stream, credential-location note, description, or sensitivity.
3. Keep real credential values out of Cockpit; store only where the credential lives.
4. Use `prisma/launchpad-system-metadata.local.json` only for bootstrap or bulk local reseed values.
5. After changing renewal metadata, run the Renewal reminder automation if you need open reminder actions refreshed immediately.

## Add An Automation

1. Register it in the Automation Control Room.
2. Start at `DRAFT_ONLY` or `APPROVAL_REQUIRED`.
3. Add the webhook target.
4. Run once with approval.
5. Review the run log before considering trusted status.

## Change Assistant Behavior

1. Read `docs/AI_GUIDE.md`.
2. Update pure parsing tests first.
3. Keep fallback behavior safe when Ollama is unavailable or invalid.
