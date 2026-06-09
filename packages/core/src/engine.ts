import type { Lesson, ScenarioStep } from "./types.js";

/**
 * Pure scenario navigation. Kept free of React/React Native so it can be unit-tested
 * and reused by the web portal later.
 */
export function getStep(lesson: Lesson, stepId: string): ScenarioStep {
  const step = lesson.steps.find((s) => s.id === stepId);
  if (!step) {
    throw new Error(`Lesson "${lesson.slug}" has no step "${stepId}"`);
  }
  return step;
}

export function getStartStep(lesson: Lesson): ScenarioStep {
  return getStep(lesson, lesson.startStepId);
}

/** The id of the next step given a step and (for decisions) a chosen choice id. */
export function nextStepId(step: ScenarioStep, choiceId?: string): string | null {
  switch (step.kind) {
    case "scene":
    case "check":
      return step.next;
    case "decision": {
      const choice = step.choices.find((c) => c.id === choiceId);
      return choice ? choice.next : null;
    }
    case "end":
      return null;
  }
}

export function isCheckCorrect(step: ScenarioStep, optionId: string): boolean {
  if (step.kind !== "check") return false;
  return step.options.find((o) => o.id === optionId)?.correct ?? false;
}

/** Total CPD-style hours a learner has accrued across completions. */
export function totalHours(completions: { hoursCredited: number }[]): number {
  const sum = completions.reduce((acc, c) => acc + c.hoursCredited, 0);
  return Math.round(sum * 100) / 100;
}
