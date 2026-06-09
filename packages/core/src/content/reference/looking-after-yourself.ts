import type { ReferenceCard } from "../../types.js";
import { EDUCATIONAL_DISCLAIMER } from "../shared.js";

export const lookingAfterYourself: ReferenceCard = {
  id: "ref_looking_after_yourself",
  slug: "looking-after-yourself",
  title: "Looking after yourself",
  domain: "de-escalation",
  tags: ["wellbeing", "debrief", "support"],
  bodyMarkdown: [
    "Responding to distress and aggression takes a toll. Looking after yourself isn't " +
      "optional — it's part of doing this work safely over time.",
    "",
    "- **Debrief.** Talk it through with a supervisor or trusted colleague soon after.",
    "- **Reset.** Take a real break; let your body come down from the adrenaline.",
    "- **Record & report.** Getting it documented also gets it off your shoulders.",
    "- **Know your supports.** Employee assistance programs, supervision, peer support.",
    "- **Watch for the slow build.** Repeated incidents add up. Speak up early.",
    "",
    "It's never 'just part of the job'. If you're affected, that matters — seek support."
  ].join("\n"),
  disclaimer: EDUCATIONAL_DISCLAIMER,
  sourceNote:
    "General wellbeing and debriefing guidance for frontline workers. Not clinical or mental " +
    "health advice; if you need support, contact your EAP or a health professional.",
  version: 1
};
