import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CheckCircle2 } from 'lucide-react-native';

import { Button } from '@/components';
import type { MainStackParamList } from '@/app/navigation/navigationTypes';
import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';

/**
 * Shown after a successful `POST /orders/`. Reached via
 * `navigation.reset` from `PaymentScreen`, so the back stack is just
 * Home -> this - the hardware back button can never return to a
 * now-empty checkout.
 */
export function OrderSuccessScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { params } = useRoute<RouteProp<MainStackParamList, 'OrderSuccess'>>();

  const handleContinue = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Tabs', params: { screen: 'Home' } }],
    });
  }, [navigation]);
  const handleViewOrders = useCallback(
    () => navigation.navigate('Orders'),
    [navigation],
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={styles.body}>
        <CheckCircle2 color={colors.success} size={72} strokeWidth={1.75} />
        <Text style={styles.title}>Order placed!</Text>
        <Text style={styles.subtitle}>
          Thanks for shopping with us. We're getting your order ready.
        </Text>

        <View style={styles.card}>
          <Row label="Order number" value={`#${params.orderNumber}`} styles={styles} />
          <Row label="Amount to pay" value={`₹${params.totalAmount}`} styles={styles} />
          <Row label="Payment" value="Cash on delivery" styles={styles} />
          {params.etaMinutes ? (
            <Row
              label="Estimated delivery"
              value={`~${params.etaMinutes} mins`}
              styles={styles}
            />
          ) : null}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Button title="View my orders" variant="outline" onPress={handleViewOrders} fullWidth />
        <Button title="Continue shopping" onPress={handleContinue} fullWidth />
      </View>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1 },
    body: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
    },
    title: {
      fontSize: 24,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
      marginTop: spacing.sm,
    },
    subtitle: {
      fontSize: 14,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    card: {
      alignSelf: 'stretch',
      marginTop: spacing.lg,
      backgroundColor: colors.backgroundSec,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rowLabel: {
      fontSize: 13,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },
    rowValue: {
      fontSize: 14,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
    footer: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      gap: spacing.sm,
    },
  });
}
