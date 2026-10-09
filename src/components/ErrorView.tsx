import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertCircle } from 'lucide-react-native';

import { Button } from './Button';
import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';

export interface ErrorViewProps {
  title?: string;
  body?: string;
  onRetry?: () => void;
}

/**
 * Generic "something went wrong" block for a failed query/request -
 * icon + title + body, with an optional Retry button when the caller has
 * something to re-run (e.g. `query.refetch`).
 */
export function ErrorView({
  title = 'Something went wrong',
  body = "We couldn't load this right now. Please try again.",
  onRetry,
}: ErrorViewProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <AlertCircle color={colors.error} size={32} strokeWidth={1.5} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {onRetry ? (
        <Button
          title="Retry"
          onPress={onRetry}
          variant="outline"
          style={styles.retryBtn}
        />
      ) : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xxl,
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: radius.full,
      backgroundColor: colors.backgroundSec,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    title: {
      fontSize: 15,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    body: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
    retryBtn: {
      marginTop: spacing.md,
      minWidth: 120,
    },
  });
}
