import React from "react";
import { ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing } from "../tokens.js";
import { Text } from "./Text.js";

/** Standard scrollable screen frame with safe-area + comfortable padding. */
export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Stack({ gap = spacing.md, style, children }: {
  gap?: number;
  style?: ViewStyle;
  children: React.ReactNode;
}) {
  return <View style={[{ gap }, style]}>{children}</View>;
}

export interface ProgressBarProps {
  /** 0..1 */
  value: number;
}

export function ProgressBar({ value }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityValue={{ now: Math.round(pct * 100), min: 0, max: 100 }}
    >
      <View style={[styles.fill, { width: `${pct * 100}%` }]} />
    </View>
  );
}

export function Badge({ label, fg, bg }: { label: string; fg: string; bg: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text variant="caption" color={fg}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  track: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden"
  },
  fill: { height: "100%", backgroundColor: colors.primary },
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  }
});
