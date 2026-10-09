import React, { useCallback, useMemo } from 'react';
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

import {
  ErrorView,
  Header,
  Loader,
  ProductOptionsSheet,
  type Product,
  type ProductVariant,
} from '@/components';
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
import {
  mapCustomerProductCardToProduct,
  mapCustomerVariantsToProduct,
} from '@/features/categories/utils/mapCatalogueData';
import { useCustomerProducts } from '@/features/categories/hooks/useCustomerProducts';
// `ProductSection` is Home's horizontal-scroll product row - reused as-is
// for "Similar Products" rather than building a second copy of it; it's a
// generic, data-free presentational component (same spirit as this
// screen already importing the shared `ProductCard` itself via
// `@/components`), not anything Home-specific.
import { ProductSection } from '@/features/home/components/ProductSection';
import { resolveOptionsMode } from '../api/productApi';
import { useProductVariants } from '../hooks/useProductVariants';
import { ProductImageCarousel } from '../components/ProductImageCarousel';
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

// Live-catalogue products only now - the old dummy/`ALL_PRODUCTS` path
// (Home's hand-picked string ids like `'grapes'`) has been removed
// per request, along with its own Home entry point. `productId` is
// expected to be a real numeric catalogue id (see
// `mapCustomerProductCardToProduct`'s `id: String(card.productId)`);
// anything else falls into the same "not found" state a deleted/bad id
// would, rather than crashing on `Number(productId)` being `NaN`.
function isValidProductId(productId: string): boolean {
  return /^\d+$/.test(productId);
}

export function ProductDetailsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<ProductDetailsNavigationProp>();
  const route = useRoute<ProductDetailsRouteProp>();
  const { productId } = route.params;
  const validId = isValidProductId(productId);

  // The variants endpoint (`GET .../variants/`) instead of a dedicated
  // single-product detail endpoint - the backend doesn't have one, and
  // this returns every field the page needs anyway (name/image/pricing
  // flags/groupId) plus `defaultVariant`, whose `finalSellingPrice` is
  // already the real, post-discount price - see
  // `mapCustomerVariantsToProduct`'s own comment.
  const liveVariantsQuery = useProductVariants(Number(productId), validId);

  const product = useMemo(() => {
    const data = liveVariantsQuery.data;
    if (!data) return undefined;
    return mapCustomerVariantsToProduct(data);
  }, [liveVariantsQuery.data]);
  console.log("🚀 ~ ProductDetailsScreen ~ liveProduct:", product)

  // A real pack-size variant vs a custom-quantity (loose/bulk) product -
  // decides which cart-store action this screen's simple quick-add uses,
  // same routing rule `ProductCard` uses for its own options sheet.
  const liveOptionsMode = liveVariantsQuery.data
    ? resolveOptionsMode({
        isCustomQty: liveVariantsQuery.data.isCustomQty,
        isVariableWeight: liveVariantsQuery.data.isVariableWeight,
        pricingMethod: liveVariantsQuery.data.pricingMethod,
      })
    : null;
  const defaultVariant = liveVariantsQuery.data?.defaultVariant;

  // "Similar products" - every other active product in this product's own
  // group (see `CustomerProductVariants.groupId`), via the same
  // per-group endpoint/hook Categories already uses. Filtered to exclude
  // this product itself and mapped through the same listing-card mapper
  // Categories/Search/Home all share.
  const groupId = liveVariantsQuery.data?.groupId ?? null;
  const similarProductsQuery = useCustomerProducts(groupId);
  const similarProducts = useMemo(() => {
    const results = similarProductsQuery.data?.results ?? [];
    return results
      .filter(card => String(card.productId) !== productId)
      .map(mapCustomerProductCardToProduct);
  }, [similarProductsQuery.data, productId]);

  // A VARIANT-based product can have MULTIPLE simultaneous cart lines
  // (e.g. both "500 g" and "1 kg" of the same product), so "the quantity
  // of this product" isn't one number the way it is for a custom-quantity
  // one - this screen's simple +/- stepper only ever quick-adds/adjusts
  // the DEFAULT variant's own line, so the line id it reads/writes has to
  // match that variant specifically, not just the bare product id.
  const cartLineId =
    liveOptionsMode === 'variants' && defaultVariant != null
      ? `${productId}:${defaultVariant.variantId}`
      : productId;

  const { itemCount } = useCartItems();
  const addVariantLine = useCartStore(state => state.addVariantLine);
  const setCustomQuantityLine = useCartStore(
    state => state.setCustomQuantityLine,
  );
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const quantity = useCartStore(
    state => state.items.find(i => i.id === cartLineId)?.quantity ?? 0,
  );
  const isWishlisted = useWishlistStore(state => state.isWishlisted(productId));
  const toggleWishlist = useWishlistStore(state => state.toggle);

  const handleShare = useCallback(() => {
    if (!product) return;
    Share.share({
      message: `Check out ${product.name} on FreshCart - ₹${product.price}/${product.unit}`,
    }).catch(() => {});
  }, [product]);

  // Quick-adds ONE unit of the default pick, branching the same way
  // `ProductCard`'s own options sheet routes a cart write: a real
  // pack-size variant is `addVariantLine` (its own line, keyed by
  // `cartLineId` above); a custom-quantity product is `setCustomQuantityLine`
  // (one line for the whole product). This is deliberately just the
  // DEFAULT pick, not the full options picker - a shopper who wants a
  // different pack size/quantity still gets that from the "Options"
  // button on the product's card in Categories/Search/Home, which already
  // has the complete live picker.
  const addDefaultToCart = useCallback(() => {
    if (!product || !defaultVariant) return;
    const shared = {
      productId,
      quantity: 1,
      name: product.name,
      imageUri: product.imageUri,
      price: product.price,
      originalPrice: product.mrp,
      unit: product.unit,
    };
    if (liveOptionsMode === 'quantity-choices') {
      // This quick-add button doesn't fetch the full quantity-choices
      // list (only the plain detail payload), so it can't know the
      // shopper's usual pick size the way ProductCard's options sheet
      // can - `apiBaseQty: 1` is a deliberate simplification meaning
      // "1 of this product's own root unit" (e.g. 1 kg), not a specific
      // choice. See `cartStore.ts`'s comment on `apiBaseQty` for why this
      // has to be a real root-unit amount, not a selection count.
      setCustomQuantityLine({
        ...shared,
        apiVariantId: defaultVariant.variantId,
        apiBaseQty: 1,
      });
    } else {
      addVariantLine({
        ...shared,
        variantId: String(defaultVariant.variantId),
        apiVariantId: defaultVariant.variantId,
      });
    }
  }, [
    product,
    defaultVariant,
    liveOptionsMode,
    productId,
    addVariantLine,
    setCustomQuantityLine,
  ]);

  const handleIncrement = useCallback(() => {
    if (quantity === 0) {
      addDefaultToCart();
    } else {
      updateQuantity(cartLineId, quantity + 1);
    }
  }, [quantity, cartLineId, addDefaultToCart, updateQuantity]);
  const handleDecrement = useCallback(() => {
    updateQuantity(cartLineId, quantity - 1);
  }, [quantity, cartLineId, updateQuantity]);

  // Mirrors ProductCard's own "don't double-count" rule (see its comment):
  // only actually adds when nothing's in the cart yet - the adjacent
  // stepper is what changes the quantity from there, so this button
  // re-adding on every tap would double it, same bug as before.
  const handleAddToCart = useCallback(() => {
    if (quantity === 0) addDefaultToCart();
  }, [quantity, addDefaultToCart]);

  const handleBuyNow = useCallback(() => {
    // No checkout flow exists yet - same "coming soon" pattern used across
    // the app (ProfileScreen, EditProfileScreen) for features not yet built.
    Alert.alert('Buy Now', "This isn't wired up yet - coming soon.");
  }, []);

  // Same add-to-cart routing `CategoriesScreen`/`SearchScreen`/`HomeScreen`
  // use for their own `ProductCard` grids - duplicated here (one function,
  // not worth a shared hook for yet) rather than imported, same kind of
  // cross-feature exception `ProductCard.tsx` itself already makes.
  const handleAddOptionsToCart = useCallback(
    (similarProduct: Product, variant: ProductVariant, pickedQuantity: number) => {
      const shared = {
        productId: similarProduct.id,
        quantity: pickedQuantity,
        name: similarProduct.name,
        imageUri: similarProduct.imageUri,
        price: variant.price,
        originalPrice: variant.mrp,
        unit: variant.label,
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

  const handleSimilarProductPress = useCallback(
    (similarProduct: Product) => {
      navigation.push('ProductDetails', { productId: similarProduct.id });
    },
    [navigation],
  );

  if (!validId) {
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

  if (liveVariantsQuery.isLoading) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <Loader fullscreen />
      </SafeAreaView>
    );
  }

  if (liveVariantsQuery.isError || !product) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <ErrorView
          title="Couldn't load this product"
          body="Check your connection and try again."
          onRetry={() => liveVariantsQuery.refetch()}
        />
      </SafeAreaView>
    );
  }

  const galleryImages = Array.from(
    { length: GALLERY_IMAGE_COUNT },
    () => product.imageUri,
  );
  const originalPrice = product.mrp ?? product.price;
  const savings = originalPrice - product.price;
  // A live product never sets `Product.discountPercent` directly (see
  // `mapCustomerProductCardToProduct`), so this is always derived from
  // the real prices above instead of ever showing "undefined%".
  const discountPercent =
    product.discountPercent ??
    (savings > 0 ? Math.round((savings / originalPrice) * 100) : 0);

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
          discountPercent={discountPercent}
          isWishlisted={isWishlisted}
          onToggleWishlist={() => toggleWishlist(productId)}
          onShare={handleShare}
        />

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={styles.titleTextWrap}>
              <Text style={styles.name}>{product.name}</Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <View style={styles.priceTextWrap}>
              <Text style={styles.price}>₹{product.price}</Text>
              {savings > 0 && (
                <Text style={styles.originalPrice}>₹{originalPrice}</Text>
              )}
            </View>
            {/* Same options button + variant-picker sheet ProductCard uses
                everywhere else in the app (Home/Categories/Search) -
                see ProductOptionsSheet.tsx's own comment. */}
            <ProductOptionsSheet product={product} onAddToCart={handleAddOptionsToCart} />
          </View>

          {savings > 0 && (
            <Text style={styles.savingsText}>
              You save ₹{savings} ({discountPercent}%)
            </Text>
          )}

          <ProductTrustBadges />
        </View>

        {similarProducts.length > 0 && (
          <ProductSection
            title="Similar Products"
            products={similarProducts}
            onAddToCart={handleAddOptionsToCart}
            onProductPress={handleSimilarProductPress}
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
  });
}
