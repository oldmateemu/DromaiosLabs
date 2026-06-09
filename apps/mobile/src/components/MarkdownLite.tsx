import React from "react";
import { View } from "react-native";
import { Text, colors, spacing } from "@dromaios/ui";

/**
 * Deliberately tiny markdown renderer for reference-card bodies: supports blank lines,
 * "- " bullets, and inline **bold**. Avoids pulling a markdown dependency into the MVP.
 */
export function MarkdownLite({ source }: { source: string }) {
  const lines = source.split("\n");
  return (
    <View style={{ gap: spacing.xs }}>
      {lines.map((line, i) => {
        if (line.trim() === "") return <View key={i} style={{ height: spacing.sm }} />;
        const isBullet = line.startsWith("- ");
        const content = isBullet ? line.slice(2) : line;
        return (
          <View key={i} style={{ flexDirection: "row", gap: spacing.sm }}>
            {isBullet ? <Text color={colors.primary}>{"•"}</Text> : null}
            <Text style={{ flex: 1 }}>{renderInline(content)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function renderInline(text: string): React.ReactNode {
  // Split on **bold** segments.
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <Text key={i} variant="bodyStrong">
          {part.slice(2, -2)}
        </Text>
      );
    }
    return <Text key={i}>{part}</Text>;
  });
}
