import React from "react";
import { View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Badge,
  Button,
  Card,
  Caption,
  Heading,
  ProgressBar,
  Screen,
  Stack,
  Text,
  Title,
  colors,
  spacing
} from "@dromaios/ui";
import { getPublishedLessons, type Role } from "@dromaios/core";
import type { LearnStackParamList } from "../navigation/types.js";
import { useRecord } from "../lib/record.js";

type Props = NativeStackScreenProps<LearnStackParamList, "Home">;

const ROLES: { role: Role; label: string }[] = [
  { role: "disability-support", label: "Disability support" },
  { role: "aged-care", label: "Aged care" },
  { role: "nurse", label: "Nurse" },
  { role: "other", label: "Other / prefer not to say" }
];

export function HomeScreen({ navigation }: Props) {
  const { role, setRole, completions, totalHours, hasCompleted, ready } = useRecord();
  const lessons = getPublishedLessons();
  const featured = lessons[0];
  const completedCount = lessons.filter((l) => hasCompleted(l.id)).length;

  if (!ready) {
    return (
      <Screen>
        <Text muted>Loading…</Text>
      </Screen>
    );
  }

  if (!role) {
    return (
      <Screen>
        <Title>Welcome</Title>
        <Text>
          Short, practical lessons on de-escalation and behaviour support — built for the
          realities of frontline work. Free, and yours to keep.
        </Text>
        <Heading>What best describes your work?</Heading>
        <Caption>This just helps us frame the scenarios. You can change it later.</Caption>
        <Stack gap={spacing.sm}>
          {ROLES.map((r) => (
            <Button key={r.role} label={r.label} variant="secondary" onPress={() => setRole(r.role)} />
          ))}
        </Stack>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <Caption>Your progress</Caption>
        <Title>
          {completedCount} of {lessons.length} lessons
        </Title>
        <ProgressBar value={lessons.length ? completedCount / lessons.length : 0} />
        <Text muted>{totalHours} learning hours recorded</Text>
      </Card>

      {featured ? (
        <Card onPress={() => navigation.navigate("LessonPlayer", { lessonId: featured.id })}>
          <Badge label="This week" fg={colors.primary} bg={colors.primaryTint} />
          <Heading>{featured.title}</Heading>
          <Text muted>{featured.summary}</Text>
          <Caption>
            {featured.estimatedMinutes} min · {featured.hoursCredited} hrs
          </Caption>
        </Card>
      ) : null}

      <Heading>All lessons</Heading>
      <Stack gap={spacing.md}>
        {lessons.map((lesson) => {
          const done = hasCompleted(lesson.id);
          return (
            <Card
              key={lesson.id}
              onPress={() => navigation.navigate("LessonPlayer", { lessonId: lesson.id })}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.sm }}>
                <Text variant="bodyStrong" style={{ flex: 1 }}>
                  {lesson.title}
                </Text>
                {done ? <Badge label="Done" fg={colors.good} bg={colors.goodTint} /> : null}
              </View>
              <Caption>
                {lesson.estimatedMinutes} min · {lesson.domain.replace("-", " ")}
              </Caption>
            </Card>
          );
        })}
      </Stack>
    </Screen>
  );
}
