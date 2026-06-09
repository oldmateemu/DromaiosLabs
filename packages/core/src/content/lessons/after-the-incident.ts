import type { Lesson } from "../../types.js";
import { EDUCATIONAL_DISCLAIMER, hoursForMinutes } from "../shared.js";

export const afterTheIncident: Lesson = {
  id: "lsn_after_the_incident",
  slug: "after-the-incident",
  title: "After the incident: record, report, recover",
  domain: "behaviour-support",
  roleTags: ["disability-support", "aged-care", "nurse"],
  estimatedMinutes: 6,
  hoursCredited: hoursForMinutes(6),
  summary:
    "What good looks like once a situation has settled — accurate recording, the right " +
    "reports, and looking after yourself and the person.",
  disclaimer: EDUCATIONAL_DISCLAIMER,
  sourceNote:
    "Reflects general incident-management and reporting good practice in NDIS and aged " +
    "care. Awareness only — your organisation's procedures and applicable schemes set the " +
    "actual requirements and timeframes.",
  regulatoryContext: [
    "NDIS reportable incidents (awareness)",
    "Aged Care Serious Incident Response Scheme (awareness)"
  ],
  version: 1,
  published: true,
  startStepId: "intro",
  steps: [
    {
      kind: "scene",
      id: "intro",
      title: "It's settled — now what?",
      body:
        "The situation has calmed. What you do next matters: an accurate record, the right " +
        "report, support for the person, and support for you. Memory fades fast, so timely " +
        "and factual recording is part of good care.",
      next: "decision_record"
    },
    {
      kind: "decision",
      id: "decision_record",
      title: "Writing it up",
      body: "How should you record what happened?",
      choices: [
        {
          id: "c_factual",
          label:
            "Factually and soon: what happened, what was tried, what helped, who was " +
            "involved — without judgement or guesswork.",
          quality: "good",
          feedback:
            "Yes. Timely, factual, objective records help the person, the team and the plan, " +
            "and meet reporting obligations. Stick to what you saw and did.",
          next: "decision_report"
        },
        {
          id: "c_minimise",
          label: "Keep it vague so no one gets in trouble.",
          quality: "poor",
          feedback:
            "No. Minimising or fudging a record can hide risk, breach obligations, and harm " +
            "the person. Accurate recording protects everyone.",
          next: "decision_report"
        },
        {
          id: "c_later",
          label: "Leave it until your next shift when you have more time.",
          quality: "ok",
          feedback:
            "Understandable when you're busy, but detail fades and some incidents must be " +
            "reported quickly. Record while it's fresh.",
          next: "decision_report"
        }
      ]
    },
    {
      kind: "decision",
      id: "decision_report",
      title: "Does it need reporting?",
      body:
        "The incident involved an injury and possible use of force. You're unsure if it's " +
        "'reportable'. What do you do?",
      choices: [
        {
          id: "c_escalate",
          label:
            "Tell your supervisor straight away and follow your reporting procedure — if in " +
            "doubt, report.",
          quality: "good",
          feedback:
            "Right. Serious incidents — including unreasonable use of force and unauthorised " +
            "restrictive practices — have reporting obligations and tight timeframes. When " +
            "unsure, escalate; don't sit on it.",
          next: "check"
        },
        {
          id: "c_assume",
          label: "Assume it's minor and move on.",
          quality: "poor",
          feedback:
            "Assuming it's minor risks missing a reportable incident with a legal timeframe. " +
            "Check with your supervisor.",
          next: "check"
        }
      ]
    },
    {
      kind: "check",
      id: "check",
      title: "Quick check",
      question: "If you're unsure whether an incident is reportable, you should:",
      options: [
        {
          id: "o_correct",
          label: "Raise it with your supervisor promptly and follow your reporting procedure.",
          correct: true,
          explanation:
            "Correct. Reporting schemes have set timeframes; escalating early is the safe call."
        },
        {
          id: "o_wait",
          label: "Wait to see if anyone else mentions it.",
          correct: false,
          explanation: "No — that can blow a reporting deadline. Escalate when in doubt."
        }
      ],
      next: "end"
    },
    {
      kind: "end",
      id: "end",
      title: "Closed out well",
      body:
        "Record promptly and factually, report through the right channel, support the person, " +
        "and get a debrief yourself. Your organisation's procedures and the relevant scheme " +
        "(NDIS reportable incidents, aged care SIRS) set the actual requirements — know where " +
        "to find them before you need them."
    }
  ]
};
