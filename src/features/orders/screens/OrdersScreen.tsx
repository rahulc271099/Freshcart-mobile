import React, { useCallback, useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PackageOpen } from 'lucide-react-native';

import { EmptyState, ErrorView, Header, Loader } from '@/components';
import type { MainStackParamList } from '@/app/navigation/navigationTypes';
import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';
import { useOrders } from '../hooks/useOrders';
import type { OrderSummaryApi } from '../api/ordersApi';

/** `OUT_FOR_DELIVERY` -> `Out for delivery`. */
function formatStatus(status: string): string {
  const text = status.replace(/_/g, ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
}

/** Basic order history (`GET /api/v1/orders/`) - number, date, status and
 * total per order. Tracking/detail views are a later feature. */
export function OrdersScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { data: orders = [], isLoading, isError, refetch, isRefetching } =
    useOrders();

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: OrderSummaryApi }) => (
      <View style={styles.card}>
        <View style={styles.rowTop}>
          <Text style={styles.number}>#{item.order_number}</Text>
          <Text style={styles.total}>₹{item.total_amount}</Text>
        </View>
        <Text style={styles.meta}>
          {formatDate(item.placed_at ?? item.created_at)}
          {item.delivery_area_name_snapshot
            ? ` · ${item.delivery_area_name_snapshot}`
            : ''}
        </Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{formatStatus(item.status)}</Text>
        </View>
      </View>
    ),
    [styles],
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <Header title="My Orders" onBackPress={handleGoBack} style={styles.header} />
      {isLoading ? (
        <Loader fullscreen />
      ) : isError ? (
        <ErrorView title="Couldn't load your orders" onRetry={refetch} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => String(item.order_id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <EmptyState
              icon={PackageOpen}
              title="No orders yet"
              body="Your placed orders will show up here."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1 },
    header: {
      paddingHorizontal: spacing.md,
      backgroundColor: colors.background,
    },
    list: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xl,
      gap: spacing.sm,
      flexGrow: 1,
    },
    card: {
      backgroundColor: colors.backgroundSec,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: 4,
    },
    rowTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    number: {
      fontSize: 15,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
    total: {
      fontSize: 15,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
    meta: {
      fontSize: 12,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    statusPill: {
      alignSelf: 'flex-start',
      marginTop: 4,
      backgroundColor: `${colors.primary}1A`,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
    },
    statusText: {
      fontSize: 11,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
  });
}
