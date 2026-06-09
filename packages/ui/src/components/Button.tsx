import React from "react";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { colors, radius, spacing, minTapTarget } from "../tokens.js";
import { Text } from "./Text.js";

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = "primary", disabled, style }: ButtonProps) {
  const isPrimary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style
      ]}
    >
      <Text
        variant="bodyStrong"
        color={isPrimary ? colors.textInverse : colors.primary}
        style={styles.label}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Inline disclaimer / caution banner — used on every lesson and reference screen. */
export function DisclaimerBanner({ text }: { text: string }) {
  return (
    <View style={styles.disclaimer}>
      <Text variant="caption" color={colors.caution}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTapTarget,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.4 },
  label: { textAlign: "center" },
  disclaimer: {
    backgroundColor: colors.cautionTint,
    borderRadius: radius.sm,
    padding: spacing.md
  }
});
