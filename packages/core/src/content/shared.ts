/**
 * Shared content constants.
 *
 * The disclaimer wording is deliberately conservative to satisfy the Dromaios brand
 * guardrail: the app builds knowledge, confidence and regulatory awareness — it must
 * never claim to be proven to reduce violence, restraint, or clinical outcomes.
 */
export const EDUCATIONAL_DISCLAIMER =
  "Educational content only. This supports your knowledge, confidence and awareness of " +
  "good practice and your obligations. It is not clinical, legal or behaviour-support-plan " +
  "advice, and it is not a substitute for your employer's policies, a participant's " +
  "behaviour support plan, or professional supervision. In an emergency, prioritise safety " +
  "and follow your organisation's procedures.";

/** Minutes-to-hours helper so authored content stays consistent. */
export function hoursForMinutes(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100;
}
