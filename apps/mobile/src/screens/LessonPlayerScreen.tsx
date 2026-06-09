import React, { useMemo, useState } from "react";
import { View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Badge,
  Button,
  Card,
  Caption,
  DisclaimerBanner,
  Heading,
  ProgressBar,
  Screen,
  Stack,
  Text,
  Title,
  colors,
  qualityColors,
  spacing,
  type QualityKey
} from "@dromaios/ui";
import {
  getLessonById,
  getStep,
  isCheckCorrect,
  nextStepId,
  type Certificate,
  type ScenarioStep
} from "@dromaios/core";
import type { LearnStackParamList } from "../navigation/types.js";
import { useRecord } from "../lib/record.js";

type Props = NativeStackScreenProps<LearnStackParamList, "LessonPlayer">;

const QUALITY_LABEL: Record<QualityKey, string> = {
  good: "Strong choice",
  ok: "Could be better",
  poor: "Risky"
};

export function LessonPlayerScreen({ route, navigation }: Props) {
  const { completeLesson } = useRecord();
  const lesson = getLessonById(route.params.lessonId);

  const [stepId, setStepId] = useState(lesson?.startStepId ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checks, setChecks] = useState({ correct: 0, total: 0 });
  const [certificate, setCertificate] = useState<Certificate | null>(null);

  const progress = useMemo(() => {
    if (!lesson) return 0;
    const idx = lesson.steps.findIndex((s) => s.id === stepId);
    return lesson.steps.length ? (idx + 1) / lesson.steps.length : 0;
  }, [lesson, stepId]);

  if (!lesson) {
    return (
      <Screen>
        <Title>Lesson unavailable</Title>
        <Text muted>We couldn&apos;t find that lesson.</Text>
        <Button label="Back" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  // Capture the narrowed lesson so the nested renderStep closure keeps the non-null type.
  const activeLesson = lesson;
  const step = getStep(activeLesson, stepId);

  const advance = (choiceId?: string) => {
    const next = nextStepId(step, choiceId);
    setSelectedId(null);
    if (next) setStepId(next);
  };

  const onSaveCertificate = () => {
    const score = checks.total ? checks.correct / checks.total : undefined;
    setCertificate(completeLesson(activeLesson, score));
  };

  return (
    <Screen>
      <ProgressBar value={progress} />
      <DisclaimerBanner text={lesson.disclaimer} />
      {renderStep(step)}
    </Screen>
  );

  function renderStep(s: ScenarioStep) {
    switch (s.kind) {
      case "scene":
        return (
          <Stack gap={spacing.md}>
            {s.title ? <Heading>{s.title}</Heading> : null}
            <Text>{s.body}</Text>
            <Button label="Continue" onPress={() => advance()} />
          </Stack>
        );

      case "decision": {
        const chosen = s.choices.find((c) => c.id === selectedId) ?? null;
        return (
          <Stack gap={spacing.md}>
            {s.title ? <Heading>{s.title}</Heading> : null}
            <Text>{s.body}</Text>
            <Stack gap={spacing.sm}>
              {s.choices.map((c) => (
                <Button
                  key={c.id}
                  label={c.label}
                  variant="secondary"
                  disabled={selectedId !== null && selectedId !== c.id}
                  onPress={() => setSelectedId(c.id)}
                />
              ))}
            </Stack>
            {chosen ? (
              <Card>
                <Badge
                  label={QUALITY_LABEL[chosen.quality]}
                  fg={qualityColors(chosen.quality).fg}
                  bg={qualityColors(chosen.quality).bg}
                />
                <Text>{chosen.feedback}</Text>
                <Button label="Continue" onPress={() => advance(chosen.id)} />
              </Card>
            ) : null}
          </Stack>
        );
      }

      case "check": {
        const picked = s.options.find((o) => o.id === selectedId) ?? null;
        const correct = picked ? isCheckCorrect(s, picked.id) : false;
        return (
          <Stack gap={spacing.md}>
            {s.title ? <Heading>{s.title}</Heading> : null}
            <Text variant="bodyStrong">{s.question}</Text>
            <Stack gap={spacing.sm}>
              {s.options.map((o) => (
                <Button
                  key={o.id}
                  label={o.label}
                  variant="secondary"
                  disabled={selectedId !== null && selectedId !== o.id}
                  onPress={() => {
                    if (selectedId) return;
                    setSelectedId(o.id);
                    setChecks((prev) => ({
                      correct: prev.correct + (isCheckCorrect(s, o.id) ? 1 : 0),
                      total: prev.total + 1
                    }));
                  }}
                />
              ))}
            </Stack>
            {picked ? (
              <Card>
                <Badge
                  label={correct ? "Correct" : "Not quite"}
                  fg={correct ? colors.good : colors.poor}
                  bg={correct ? colors.goodTint : colors.poorTint}
                />
                <Text>{picked.explanation}</Text>
                <Button label="Continue" onPress={() => advance()} />
              </Card>
            ) : null}
          </Stack>
        );
      }

      case "end":
        return (
          <Stack gap={spacing.md}>
            <Title>{s.title ?? "Lesson complete"}</Title>
            <Text>{s.body}</Text>
            {certificate ? (
              <Card>
                <Badge label="Saved" fg={colors.good} bg={colors.goodTint} />
                <Heading>Certificate saved</Heading>
                <Text muted>
                  {certificate.hoursCredited} hrs recorded for &ldquo;{certificate.lessonTitle}
                  &rdquo;. Find it any time under My record.
                </Text>
                <Button label="Back to lessons" onPress={() => navigation.navigate("Home")} />
              </Card>
            ) : (
              <View style={{ gap: spacing.sm }}>
                <Caption>
                  Save a dated certificate ({activeLesson.hoursCredited} hrs) to your private record.
                </Caption>
                <Button label="Save my certificate" onPress={onSaveCertificate} />
              </View>
            )}
          </Stack>
        );
    }
  }
}
