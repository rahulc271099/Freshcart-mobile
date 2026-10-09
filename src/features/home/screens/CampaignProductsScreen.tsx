import React, { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  ErrorView,
  Header,
  Loader,
  ProductCard,
  Skeleton,
  type Product,
} from '@/components';
import type { MainStackParamList } from '@/app/navigation/navigationTypes';
import { spacing, typography, useTheme, type ThemeColors } from '@/theme';
import { useAddProductToCart } from '../hooks/useAddProductToCart';
import { useCampaignProducts } from '../hooks/useHomeContent';

type Navigation = NativeStackNavigationProp<
  MainStackParamList,
  'CampaignProducts'
>;
type Route = RouteProp<MainStackParamList, 'CampaignProducts'>;

const PLACEHOLDER_COUNT = 6;

/**
 * "See all" page for one Home campaign: every product in the campaign as a
 * 2-column grid, loaded a page at a time as the shopper scrolls.
 */
export function CampaignProductsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<Navigation>();
  const { campaignId, title } = useRoute<Route>().params;

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCampaignProducts(campaignId);
  const handleAddToCart = useAddProductToCart();

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleProductPress = useCallback(
    (product: Product) =>
      navigation.navigate('ProductDetails', { productId: product.id }),
    [navigation],
  );
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage().catch(error => {
        console.warn('[CampaignProducts] could not load next page', error);
      });
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => (
      <View style={styles.cell}>
        <ProductCard
          product={item}
          onAddToCart={handleAddToCart}
          onPress={handleProductPress}
        />
      </View>
    ),
    [styles.cell, handleAddToCart, handleProductPress],
  );

  let body: React.ReactNode;
  if (isLoading) {
    body = (
      <View style={styles.grid}>
        <View style={styles.skeletonWrap}>
          {Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => (
            <View key={i} style={styles.cell}>
              <Skeleton width="100%" height={230} borderRadius={12} />
            </View>
          ))}
        </View>
      </View>
    );
  } else if (isError && !data) {
    body = <ErrorView title="Couldn't load these products" onRetry={refetch} />;
  } else if (!data || data.length === 0) {
    body = (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No products available right now.</Text>
      </View>
    );
  } else {
    body = (
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        numColumns={2}
        renderItem={renderProduct}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.6}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footer}>
              <Loader size="small" />
            </View>
          ) : null
        }
      />
    );
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <Header title={title} onBackPress={handleGoBack} style={styles.header} />
      {body}
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1 },
    header: { paddingHorizontal: spacing.md },
    grid: { padding: spacing.sm, paddingBottom: spacing.xl },
    row: { justifyContent: 'space-between' },
    skeletonWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    cell: { width: '48%', marginBottom: spacing.sm },
    footer: { paddingVertical: spacing.md },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { ...typography.body, color: colors.textSecondary },
  });
}
