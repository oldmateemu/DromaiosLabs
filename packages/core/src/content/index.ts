import { ContentPackSchema, type ContentPack, type Lesson, type ReferenceCard } from "../types.js";

// Lessons
import { escalatingSituation } from "./lessons/escalating-situation.js";
import { leastRestrictiveFirst } from "./lessons/least-restrictive-first.js";
import { recognisingTriggers } from "./lessons/recognising-triggers.js";
import { safeWithdrawal } from "./lessons/safe-withdrawal.js";
import { afterTheIncident } from "./lessons/after-the-incident.js";
import { whenToReport } from "./lessons/when-to-report.js";

// Reference cards
import { deEscalationQuickSteps } from "./reference/de-escalation-quick-steps.js";
import { leastRestrictivePrinciples } from "./reference/least-restrictive-principles.js";
import { reportableIncidentsAwareness } from "./reference/reportable-incidents-awareness.js";
import { lookingAfterYourself } from "./reference/looking-after-yourself.js";

export const lessons: Lesson[] = [
  escalatingSituation,
  recognisingTriggers,
  leastRestrictiveFirst,
  safeWithdrawal,
  afterTheIncident,
  whenToReport
];

export const referenceCards: ReferenceCard[] = [
  deEscalationQuickSteps,
  leastRestrictivePrinciples,
  reportableIncidentsAwareness,
  lookingAfterYourself
];

/**
 * The bundled content pack shipped with the app for offline use. Validated at module
 * load so malformed content (a bad `next` id, a missing field) fails loudly in tests
 * and CI rather than silently in a learner's hands.
 */
export const contentPack: ContentPack = ContentPackSchema.parse({
  version: 1,
  publishedAt: "2026-06-09T00:00:00.000Z",
  lessons,
  referenceCards
});

export function getLessonBySlug(slug: string): Lesson | undefined {
  return lessons.find((l) => l.slug === slug);
}

export function getLessonById(id: string): Lesson | undefined {
  return lessons.find((l) => l.id === id);
}

export function getPublishedLessons(): Lesson[] {
  return lessons.filter((l) => l.published);
}
