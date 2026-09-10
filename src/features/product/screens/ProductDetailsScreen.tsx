import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search } from 'lucide-react-native';

import { Header } from '@/components';
import { ProductSection } from '@/features/home/components/ProductSection';
import { ALL_PRODUCTS } from '@/features/home/data/products';
import { icons } from '@/constants/icons';
import type { MainStackParamList } from '@/app/navigation/navigationTypes';
import { useCartItems } from '@/features/cart/hooks/useCartItems';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import {
  fonts,
  radius,
  spacing,
  typography,
  useTheme,
  type ThemeColors,
} from '@/theme';
import { getProductDetails } from '../data/productDetails';
import { ProductImageCarousel } from '../components/ProductImageCarousel';
import { ProductOptionsSheet } from '../components/ProductOptionsSheet';
import { ProductStickyFooter } from '../components/ProductStickyFooter';
import { ProductTrustBadges } from '../components/ProductTrustBadges';

type ProductDetailsNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'ProductDetails'
>;
type ProductDetailsRouteProp = RouteProp<MainStackParamList, 'ProductDetails'>;

/** Gallery is synthesized from the single `Product.imageUri` (repeated) -
 * there's only one real image per product in the catalog today. Swap for
 * a real `images: string[]` field once multiple product photos exist;
 * this keeps the paginated-carousel UI honest about that until then. */
const GALLERY_IMAGE_COUNT = 3;

export function ProductDetailsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<ProductDetailsNavigationProp>();
  const route = useRoute<ProductDetailsRouteProp>();
  const { productId } = route.params;

  const product = useMemo(
    () => ALL_PRODUCTS.find(p => p.id === productId),
    [productId],
  );
  const details = useMemo(
    () => (product ? getProductDetails(product) : null),
    [product],
  );

  const { itemCount } = useCartItems();
  const addItem = useCartStore(state => state.addItem);
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const quantity = useCartStore(
    state => state.items.find(i => i.productId === productId)?.quantity ?? 0,
  );
  const isWishlisted = useWishlistStore(state => state.isWishlisted(productId));
  const toggleWishlist = useWishlistStore(state => state.toggle);

  const [descExpanded, setDescExpanded] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  const handleShare = useCallback(() => {
    if (!product) return;
    Share.share({
      message: `Check out ${product.name} on FreshCart - ₹${product.price}/${product.unit}`,
    }).catch(() => {});
  }, [product]);

  const handleIncrement = useCallback(() => {
    if (quantity === 0) addItem(productId);
    else updateQuantity(productId, quantity + 1);
  }, [quantity, productId, addItem, updateQuantity]);
  const handleDecrement = useCallback(() => {
    updateQuantity(productId, quantity - 1);
  }, [quantity, productId, updateQuantity]);

  // Mirrors ProductCard's own "don't double-count" rule (see its comment):
  // only actually adds when nothing's in the cart yet - the adjacent
  // stepper is what changes the quantity from there, so this button
  // re-adding on every tap would double it, same bug as before.
  const handleAddToCart = useCallback(() => {
    if (quantity === 0) addItem(productId);
  }, [quantity, productId, addItem]);

  const handleBuyNow = useCallback(() => {
    // No checkout flow exists yet - same "coming soon" pattern used across
    // the app (ProfileScreen, EditProfileScreen) for features not yet built.
    Alert.alert('Buy Now', "This isn't wired up yet - coming soon.");
  }, []);

  const handleSheetAddOption = useCallback(() => {
    // The cart store only tracks { productId, quantity } - it has no
    // concept of a selected weight variant yet, so every option adds the
    // same base product. TODO: extend CartItem with a variant id once the
    // cart actually needs to distinguish "500g" from "1kg" of the same
    // product.
    addItem(productId);
    setSheetVisible(false);
  }, [productId, addItem]);

  const handleSheetAddCustom = useCallback(() => {
    // Same limitation as handleSheetAddOption - the custom quantity/price
    // computed in the sheet isn't tracked, only that the product was added.
    addItem(productId);
    setSheetVisible(false);
  }, [productId, addItem]);

  if (!product || !details) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Product not found.</Text>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Text style={styles.notFoundLink}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const galleryImages = Array.from(
    { length: GALLERY_IMAGE_COUNT },
    () => product.imageUri,
  );
  const originalPrice = details.weightOptions[0].originalPrice;
  const savings = originalPrice - product.price;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Same `Header` every other screen (Profile, Categories, Edit
          Profile, ...) uses - no title, just back + a right-side icon
          cluster via `rightAccessory`, same pattern ProfileScreen uses
          for its own "⋯" menu button. */}
      <Header
        onBackPress={() => navigation.goBack()}
        rightAccessory={
          <View style={styles.topNavActions}>
            <Pressable
              style={styles.topNavBtn}
              onPress={() => navigation.navigate('Search')}
              hitSlop={8}
              accessibilityLabel="Search"
            >
              <Search color={colors.textPrimary} size={20} strokeWidth={2} />
            </Pressable>
            <Pressable
              style={styles.topNavBtn}
              onPress={() => navigation.navigate('Tabs', { screen: 'Cart' })}
              hitSlop={8}
              accessibilityLabel="Cart"
            >
              <icons.cart
                color={colors.textPrimary}
                size={20}
                strokeWidth={2}
              />
              {itemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {itemCount > 9 ? '9+' : itemCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        }
        style={styles.header}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <ProductImageCarousel
          images={galleryImages}
          discountPercent={product.discountPercent}
          isWishlisted={isWishlisted}
          onToggleWishlist={() => toggleWishlist(productId)}
          onShare={handleShare}
        />

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={styles.titleTextWrap}>
              <Text style={styles.name}>{product.name}</Text>
              <Text style={styles.unit}>{product.unit}</Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <View style={styles.priceTextWrap}>
              <Text style={styles.price}>₹{product.price}</Text>
              {savings > 0 && (
                <Text style={styles.originalPrice}>₹{originalPrice}</Text>
              )}
            </View>
            <Pressable
              style={styles.addPill}
              onPress={() => setSheetVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Choose options and add to cart"
            >
              <Text style={styles.addPillText}>Add</Text>
              <icons.chevronDown
                color={colors.primary}
                size={16}
                strokeWidth={2.5}
              />
            </Pressable>
          </View>

          {savings > 0 && (
            <Text style={styles.savingsText}>
              You save ₹{savings} ({product.discountPercent}%)
            </Text>
          )}

          <ProductTrustBadges />

          <Text style={styles.sectionTitle}>Product Description</Text>
          <Text
            style={styles.description}
            numberOfLines={descExpanded ? undefined : 3}
          >
            {details.description}
          </Text>
          <Pressable
            onPress={() => setDescExpanded(v => !v)}
            hitSlop={8}
            style={styles.readMoreRow}
          >
            <Text style={styles.readMoreText}>
              {descExpanded ? 'Read less' : 'Read more'}
            </Text>
            <icons.chevronDown
              color={colors.primary}
              size={14}
              strokeWidth={2.5}
              style={descExpanded ? styles.chevronFlipped : undefined}
            />
          </Pressable>
        </View>

        {details.similarProducts.length > 0 && (
          <ProductSection
            title="Similar products"
            products={details.similarProducts}
            onAddToCart={() => {}}
            onProductPress={p =>
              navigation.push('ProductDetails', { productId: p.id })
            }
            onViewAll={() => {}}
          />
        )}
      </ScrollView>

      <ProductStickyFooter
        quantity={quantity}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />

      <ProductOptionsSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        product={product}
        weightOptions={details.weightOptions}
        baseGrams={details.baseGrams}
        onAddOption={handleSheetAddOption}
        onAddCustom={handleSheetAddCustom}
      />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
    },
    notFound: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    notFoundText: {
      fontSize: 15,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },
    notFoundLink: {
      fontSize: 14,
      fontFamily: fonts.bold,
      color: colors.primary,
    },
    header: {
      paddingHorizontal: spacing.md,
    },
    topNavActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    topNavBtn: {
      width: 38,
      height: 38,
      borderRadius: radius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cartBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 16,
      height: 16,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    cartBadgeText: {
      fontSize: 9,
      fontFamily: fonts.bold,
      color: colors.textInverse,
    },
    content: {
      paddingHorizontal: spacing.md,
    },
    titleRow: {
      flexDirection: 'row',
      marginTop: spacing.md,
    },
    titleTextWrap: {
      flex: 1,
    },
    name: {
      ...typography.heading3,
      color: colors.textPrimary,
    },
    unit: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
    priceTextWrap: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.sm,
    },
    price: {
      fontSize: 22,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
    originalPrice: {
      fontSize: 15,
      color: colors.textSecondary,
      textDecorationLine: 'line-through',
    },
    addPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderWidth: 1.5,
      borderColor: colors.primary,
      borderRadius: radius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
    },
    addPillText: {
      fontSize: 14,
      fontFamily: fonts.bold,
      color: colors.primary,
    },
    savingsText: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: colors.primary,
      marginTop: spacing.xs,
    },
    sectionTitle: {
      fontSize: 15,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
      marginTop: spacing.lg,
      marginBottom: spacing.xs,
    },
    description: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    readMoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      marginTop: spacing.xs,
    },
    readMoreText: {
      fontSize: 13,
      fontFamily: fonts.bold,
      color: colors.primary,
    },
    chevronFlipped: {
      transform: [{ rotate: '180deg' }],
    },
  });
}
