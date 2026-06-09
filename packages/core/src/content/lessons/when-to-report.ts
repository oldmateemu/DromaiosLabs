import type { Lesson } from "../../types.js";
import { EDUCATIONAL_DISCLAIMER, hoursForMinutes } from "../shared.js";

export const whenToReport: Lesson = {
  id: "lsn_when_to_report",
  slug: "when-to-report",
  title: "Knowing what to report",
  domain: "behaviour-support",
  roleTags: ["disability-support", "aged-care", "nurse"],
  estimatedMinutes: 7,
  hoursCredited: hoursForMinutes(7),
  summary:
    "Building awareness of the kinds of incidents that commonly trigger reporting " +
    "obligations in NDIS and aged care — so nothing important slips through.",
  disclaimer: EDUCATIONAL_DISCLAIMER,
  sourceNote:
    "Awareness of common reportable-incident categories under the NDIS reportable incidents " +
    "rules and the aged care Serious Incident Response Scheme. This is general awareness, " +
    "not a definitive list — your scheme and organisation define what and when to report.",
  regulatoryContext: [
    "NDIS reportable incidents (awareness of categories)",
    "Aged Care Serious Incident Response Scheme — reportable incident types (awareness)"
  ],
  version: 1,
  published: true,
  startStepId: "intro",
  steps: [
    {
      kind: "scene",
      id: "intro",
      title: "Why this matters",
      body:
        "Reporting isn't bureaucracy for its own sake — it's how harm gets noticed, stopped " +
        "and prevented. Both the NDIS and aged care have schemes that require certain serious " +
        "incidents to be reported, sometimes within 24 hours. Knowing the categories helps you " +
        "act fast.",
      next: "check_categories"
    },
    {
      kind: "check",
      id: "check_categories",
      title: "Which usually needs reporting?",
      question:
        "Across these schemes, which of the following is commonly a reportable incident type?",
      options: [
        {
          id: "o_correct",
          label:
            "Unreasonable use of force, neglect, abuse, serious injury, or unauthorised use " +
            "of a restrictive practice.",
          correct: true,
          explanation:
            "Yes — these sit among the common reportable categories. The exact list and " +
            "timeframes are set by the NDIS rules and the aged care SIRS."
        },
        {
          id: "o_wrong",
          label: "Only incidents that make it into the news.",
          correct: false,
          explanation:
            "No. Reporting obligations are about defined categories of harm and risk, not " +
            "publicity."
        }
      ],
      next: "decision_timeframe"
    },
    {
      kind: "decision",
      id: "decision_timeframe",
      title: "How fast?",
      body:
        "You witness something that looks like a serious reportable incident. How quickly " +
        "should it move?",
      choices: [
        {
          id: "c_now",
          label:
            "Straight away — tell your supervisor now; the most serious incidents can have a " +
            "24-hour reporting clock.",
          quality: "good",
          feedback:
            "Right. The most serious incidents are time-critical. Reporting promptly through " +
            "your organisation is the safe default.",
          next: "end"
        },
        {
          id: "c_endofweek",
          label: "By the end of the week is probably fine.",
          quality: "poor",
          feedback:
            "No. That can miss a tight statutory deadline. Treat serious incidents as urgent " +
            "and escalate immediately.",
          next: "end"
        }
      ]
    },
    {
      kind: "end",
      id: "end",
      title: "Know where to look",
      body:
        "You don't have to memorise every rule — but you do need to recognise the categories " +
        "and know who to tell and where your procedure lives. When something feels serious, " +
        "report it promptly and let the process work. The quick-reference card has a reminder."
    }
  ]
};
