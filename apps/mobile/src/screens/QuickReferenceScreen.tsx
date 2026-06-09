import React, { useMemo, useState } from "react";
import { TextInput, StyleSheet } from "react-native";
import {
  Card,
  Caption,
  Heading,
  Screen,
  Stack,
  Text,
  Title,
  colors,
  radius,
  spacing,
  minTapTarget
} from "@dromaios/ui";
import { referenceCards } from "@dromaios/core";
import { MarkdownLite } from "../components/MarkdownLite.js";

export function QuickReferenceScreen() {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return referenceCards;
    return referenceCards.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)) ||
        c.bodyMarkdown.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <Screen>
      <Title>Quick reference</Title>
      <Caption>Skim it in the moment. Works offline.</Caption>
      <TextInput
        placeholder="Search (e.g. de-escalation, reporting)"
        placeholderTextColor={colors.textMuted}
        value={query}
        onChangeText={setQuery}
        style={styles.search}
        accessibilityLabel="Search reference cards"
      />
      <Stack gap={spacing.md}>
        {results.map((card) => {
          const open = openId === card.id;
          return (
            <Card key={card.id} onPress={() => setOpenId(open ? null : card.id)}>
              <Heading>{card.title}</Heading>
              {open ? (
                <Stack gap={spacing.sm}>
                  <MarkdownLite source={card.bodyMarkdown} />
                  <Caption>{card.sourceNote}</Caption>
                </Stack>
              ) : (
                <Caption>Tap to open</Caption>
              )}
            </Card>
          );
        })}
        {results.length === 0 ? <Text muted>No cards match “{query}”.</Text> : null}
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    minHeight: minTapTarget,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 17,
    color: colors.text
  }
});
