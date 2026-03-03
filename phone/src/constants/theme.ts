export const colors = {
  background: "#0D0D12",
  surface: "#1A1A24",
  raised: "#242430",
  overlay: "#2A2A38",
  textPrimary: "#F5F5FA",
  textSecondary: "#7B7B94",
  textTertiary: "#4A4A5E",
  accent: "#6C5CE7",
  accentLight: "#8B7CF0",
  accentMuted: "rgba(108, 92, 231, 0.15)",
  success: "#34D399",
  successMuted: "rgba(52, 211, 153, 0.15)",
  warning: "#FBBF24",
  warningMuted: "rgba(251, 191, 36, 0.15)",
  error: "#F87171",
  upperA: "#FF6B6B",
  lowerA: "#4ECDC4",
  upperB: "#FFE66D",
  lowerB: "#A78BFA",
  border: "#1F1F2E",
} as const;

export const workoutColors: Record<string, string> = {
  upper_a: colors.upperA,
  lower_a: colors.lowerA,
  upper_b: colors.upperB,
  lower_b: colors.lowerB,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const TAP_TARGET_MIN = 48;
export const TAP_TARGET_PRIMARY = 56;
