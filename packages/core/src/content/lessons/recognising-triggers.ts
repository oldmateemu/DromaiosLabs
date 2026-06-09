import type { Lesson } from "../../types.js";
import { EDUCATIONAL_DISCLAIMER, hoursForMinutes } from "../shared.js";

export const recognisingTriggers: Lesson = {
  id: "lsn_recognising_triggers",
  slug: "recognising-triggers-early",
  title: "Recognising triggers early",
  domain: "de-escalation",
  roleTags: ["disability-support", "aged-care", "nurse"],
  estimatedMinutes: 6,
  hoursCredited: hoursForMinutes(6),
  summary:
    "Spotting the environmental, physical and communication triggers that often come " +
    "before distress — so you can act before things escalate.",
  disclaimer: EDUCATIONAL_DISCLAIMER,
  sourceNote:
    "Based on positive behaviour support concepts of antecedents and triggers. Builds " +
    "awareness and confidence; does not predict any individual's behaviour.",
  regulatoryContext: [
    "NDIS positive behaviour support framework (awareness of antecedents/triggers)"
  ],
  version: 1,
  published: true,
  startStepId: "intro",
  steps: [
    {
      kind: "scene",
      id: "intro",
      title: "Before it shows",
      body:
        "Distress rarely comes from nowhere. Often there are triggers — things in the " +
        "environment, the body, or how we communicate — that build up first. Noticing them " +
        "early is one of the most useful skills you have.",
      next: "decision_kind"
    },
    {
      kind: "decision",
      id: "decision_kind",
      title: "Which is a trigger?",
      body:
        "Priya usually does well in the mornings. Today she skipped breakfast, the support " +
        "van was 40 minutes late, and the day program room is unusually crowded. Which of " +
        "these is most useful to treat as a trigger?",
      choices: [
        {
          id: "c_all",
          label: "All three — hunger, a broken routine, and a crowded, noisy space.",
          quality: "good",
          feedback:
            "Right. Triggers stack. Hunger (physical), a disrupted routine (predictability), " +
            "and sensory overload (environment) often combine. Addressing any of them helps.",
          next: "check"
        },
        {
          id: "c_personality",
          label: "None — it's just her personality on a bad day.",
          quality: "poor",
          feedback:
            "Labelling behaviour as 'just personality' stops us looking for the real, " +
            "changeable triggers. Almost always, something in the situation is contributing.",
          next: "check"
        },
        {
          id: "c_lateonly",
          label: "Only the late van — the rest doesn't matter.",
          quality: "ok",
          feedback:
            "The late van matters, but so do hunger and the crowded room. Triggers usually " +
            "add up rather than acting alone.",
          next: "check"
        }
      ]
    },
    {
      kind: "check",
      id: "check",
      title: "Quick check",
      question: "Why is it worth noticing triggers early?",
      options: [
        {
          id: "o_correct",
          label:
            "Because you can often reduce or remove a trigger before distress escalates.",
          correct: true,
          explanation:
            "Exactly — early, small adjustments (a snack, a quieter space, a heads-up about " +
            "a change) are the least-restrictive, most effective tools you have."
        },
        {
          id: "o_blame",
          label: "So you can record who caused the problem.",
          correct: false,
          explanation:
            "The point isn't blame — it's prevention and support."
        }
      ],
      next: "end"
    },
    {
      kind: "end",
      id: "end",
      title: "Well spotted",
      body:
        "Triggers stack, and most are changeable. Noticing them early lets you make small, " +
        "respectful adjustments. Where a person has a behaviour support plan, it will often " +
        "name their known triggers — use it."
    }
  ]
};
