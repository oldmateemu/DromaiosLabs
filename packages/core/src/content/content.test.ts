import { describe, it, expect } from "vitest";
import { contentPack, lessons, referenceCards, getPublishedLessons } from "./index.js";
import { LessonSchema, ReferenceCardSchema } from "../types.js";
import { getStartStep, nextStepId, getStep } from "../engine.js";

describe("content pack", () => {
  it("loads and validates against the schema", () => {
    expect(contentPack.lessons.length).toBeGreaterThanOrEqual(6);
    expect(contentPack.referenceCards.length).toBeGreaterThanOrEqual(4);
  });

  it("every lesson validates (schema also checks step graph integrity)", () => {
    for (const lesson of lessons) {
      expect(() => LessonSchema.parse(lesson)).not.toThrow();
    }
  });

  it("every reference card validates", () => {
    for (const card of referenceCards) {
      expect(() => ReferenceCardSchema.parse(card)).not.toThrow();
    }
  });

  it("lesson ids and slugs are unique", () => {
    const ids = lessons.map((l) => l.id);
    const slugs = lessons.map((l) => l.slug);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every published lesson is walkable from start to an end step", () => {
    for (const lesson of getPublishedLessons()) {
      let current = getStartStep(lesson);
      const visited = new Set<string>();
      // Walk the "good"/first path; guard against cycles.
      while (current.kind !== "end") {
        expect(visited.has(current.id)).toBe(false);
        visited.add(current.id);
        const choiceId =
          current.kind === "decision" ? current.choices[0]?.id : undefined;
        const next = nextStepId(current, choiceId);
        expect(next).not.toBeNull();
        current = getStep(lesson, next as string);
      }
    }
  });

  it("every lesson carries a disclaimer and source note", () => {
    for (const lesson of lessons) {
      expect(lesson.disclaimer.length).toBeGreaterThan(0);
      expect(lesson.sourceNote.length).toBeGreaterThan(0);
    }
  });
});
