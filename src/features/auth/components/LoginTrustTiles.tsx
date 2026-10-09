import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { icons } from '@/constants/icons';
import { fonts, radius, useTheme, type ThemeColors } from '@/theme';
import { authPalette } from '../authPalette';

interface TrustPoint {
  id: string;
  title: string;
  caption: string;
  Icon: (typeof icons)[keyof typeof icons];
  /** Resolved against the theme at render time. */
  tone: 'primary' | 'success' | 'indigo';
}

/**
 * Marketing points from the Stitch login. Kept as data so copy can be edited
 * (or removed) in one place - several are factual claims ("0% Additives",
 * "Lab Certified", "15 Mins") that must be true before they ship.
 */
const TRUST_POINTS: readonly TrustPoint[] = [
  {
    id: 'speed',
    title: '15 Mins',
    caption: 'Express Harvest',
    Icon: icons.zap,
    tone: 'primary',
  },
  {
    id: 'purity',
    title: '0% Additives',
    caption: 'Lab Certified',
    Icon: icons.lab,
    tone: 'success',
  },
  {
    id: 'farm',
    title: 'Direct Farm',
    caption: 'Ethical Pricing',
    Icon: icons.farm,
    tone: 'indigo',
  },
];

const toneColor = (tone: TrustPoint['tone'], colors: ThemeColors): string =>
  tone === 'primary'
    ? colors.primary
    : tone === 'success'
    ? colors.success
    : authPalette.indigo;

/** Three equal tiles under the login CTA. */
export function LoginTrustTiles() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      {TRUST_POINTS.map(({ id, title, caption, Icon, tone }) => {
        const color = toneColor(tone, colors);
        return (
          <View
            key={id}
            style={styles.tile}
            accessible
            accessibilityLabel={`${title}, ${caption}`}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${color}1F` }]}>
              <Icon size={14} color={color} strokeWidth={2.25} />
            </View>
            <Text
              style={styles.title}
              numberOfLines={1}
              maxFontSizeMultiplier={1.25}
            >
              {title}
            </Text>
            <Text
              style={styles.caption}
              numberOfLines={1}
              maxFontSizeMultiplier={1.25}
            >
              {caption}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: { flexDirection: 'row', gap: 10 },
    tile: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderRadius: radius.lg + 2,
      borderWidth: 1,
      borderColor: colors.divider,
      backgroundColor: colors.surface,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 12,
      lineHeight: 16,
      color: colors.textPrimary,
    },
    caption: {
      fontFamily: fonts.regular,
      fontSize: 11,
      lineHeight: 15,
      color: colors.textSecondary,
      marginTop: 1,
    },
  });
}
