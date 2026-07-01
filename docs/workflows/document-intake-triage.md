# Document Intake & Triage Workflow Contract

Date: 2026-06-28

## Purpose

`Document intake triage` is the cockpit pathway for getting a scanned, uploaded,
or emailed document read, triaged, and routed into the right place with a human
in the loop. It captures a document, reads it locally (OCR + Ollama), classifies
it into a **Business / Personal / Mixed** domain, proposes a disposition (create
an action, file it, or archive it), and holds it in the `/intake` review queue
until the operator approves, files, archives, or rejects it.

Cockpit is the control room and the system of record for the queue, the proposed
triage, and the approval. Reading happens entirely on the box: no document bytes
or extracted text are sent to a cloud service. AI extraction only runs against an
on-box Ollama (loopback or the Docker host); if `OLLAMA_BASE_URL` points off-box,
extraction is skipped and the local heuristic triage stands alone, so document
text never leaves the box. An operator who runs a self-hosted Ollama elsewhere on
their VPN can opt in with `INTAKE_ALLOW_REMOTE_OLLAMA=true` (accepting that text
then leaves this box for that machine). No company Action is created from a
document without explicit human approval.

## Cockpit Register Entry

- Name: `Document intake triage`
- Owner: founder/operator
- Company function: admin, with finance/legal review for financial and contract documents
- Trigger: manual scan triage
- Target tool: local cockpit (Tesseract OCR + poppler + Ollama)
- Safety level: `APPROVAL_REQUIRED`
- Source contract: `docs/workflows/document-intake-triage.md`
- Machine-readable contract: `docs/workflows/document-intake-triage.contract.json`

## Intake Sources

All three converge on one review queue:

- **Watched folder** — files placed in `<INTAKE_DIR>/inbox/scan` (scanner or phone
  sync via Nextcloud/Syncthing/SFTP). Source `FOLDER`.
- **In-cockpit upload** — drag-drop or mobile-camera upload on `/intake`. Source `UPLOAD`.
- **Email** — documents synced into `<INTAKE_DIR>/inbox/email` from the existing
  Company mailroom filing path (Gmail → Drive sync). Source `EMAIL`.

`INTAKE_DIR` defaults to `/data/intake` in Docker (the `intake_data` volume) and
`./.intake` for local dev.

## Pathway

1. **Capture** — a file enters via folder, upload, or email and becomes an
   `IntakeDocument` with status `CAPTURED`. Stored content-addressed by SHA-256;
   duplicates (same hash) are skipped.
2. **Read** — `pdftotext` for digital PDFs; Tesseract (with `pdftoppm` raster) for
   scans and photos. Extracted text is stored locally.
3. **Triage** — heuristics classify domain (Business/Personal/Mixed/Unknown) and
   document type, then a local Ollama pass enriches the summary, due date, and
   suggested title. A proposed Action draft is attached. Status `TRIAGED`.
4. **Review (human in the loop)** — the operator approves into an Action (carrying
   the chosen domain), files for records, archives, or rejects. Status becomes
   `FILED`, `ARCHIVED`, or `REJECTED`.

## Business vs Personal Routing

- Domain is an orthogonal field on both `IntakeDocument` and `Action`
  (`BUSINESS | PERSONAL | MIXED | UNKNOWN`), independent of the existing Streams.
- **Business** documents are routed to a Stream + Company function (e.g. finance
  for invoices/receipts/statements, legal for contracts/insurance, admin
  otherwise) and become normal company actions.
- **Personal** documents are deliberately **not** attached to a company Stream or
  Function; they flow into the Personal pipeline and stay out of company ops.
- **Mixed / Unknown** documents are routed to admin and flagged for the human to
  split or reclassify.

## Reading Engine

- OCR: Tesseract (`tesseract-ocr` + `tesseract-ocr-data-eng`) and poppler
  (`poppler-utils`), installed in the app image.
- Understanding: the local Ollama model (`OLLAMA_MODEL`, default `gemma3:1b`) via
  `OLLAMA_BASE_URL`. JSON-only extraction; output is a draft, never an action.
- If a binary is missing or a document cannot be read, the pathway degrades to a
  filename-based triage with the read error recorded; the operator can still
  review and approve manually.

## Approval And Run Flow

1. Operator scans/uploads/emails a document, or approves the `Document intake
   triage` automation to pull the watched folders into the queue.
2. Operator runs **Read & triage** on captured documents.
3. Cockpit reads locally and attaches a proposed domain, disposition, and action.
4. Operator approves into an action, files, archives, or rejects each document.

The automation, when approved, ingests the watched folders (creating `CAPTURED`
documents) and records a run summary plus a single review action. It never reads,
triages, or creates per-document actions automatically.

## Duplicate And Exception Rules

- Deduplicate by SHA-256 content hash; a re-scanned identical file is skipped.
- A read or extraction failure sets the document to `FAILED` (or records a triage
  note) and keeps it visible in the queue for manual handling.

## Blocked Boundaries

This workflow must not:

- Send document bytes or extracted text to a cloud AI/OCR provider by default.
- Pay invoices, move money, or create bank rules.
- Lodge BAS, tax, legal, or compliance documents.
- Create, update, or approve Xero records.
- Create any Action from a document without explicit human approval.
- Publish anything or send external email.

## Rollback And Disable Path

- Stop dropping files into the watched folders, or pause the automation.
- Reject incorrectly captured documents; they move to `REJECTED` rather than being
  deleted.
- Archived documents move to `<INTAKE_DIR>/archive` and can be restored.
- Mark generated review actions done or cancelled once resolved.

## Proof Metrics

- Documents captured (by source)
- Documents read successfully vs read failures
- Triage domain split (Business / Personal / Mixed / Unknown)
- Manual domain/disposition corrections per batch
- Documents approved into actions vs filed vs archived vs rejected

Promotion to `TRUSTED_LOOP` requires at least 30 days or 20 clean runs, low
duplicate noise, reviewed read-failure handling, and a written rollback check.

## Follow-ups (not in v1)

- Authenticated original-file preview/download in the queue.
- Vision-model reading for low-quality scans.
- Per-document re-routing into the Drive folder structure used by mailroom filing.
