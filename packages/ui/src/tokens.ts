/**
 * Dromaios design tokens.
 *
 * Calm, operational, high-contrast and accessible — built for the frontline reality
 * (gloves, glare, low digital confidence, the ~12% low-readiness tail). Large tap
 * targets, generous spacing, strong contrast, no decorative clutter.
 */

export const colors = {
  // Brand — calm clinical teal/blue
  primary: "#0F6E6E",
  primaryDark: "#0A5050",
  primaryTint: "#E3F1F1",

  // Surfaces
  background: "#F7F9F9",
  surface: "#FFFFFF",
  surfaceAlt: "#EEF3F3",
  border: "#D5DEDE",

  // Text
  text: "#16201F",
  textMuted: "#52605F",
  textInverse: "#FFFFFF",

  // Semantic feedback (used for scenario choice quality + status)
  good: "#1F7A43",
  goodTint: "#E4F2E9",
  ok: "#8A6D11",
  okTint: "#FBF3DC",
  poor: "#B23A3A",
  poorTint: "#F8E4E4",

  // Attention / disclaimer
  caution: "#8A5A00",
  cautionTint: "#FBEFD9"
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999
} as const;

export const typography = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: "700" as const },
  title: { fontSize: 22, lineHeight: 28, fontWeight: "700" as const },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: "600" as const },
  body: { fontSize: 17, lineHeight: 25, fontWeight: "400" as const },
  bodyStrong: { fontSize: 17, lineHeight: 25, fontWeight: "600" as const },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: "400" as const }
} as const;

/** Minimum interactive height — accessibility for large fingers / low dexterity. */
export const minTapTarget = 52;

export type QualityKey = "good" | "ok" | "poor";

export function qualityColors(quality: QualityKey): { fg: string; bg: string } {
  switch (quality) {
    case "good":
      return { fg: colors.good, bg: colors.goodTint };
    case "ok":
      return { fg: colors.ok, bg: colors.okTint };
    case "poor":
      return { fg: colors.poor, bg: colors.poorTint };
  }
}
