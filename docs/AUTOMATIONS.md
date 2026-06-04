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

## Local Draft Runners

The implemented local runners are `Weekly review prep` and `Stale task summary`.

- Safety level: `DRAFT_ONLY`.
- Scope: reads local cockpit records only.
- Output: writes the generated brief or digest to the automation run log.
- Hard limits: no webhook call, no external service, no public publishing, no credential change, and no action/review records are created automatically.

`Weekly review prep` summarises overdue work, stale actions, renewal checks, draft review pressure, and open risks.

`Stale task summary` summarises open actions that have not moved for at least seven days, with follow-up prompts for high-priority, overdue, waiting, and blocked work.

## Local Approval Runner

`Renewal reminder` is an `APPROVAL_REQUIRED` local runner.

- Scope: reads launchpad system metadata and the derived launchpad health model.
- Trigger: manual approval from the Automations registry.
- Output: creates linked reminder actions for launchpad renewals due now or within 30 days, then writes the run summary to the automation log.
- Hard limits: no webhook call, no external service, no public publishing, and no credential values are copied into reminder actions.

The reminder due date targets seven days before the renewal date when possible. For already-due renewals, the generated action is due on the run date.
