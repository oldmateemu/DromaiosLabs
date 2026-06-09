import type { Lesson } from "../../types.js";
import { EDUCATIONAL_DISCLAIMER, hoursForMinutes } from "../shared.js";

export const leastRestrictiveFirst: Lesson = {
  id: "lsn_least_restrictive_first",
  slug: "least-restrictive-first",
  title: "Least restrictive, always first",
  domain: "behaviour-support",
  roleTags: ["disability-support", "aged-care", "nurse"],
  estimatedMinutes: 7,
  hoursCredited: hoursForMinutes(7),
  summary:
    "What 'least restrictive' means in practice, and why restrictive practices are a " +
    "last resort that must be authorised, planned and reported.",
  disclaimer: EDUCATIONAL_DISCLAIMER,
  sourceNote:
    "Reflects NDIS and aged care restrictive practices principles: last resort, least " +
    "restrictive, proportionate, time-limited, and used only within an authorised plan. " +
    "Awareness only — not authorisation to use any restrictive practice.",
  regulatoryContext: [
    "NDIS regulated restrictive practices — last resort and authorisation requirements",
    "Aged Care restrictive practices rules (awareness)"
  ],
  version: 1,
  published: true,
  startStepId: "intro",
  steps: [
    {
      kind: "scene",
      id: "intro",
      title: "What 'least restrictive' means",
      body:
        "A restrictive practice is anything that restricts a person's rights or freedom of " +
        "movement — physical, environmental, mechanical, chemical, or seclusion. The rule is " +
        "simple to say and hard to live: use the least restrictive option that keeps people " +
        "safe, and only when nothing less will do.",
      next: "decision_choice"
    },
    {
      kind: "decision",
      id: "decision_choice",
      title: "A safer doorway",
      body:
        "Sam sometimes leaves through a side door onto a busy road. A colleague suggests " +
        "locking Sam in the lounge 'just to be safe'. What's the least-restrictive direction " +
        "to think in first?",
      choices: [
        {
          id: "c_environment",
          label:
            "Look at changing the environment and support — e.g. a chime on the door, more " +
            "engaging activities, a staff member nearby — and raise it with the plan.",
          quality: "good",
          feedback:
            "Yes. Environmental and support changes are far less restrictive than locking " +
            "someone in. Locking a person in is a restrictive practice that would need proper " +
            "authorisation and a plan — it is never an on-the-spot decision.",
          next: "check"
        },
        {
          id: "c_lock",
          label: "Lock the lounge door now; sort the paperwork later.",
          quality: "poor",
          feedback:
            "No. Confining someone is a regulated restrictive practice. Using one without " +
            "authorisation is unlawful and reportable. Safety is achieved through the least " +
            "restrictive option and proper process, not improvisation.",
          next: "check"
        },
        {
          id: "c_nothing",
          label: "Do nothing — Sam has the right to come and go.",
          quality: "ok",
          feedback:
            "Rights matter, but so does a real safety risk. The answer isn't 'ignore it' or " +
            "'confine him' — it's the least-restrictive support that manages the risk, raised " +
            "through the plan.",
          next: "check"
        }
      ]
    },
    {
      kind: "check",
      id: "check",
      title: "Quick check",
      question: "When may a regulated restrictive practice be used?",
      options: [
        {
          id: "o_correct",
          label:
            "Only as a last resort, when authorised and set out in the person's behaviour " +
            "support plan, and then reported as required.",
          correct: true,
          explanation:
            "Correct. Last resort, least restrictive, authorised, planned, time-limited, and " +
            "reported. Anything else is unauthorised use — which is reportable."
        },
        {
          id: "o_anytime",
          label: "Any time a worker believes it would keep someone safe.",
          correct: false,
          explanation:
            "No. Good intentions don't authorise a restrictive practice. It must be planned " +
            "and authorised; unauthorised use must be reported."
        }
      ],
      next: "end"
    },
    {
      kind: "end",
      id: "end",
      title: "Last resort, by the book",
      body:
        "Least restrictive, always first. If you ever think a restrictive practice is needed, " +
        "that's a conversation for the behaviour support plan and your supervisor — not an " +
        "on-the-spot call. Unauthorised use is reportable; when in doubt, ask and escalate."
    }
  ]
};
