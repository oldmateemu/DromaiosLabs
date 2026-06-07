# Company Setup Checklist

What Dromaios Labs still needs to build out to be legally sound, financially
clean, properly insured, and safely operating as an Australia-first healthcare
company.

This is the human-readable companion to the live checklist in the cockpit
(`/setup`). The cockpit version is seeded from
`src/lib/company-setup-checklist.ts` and tracked as Actions. Tick items off
directly on the `/setup` page (one-click Done/Start/Waiting/Block/Reset); status
flows into the Today board, the Actions register, and the weekly review. The
weekly review page and the local "weekly review prep" draft both surface the
highest-priority outstanding setup items so nothing critical drifts.

### How progress is measured

- **Recommended due dates.** Each item is seeded with a due date based on a
  priority-driven horizon (critical 14 days, high 30, medium 45, low 60), so the
  work lands as a realistic staggered schedule. Due dates flow into the Today
  board's overdue / due-today / upcoming lanes, and items can go **overdue** or
  **due soon** (within 14 days).
- **Weighted readiness score.** The headline `/setup` and Today-board number is
  priority-weighted (critical counts 8x a low item), so clearing one critical
  obligation moves the needle more than ticking several minor items.
- **Readiness band.** *Foundational gaps* (any unfinished critical item or
  weighted score under 50), *Operating*, or *Scale-ready* (85%+ weighted, no
  overdue, no critical/high gaps).

> **Not formal advice.** This is operational scaffolding to help you track
> setup, not legal, tax, insurance, or regulatory advice. Confirm specifics with
> your accountant, your solicitor (or Lawpath), and your insurer.

## Where the company is

Registered and early-operating: the company exists (ABN/ACN), with Xero,
Airwallex, and Lawpath already in the launchpad. The work now is hardening the
foundations and getting the healthcare-specific obligations right before scaling
education delivery and ClinicBoss pilots.

## Do these first (highest leverage / highest risk)

1. **Professional indemnity insurance** in force and matched to the services you
   actually deliver. For healthcare education and advisory work this is the
   single most important protection. Add public liability if you deliver in
   person.
2. **Privacy policy + Australian Privacy Principles** compliance, plus a data
   handling register. You touch personal and potentially health-related data;
   the Privacy Act 1988 and the Notifiable Data Breaches scheme apply.
3. **GST + BAS cadence confirmed** and Airwallex reconciled into Xero, with a
   bookkeeper/accountant owning lodgement deadlines.
4. **IP assignment** signed by every contributor, and **core contract
   templates** (services, education, NDA, contractor) ready in Lawpath.
5. **TGA / Software-as-a-Medical-Device line documented** for ClinicBoss and the
   medtech direction so software and public claims don't drift into regulated
   "medical device" territory.

## Full checklist by area

### Legal & structure
- Confirm ASIC company details are current (ACN, registered office, directors,
  shares).
- Confirm the Director Identification Number (DIN) is held.
- Company constitution and (if equity is shared) a shareholders agreement.
- IP ownership and assignment locked for all contributors.
- Trademark "Dromaios Labs" and key product names with IP Australia.
- Core contract templates ready: services, education, NDA, contractor.

### Finance & tax
- Confirm GST registration and BAS cadence in Xero.
- Airwallex reconciled into Xero with a live bank feed.
- Bookkeeping and tax/BAS accountant engaged.
- Chart of accounts / tracking categories mapped to streams.
- Runway and cashflow model maintained monthly.
- Pricing and packaging defined for live revenue streams.

### Insurance & risk
- Professional indemnity insurance in force.
- Public liability insurance for in-person delivery.
- Cyber insurance assessed against the data you actually hold.

### Privacy & data protection
- Privacy policy + Australian Privacy Principles compliance.
- Data handling and security register (where data lives, access, retention).
- Notifiable Data Breach response plan.
- Website terms of use and analytics consent.

### Compliance & claims
- Public-claims guardrail operationalised (use the cockpit posting guardrail).
- TGA / SaMD boundary documented for ClinicBoss and medtech.
- Clinical accuracy review process for education content.

### Brand, web & marketing
- Primary domain and email hardened (SPF/DKIM/DMARC).
- Public website live with approved positioning (see
  `Dromaios_Labs_company_statements.md`).
- LinkedIn company page and founder profile aligned.

### Sales & partnerships
- Lead and partnership pipeline tracked.
- Discovery → pilot → proposal flow documented.

### Product & delivery
- ClinicBoss roadmap and pilot readiness defined.
- DromaiosEd delivery checklist (venue, materials, feedback).
- Cockpit and infrastructure backups + hardening (restore-tested).

### Governance & founder operations
- Weekly review rhythm running consistently.
- Risk register populated and reviewed.
- Founder operating cadence and capacity guardrails.

## Keeping this in sync

The cockpit `/setup` page is generated from the checklist definition. To add,
remove, or reword an item, edit `src/lib/company-setup-checklist.ts` and re-run
`pnpm db:seed` (seeding is idempotent and never overwrites a tracked action's
status). Update this document to match.

Checklist items are linked to their tracked Actions **by title**. Do not rename
a seeded setup action from the generic Actions screen: the `/setup` page would
no longer recognise it (showing the item as not started) and a later seed or
tick could create a duplicate. Reword items in the checklist definition instead.
