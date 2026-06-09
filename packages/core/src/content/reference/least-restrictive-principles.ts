import type { ReferenceCard } from "../../types.js";
import { EDUCATIONAL_DISCLAIMER } from "../shared.js";

export const leastRestrictivePrinciples: ReferenceCard = {
  id: "ref_least_restrictive",
  slug: "least-restrictive-principles",
  title: "Restrictive practices: the principles",
  domain: "behaviour-support",
  tags: ["restrictive practices", "behaviour support", "rights"],
  bodyMarkdown: [
    "A restrictive practice limits a person's rights or freedom of movement " +
      "(physical, environmental, mechanical, chemical, or seclusion).",
    "",
    "**The principles:**",
    "- **Last resort.** Only when there's a real risk and less restrictive options won't do.",
    "- **Least restrictive.** Use the gentlest effective option.",
    "- **Authorised & planned.** Within the person's behaviour support plan and any required " +
      "authorisation — never an on-the-spot decision.",
    "- **Proportionate & time-limited.** No more than necessary, for no longer than necessary.",
    "- **Reported.** Use must be recorded and reported as required; **unauthorised use is a " +
      "reportable incident.**",
    "",
    "If you think a restrictive practice is needed, that's a conversation with your supervisor " +
      "and the plan — not something you decide alone."
  ].join("\n"),
  disclaimer: EDUCATIONAL_DISCLAIMER,
  sourceNote:
    "Summarises NDIS and aged care restrictive practices principles. Awareness only; not " +
    "authorisation to use any practice.",
  version: 1
};
