# Testimonial & Case-Note Template (careful-claims-safe)

How to collect testimonials and write case notes that build credibility **without** tripping the
public-posting guardrail. Social proof is one of the strongest things you can show a healthcare
buyer — but in healthcare, an overclaimed testimonial is worse than none. This template keeps proof
specific, honest, and publishable.

<!-- guardrail:ignore-start -->
**The core rule:** describe what was *done* and what the client *reported experiencing*, not
quantified outcomes, clinical impact, or savings — unless those are genuinely measured and the
client has approved their release in writing. No "reduced incidents by 40%", no "saved 10 hours a
week", no "clinically validated", no patient-outcome claims. Those sit in the guardrail's Red zone.
Anything published from this file must pass `scripts/strategy-guardrail-check.mjs`.
<!-- guardrail:ignore-end -->

---

## 1. Consent first (non-negotiable)

Never publish a client's name, organisation, logo, or quote without written permission. Use this
short consent request:

> Hi [name], I'd love to share a short note about working together. Could I have your written okay
> to use:
> - [ ] your first name and role
> - [ ] your organisation's name
> - [ ] the quote below (you can edit it)
> - [ ] on our website and LinkedIn
>
> Totally fine to decline any of these, or to stay anonymous (e.g. "an aged-care team in [state]").
> Here's the draft for your approval: [quote]

Keep the signed/emailed approval on file. If in doubt about any element, default to anonymous and
category-level ("a community-care provider").

---

## 2. Testimonial collection — the questions that get usable quotes

Don't ask "can you give us a testimonial?" — you'll get something generic. Ask specific questions
and assemble the answers:

1. What was the situation or problem before we worked together?
2. What did we actually do?
3. What felt different for your team afterward? (experience, not metrics)
4. What would you say to another leader considering this?
5. Anything that surprised you, good or bad?

**Turn answers into a quote** that stays experience-level. Good shape:
> "[Problem in their words]. [What we did]. [What the team experienced]." — [Name], [Role], [Org]

---

## 3. Publishable testimonial examples (Green — experience-level)

These are safe because they describe experience and activity, not measured outcomes:

> "Our incident notes used to depend entirely on who was on shift. The session gave the whole team
> one shared way to document, and for the first time everyone's records actually look alike."
> — Care Manager, residential aged care

> "The first-30-seconds work was the first time our team had agreed out loud what to say and do when
> something escalates. Staff tell us they feel more prepared." — Team Leader, community care

> "Practical, built for how our shifts actually run, and no fluff. Our new starters now learn the
> same standard instead of picking it up by osmosis." — Operations Lead, multi-site clinic group

Note what these *don't* claim: no numbers, no "safer outcomes," no "reduced incidents." They report
what changed in the team's experience — which is both true and persuasive.

---

## 4. Claims guide — Green / Amber / Red

<!-- guardrail:ignore-start -->
**Green (publishable as-is):**
- "Staff report feeling more prepared/confident."
- "Everyone now documents to the same shared standard."
- "New starters learn one consistent standard."
- "The team agreed, out loud, what to do first."
- "Built for how our shifts actually run."

**Amber (only with written client approval + real basis):**
- Naming the client/organisation or showing a logo.
- "Our audit felt calmer this year." (experience, but tie to the client's own words)
- Any before/after framing — keep it qualitative unless measured.

**Red (do NOT publish — overclaim risk):**
- "Reduced incidents by 40%" / "cut no-shows by a third" / any unmeasured number.
- "Saved us 10 hours a week" / any unmeasured savings.
- "Clinically validated" / "improved patient outcomes" / "safer patients."
- "Compliant by design" / "made us TGA-ready."
- Anything implying the product diagnoses, predicts, monitors, or replaces clinical judgement.
<!-- guardrail:ignore-end -->

> If a client *insists* on a numeric claim, you may use it **only** if the number is genuinely
> measured, the method is defensible, and they approve it in writing. Otherwise, convert it to
> experience-level language.

---

## 5. Internal case-note template (richer; for sales use, careful externally)

Keep a fuller case note per engagement. Use the **full** version internally to brief sales
conversations; publish only the Green-zone parts.

> **Client:** [name or anonymised category]
> **Segment:** [aged care / community care / clinic group]
> **Engagement:** [rung-1 workshop / Safer Teams Program / etc.]
> **The problem (their words):** [what brought them to us]
> **What we did:** [the actual work — sessions, standard set, materials]
> **What the team experienced:** [qualitative — confidence, consistency, clarity]
> **In their words:** [approved quote]
> **Measured results, if any:** [ONLY if genuinely measured + approved for release; else "n/a"]
> **Consent on file:** [name/org/quote/logo — what's approved, where it can appear]
> **Reusable as:** [website / LinkedIn / proposal / anonymous only]

---

## 6. Where to use proof
- **Website:** a small, rotating set of Green testimonials.
- **Proposals:** the most relevant 1–2 case notes for that buyer's segment.
- **LinkedIn:** weave an approved, experience-level quote into a problem-first post (never a bare
  brag). See the careful "workshop recap" posts in the batches for tone.
- **Discovery calls:** reference a same-segment story verbally ("a community-care team we worked
  with had exactly this…").

---

## 7. Pre-publish checklist (run before anything goes public)
- [ ] Written consent on file for every named element.
- [ ] No unmeasured numbers, savings, or outcome claims.
- [ ] No clinical / TGA / "replaces judgement" implications.
- [ ] Reads as experience, not a guarantee.
- [ ] If anonymised, truly unidentifiable.
- [ ] Passes the guardrail linter (`pnpm check:strategy`) once added to a public asset.

When in doubt, soften to category-level, experience-level language. A modest, true testimonial beats
an impressive one you can't stand behind.
