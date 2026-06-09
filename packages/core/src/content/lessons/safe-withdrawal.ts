import type { Lesson } from "../../types.js";
import { EDUCATIONAL_DISCLAIMER, hoursForMinutes } from "../shared.js";

export const safeWithdrawal: Lesson = {
  id: "lsn_safe_withdrawal",
  slug: "safe-withdrawal",
  title: "Knowing when to step back",
  domain: "de-escalation",
  roleTags: ["disability-support", "aged-care", "nurse"],
  estimatedMinutes: 6,
  hoursCredited: hoursForMinutes(6),
  summary:
    "Recognising when continuing to engage adds risk, and how to withdraw safely and get " +
    "help — without abandoning the person.",
  disclaimer: EDUCATIONAL_DISCLAIMER,
  sourceNote:
    "Reflects widely taught guidance on disengagement and seeking help when de-escalation " +
    "isn't working and risk is rising. Builds confidence and judgement; not a guarantee of " +
    "safety in any specific situation.",
  regulatoryContext: [
    "Work health and safety duty to manage risk to workers and others (awareness)"
  ],
  version: 1,
  published: true,
  startStepId: "intro",
  steps: [
    {
      kind: "scene",
      id: "intro",
      title: "When de-escalation isn't working",
      body:
        "You've stayed calm, reduced triggers, and listened — but things are still escalating " +
        "and you're starting to feel unsafe. Pushing on isn't brave; it can be dangerous for " +
        "everyone. Knowing when to step back is a skill, not a failure.",
      next: "decision_step_back"
    },
    {
      kind: "decision",
      id: "decision_step_back",
      title: "Rising risk",
      body:
        "The situation is getting more heated and there's a risk of harm. What's the safest " +
        "next move?",
      choices: [
        {
          id: "c_withdraw",
          label:
            "Create distance, keep a clear exit, stay calm, and call for support per your " +
            "procedure — while keeping an eye on safety.",
          quality: "good",
          feedback:
            "Yes. Increasing distance, protecting an exit, and getting help early is safe and " +
            "responsible. You're not abandoning the person — you're managing risk and bringing " +
            "in support.",
          next: "check"
        },
        {
          id: "c_restrain",
          label: "Physically hold the person to stop things going further.",
          quality: "poor",
          feedback:
            "Physical intervention is high-risk, is a restrictive practice, and is only ever " +
            "for trained staff within an authorised plan or a genuine emergency. Reaching for " +
            "it here is the wrong default.",
          next: "check"
        },
        {
          id: "c_keep_talking",
          label: "Keep talking and stay close — don't give up.",
          quality: "ok",
          feedback:
            "Persistence is well-meant, but if risk is rising and your approach isn't working, " +
            "staying in close can make things worse. Distance and help are safer.",
          next: "check"
        }
      ]
    },
    {
      kind: "check",
      id: "check",
      title: "Quick check",
      question: "Stepping back from an escalating situation is best understood as:",
      options: [
        {
          id: "o_correct",
          label: "A safe, legitimate option that manages risk and brings in support.",
          correct: true,
          explanation:
            "Correct. Disengaging safely and calling for help is good practice when risk rises."
        },
        {
          id: "o_failure",
          label: "A failure that you should avoid if at all possible.",
          correct: false,
          explanation:
            "No. Your safety and the person's safety come first. Stepping back is a skill."
        }
      ],
      next: "end"
    },
    {
      kind: "end",
      id: "end",
      title: "Safe and supported",
      body:
        "Distance, a clear exit, calm, and early help. Afterwards, make sure the incident is " +
        "recorded and reported per your procedures, and that you get a debrief and support."
    }
  ]
};
