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

## Rule

Assistant drafts, reviews, launchpad checks, and automations can propose actions. They do not silently create important work without explicit approval, except low-risk review-generated action creation inside the guided weekly review.
