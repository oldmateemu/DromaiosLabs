# Dromaios Labs Basic Company Automation Plan

Date: 2026-06-04

## Executive Decision

Use Dromaios Cockpit as the control room, not the engine for every external task. Cockpit should hold the automation register, safety level, owner, last run, output summary, links to source artifacts, and approval state. The actual work should run in the lowest-complexity tool that fits the job:

- Google Workspace native tools for Gmail, Drive, Calendar, Docs, Sheets, and Admin tasks.
- Google Apps Script or Google Workspace CLI for small, auditable custom automations.
- Self-hosted n8n for multi-step workflows across Gmail, Drive, Sheets, OCR, accounting, Slack/Chat, forms, and webhook-based tools.
- GStack for product, software, QA, document, review, and release workflows, not as the main receipts/email/calendar automation engine.

The operating rule is simple: automate capture, filing, summaries, reminders, and drafts first. Delay automatic sending, publishing, payments, account changes, legal filing, and accounting updates until the workflow has proven itself and has explicit approval gates.

## Automation Safety Rules

Every automation must have:

- Owner.
- Company function.
- Trigger.
- Inputs read.
- Outputs created.
- Safety level.
- Rollback or disable path.
- Failure notification path.
- Proof metric.
- Link to source workflow, script, or exported JSON.

Use these levels:

- `DRAFT_ONLY`: can summarize, classify, prepare checklists, or create text for review. It cannot send, post, invite, pay, delete, or change external records.
- `APPROVAL_REQUIRED`: can perform a bounded action only after a human presses an approval control.
- `TRUSTED_LOOP`: only for proven, low-risk, reversible routines after repeated clean runs.
- `BLOCKED`: anything involving payments, legal filing, credential changes, public publishing, clinical/regulatory claims, sensitive data transmission, or destructive changes.

Promotion rule:

- New automation starts as `DRAFT_ONLY` unless it only reads data or files documents into a quarantine folder.
- External writes start as `APPROVAL_REQUIRED`.
- Move to `TRUSTED_LOOP` only after at least 30 days or 20 clean runs, with a written rollback and owner.

## Recommended Tool Stack

| Layer | Tool | Use | Justification |
| --- | --- | --- | --- |
| Control room | Dromaios Cockpit | Register automations, show safety state, store run summaries, create approved actions | Already matches the local/VPN-first company operating model and keeps automation decisions visible. |
| Workspace workhorse | Google Workspace CLI (`gws`) | Scriptable Gmail, Drive, Calendar, Docs, Sheets, Admin checks | Broad Google Workspace coverage, structured JSON output, dry-run support, and agent-friendly skills make it a good base for auditable custom scripts. |
| Google-native scripts | Apps Script | Simple Gmail/Drive/Calendar automation that should live inside Workspace | Low infrastructure, direct Workspace permissions, good for receipts, shared calendars, reminders, and admin sheets. |
| Workflow engine | Self-hosted n8n | Multi-step workflows with Gmail, Drive, Sheets, OCR, forms, payment webhooks, notifications | Strong fit when the workflow touches multiple services or needs a visual editor plus custom code. Self-hosting gives more control than random SaaS zaps. |
| Email/file processor | Gmail Processor | Rule-based Gmail attachment filing into Drive and Sheets | Mature open-source Apps Script option for matching emails, storing attachments, OCR text extraction, and spreadsheet logging. |
| AI-assisted Workspace access | Google Workspace MCP server or `gws` agent skills | Only for sandboxed, least-privilege AI assistant workflows | Useful later, but too broad for first-pass company automation unless scopes are tightly controlled. |
| Product/software workflow | GStack | Product review, engineering planning, QA, release, docs, browser checks | Good for building and reviewing automations and product changes, but not the primary engine for receipts, emails, or calendars. |

## GStack Verdict

Adopt GStack as an agent operating method for software/product work, not as the core company admin automation platform.

Use it for:

- Reviewing automation plans before implementation.
- Running product/engineering/design/QA/release checks for Dromaios Cockpit, ClinicBoss, HIL tools, DromaiosEd assets, and deployment work.
- Creating structured review habits around pull requests, browser QA, documentation, and release readiness.

Do not use it as the direct system of record for receipts, inboxes, calendars, credentials, accounting, or company compliance. Those belong in Google Workspace, Xero/accounting systems, Cockpit, and auditable workflow scripts.

## Company Automation Portfolio

### 1. Finance: Receipt And Invoice Capture

Automation: `Finance receipt intake`

- Trigger: Gmail label `receipt` or Drive folder `Finance/Inbox/Receipts`.
- Inputs: receipt/invoice emails, PDF/image attachments, sender, received date.
- Output: original file stored in Drive, row in `Finance Receipt Log`, Cockpit run summary.
- Tool candidates: n8n Gmail receipt template, n8n invoice/receipt OCR template, Gmail Processor, or custom `gws` script.
- Safety: start `APPROVAL_REQUIRED` for filing plus extraction; never auto-pay or auto-submit tax.
- Justification: receipts are frequent, easy to lose, and expensive to reconstruct at tax time. Automating capture creates an audit trail without making financial decisions.
- Proof metric: percent of labelled receipts filed, duplicate rate, extraction error rate, manual corrections per month.

Implementation preference:

1. First week: no AI. Label receipts, store attachments into Drive, log metadata to Sheets.
2. Second week: add OCR extraction to populate merchant, date, amount, GST/tax, category, currency, source email, file link.
3. Third week: add Cockpit summary and exceptions list.
4. Later: connect to Xero only as a draft import or review queue.

Do not automate:

- Payment execution.
- Bank rules.
- BAS/tax lodgement.
- Final accounting categorisation without review.

### 2. Finance: Supplier Invoice Review Queue

Automation: `Supplier invoice review`

- Trigger: Gmail label `invoice` or Drive folder `Finance/Inbox/Invoices`.
- Inputs: invoice email, attachment, known supplier list.
- Output: Drive archive, extraction row, review checklist, Cockpit action if due date is within 14 days.
- Tool candidates: n8n invoice OCR template, Gmail Processor, custom `gws` script.
- Safety: `APPROVAL_REQUIRED` if it creates Cockpit reminder actions; `BLOCKED` for payments.
- Justification: protects cash flow by surfacing due dates and missing details without making payment decisions.
- Proof metric: invoices with due date captured, overdue invoices found before due date, exception count.

### 3. Finance: Customer Invoice Drafting

Automation: `Customer invoice draft`

- Trigger: approved row in `Invoice Drafts` Sheet or CRM/payment webhook.
- Inputs: client name, ABN/details if available, item, amount, tax, due date, payment link.
- Output: PDF invoice draft in Drive and Gmail draft to customer.
- Tool candidates: n8n generate-and-track invoices template, custom Google Docs template, Apps Script.
- Safety: `DRAFT_ONLY` for first version, then `APPROVAL_REQUIRED` to send.
- Justification: invoice creation is repetitive and structured, but errors are customer-facing and financial. Drafting saves time while preserving human review.
- Proof metric: time from invoice request to approved draft, manual edits per invoice, payment follow-up delay.

### 4. Email: Daily Inbox Triage

Automation: `Daily inbox triage`

- Trigger: weekday schedule.
- Inputs: Gmail unread or labelled messages from priority accounts.
- Output: Cockpit run summary grouped as action needed, waiting, receipt/invoice, lead, FYI, unsubscribe/noise.
- Tool candidates: Gmail Processor, `gws` Gmail search, Google Workspace MCP in sandbox only.
- Safety: `DRAFT_ONLY`.
- Justification: the company loses time when admin, revenue, compliance, and delivery emails are mixed. A digest is low risk and high leverage.
- Proof metric: unread priority emails older than 48 hours, number of missed due-date emails, manual triage time.

Do not automate:

- Mass deletion.
- Sending replies.
- Unsubscribing without approval.
- Moving legal/compliance messages out of the inbox without a visible review queue.

### 5. Email: Lead And Partner Follow-Up Drafts

Automation: `Lead follow-up draft`

- Trigger: Gmail label `lead`, website form row, Skool/HIL lead list, or manual Cockpit action.
- Inputs: original message, contact name, stream, last contact date, relevant offer.
- Output: Gmail draft or Cockpit assistant draft.
- Tool candidates: custom Cockpit draft runner, `gws` Gmail draft creation, n8n with Gmail draft node.
- Safety: `DRAFT_ONLY` until every template is reviewed.
- Justification: follow-up speed matters, but public promises and clinical/product claims need guardrails.
- Proof metric: lead response time, draft acceptance rate, manual rewrite rate.

### 6. Email: Attachment Filing

Automation: `Company mailroom filing`

- Trigger: Gmail labels such as `contract`, `receipt`, `invoice`, `certificate`, `insurance`, `venue`, `course`, `software`.
- Inputs: labelled emails and attachments.
- Output: Drive folder filing, file naming convention, log row, Cockpit exception summary.
- Tool candidates: Gmail Processor or Apps Script.
- Safety: `TRUSTED_LOOP` only after test period because filing is reversible if originals stay in Gmail.
- Justification: company files are currently spread across emails and local folders. Filing creates a searchable source of truth.
- Proof metric: filed attachment count, duplicate count, exception count, retrieval time.

### 7. Calendar: Availability Calendar

Automation: `Dromaios availability calendar`

- Trigger: schedule or source calendar update.
- Inputs: founder/company calendars.
- Output: sanitized busy/free calendar with generic "Busy" blocks.
- Tool candidates: `karbassi/sync-multiple-google-calendars` or custom Apps Script.
- Safety: `TRUSTED_LOOP` after testing, because it should only copy busy blocks to a controlled calendar.
- Justification: protects scheduling time and privacy while allowing external booking or planning.
- Proof metric: double-bookings avoided, private event details leaked, sync failures.

### 8. Calendar: Meeting Prep Brief

Automation: `Meeting prep brief`

- Trigger: daily 6am or 2 hours before meeting.
- Inputs: Calendar events, attendees, linked docs, related Cockpit actions/risks.
- Output: Cockpit run summary or private prep doc.
- Tool candidates: `gws` Calendar plus Drive search, custom Cockpit runner.
- Safety: `DRAFT_ONLY`.
- Justification: meeting quality improves when context is ready. The workflow reads and summarizes; it should not email attendees.
- Proof metric: meetings with prep brief, manual prep minutes saved, missing context count.

### 9. Calendar: Out-Of-Office And Team Capacity

Automation: `Team out-of-office calendar`

- Trigger: hourly or daily schedule.
- Inputs: team calendars or Google Group members.
- Output: shared team vacation calendar.
- Tool candidates: official Google Apps Script vacation calendar sample.
- Safety: `TRUSTED_LOOP` after setup if it only copies visible OOO/vacation events.
- Justification: not essential for founder-only mode, but useful when contractors, educators, or collaborators need visibility.
- Proof metric: missed availability conflicts, sync exceptions.

### 10. Admin: Renewals, Licences, And Subscriptions

Automation: `Renewal reminder`

- Trigger: manual approval now, later weekly schedule.
- Inputs: launchpad system metadata, renewal dates, owners, cost/risk notes.
- Output: Cockpit reminder actions.
- Tool candidates: existing Cockpit approval runner.
- Safety: already `APPROVAL_REQUIRED`.
- Justification: renewals have financial and operational risk, but the safe action is reminder creation, not payment or cancellation.
- Proof metric: renewals with owner/date/cost, due-soon reminders created, renewals missed.

Expansion:

- Add all Google Workspace, domains, hosting, SaaS, insurance, LMS, Skool, payment, and compliance renewal dates.
- Add `review by`, `cancel by`, and `credential owner` metadata.

### 11. Admin: Onboarding And Offboarding

Automation: `Account onboarding checklist`

- Trigger: new collaborator row in a controlled Sheet or Cockpit action.
- Inputs: name, role, start date, email, groups needed, tools needed.
- Output: checklist and draft account setup steps.
- Tool candidates: Google Workspace onboarding Apps Script as a reference, not a direct install initially.
- Safety: `DRAFT_ONLY` first; account creation should be `APPROVAL_REQUIRED`; deletion/suspension should remain `BLOCKED` until there is a mature offboarding protocol.
- Justification: access mistakes are high risk. A checklist prevents misses without automatically granting access.
- Proof metric: onboarding time, missed access items, stale account count.

### 12. Compliance And Legal: Due-Soon Checks

Automation: `Compliance due-soon scan`

- Trigger: weekly.
- Inputs: Cockpit actions, launchpad records, policy/insurance/certification dates, legal/admin Drive folders.
- Output: due-soon digest and proposed Cockpit actions.
- Tool candidates: existing Cockpit draft runner style plus Drive date scan.
- Safety: `DRAFT_ONLY` for digest; `APPROVAL_REQUIRED` if it creates actions.
- Justification: legal/compliance work is not always frequent, but misses can be costly. The safe automation is early warning.
- Proof metric: obligations with date/owner, overdue compliance items, false positives.

Do not automate:

- Legal filing.
- Contract signing.
- Regulatory or clinical claims.
- Public publication of compliance statements.

### 13. Sales And Delivery: Post-Course Follow-Up

Automation: `Post-course follow-up drafts`

- Trigger: course completion date or feedback form response.
- Inputs: attendee list, feedback results, course stream, follow-up template.
- Output: draft thank-you email, feedback summary, next-step actions.
- Tool candidates: Cockpit draft runner, n8n forms -> Sheets -> Gmail draft, `gws`.
- Safety: `DRAFT_ONLY`.
- Justification: follow-up is predictable and revenue-relevant, but tone and claims need review.
- Proof metric: follow-up delay, feedback captured, conversion to next conversation.

### 14. Product And Engineering: GStack-Assisted Shipping

Automation: `GStack product workflow`

- Trigger: feature idea, branch ready for review, deployment candidate.
- Inputs: repo state, plan, diff, browser target, test output.
- Output: review notes, QA checklist, release checklist, docs draft.
- Tool candidates: `garrytan/gstack`, Codex/GitHub workflow, existing repo tests.
- Safety: `DRAFT_ONLY` for recommendations; `APPROVAL_REQUIRED` for commit/push/deploy actions.
- Justification: this is where GStack is strongest: improving product and software quality by forcing planning, review, QA, and release discipline.
- Proof metric: review issues caught before merge, failed deploys avoided, test coverage added, release notes quality.

## Premade Automation Candidates

| Candidate | Type | Fit | Recommendation |
| --- | --- | --- | --- |
| `googleworkspace/cli` | GitHub repo, Google Workspace CLI | Gmail, Drive, Calendar, Sheets, Docs, Admin scripting | Primary foundation for custom auditable Google automation. |
| `n8n-io/n8n` | GitHub repo, self-hosted workflow engine | Multi-app workflows, OCR, webhooks, notifications, Sheets, Gmail, Drive | Use as the workflow engine when Apps Script becomes too small. |
| n8n Gmail receipt template | Importable workflow template | Gmail receipts -> AI extraction -> Sheets + Drive | Good prototype for receipt capture, but review privacy before sending receipts to OpenAI. |
| n8n invoice/receipt OCR template | Importable workflow template | Drive/Gmail/Telegram receipts -> Gemini OCR -> Sheets | Good if using Gemini is acceptable; otherwise use non-AI filing first. |
| n8n invoice generation template | Importable workflow template | Generate PDF invoices, archive to Drive, send Gmail | Use only in draft/approval mode at first. |
| `ahochsteger/gmail-processor` | GitHub repo, Apps Script library | Rule-based Gmail attachment processing, Drive filing, Sheets logging, OCR | Recommended for mailroom and attachment filing. |
| `karbassi/sync-multiple-google-calendars` | GitHub repo, Apps Script | Availability/busy calendar | Good narrow tool if private event details are sanitized. |
| Google Apps Script vacation calendar sample | Official sample with GitHub source | Team OOO calendar | Use when team/collaborator coordination becomes real. |
| `diascristiano25/google-workspace-onboarding-automation` | GitHub repo, Apps Script | Google Workspace user creation from Sheet | Reference only until onboarding/offboarding policy is mature. |
| `taylorwilsdon/google_workspace_mcp` or similar | GitHub repo, MCP server | AI access to Google Workspace | Sandbox only; useful later, but broad OAuth scope makes it too risky for first-pass admin automation. |
| `garrytan/gstack` | GitHub repo, agent workflow stack | Product, engineering, QA, docs, shipping | Adopt for building/reviewing automations, not for directly running company office workflows. |

## First 30 Days

### Week 1: Foundations

- Create Drive folders:
  - `Company Core/Finance/Receipts/Inbox`
  - `Company Core/Finance/Receipts/Processed`
  - `Company Core/Finance/Invoices/Inbox`
  - `Company Core/Admin/Contracts`
  - `Company Core/Admin/Insurance`
  - `Company Core/Admin/Renewals`
  - `Company Core/Automation Logs`
- Create Gmail labels:
  - `receipt`
  - `invoice`
  - `lead`
  - `action-needed`
  - `contract`
  - `automation-review`
  - `automation-processed`
  - `automation-exception`
- Create Sheets:
  - `Finance Receipt Log`
  - `Supplier Invoice Review`
  - `Automation Exception Log`
  - `Company Access Register`
- Register the first automations in Cockpit:
  - `Finance receipt intake`: `APPROVAL_REQUIRED`
  - `Daily inbox triage`: `DRAFT_ONLY`
  - `Dromaios availability calendar`: `DRAFT_ONLY`
  - `Meeting prep brief`: `DRAFT_ONLY`

### Week 2: Receipts And Mailroom

- Implement Gmail/Drive receipt filing without AI first.
- Test with 10-20 historic receipts.
- Confirm naming convention:
  - `YYYY-MM-DD_vendor_amount_source.ext`
- Add duplicate checks by Gmail message ID and attachment hash when feasible.
- Write run summaries into Cockpit or a linked Sheet.
- Keep all originals in Gmail and Drive quarantine until reviewed.

### Week 3: Calendar And Email Drafts

- Add sanitized busy calendar sync.
- Add daily inbox triage digest.
- Add meeting prep brief.
- Add lead follow-up draft template, but do not send automatically.

### Week 4: Finance Extraction And Admin Controls

- Add OCR extraction to receipt log if privacy review passes.
- Add supplier invoice due-date extraction.
- Expand renewal metadata in launchpad.
- Build admin onboarding/offboarding checklist as draft-only workflow.
- Add automation health check: failed runs, stale credentials, empty outputs, and exceptions.

## 90 Day Target State

By 90 days, the company should have:

- All receipts and invoices automatically filed or surfaced for review.
- A searchable finance receipt log linked to original files.
- A daily inbox digest that separates finance, compliance, leads, delivery, and noise.
- A private availability calendar that reduces double-booking.
- Meeting prep briefs for meaningful calls.
- Lead and course follow-up drafts ready for review.
- Renewal and compliance due-soon actions visible in Cockpit.
- Exported n8n workflows and Apps Script source stored in the repo or linked from Cockpit.
- GStack installed for product/dev workflows if it improves review discipline.

## What Should Stay Manual For Now

- Paying bills.
- Moving money.
- Lodging BAS/tax/legal/compliance documents.
- Signing contracts.
- Creating or deleting user accounts without a checklist and approval.
- Sending customer, partner, student, or public emails automatically.
- Publishing website, LinkedIn, medical, clinical, regulatory, or marketing claims.
- Sending sensitive company, health, legal, or credential data to an AI provider without explicit review.

## My Recommended First Build

Build `Company mailroom filing` first, with receipt/invoice support.

Why:

- It is a daily pain.
- It has clear inputs and outputs.
- It creates a useful finance source of truth.
- It does not need to make risky decisions.
- It can start without AI.
- It creates the foundation for later OCR, Xero review, and tax/accounting readiness.

First implementation shape:

- Gmail labels drive the workflow.
- Attachments are copied to Drive.
- Metadata goes to Sheets.
- Exceptions are written visibly.
- Cockpit stores the run summary and safety state.
- Nothing is deleted, sent, paid, filed to government, or posted publicly.

## Source Links Checked

- Google Workspace CLI: https://github.com/googleworkspace/cli
- n8n repository: https://github.com/n8n-io/n8n
- n8n Gmail receipts template: https://n8n.io/workflows/5451-ai-auto-save-gmail-receipts-to-google-sheets-google-drive/
- n8n invoice/receipt OCR template: https://n8n.io/workflows/3618-auto-invoice-and-receipt-ocr-to-google-sheets-drive-gmail-and-telegram-triggers/
- n8n invoice generation template: https://n8n.io/workflows/10588-generate-and-track-invoices-with-google-drive-pdf-converter-and-gmail/
- Gmail Processor: https://github.com/ahochsteger/gmail-processor
- Google Apps Script vacation calendar sample: https://developers.google.com/apps-script/samples/automations/vacation-calendar
- Multiple Google Calendar sync: https://github.com/karbassi/sync-multiple-google-calendars
- Google Workspace onboarding automation reference: https://github.com/diascristiano25/google-workspace-onboarding-automation
- Google Workspace MCP option: https://github.com/taylorwilsdon/google_workspace_mcp
- GStack: https://github.com/garrytan/gstack
