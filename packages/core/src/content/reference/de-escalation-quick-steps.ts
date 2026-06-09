import type { ReferenceCard } from "../../types.js";
import { EDUCATIONAL_DISCLAIMER } from "../shared.js";

export const deEscalationQuickSteps: ReferenceCard = {
  id: "ref_deesc_quick_steps",
  slug: "de-escalation-quick-steps",
  title: "De-escalation: quick steps",
  domain: "de-escalation",
  tags: ["de-escalation", "in the moment", "safety"],
  bodyMarkdown: [
    "**First, keep yourself safe and regulated.** You can't help if you're not calm.",
    "",
    "- **Notice early.** Pacing, tense posture, clipped speech, going quiet.",
    "- **Reduce triggers.** Lower noise, give space, ease off demands.",
    "- **Stay calm and present.** Slow your voice, open posture, unhurried.",
    "- **Listen and acknowledge.** Name the feeling without judging it.",
    "- **Offer some control.** Simple choices, not ultimatums.",
    "- **Give time.** Silence and patience are tools.",
    "- **Get help early.** Call for support before you're out of options.",
    "",
    "Always follow the person's behaviour support plan and your organisation's procedures."
  ].join("\n"),
  disclaimer: EDUCATIONAL_DISCLAIMER,
  sourceNote:
    "Summarises commonly taught de-escalation principles. Evidence supports gains in " +
    "knowledge and confidence; it does not prove a reduction in incidents.",
  version: 1
};
