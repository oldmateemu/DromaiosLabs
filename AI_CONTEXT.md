# AI Context: Dromaios Cockpit

Start here before changing the cockpit.

## What This App Is

Dromaios Cockpit is the private operating dashboard for Dromaios Labs. It keeps daily actions, weekly company reviews, software links, assistant drafts, and approval-gated automations in one command-and-control workspace.

## Read First

1. `docs/superpowers/specs/2026-05-29-dromaios-company-cockpit-design.md` for the approved product design.
2. `docs/OPERATING_MODEL.md` for streams, functions, and review rhythm.
3. `docs/DATA_MODEL.md` for the core records.
4. `docs/AUTOMATIONS.md` before changing any automation behavior.
5. `docs/AI_GUIDE.md` before changing assistant/model behavior.

## Safety Defaults

- Do not send sensitive company, financial, legal, patient/client, IP, or regulatory data to cloud AI by default.
- Do not add silent execution for payments, legal filings, credential changes, public publishing, or clinical/regulatory claims.
- All new automation types start as draft-only or approval-required.
- Keep the UI tidy, readable, operational, and command-and-control.
