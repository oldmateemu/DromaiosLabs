# Automations

## Safety Levels

- `DRAFT_ONLY`: can propose work but cannot execute.
- `APPROVAL_REQUIRED`: can run only from an explicit approval button.
- `TRUSTED_LOOP`: proven low-risk routine. Scheduling may be added after v1.
- `BLOCKED`: cannot run without explicit review and code changes.

## Blocked By Default

- Banking or payment execution.
- Legal filing.
- Credential changes.
- Public publishing.
- Clinical or regulatory claims.
- Sensitive data transmission to cloud services.
- Destructive data changes.

## First Good Loops

- Weekly company review prep.
- Stale task summary.
- Subscription and renewal reminders.
- Due-soon compliance checks.
- Lead follow-up drafts.
- Post-course feedback follow-up drafts.

## Local Draft Runner

The first implemented local runner is `Weekly review prep`.

- Safety level: `DRAFT_ONLY`.
- Scope: reads local cockpit records only.
- Output: writes a generated weekly review brief to the automation run log.
- Hard limits: no webhook call, no external service, no public publishing, no credential change, and no action/review records are created automatically.
