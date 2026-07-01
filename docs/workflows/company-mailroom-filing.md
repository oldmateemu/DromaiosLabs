# Company Mailroom Filing Workflow Contract

Date: 2026-06-05

## Purpose

`Company mailroom filing` is the first external admin automation foundation. It files labelled Gmail attachments into Drive quarantine folders and writes metadata rows to Sheets for review. It supports receipts and supplier invoices from day one, but it does not extract accounting values, pay bills, lodge anything, delete source messages, or write to Xero.

Cockpit is the control room for approval, safety state, run summaries, and review actions. Gmail, Drive, and Sheets remain the external execution path through Gmail Processor or a small Apps Script.

## Cockpit Register Entry

- Name: `Company mailroom filing`
- Owner: founder/operator
- Company function: admin, with finance review for receipt and invoice rows
- Trigger: manual Gmail/Drive/Sheets filing review
- Target tool: Gmail Processor / Apps Script
- Safety level: `APPROVAL_REQUIRED`
- Source contract: `docs/workflows/company-mailroom-filing.md`
- Machine-readable contract: `docs/workflows/company-mailroom-filing.contract.json`

## Inputs Read

- Gmail messages carrying one of these labels: `contract`, `receipt`, `invoice`, `certificate`, `insurance`, `venue`, `course`, `software`
- Gmail sender, subject, received date, message ID, thread ID, and attachment metadata
- Attachment bytes for PDFs, images, and common document files
- Existing Sheet rows for duplicate detection by Gmail message ID and attachment hash

No bank, payment, accounting, tax, or Xero data is read in v1.

## Outputs Created

- Drive file copy in a quarantine or review folder
- One row in the relevant review Sheet
- Optional exception row when a file cannot be handled safely
- Cockpit run summary and a linked review action

Nothing is deleted from Gmail. Nothing is promoted from quarantine to processed without human review.

## Drive Folders

- `Company Core/Finance/Receipts/Inbox`
- `Company Core/Finance/Receipts/Processed`
- `Company Core/Finance/Invoices/Inbox`
- `Company Core/Admin/Contracts`
- `Company Core/Admin/Insurance`
- `Company Core/Admin/Renewals`
- `Company Core/Automation Logs`

## Sheets

### Finance Receipt Log

Minimum columns:

- `received_at`
- `sender`
- `subject`
- `gmail_message_id`
- `gmail_thread_id`
- `gmail_label`
- `attachment_filename`
- `attachment_hash`
- `drive_file_id`
- `drive_file_url`
- `filing_status`
- `exception_reason`
- `reviewer_note`

Reserved OCR columns:

- `merchant_or_supplier`
- `document_date`
- `amount`
- `tax_or_gst`
- `currency`
- `category`
- `extraction_confidence`

### Supplier Invoice Review

Minimum columns:

- `received_at`
- `sender`
- `subject`
- `gmail_message_id`
- `gmail_thread_id`
- `gmail_label`
- `attachment_filename`
- `attachment_hash`
- `drive_file_id`
- `drive_file_url`
- `filing_status`
- `exception_reason`
- `reviewer_note`

Reserved OCR columns:

- `supplier`
- `invoice_number`
- `document_date`
- `due_date`
- `amount`
- `tax_or_gst`
- `currency`
- `category`
- `extraction_confidence`

### Automation Exception Log

Minimum columns:

- `created_at`
- `source`
- `gmail_message_id`
- `gmail_thread_id`
- `label`
- `attachment_filename`
- `exception_type`
- `exception_detail`
- `operator_status`
- `resolved_at`

## Filing Rules

- `receipt` label files to `Company Core/Finance/Receipts/Inbox`
- `invoice` label files to `Company Core/Finance/Invoices/Inbox`
- `contract` label files to `Company Core/Admin/Contracts`
- `insurance` label files to `Company Core/Admin/Insurance`
- `certificate`, `venue`, `course`, and `software` label files to the nearest admin review folder until a narrower folder is approved

File naming convention:

`YYYY-MM-DD_vendor_amount_source.ext`

When vendor or amount is not known without OCR, keep the original filename and append safe source context such as the Gmail message ID.

## Approval And Run Flow

1. Operator labels messages in Gmail.
2. Operator approves `Company mailroom filing` in Cockpit.
3. Cockpit records the approved run summary and creates a review action.
4. Operator runs or inspects the Gmail Processor / Apps Script workflow outside Cockpit.
5. External workflow copies attachments to Drive quarantine and writes Sheet rows.
6. Operator reviews exceptions and sampled filed rows before any promotion.

Cockpit approval does not call Gmail, Drive, Sheets, OCR, Xero, or payment systems.

## Duplicate And Exception Rules

Use Gmail message ID plus attachment hash when feasible. If the same message ID and hash already exist in the target Sheet, log a duplicate exception or skip the second copy according to the Apps Script configuration.

Exceptions must be visible when:

- An expected attachment is missing
- The file type is unsupported
- A duplicate is found
- A target folder or Sheet cannot be found
- A label is ambiguous
- The workflow lacks permission to copy or log the file

## OCR Foundation

OCR is disabled in v1. The Sheet schemas reserve extraction columns so OCR can be added later without changing the source-of-truth log shape.

Later OCR must:

- Write review fields, not final accounting decisions
- Include extraction confidence
- Keep a reviewer note or correction field
- Avoid sending sensitive data to an AI or OCR provider until privacy review is complete
- Stay disconnected from payments, bank rules, tax lodgement, and Xero writes

## Blocked Boundaries

This workflow must not:

- Pay invoices or move money
- Create bank rules
- Lodge BAS, tax, legal, or compliance documents
- Create, update, or approve Xero records
- Delete Gmail originals
- Permanently delete Drive quarantine files
- Send external emails
- Publish anything

## Rollback And Disable Path

- Remove or stop using the Gmail labels that trigger the workflow.
- Disable the Apps Script trigger or Gmail Processor schedule.
- Move incorrectly filed Drive copies back to the quarantine or exception folder.
- Mark incorrect Sheet rows as `needs_review` instead of deleting them.
- Mark generated Cockpit review actions done or cancelled once resolved.

## Failure Notification Path

- Write exception rows to `Automation Exception Log`.
- Leave the Cockpit run summary visible in `/automations`.
- Create or keep the Cockpit review action open until exceptions are checked.

## Proof Metrics

- Labelled messages reviewed
- Attachments filed
- Duplicate count
- Exception count
- Receipt rows created
- Invoice rows created
- Sample retrieval time for a filed attachment
- Manual corrections per review batch

Promotion to `TRUSTED_LOOP` requires at least 30 days or 20 clean runs, low duplicate noise, reviewed exception handling, and a written rollback check that still works.
