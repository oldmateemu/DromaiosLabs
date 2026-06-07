# Publish checklist

Run this before any Dromaios Labs copy goes out — LinkedIn, owned articles,
website snippets, founder posts. The automated step catches guardrail keywords;
the manual steps catch the things software can't judge (accuracy, IP, voice).

## 1. Automated guardrail gate (required)

```bash
pnpm check:publish path/to/draft.md     # one file
pnpm check:publish                       # all drafts in docs/strategy/content
```

- Every draft declares intent on its first lines:
  `<!-- publish-intent: external -->` (must be GREEN to post) or
  `<!-- publish-intent: internal -->` (ammunition only; AMBER/RED is expected).
- The gate strips internal `>` notes, `<!-- comments -->`, and `[link]`
  placeholders, then runs `checkPublicPostingDraft` per `## ` section.
- **External drafts must be 🟢 GREEN.** A 🟡 AMBER or 🔴 RED on an external draft
  fails the gate (non-zero exit) — soften the flagged wording back to
  problem/principle level and re-run. (See the rewrite patterns in
  `Dromaios_Labs_public_posting_guardrail.md`.)

## 2. Manual Quick Pre-Post Check (required)

The keyword gate is necessary, not sufficient. Confirm by hand:

- [ ] Does it reveal how ClinicBoss or future medtech *works* in a way that could
      matter for patent protection? (Keep feature mechanics, workflows,
      screenshots, diagrams, algorithms internal.)
- [ ] Does it make "ClinicBoss" look like a cleared, final brand? (It's a working
      name until trademark clearance — use sparingly, keep backups.)
- [ ] Does it imply diagnosis, treatment, monitoring, prediction, decision
      support, medical advice, or patient-outcome improvement? (It must not,
      until the regulatory pathway and evidence support it.)
- [ ] Does it imply customer traction, adoption, validation, savings, or
      regulatory status that isn't documented?
- [ ] Could this survive a lawyer, patent attorney, trademark agent, TGA
      consultant, and a healthcare customer reading it side by side?

If any answer is yes/uncertain, soften back to umbrella, problem, or
principle-level language.

## 3. Accuracy & sourcing (required for anything with claims or numbers)

- [ ] Every statistic and quote is attributed and traceable to its source.
- [ ] Any item flagged `[verify ...]` in the draft has been confirmed against the
      primary source (or removed/softened).
- [ ] Competitor pricing/facts are re-confirmed on the live vendor page **today**
      and the page is date-stamped (prices change; some pages block scraping).
- [ ] Direct quotes are confirmed character-for-character, or reworded as
      attributed paraphrase.

## 4. Final polish (required)

- [ ] Real URLs swapped in for every `[link]` placeholder.
- [ ] A human has read it aloud once for voice — measured, evidence-led, human;
      ambitious but not inflated.
- [ ] Posting from the right account (company vs founder) per the piece's voice.

---

**Rule of thumb:** the gate proves you didn't trip a guardrail keyword. Steps 2–4
prove the piece is true, safe on IP/brand, and sounds like us. Both are required
before anything is treated as published.
