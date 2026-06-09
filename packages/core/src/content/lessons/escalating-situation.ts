import type { Lesson } from "../../types.js";
import { EDUCATIONAL_DISCLAIMER, hoursForMinutes } from "../shared.js";

/**
 * VERTICAL-SLICE LESSON.
 * This is the worked example wired end-to-end through the player. Other lessons
 * follow the same shape.
 */
export const escalatingSituation: Lesson = {
  id: "lsn_escalating_situation",
  slug: "responding-to-an-escalating-situation",
  title: "Responding to an escalating situation",
  domain: "de-escalation",
  roleTags: ["disability-support", "aged-care", "nurse"],
  estimatedMinutes: 8,
  hoursCredited: hoursForMinutes(8),
  summary:
    "A short scenario on noticing early signs of escalation and choosing a calm, " +
    "least-restrictive first response.",
  disclaimer: EDUCATIONAL_DISCLAIMER,
  sourceNote:
    "Aligned to widely taught de-escalation principles (calm tone, space, listening, " +
    "least-restrictive response) and NDIS positive behaviour support concepts. Note: " +
    "de-escalation training has mixed outcome evidence; this lesson aims to build " +
    "knowledge and confidence, not to guarantee a reduction in incidents.",
  regulatoryContext: [
    "NDIS positive behaviour support and restrictive practices framework (awareness)",
    "Work health and safety duty to recognise and reduce risk (awareness)"
  ],
  version: 1,
  published: true,
  startStepId: "intro",
  steps: [
    {
      kind: "scene",
      id: "intro",
      title: "The situation",
      body:
        "You are supporting Marcus during a normally quiet afternoon. The room is warm " +
        "and noisy — a TV is on, two other people are talking loudly. Marcus has stopped " +
        "what he was doing. He is pacing, his jaw is tight, and his answers have become " +
        "short and clipped. He hasn't raised his voice yet.",
      next: "decision_first_response"
    },
    {
      kind: "decision",
      id: "decision_first_response",
      title: "Your first move",
      body: "What do you do first?",
      choices: [
        {
          id: "c_reduce_demands",
          label: "Lower the noise and give him space while staying nearby and calm.",
          quality: "good",
          feedback:
            "Good. Reducing sensory load and demands early — while staying present and " +
            "calm — addresses a likely trigger before things escalate, and keeps you both safe.",
          next: "scene_after_space"
        },
        {
          id: "c_insist_explain",
          label: "Ask him firmly to calm down and explain what's wrong right now.",
          quality: "poor",
          feedback:
            "Telling someone to 'calm down' and demanding an explanation usually adds " +
            "pressure. Early escalation is often better met by reducing demands, not adding them.",
          next: "scene_after_space"
        },
        {
          id: "c_ignore",
          label: "Carry on as normal and hope it passes.",
          quality: "ok",
          feedback:
            "Staying relaxed is reasonable, but ignoring clear early signs is a missed " +
            "chance to help and to manage risk. Noticing and gently adjusting is safer.",
          next: "scene_after_space"
        }
      ]
    },
    {
      kind: "scene",
      id: "scene_after_space",
      title: "A moment later",
      body:
        "You turn the TV down and quietly suggest moving to the cooler, quieter hallway. " +
        "Marcus comes with you. His pacing slows a little, but he says, sharply, " +
        "\"Everyone always tells me what to do.\"",
      next: "decision_respond_to_words"
    },
    {
      kind: "decision",
      id: "decision_respond_to_words",
      title: "He's talking",
      body: "How do you respond?",
      choices: [
        {
          id: "c_validate",
          label:
            "Acknowledge the feeling: \"It sounds like you've had enough of being told what " +
            "to do. I'm listening.\"",
          quality: "good",
          feedback:
            "Naming and validating the feeling — without judging it — helps him feel heard, " +
            "which often lowers arousal. You're giving him some control back through listening.",
          next: "check_principles"
        },
        {
          id: "c_correct",
          label: "Point out that you've actually been very patient with him today.",
          quality: "poor",
          feedback:
            "Defending yourself or correcting the record tends to escalate. In the moment, " +
            "his experience is what matters; the facts can wait.",
          next: "check_principles"
        },
        {
          id: "c_silent",
          label: "Say nothing and give him more physical space.",
          quality: "ok",
          feedback:
            "Quiet space can help, but a brief, warm acknowledgement usually helps more — it " +
            "signals you're with him, not against him.",
          next: "check_principles"
        }
      ]
    },
    {
      kind: "check",
      id: "check_principles",
      title: "Quick check",
      question:
        "Which of these is the best summary of a calm, least-restrictive early response?",
      options: [
        {
          id: "o_correct",
          label: "Reduce triggers, stay calm and present, listen, and offer some control.",
          correct: true,
          explanation:
            "Yes. Lowering demands and sensory load, staying regulated yourself, listening, " +
            "and offering choice are the core of an early, least-restrictive response."
        },
        {
          id: "o_control",
          label: "Take firm control quickly so the person knows the boundaries.",
          correct: false,
          explanation:
            "Asserting firm control early often increases pressure and risk. Least-restrictive " +
            "means starting with the gentlest effective response."
        },
        {
          id: "o_leave",
          label: "Leave the person alone until they have completely calmed down.",
          correct: false,
          explanation:
            "Some space helps, but disengaging entirely can feel like abandonment and misses " +
            "the chance to support and monitor safety."
        }
      ],
      next: "end"
    },
    {
      kind: "end",
      id: "end",
      title: "Nicely handled",
      body:
        "You stayed calm, reduced the triggers, listened, and gave Marcus some control. He " +
        "takes a breath and the situation settles. Remember: every person and plan is " +
        "different — always follow the person's behaviour support plan and your organisation's " +
        "procedures, and seek support early when you need it."
    }
  ]
};
