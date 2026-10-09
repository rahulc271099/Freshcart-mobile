import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search as SearchIcon, X } from 'lucide-react-native';

import {
  Header,
  Loader,
  ProductCard,
  Skeleton,
  TextInput,
  type Product,
  type ProductVariant,
} from '@/components';
import type { MainStackParamList } from '@/app/navigation/navigationTypes';
import { mapCustomerProductCardToProduct } from '@/features/categories/utils/mapCatalogueData';
import { useCartStore } from '@/store/cartStore';
import {
  fonts,
  radius,
  spacing,
  typography,
  useTheme,
  type ThemeColors,
} from '@/theme';
import { useSearchProducts } from '../hooks/useSearchProducts';

// TODO: persist recent searches (MMKV, same pattern as cartStore/
// wishlistStore) once this needs to survive app restarts - local state is
// enough to prove the interaction for now.
const INITIAL_RECENT_SEARCHES: string[] = [];

const POPULAR_SEARCHES = [
  'Fresh Vegetables',
  'Seasonal Fruits',
  'Leafy Greens',
  'Exotic Fruits',
  'Herbs',
];

export function SearchScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState(INITIAL_RECENT_SEARCHES);

  const trimmedQuery = query.trim();

  // Server-side search against the real catalogue (see `useSearchProducts`/
  // `searchApi.ts`) - debounced internally, so this doesn't fire a request
  // on every keystroke.
  const {
    data,
    isLoading,
    isDebouncing,
    isError,
    refetch,
    isFetching,
  } = useSearchProducts(query);

  const results = useMemo<Product[]>(
    () => (data?.results ?? []).map(mapCustomerProductCardToProduct),
    [data],
  );

  // A search only earns a spot in "Recent" once it actually resolves to
  // something - typos and abandoned partial queries shouldn't clutter the
  // list the way an eager per-keystroke save would.
  useEffect(() => {
    if (!data || trimmedQuery.length === 0) return;
    setRecentSearches(prev =>
      [
        trimmedQuery,
        ...prev.filter(t => t.toLowerCase() !== trimmedQuery.toLowerCase()),
      ].slice(0, 6),
    );
    // Only re-run when a NEW result set actually arrives, not on every
    // `recentSearches` change (that would self-trigger).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const addVariantLine = useCartStore(state => state.addVariantLine);
  const setCustomQuantityLine = useCartStore(state => state.setCustomQuantityLine);

  // Same variant-vs-custom-quantity branch as Home/Categories - see
  // `cartStore.ts`'s own comments for why the two need different merge
  // behavior (a real pack-size variant is always its own line; a
  // custom-quantity pick always replaces the product's one line).
  const handleAddToCart = useCallback(
    (product: Product, variant: ProductVariant, quantity: number) => {
      const shared = {
        productId: product.id,
        quantity,
        name: product.name,
        imageUri: product.imageUri,
        price: variant.price,
        originalPrice: variant.mrp,
        unit: variant.label,
        // Real catalogue products here too (same source as Categories -
        // see `searchCustomerProductsApi`'s own comment), so this syncs
        // to the real cart API the same way.
        apiVariantId: variant.apiVariantId,
      };
      if (variant.isCustomQuantitySelection) {
        setCustomQuantityLine({
          ...shared,
          apiBaseQty: variant.apiBaseQty,
          // Snapshotted so the cart screen's own stepper can step this
          // line by the product's real `stepQty` - see `cartStore.ts`'s
          // `CartItem.quantityRule`.
          quantityRule: variant.quantityRule,
          pricingUnitLabel: variant.pricingUnitLabel,
        });
      } else {
        addVariantLine({ ...shared, variantId: variant.id });
      }
    },
    [addVariantLine, setCustomQuantityLine],
  );

  const handleProductPress = useCallback(
    (product: Product) => {
      navigation.navigate('ProductDetails', { productId: product.id });
    },
    [navigation],
  );

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const commitSearch = useCallback((term: string) => {
    setQuery(term);
  }, []);

  const handleClearRecent = useCallback(() => setRecentSearches([]), []);

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => (
      <View style={styles.resultItem}>
        <ProductCard
          product={item}
          onAddToCart={handleAddToCart}
          onPress={handleProductPress}
        />
      </View>
    ),
    [styles.resultItem, handleAddToCart, handleProductPress],
  );

  // Debounce still pending, or this is the query's first-ever fetch (no
  // cached data yet) - `isFetching && !isLoading` below covers a
  // background refetch of an already-cached query (e.g. after `refetch()`
  // from the error state), shown as a small inline spinner instead of
  // replacing the grid with skeletons.
  const showSkeleton = isDebouncing || isLoading;
  const showLoadingMore = isFetching && !isLoading && !isDebouncing;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <Header onBackPress={handleGoBack} style={styles.header} />

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search fruits, vegetables..."
        autoCorrect={false}
        leftAccessory={
          <View style={styles.searchIcon}>
            <SearchIcon
              color={colors.textSecondary}
              size={18}
              strokeWidth={2}
            />
          </View>
        }
        rightAccessory={
          query.length > 0 ? (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={8}
              accessibilityLabel="Clear search"
            >
              <X color={colors.textSecondary} size={18} strokeWidth={2} />
            </Pressable>
          ) : undefined
        }
        containerStyle={styles.inputContainer}
      />

      {trimmedQuery.length === 0 ? (
        <View style={styles.suggestions}>
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <Pressable onPress={handleClearRecent} hitSlop={8}>
                  <Text style={styles.clearAllText}>Clear all</Text>
                </Pressable>
              </View>
              <View style={styles.chipRow}>
                {recentSearches.map(term => (
                  <Pressable
                    key={term}
                    style={styles.chip}
                    onPress={() => commitSearch(term)}
                  >
                    <Text style={styles.chipText}>{term}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Searches</Text>
            <View style={styles.chipRow}>
              {POPULAR_SEARCHES.map(term => (
                <Pressable
                  key={term}
                  style={[styles.chip, styles.chipPopular]}
                  onPress={() => commitSearch(term)}
                >
                  <Text style={[styles.chipText, styles.chipTextPopular]}>
                    {term}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      ) : showSkeleton ? (
        <SearchResultsSkeleton />
      ) : isError ? (
        <View style={styles.emptyResults}>
          <Text style={styles.emptyResultsTitle}>
            Couldn&apos;t load results.
          </Text>
          <Text style={styles.emptyResultsSubtitle}>
            The server can take up to a minute to wake up if it&apos;s been
            idle - please try again.
          </Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => refetch()}
            hitSlop={8}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyResults}>
          <Text style={styles.emptyResultsTitle}>
            No results found for &quot;{trimmedQuery}&quot;
          </Text>
          <Text style={styles.emptyResultsSubtitle}>
            Try searching for a different fruit or vegetable.
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          numColumns={2}
          renderItem={renderProduct}
          columnWrapperStyle={styles.resultsRow}
          contentContainerStyle={styles.resultsGrid}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.resultsMetaRow}>
              <Text style={styles.resultsMetaText}>
                {results.length} result{results.length === 1 ? '' : 's'} for
                &quot;{trimmedQuery}&quot;
              </Text>
              {showLoadingMore ? <Loader size="small" /> : null}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

/** 2-column placeholder grid shown while the debounced query is pending or
 * its request is in flight - matches the real grid's own sizing so
 * nothing shifts once results swap in. */
function SearchResultsSkeleton() {
  return (
    <View style={skeletonStyles.grid}>
      {[0, 1, 2, 3].map(row => (
        <View key={row} style={skeletonStyles.row}>
          <Skeleton
            width="48%"
            height={SKELETON_CARD_HEIGHT}
            borderRadius={radius.lg}
          />
          <Skeleton
            width="48%"
            height={SKELETON_CARD_HEIGHT}
            borderRadius={radius.lg}
          />
        </View>
      ))}
    </View>
  );
}

const SKELETON_CARD_HEIGHT = 220;

const skeletonStyles = StyleSheet.create({
  grid: {
    padding: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
});

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
    },
    header: {
      paddingHorizontal: spacing.md,
    },
    searchIcon: {
      marginRight: spacing.xs,
    },
    inputContainer: {
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    suggestions: {
      paddingHorizontal: spacing.md,
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      ...typography.heading3,
      fontSize: 14,
      color: colors.textSecondary,
    },
    clearAllText: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.primary,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chip: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundSec,
      borderRadius: radius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
    },
    chipPopular: {
      backgroundColor: colors.background,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.textPrimary,
    },
    chipTextPopular: {
      color: colors.primary,
    },
    resultsMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xs,
      paddingBottom: spacing.sm,
    },
    resultsMetaText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    resultsGrid: {
      padding: spacing.sm,
      paddingBottom: spacing.xl,
    },
    resultsRow: {
      justifyContent: 'space-between',
    },
    resultItem: {
      width: '48%',
      marginBottom: spacing.sm,
    },
    emptyResults: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
    emptyResultsTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    emptyResultsSubtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
    retryButton: {
      marginTop: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
    },
    retryText: {
      fontSize: 13,
      fontFamily: fonts.bold,
      color: colors.textInverse,
    },
  });
}
