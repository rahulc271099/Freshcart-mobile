/**
 * Centralized Inter font configuration.
 *
 * Defines the custom Inter font family variants corresponding to the linked TTF assets:
 * - Regular: Inter-Regular (Weight 400)
 * - Medium: Inter-Medium (Weight 500)
 * - SemiBold: Inter-SemiBold (Weight 600)
 * - Bold: Inter-Bold (Weight 700)
 */
export const fonts = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
} as const;

export type FontToken = keyof typeof fonts;
