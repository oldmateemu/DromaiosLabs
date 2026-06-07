# Partnership & Webinar Kit — "The First 30 Seconds"

The volume play from the strategy (`CUSTOMER_ACQUISITION_STRATEGY.md` §4.4). A peak body,
association, network, or RTO brings the audience; Dromaios Labs brings a genuinely useful, no-pitch
session. One good webinar = a room full of Tier-1 buyers + weeks of content + warm follow-ups.

This kit contains: the partner pitch, the webinar slide outline + speaker notes, the registration
and follow-up flow, and a run-of-show checklist.

<!-- guardrail:ignore-start -->
**Guardrail:** the session teaches practical capability. No clinical/outcome/TGA claims, no
unmeasured savings, no ClinicBoss feature detail or final-brand language. ClinicBoss is mentioned
once, optionally, as "a working product stream," and only in the closing. Verified by
`scripts/strategy-guardrail-check.mjs`.
<!-- guardrail:ignore-end -->

---

## 1. The partner pitch (why an association says yes)

A peak body/association cares about: member value, low effort, low risk, no being "sold to."
Lead with all four.

> **For your members, at no cost:** a 45-minute practical session, "The First 30 Seconds: handling
> escalation and documentation when it counts." Built for frontline care teams and the leaders who
> support them. No product pitch — just usable, take-home practice.
>
> **You provide:** the audience and the invite. **I provide:** the content, the delivery, the
> slides, and a take-home one-pager for every attendee.
>
> **Why it works for you:** a high-value, zero-cost member benefit you can run as a standalone
> webinar, a conference breakout, or a newsletter-driven event — with none of the prep on your side.

(See `outreach-templates-tier1.md` §C for the email versions.)

---

## 2. Webinar outline (45 minutes + 15 Q&A)

Each slide below = one beat. Keep slides sparse; the value is in the talk and the practice, not the
deck.

### Slide 1 — Title
**The First 30 Seconds**
Handling escalation and documentation when it counts.
*[Presenter name], Dromaios Labs · hosted with [Partner]*

**Notes:** Thank the partner. Set the no-pitch promise out loud — "I'm not selling anything today;
you'll leave with things you can use on your next shift." That promise buys you trust for 45 minutes.

### Slide 2 — The pattern
Most serious incidents don't start as emergencies. They start as small moments that escalate.

**Notes:** Tell a recognisable, de-identified story. Get heads nodding. The whole session rests on
them accepting this one idea.

### Slide 3 — Why policies don't help in the moment
A document in a folder can't help someone in a hallway with no time to think.

**Notes:** Name the gap between *documented* and *doable under pressure*. This is the reframe.

### Slide 4 — Rehearsed, not braver
Teams that handle hard moments well have practised them. Reflexes, not recall.

**Notes:** This is the hopeful turn — it's learnable, free, and starts this week.

### Slide 5 — Build the playbook (interactive)
Say / Do / Call: the three questions for any escalation scenario.

**Notes:** Live exercise. Pick one common scenario from the chat/room. Crowd-source: what do we
*say* first, *do* first, *call*? Type answers on screen. This is the moment they feel the value.

### Slide 6 — Rehearse it
Practise turns the playbook into a reflex.

**Notes:** Show how a 30-minute team rehearsal works so they can run it themselves. Give the
mechanics, not theory.

### Slide 7 — The second 30 seconds: documentation
Same-day · consistent shape (what happened / what was done / follow-up) · the "why."

**Notes:** The "documentation lottery" line. Make it about protecting *staff*, not pleasing
management — that's what makes it stick.

### Slide 8 — Make it stick
Name owners. Agree the habit. Book the next rehearsal before you leave the room.

**Notes:** The difference between a nice session and a real change is a booked next step. Model it.

### Slide 9 — Take-home
One-pager: the Say/Do/Call template + the documentation shape + the self-assessment link.

**Notes:** Tell them exactly how to get it (the registration email / a link). This is your lead
capture.

### Slide 10 — Who's behind this (soft, optional)
Dromaios Labs — practical healthcare education, tools, and operational software for safer,
better-run care.

<!-- guardrail:ignore-start -->
**Notes:** 30 seconds, no hard pitch. You may mention ClinicBoss *once* as "a working product
stream we're developing around care workflows" — only if it's natural. Do not demo, show features,
or make claims. Then straight into Q&A. Keep this slide optional; cutting it entirely is fine.
<!-- guardrail:ignore-end -->

### Slide 11 — Q&A + how to go further
Questions. Plus: the free self-assessment, and "happy to talk if your team wants to go deeper."

**Notes:** Q&A is where buying signals appear. When someone describes a specific, painful problem,
that's your warm lead — follow up personally afterward (see §4).

---

## 3. Registration & capture flow
1. Partner promotes; attendees register with name, work email, organisation, role.
2. Confirmation email = calendar invite + "you'll get the take-home one-pager after."
3. Reminder email 24h and 1h before.
4. Registrants automatically enter the email nurture sequence (`email-nurture-sequence.md`) — start
   them at Email 1 with a line acknowledging the webinar.

**Even non-attendees who registered are leads.** Send them the recording + one-pager.

---

## 4. Follow-up flow (where the revenue actually comes from)

Within 24 hours of the webinar:
- **All attendees:** thank-you + recording + take-home one-pager + self-assessment link.
- **Engaged attendees** (asked a question, high chat activity, described a real problem): a
  *personal* message (see `outreach-templates-tier1.md` §A/§B) referencing what they said, offering
  a 20-minute conversation.
- **The partner:** a thank-you + offer to run it again for the next cohort, and ask for a short
  testimonial about the session's value to members.

Then: feed the recording + slides into 2–3 LinkedIn posts and a fortnightly email. One webinar,
many assets.

---

## 5. Run-of-show checklist (the "tested" part — verify before every session)

**T-1 week**
- [ ] Partner has sent the invite; registrations are coming in.
- [ ] Slides finalised and run past the guardrail (`pnpm check:strategy`).
- [ ] Take-home one-pager finalised and link live.
- [ ] Self-assessment link live and tested end-to-end (download + email capture works).
- [ ] Nurture sequence ready to receive registrants.

**T-1 day**
- [ ] Tech check: screen share, audio, slide advance, chat visible.
- [ ] Reminder email sent.
- [ ] Two real scenarios ready in case the room is quiet during Slide 5.
- [ ] Booking link for follow-up conversations live and tested.

**T-0 (run)**
- [ ] State the no-pitch promise in the first minute.
- [ ] Hit the interactive exercise (Slide 5) — don't skip it for time.
- [ ] Note who asks questions / describes real problems (your warm leads).
- [ ] End with a clear, single CTA: get the one-pager + self-assessment.

**T+1 day**
- [ ] Recording + one-pager sent to all registrants.
- [ ] Personal follow-ups to engaged attendees.
- [ ] Partner thanked + re-run offered + testimonial requested.
- [ ] Leads logged in the cockpit sales function with stage + next action.
- [ ] Webinar repurposed into posts + email.

---

## 6. Metrics for the channel
Track per webinar: registrations, attendance rate, questions asked, one-pager downloads,
self-assessment completions, conversations booked, and conversations → first purchase. Compare
across partners to find which audiences convert — then prioritise those partners.
