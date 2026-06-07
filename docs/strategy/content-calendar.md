# Content Calendar — 16-Week Run Sheet

One schedule that sequences everything in `docs/strategy/` into a week-by-week plan you can run from
the cockpit: 48 LinkedIn posts, 3 pillar articles, the 6-email nurture sequence + ongoing list
emails, the lead magnet, the webinar, and the three offer rungs.

<!-- guardrail:ignore-start -->
**Guardrail:** this is an internal schedule. Every public asset it references is already verified by
`scripts/strategy-guardrail-check.mjs` (pre-commit hook + CI). Run `pnpm check:strategy` before
anything ships.
<!-- guardrail:ignore-end -->

## How to read this
- **Posts** = post numbers from `linkedin-posts-batch-1..4.md` (3/week: Mon/Wed/Fri).
- **Article** = publish the pillar article that week (website + LinkedIn article), then let that
  week's posts orbit it.
- **Email** = the nurture email (auto-sequenced from lead-magnet download) or the fortnightly list
  email.
- **Offer/Action** = the business-development move to run that week.
- The phases mirror the strategy's 90-day plan (Foundations → Revenue → Scale) and extend it to 16
  weeks so the offer ladder (rung 1 → 2 → 3) has room to play out.

---

## Phase 1 — Foundations & first conversations (Weeks 1–4)

| Week | Mon/Wed/Fri posts | Article | Email | Offer / Action |
|------|-------------------|---------|-------|----------------|
| 1 | 1, 2, 3 | **Publish Article #1** (first-30-seconds) | Nurture E1 (deliver) on download | Lead magnet live + tested end-to-end; start daily outreach (10–15/wk) |
| 2 | 4, 5, 6 | — | E2 (de-escalation) | First discovery conversations; package rung-1 workshop |
| 3 | 7, 8, 9 | — | E3 (documentation) | Begin 1 partnership conversation (assoc/RTO) |
| 4 | 10, 11, 12 | — | E4 (compliance habits) | First rung-1 workshop proposals out; list email #1 (fortnightly) |

## Phase 2 — First revenue & repeatability (Weeks 5–8)

| Week | Mon/Wed/Fri posts | Article | Email | Offer / Action |
|------|-------------------|---------|-------|----------------|
| 5 | 13, 14, 15 | — | E5 (onboarding) | Deliver first rung-1 workshop; collect careful testimonial |
| 6 | 16, 17, 18 | — | E6 (invitation) | Lock in 1 webinar/partner date; post 18 promotes it |
| 7 | 19, 20, 21 | **Publish Article #2** (documentation lottery) | List email #2 | Tighten funnel metrics (conv→proposal→purchase) |
| 8 | 22, 23, 24 | — | — | Run first webinar (partnership kit); post 24 = self-assessment CTA |

## Phase 3 — Scale & open expansion (Weeks 9–12)

| Week | Mon/Wed/Fri posts | Article | Email | Offer / Action |
|------|-------------------|---------|-------|----------------|
| 9 | 25, 26, 27 | — | List email #3 | Double down on best-converting channel + segment |
| 10 | 28, 29, 30 | — | — | Post 28 = careful workshop recap; offer rung-2 program to happy clients |
| 11 | 31, 32, 33 | — | List email #4 | Post 32 = ownership-map lead-gen; first rung-2 program proposals |
| 12 | 34, 35, 36 | — | — | Post 36 = education CTA; begin earned ClinicBoss problem-level chats |

## Phase 4 — Recurring revenue & consistency (Weeks 13–16)

| Week | Mon/Wed/Fri posts | Article | Email | Offer / Action |
|------|-------------------|---------|-------|----------------|
| 13 | 37, 38, 39 | — | List email #5 | Start first rung-2 Safer Teams Program (Set phase) |
| 14 | 40, 41, 42 | **Publish Article #3** (consistency across sites) | — | Post 42 = recap; pitch rung-2 to multi-site operators |
| 15 | 43, 44, 45 | — | List email #6 | Second webinar (partner audience) for volume |
| 16 | 46, 47, 48 | — | — | Post 48 = rung-2 CTA; at program week-12 reviews, offer **rung-3 partnership** |

---

## Beyond week 16 (keep the engine fed)
- **Posts:** write batch 5 (article #3 already gives you 2–3); maintain 3/week.
- **Articles:** one new pillar every ~3–4 weeks; each spawns a week of posts + a list email.
- **Emails:** continue the fortnightly list email (one problem / one tip / one CTA).
- **Offers:** rung-1 workshops feed rung-2 programs feed rung-3 partnerships; protect renewals at
  every quarterly review.
- **Webinars:** ~monthly with partners; each becomes posts + an email + warm leads.

## Weekly production rhythm (how the calendar gets made)
Tie this to the Weekly Review (`operating-cadence-checklist.md`):
1. Schedule next week's 3 posts from the batch files.
2. If it's an article week, finalise + publish it, then repurpose into that week's posts + a list email.
3. Confirm the email going out (nurture auto-sequence vs. fortnightly list).
4. Run the offer/action for the week and log pipeline movement.
5. `pnpm check:strategy` before anything public ships.

## Cross-reference (assets used by this calendar)
- Posts: `linkedin-posts-batch-1.md` … `linkedin-posts-batch-4.md`
- Articles: `article-first-30-seconds.md`, `article-documentation-lottery.md`,
  `article-consistency-across-sites.md`
- Email: `email-nurture-sequence.md`
- Lead magnet: `lead-magnet-safety-compliance-self-assessment.md`
- Outreach: `outreach-templates-tier1.md`
- Webinar: `webinar-partnership-kit.md`
- Offers: `workshop-package-rung1.md`, `offer-rung2-team-program.md`,
  `offer-rung3-annual-partnership.md`
- Proof: `testimonial-and-case-note-template.md`
- Cadence: `operating-cadence-checklist.md`
