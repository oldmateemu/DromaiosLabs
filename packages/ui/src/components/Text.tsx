import React from "react";
import { Text as RNText, type TextProps, type TextStyle } from "react-native";
import { colors, typography } from "../tokens.js";

type Variant = keyof typeof typography;

export interface DText extends TextProps {
  variant?: Variant;
  muted?: boolean;
  color?: string;
}

/** Typed, token-driven text. Defaults to readable body copy. */
export function Text({ variant = "body", muted, color, style, ...rest }: DText) {
  const base: TextStyle = {
    ...typography[variant],
    color: color ?? (muted ? colors.textMuted : colors.text)
  };
  return <RNText style={[base, style]} {...rest} />;
}

export function Heading(props: DText) {
  return <Text variant="heading" {...props} />;
}

export function Title(props: DText) {
  return <Text variant="title" {...props} />;
}

export function Caption(props: DText) {
  return <Text variant="caption" muted {...props} />;
}
