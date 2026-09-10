import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search as SearchIcon, X } from 'lucide-react-native';

import { Header, TextInput } from '@/components';
import type { MainStackParamList } from '@/app/navigation/navigationTypes';
import {
  ProductCard,
  type Product,
} from '@/features/home/components/ProductCard';
import { ALL_PRODUCTS } from '@/features/home/data/products';
import {
  fonts,
  radius,
  spacing,
  typography,
  useTheme,
  type ThemeColors,
} from '@/theme';

// TODO: persist recent searches (MMKV, same pattern as cartStore/
// wishlistStore) once this needs to survive app restarts - local state is
// enough to prove the interaction for now.
const INITIAL_RECENT_SEARCHES = ['Tomato', 'Banana', 'Organic Apples'];

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
  const results = useMemo(() => {
    if (!trimmedQuery) return [];
    const q = trimmedQuery.toLowerCase();
    return ALL_PRODUCTS.filter(p => p.name.toLowerCase().includes(q));
  }, [trimmedQuery]);

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const commitSearch = useCallback((term: string) => {
    setQuery(term);
    setRecentSearches(prev =>
      [term, ...prev.filter(t => t.toLowerCase() !== term.toLowerCase())].slice(
        0,
        6,
      ),
    );
  }, []);

  const renderProduct = useCallback(
    ({ item, index }: { item: Product; index: number }) => (
      <View
        style={[styles.resultItem, index % 2 === 0 && styles.resultItemLeft]}
      >
        <ProductCard product={item} />
      </View>
    ),
    [styles.resultItem, styles.resultItemLeft],
  );

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
              <Text style={styles.sectionTitle}>Recent Searches</Text>
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
                  style={styles.chip}
                  onPress={() => commitSearch(term)}
                >
                  <Text style={styles.chipText}>{term}</Text>
                </Pressable>
              ))}
            </View>
          </View>
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
          contentContainerStyle={styles.resultsGrid}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

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
    sectionTitle: {
      ...typography.heading3,
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
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
    chipText: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.textPrimary,
    },
    resultsGrid: {
      padding: spacing.sm,
      paddingBottom: spacing.xl,
    },
    resultItem: {
      flex: 1,
      marginBottom: spacing.sm,
      marginLeft: spacing.xs,
    },
    resultItemLeft: {
      marginLeft: 0,
      marginRight: spacing.xs,
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
  });
}
