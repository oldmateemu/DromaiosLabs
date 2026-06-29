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
- Company mailroom filing for labelled Gmail attachments, receipts, and invoices.
- Due-soon compliance checks.
- Lead follow-up drafts.
- Post-course feedback follow-up drafts.

## Local Draft Runners

The implemented local runners are `Weekly review prep`, `Stale task summary`, and `Daily inbox triage`.

- Safety level: `DRAFT_ONLY`.
- Scope: reads local cockpit records only.
- Output: writes the generated brief or digest to the automation run log.
- Hard limits: no webhook call, no external service, no public publishing, no credential change, and no action/review records are created automatically.

`Weekly review prep` summarises overdue work, stale actions, renewal checks, draft review pressure, and open risks.

`Stale task summary` summarises open actions that have not moved for at least seven days, with follow-up prompts for high-priority, overdue, waiting, and blocked work.

`Daily inbox triage` prepares a local weekday digest from cockpit action records as an inbox-work proxy until a reviewed Gmail export or connector is added. It groups work into the company automation plan buckets: action needed, waiting, receipt/invoice, lead, FYI, and unsubscribe/noise. It prepares reply and filing review prompts without sending email, creating Gmail drafts, moving labels, deleting messages, unsubscribing, or contacting external systems.

## Local Approval Runner

`Renewal reminder` is an `APPROVAL_REQUIRED` local runner.

- Scope: reads launchpad system metadata and the derived launchpad health model.
- Trigger: manual approval from the Automations registry.
- Output: creates linked reminder actions for launchpad renewals due now or within 30 days, then writes the run summary to the automation log.
- Hard limits: no webhook call, no external service, no public publishing, and no credential values are copied into reminder actions.

The reminder due date targets seven days before the renewal date when possible. For already-due renewals, the generated action is due on the run date.

`Company mailroom filing` is an `APPROVAL_REQUIRED` local control-room runner for an external Gmail/Drive/Sheets workflow.

- Scope: Cockpit records the approved run summary and creates a review action; Gmail, Drive, Sheets, OCR, Xero, payment, tax, and accounting systems are not contacted by Cockpit.
- Trigger: manual approval from the Automations registry.
- External contract: `docs/workflows/company-mailroom-filing.md`.
- Machine-readable contract: `docs/workflows/company-mailroom-filing.contract.json`.
- Output: writes the receipt/invoice filing contract summary to the run log and creates a `Company Core` review action if one is not already open.
- Hard limits: no Gmail deletion, no Drive quarantine deletion, no payment execution, no bank rules, no BAS/tax/legal lodgement, no Xero writes, no sending, and no publishing.

The v1 external workflow supports Gmail labels including `receipt`, `invoice`, `contract`, `certificate`, `insurance`, `venue`, `course`, and `software`; files to Drive quarantine/review folders; and writes metadata rows to `Finance Receipt Log`, `Supplier Invoice Review`, and `Automation Exception Log`. OCR columns are reserved for later, but OCR is disabled in v1 and must remain review-only when added.
