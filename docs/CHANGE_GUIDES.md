# Change Guides

## Add A Stream

1. Add it to `prisma/seed.ts`.
2. Run `pnpm db:seed`.
3. Confirm it appears in action creation forms.
4. Update `docs/OPERATING_MODEL.md`.

## Add A Launchpad Group

1. Create a link with the new group in the Launchpad page.
2. Add seed entries only if the group should exist for every environment.
3. Update `docs/OPERATING_MODEL.md` if it changes how the company is run.

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
