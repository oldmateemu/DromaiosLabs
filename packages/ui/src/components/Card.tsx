import React from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type ViewProps,
  type ViewStyle
} from "react-native";
import { colors, radius, spacing } from "../tokens.js";

export interface CardProps extends ViewProps {
  onPress?: () => void;
  style?: ViewStyle;
}

export function Card({ onPress, style, children, ...rest }: CardProps) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [styles.card, pressed ? styles.pressed : null, style]}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm
  },
  pressed: { opacity: 0.9, backgroundColor: colors.surfaceAlt }
});
