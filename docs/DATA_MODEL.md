# Data Model

The central object is `Action`. Other records either create, explain, group, or trigger actions.

## Core Records

- `User` and `Session`: local email/password access.
- `Stream`: strategic area such as DromaiosEd or ClinicBoss.
- `CompanyFunction`: operational discipline such as finance or sales.
- `Action`: work item with status, priority, due/review dates, source, and related records.
- `LaunchpadLink`: external system with group, URL, renewal, cost, risk, login-location note, and an optional `streamId` linking the system to the venture it supports (enables spend-by-stream).
- `Review`: stored daily/weekly/monthly review answers and generated follow-up actions.
- `AssistantDraft`: AI output before approval.
- `Automation` and `AutomationRun`: approval-gated automation registry and execution log.
- `Risk` and `Decision`: durable company memory.
- `IntakeDocument`: a scanned/uploaded/emailed document captured into the `/intake` review queue. It is read locally (OCR + Ollama), triaged into a `domain` (Business/Personal/Mixed/Unknown) with a proposed `disposition`, and held for human approval before any `Action` is created. Bytes are stored content-addressed on the intake volume; nothing leaves the box.

## Domain (Business vs Personal)

`domain` is an orthogonal `IntakeDomain` field (`BUSINESS | PERSONAL | MIXED | UNKNOWN`) on both `IntakeDocument` and `Action`. It is independent of `Stream`: business documents route into a Stream + Company function, while personal documents flow into the Personal pipeline and are intentionally kept out of company streams and functions. Existing actions default to `BUSINESS`.

## Rule

Assistant drafts, reviews, launchpad checks, automations, and intake documents can propose actions. They do not silently create important work without explicit approval, except low-risk review-generated action creation inside the guided weekly review.
