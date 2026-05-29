# Dromaios Company Cockpit Design

Date: 2026-05-29
Status: Approved design, pending implementation plan

## Purpose

Build a low-cost, self-hostable company cockpit for Dromaios Labs that helps a one-person company run with company-grade discipline. The cockpit should keep all streams, core company functions, due work, recurring checks, software links, reviews, and automation opportunities visible from one place.

The cockpit is the operating layer. It should not replace every specialist tool. It should organise the work, store enough structured company memory to guide decisions, and link out to or trigger external systems when that is the cleaner option.

## Build Approach

Use a thin custom cockpit rather than a full company operating system from scratch.

The app should provide a personalised daily/weekly command surface over:

- DromaiosEd course operations.
- ClinicBoss product work.
- HIL and Skool tools/community work.
- Medtech direction, evidence, IP, and regulatory guardrails.
- Company core functions: finance, legal, compliance, admin, sales, delivery, product, governance, risk, and founder workload.

Existing specialist tools remain in place. Examples include Xero, Airwallex, Lawpath, Skool, ChatGPT, Claude, Ollama, GitHub, hosting dashboards, banking, domains, and automation tools.

## Recommended Stack

- App: Next.js App Router with TypeScript.
- Database: Postgres.
- ORM/migrations: Prisma.
- Styling: Tailwind CSS with a restrained operational dashboard style.
- Auth: simple local login for the first version, with team/invite readiness in the data model.
- AI: Ollama local adapter first, plus optional OpenAI/Anthropic adapters behind explicit configuration and safety rules.
- Automations: generic webhook adapter that can call n8n or Activepieces flows without coupling the core app to one automation product.
- Deployment: Docker Compose on Hetzner, behind Caddy for HTTPS and reverse proxying.
- Documentation: AI-readable maintenance pack committed with the app.

## Core Modules

### Today Command Board

The first screen should answer: what needs attention today?

It should show:

- Top priorities.
- Due today.
- Overdue.
- Upcoming.
- Blocked or waiting.
- Recently completed.
- Quick capture input.
- Assistant summary: "what should I do next?"

The board should encourage a small daily focus set: one admin/compliance item, one revenue/delivery item, and one strategic/product item.

### Company Action Register

Use one shared action system across all streams and functions. Actions can be filtered by stream, company function, status, priority, due date, source, review date, or automation state.

An action should support at least:

- Title.
- Description.
- Stream.
- Company function.
- Status.
- Priority.
- Due date.
- Review date.
- Next step.
- Source.
- Sensitive flag.
- Created by: user, assistant, review, or automation.
- Related link, risk, decision, review, or automation.

### Company Launchpad

Provide grouped links to the software and services used to run the company.

Initial groups:

- Money: Xero, Airwallex, banking, Stripe or payment tools.
- Legal/admin: Lawpath, ASIC, ABR, IP notes, insurance.
- AI/workbench: ChatGPT, Claude, Ollama, Codex.
- Community/sales: Skool, CRM, waitlists, enquiry forms.
- Product: GitHub, ClinicBoss, deployments, docs.
- Learning/evidence: research links, policies, source library.
- Infrastructure: Hetzner, domains, DNS, email, monitoring.

Each link should support:

- URL.
- Group.
- Description.
- Cost.
- Renewal date.
- Login or credential-location note.
- Risk level.
- Owner.
- Related recurring actions.
- Sensitive flag.

### Review And Improvement Coach

The cockpit should support a hybrid of structured weekly review and active coaching.

The weekly review should guide checks across:

- Compliance and legal.
- Finance and cash.
- Sales and follow-ups.
- Delivery and operations.
- Product and research.
- Governance and risk.
- Founder workload and priorities.

The assistant should prepare a review summary and draft proposed actions, but the user approves what becomes real work.

Daily tips should stay lightweight: one useful improvement or check, not a noisy feed. Weekly and monthly reviews carry the deeper company-improvement logic.

### Assistant Workbench

The assistant should help with:

- Messy quick capture to structured actions.
- Due date, stream, and function classification.
- Review summaries.
- Stale task and overdue summaries.
- Drafting follow-up actions.
- Drafting automation candidates.
- Explaining company state.
- Reviewing docs and suggesting updates.

Ollama is the default for private or routine company memory work. Cloud AI can be used for higher-quality drafting, strategy, code help, and document review when the data is non-sensitive, redacted, or explicitly approved for cloud use.

### Automation Control Room

Automations should be visible and governed from the cockpit.

Safety levels:

- Draft only: AI proposes actions, emails, notes, or automation candidates. Nothing is sent or changed.
- Approval required: a button can create tasks, call webhooks, open tools, or run approved flows only after user confirmation.
- Trusted loop: proven low-risk routines can run on a schedule.
- Blocked without explicit review: payments, legal filings, credential changes, public publishing, clinical/regulatory claims, sensitive data transmission, and destructive changes.

The first low-risk automations should be:

- Weekly company review prep.
- Stale task summary.
- Subscription and renewal reminders.
- Due-soon compliance checks.
- Lead follow-up drafts.
- Post-course feedback follow-up drafts.

## Core Data Objects

### Action

The primary unit of work.

Fields: title, description, stream, company function, status, priority, due date, review date, next step, source, sensitive flag, related records, timestamps.

### Stream

The strategic area the work belongs to.

Initial streams: DromaiosEd, ClinicBoss, HIL/Skool, Medtech Direction, Company Core.

### Company Function

The operational discipline the work supports.

Initial functions: finance, legal, compliance, admin, sales, marketing, delivery, product, research, governance, risk, founder workload.

### Launchpad Link

A company system, external tool, service, or important destination.

Fields: name, URL, group, description, cost, renewal date, login note, risk level, owner, sensitive flag, related recurring actions.

### Review

A stored daily, weekly, or monthly review.

Fields: review type, period, answers, assistant summary, generated actions, decisions, unresolved risks, timestamps.

### Automation

A registered automation or proposed automation.

Fields: name, description, trigger, target tool, webhook/config reference, safety level, status, last run, last failure, rollback note, related actions.

### Decision

A durable company decision.

Fields: decision, rationale, date, affected stream/function, follow-up action, related docs.

### Risk

A company risk or concern.

Fields: issue, severity, status, mitigation, next review date, related stream/function/action/docs.

### Assistant Draft

A proposed AI output before approval.

Fields: prompt, model/provider, source data summary, generated content, proposed action, approval state, timestamps.

## Daily Workflow

1. Open the Today Command Board.
2. Review overdue, due today, upcoming, blocked, and waiting items.
3. Use quick capture for messy notes.
4. Let the assistant propose structured actions from messy capture.
5. Confirm or edit the proposed actions.
6. Pick a small focus set for the day.
7. Trigger approved automations or open external tools as needed.
8. Close the day by reviewing completed/stale items and capturing loose ends.

## Weekly Workflow

1. Start the guided weekly company review.
2. Review compliance, finance, sales, delivery, product, governance, risk, and founder workload.
3. Assistant prepares summaries of overdue items, stale work, due checks, recurring costs, missed follow-ups, and unresolved risks.
4. Assistant drafts proposed actions.
5. User approves, edits, defers, or rejects proposed actions.
6. Confirm next week priorities.
7. Store important decisions and update living docs when the operating model changes.

## Documentation Layer

The repository should include an AI-readable maintenance pack:

- `AI_CONTEXT.md`: a short index telling future AI sessions what to read first.
- `README.md`: what the app does, how to run it, and how it is deployed.
- `docs/OPERATING_MODEL.md`: streams, functions, review rhythm, and company rules.
- `docs/DATA_MODEL.md`: core records and relationships.
- `docs/AUTOMATIONS.md`: automation registry, safety levels, approval rules, and examples.
- `docs/AI_GUIDE.md`: model routing, privacy rules, prompt patterns, and assistant constraints.
- `docs/CHANGE_GUIDES.md`: recipes for common changes such as adding a stream, launchpad group, recurring check, or automation.
- `docs/DECISIONS.md`: durable decision log for major design and operating choices.

The docs should stay short, practical, and updated when implementation changes the operating model.

## Privacy And AI Rules

Local-only by default:

- Patient/client-identifiable data.
- Credentials and credential locations beyond high-level notes.
- Contracts and sensitive legal records.
- Financial raw records.
- Patentable ClinicBoss or medtech details.
- Clinical, regulatory, or unreleased product claims.

Cloud AI may be used for:

- Public copy after checking posting guardrails.
- Strategy and planning with sensitive details removed.
- Code help.
- Documentation review.
- Generic business analysis.

The app must make model/provider choice visible for assistant drafts.

## First Version Scope

The first implementation should include:

- Authentication.
- Today Command Board.
- Action register CRUD.
- Streams and company functions.
- Launchpad CRUD with groups and metadata.
- Weekly review flow.
- Assistant draft storage.
- Ollama-backed messy capture to structured action drafts.
- Manual automation registry with safety levels.
- Webhook trigger support for approval-required automations.
- AI maintenance docs.

The first implementation should not include:

- Direct banking/payment execution.
- Direct legal filing.
- Direct public posting.
- Full CRM replacement.
- Full accounting replacement.
- Autonomous cloud-agent execution.
- Sensitive data sync into cloud AI.

## Acceptance Criteria

- A user can open the cockpit and understand what needs attention today.
- A user can capture messy notes and approve structured action drafts.
- Actions can be filtered across all streams and company functions.
- Company software links can be grouped, annotated, and tied to renewals or recurring checks.
- The weekly review creates durable review records and proposed actions.
- Assistant drafts show provider/model, source summary, and approval state.
- Automations have explicit safety levels and logs.
- Future AI sessions can read the maintenance docs and understand how to modify the system safely.

## Verification Plan

Implementation should include:

- Unit tests for data mapping and assistant draft parsing.
- API tests for action, launchpad, review, and automation flows.
- UI tests for Today board, quick capture, weekly review, and launchpad management.
- A local smoke test for Docker Compose startup.
- A manual safety check confirming blocked actions cannot execute without explicit review.
