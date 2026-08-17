/**
 * Centralized border-radius scale. `full` is for fully-rounded elements
 * (pills, circular avatars/buttons) — pass a large enough size alongside it.
 */
export const radius = {
  sm: 4,
  md: 8,
  lg: 16,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;
