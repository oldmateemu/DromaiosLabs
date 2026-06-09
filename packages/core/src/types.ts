import { z } from "zod";

/**
 * Shared domain model for Dromaios mobile (and, later, the wider portal).
 *
 * Design notes:
 * - Content is data, not code: lessons and reference cards are plain objects that
 *   validate against these schemas, so they can be authored, reviewed, bundled for
 *   offline use, and refreshed over-the-air without shipping a new binary.
 * - The learning record is worker-owned and works fully offline/anonymously.
 *   Nothing here links a learner to an employer.
 */

export const DomainSchema = z.enum([
  "de-escalation",
  "behaviour-support",
  // domain #2 onward (kept here so content can be authored ahead of UI work)
  "manual-handling",
  "infection-control"
]);
export type Domain = z.infer<typeof DomainSchema>;

export const RoleSchema = z.enum([
  "disability-support",
  "aged-care",
  "nurse",
  "other"
]);
export type Role = z.infer<typeof RoleSchema>;

/** Quality signal for a decision choice. Drives feedback tone, never a bare right/wrong. */
export const ChoiceQualitySchema = z.enum(["good", "ok", "poor"]);
export type ChoiceQuality = z.infer<typeof ChoiceQualitySchema>;

export const ScenarioChoiceSchema = z.object({
  id: z.string(),
  label: z.string(),
  /** Explains the reasoning behind the choice — the teaching moment. */
  feedback: z.string(),
  quality: ChoiceQualitySchema,
  /** Id of the next step to advance to after the learner reads the feedback. */
  next: z.string()
});
export type ScenarioChoice = z.infer<typeof ScenarioChoiceSchema>;

export const CheckOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  correct: z.boolean(),
  explanation: z.string()
});
export type CheckOption = z.infer<typeof CheckOptionSchema>;

/**
 * A scenario is a small directed graph of steps. The player starts at
 * `Lesson.startStepId` and follows `next` ids until it reaches an `end` step.
 */
export const ScenarioStepSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("scene"),
    id: z.string(),
    title: z.string().optional(),
    body: z.string(),
    next: z.string()
  }),
  z.object({
    kind: z.literal("decision"),
    id: z.string(),
    title: z.string().optional(),
    body: z.string(),
    choices: z.array(ScenarioChoiceSchema).min(2)
  }),
  z.object({
    kind: z.literal("check"),
    id: z.string(),
    title: z.string().optional(),
    question: z.string(),
    options: z.array(CheckOptionSchema).min(2),
    next: z.string()
  }),
  z.object({
    kind: z.literal("end"),
    id: z.string(),
    title: z.string().optional(),
    body: z.string()
  })
]);
export type ScenarioStep = z.infer<typeof ScenarioStepSchema>;

export const LessonSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    domain: DomainSchema,
    /** Roles this lesson is most relevant to (used for light tailoring/filtering). */
    roleTags: z.array(RoleSchema).min(1),
    estimatedMinutes: z.number().int().positive(),
    /** CPD-style hours credited on completion (e.g. 0.25 for a ~15 min lesson). */
    hoursCredited: z.number().positive(),
    summary: z.string(),
    /** Mandatory educational-use / non-diagnostic disclaimer surfaced in the player. */
    disclaimer: z.string(),
    /** What the content is based on. Supports the brand's evidence-led guardrail. */
    sourceNote: z.string(),
    /** Regulatory awareness this supports — never a claim it discharges a legal duty. */
    regulatoryContext: z.array(z.string()).default([]),
    version: z.number().int().positive(),
    published: z.boolean(),
    startStepId: z.string(),
    steps: z.array(ScenarioStepSchema).min(1)
  })
  .superRefine((lesson, ctx) => {
    const ids = new Set(lesson.steps.map((s) => s.id));
    if (!ids.has(lesson.startStepId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `startStepId "${lesson.startStepId}" is not a step id`
      });
    }
    // Every referenced `next` must point at a real step.
    for (const step of lesson.steps) {
      const targets =
        step.kind === "decision"
          ? step.choices.map((c) => c.next)
          : step.kind === "scene" || step.kind === "check"
            ? [step.next]
            : [];
      for (const target of targets) {
        if (!ids.has(target)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `step "${step.id}" points to missing step "${target}"`
          });
        }
      }
    }
  });
export type Lesson = z.infer<typeof LessonSchema>;

export const ReferenceCardSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  domain: DomainSchema,
  tags: z.array(z.string()).default([]),
  /** Markdown body — rendered as skimmable guidance, available offline. */
  bodyMarkdown: z.string(),
  disclaimer: z.string(),
  sourceNote: z.string(),
  version: z.number().int().positive()
});
export type ReferenceCard = z.infer<typeof ReferenceCardSchema>;

/* ----------------------------- Learner record ----------------------------- */
/* These live on-device first; they sync only if/when the worker signs in. */

export const LearnerSchema = z.object({
  id: z.string(),
  role: RoleSchema,
  createdAt: z.string(), // ISO
  email: z.string().email().optional(),
  pushOptIn: z.boolean().default(false)
});
export type Learner = z.infer<typeof LearnerSchema>;

export const LessonCompletionSchema = z.object({
  id: z.string(),
  lessonId: z.string(),
  lessonVersion: z.number().int().positive(),
  completedAt: z.string(), // ISO
  minutesCredited: z.number().nonnegative(),
  hoursCredited: z.number().nonnegative(),
  checkScore: z.number().min(0).max(1).optional()
});
export type LessonCompletion = z.infer<typeof LessonCompletionSchema>;

export const CertificateSchema = z.object({
  id: z.string(),
  lessonId: z.string(),
  lessonTitle: z.string(),
  issuedAt: z.string(), // ISO
  hoursCredited: z.number().nonnegative(),
  learnerName: z.string().optional()
});
export type Certificate = z.infer<typeof CertificateSchema>;

/** Manifest for offline content bundling + OTA refresh. */
export const ContentPackSchema = z.object({
  version: z.number().int().positive(),
  publishedAt: z.string(),
  lessons: z.array(LessonSchema),
  referenceCards: z.array(ReferenceCardSchema)
});
export type ContentPack = z.infer<typeof ContentPackSchema>;
