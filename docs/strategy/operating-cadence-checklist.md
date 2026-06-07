# Acquisition Operating Cadence — Cockpit Checklist

A drop-in checklist that turns the strategy into a repeatable daily/weekly/monthly rhythm, mapped
to the cockpit's existing Daily Command Board and Weekly Review (`docs/OPERATING_MODEL.md`). This
is the "make it actually happen" layer — the strategy is only worth what gets executed.

Each item is phrased as a checkable action so it can be pasted straight into the cockpit's
sales/marketing functions as recurring tasks.

> **One-time setup (per clone):** activate the guardrail pre-commit hook with
> `git config core.hooksPath .githooks`. After that, any commit touching strategy copy is checked
> automatically and blocked on a Red-list violation.

---

## Daily (≈30–45 min, on the Today Command Board)

- [ ] **Publish or engage (1 LinkedIn action).** Either post from `linkedin-posts-batch-*.md`, or
      leave 3–5 genuine comments on Tier-1 leaders' posts.
- [ ] **Reply to every comment/DM** on your own posts within the day (first 2 hours ideally).
- [ ] **3–5 warm outreach touches** to Tier-1 prospects (`outreach-templates-tier1.md`) — new
      messages or follow-ups.
- [ ] **Respond to every inbound** (lead, reply, enquiry) same day.
- [ ] **Log activity** in the cockpit sales function: touches made, replies, conversations booked.

> Minimum viable day: 1 LinkedIn action + 5 outreach touches + inbound cleared. That's it.

---

## Weekly (≈90 min, in the Weekly Review — sales + marketing)

- [ ] **Pipeline review.** Count: new leads, conversations booked, conversations held, proposals
      out, purchases closed. Note movement vs last week.
- [ ] **Ship 1 owned asset** — an article or a substantial post — and **repurpose into 2–3 LinkedIn
      posts** + the fortnightly email.
- [ ] **Advance 1 partnership conversation** (`webinar-partnership-kit.md`).
- [ ] **Schedule next week's LinkedIn posts** (3) from the batch files.
- [ ] **Run the guardrail check** on anything new before it goes out: `pnpm check:strategy`.
- [ ] **Review the scoreboard** (below) and pick next week's single focus.
- [ ] **Move warm webinar/post engagers** into personal outreach.

---

## Fortnightly

- [ ] **Send the list email** (`email-nurture-sequence.md` ongoing format: one problem, one tip,
      one CTA).
- [ ] **Review nurture replies** — anyone who replied is a warm lead; move them to outreach.

---

## Monthly

- [ ] **Run 1 webinar or talk** (own or partner audience) using the partnership kit.
- [ ] **Refresh one proof asset** (testimonial, one-pager, case note — careful claims only).
- [ ] **ICP review:** which Tier-1 segment is converting best? Double down there next month.
- [ ] **Offer-ladder review:** are rung-1 buyers being offered rung 2/3? Any earned ClinicBoss
      design-partner conversations to open (problem-level only)?
- [ ] **Refresh the post bank** if running low (write the next batch).

---

## The scoreboard (keep it small — track in the cockpit)

<!-- guardrail:ignore-start -->
**Leading (activity — you control these)**
- LinkedIn posts/week · meaningful comments/week
- Outreach touches/week
- New subscribers / self-assessment downloads
- Discovery conversations booked/week

**Converting**
- Conversation → proposal rate
- Proposal → first-purchase rate
- Days from first touch → first purchase

**Revenue & expansion**
- New education customers/month
- Repeat + expansion rate (rung 1 → 2/3)
- Qualified ClinicBoss design-partner conversations created (pipeline signal, not a sales target)
<!-- guardrail:ignore-end -->

> Early on, judge yourself on the **leading** numbers. Do the activity consistently for 6–8 weeks,
> then read the converting numbers to see which channel to scale.

---

## Weekly self-check (the honesty test)
Answer these every Friday. If you can't, the cadence has slipped:
- Did I post and engage at least 3 times this week?
- Did I make at least 15 outreach touches?
- Did I have at least one real conversation with a Tier-1 prospect?
- Did I ship one piece of content?
- Is every lead logged with a next action?

Five yeses = the engine is turning. Anything less = next week's single focus is fixing that gap.

---

## How this maps to the cockpit
- **Daily items** → recurring tasks on the Today Command Board (sales/marketing).
- **Weekly items** → agenda lines in the Weekly Review under sales + marketing functions.
- **Scoreboard** → a small operating-intelligence view; update weekly from logged activity.
- **`pnpm check:strategy`** → run before any public content ships, so the guardrail is enforced by a
  tool, not just memory.
