import type { ReferenceCard } from "../../types.js";
import { EDUCATIONAL_DISCLAIMER } from "../shared.js";

export const reportableIncidentsAwareness: ReferenceCard = {
  id: "ref_reportable_incidents",
  slug: "reportable-incidents-awareness",
  title: "Is it reportable? (awareness)",
  domain: "behaviour-support",
  tags: ["reporting", "SIRS", "NDIS", "incidents"],
  bodyMarkdown: [
    "Both NDIS and aged care have schemes requiring **serious incidents** to be reported — " +
      "sometimes within **24 hours**. This card builds awareness; your scheme and organisation " +
      "define the actual list and timeframes.",
    "",
    "**Categories that commonly trigger reporting include:**",
    "- Death or serious injury",
    "- Abuse or neglect",
    "- Unreasonable use of force",
    "- Unlawful sexual contact or assault",
    "- Unauthorised use of a restrictive practice",
    "- (Aged care SIRS / NDIS reportable incidents have their own defined lists)",
    "",
    "**If in doubt: tell your supervisor now and follow your reporting procedure.** Acting " +
      "early is always safer than missing a deadline."
  ].join("\n"),
  disclaimer: EDUCATIONAL_DISCLAIMER,
  sourceNote:
    "Awareness of common reportable-incident categories under NDIS rules and the aged care " +
    "Serious Incident Response Scheme. Not a definitive list.",
  version: 1
};
