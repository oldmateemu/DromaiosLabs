import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  type Certificate,
  type Lesson,
  type LessonCompletion,
  type Role,
  totalHours
} from "@dromaios/core";

/**
 * The learning record is worker-owned and stored on-device. It works fully offline
 * and anonymously; nothing here is shared with an employer. Sync to a Dromaios account
 * is a later, opt-in addition (see build plan).
 */

const STORAGE_KEY = "dromaios.record.v1";

interface RecordState {
  role: Role | null;
  completions: LessonCompletion[];
  certificates: Certificate[];
}

const EMPTY: RecordState = { role: null, completions: [], certificates: [] };

interface RecordContextValue extends RecordState {
  ready: boolean;
  totalHours: number;
  setRole: (role: Role) => void;
  completeLesson: (lesson: Lesson, checkScore?: number) => Certificate;
  hasCompleted: (lessonId: string) => boolean;
  reset: () => void;
}

const RecordContext = createContext<RecordContextValue | null>(null);

function id(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function RecordProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<RecordState>(EMPTY);
  const [ready, setReady] = useState(false);

  // Load once on mount.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (active && raw) setState({ ...EMPTY, ...JSON.parse(raw) });
      })
      .catch(() => {
        /* corrupt/empty store — start fresh */
      })
      .finally(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, []);

  // Persist on change (after initial load).
  useEffect(() => {
    if (ready) void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, ready]);

  const setRole = useCallback((role: Role) => {
    setState((s) => ({ ...s, role }));
  }, []);

  const completeLesson = useCallback((lesson: Lesson, checkScore?: number): Certificate => {
    const now = new Date().toISOString();
    const completion: LessonCompletion = {
      id: id("cmp"),
      lessonId: lesson.id,
      lessonVersion: lesson.version,
      completedAt: now,
      minutesCredited: lesson.estimatedMinutes,
      hoursCredited: lesson.hoursCredited,
      checkScore
    };
    const certificate: Certificate = {
      id: id("cert"),
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      issuedAt: now,
      hoursCredited: lesson.hoursCredited
    };
    setState((s) => ({
      ...s,
      completions: [completion, ...s.completions],
      certificates: [certificate, ...s.certificates]
    }));
    return certificate;
  }, []);

  const hasCompleted = useCallback(
    (lessonId: string) => state.completions.some((c) => c.lessonId === lessonId),
    [state.completions]
  );

  const reset = useCallback(() => setState(EMPTY), []);

  const value = useMemo<RecordContextValue>(
    () => ({
      ...state,
      ready,
      totalHours: totalHours(state.completions),
      setRole,
      completeLesson,
      hasCompleted,
      reset
    }),
    [state, ready, setRole, completeLesson, hasCompleted, reset]
  );

  return <RecordContext.Provider value={value}>{children}</RecordContext.Provider>;
}

export function useRecord(): RecordContextValue {
  const ctx = useContext(RecordContext);
  if (!ctx) throw new Error("useRecord must be used within RecordProvider");
  return ctx;
}
