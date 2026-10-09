import React from 'react';
import { type Product, type ProductVariant } from '@/components';
import { HomeSectionError } from './HomeSectionError';
import { ProductSection } from './ProductSection';
import { ProductSectionSkeleton } from './ProductCardSkeleton';
import { useOfferProducts } from '../hooks/useHomeContent';
import type { ActiveOffer } from '../types/home.types';

interface OfferSectionsProps {
  offers: ActiveOffer[] | undefined;
  onAddToCart?: (
    product: Product,
    variant: ProductVariant,
    quantity: number,
  ) => void;
  onProductPress?: (product: Product) => void;
}

/**
 * One product section per active offer, in the server's offer order. Each
 * section loads its own products, so a slow or failed offer never holds
 * up the rest. No offers renders nothing.
 */
export function OfferSections({
  offers,
  onAddToCart,
  onProductPress,
}: OfferSectionsProps) {
  if (!offers || offers.length === 0) return null;
  return (
    <>
      {offers.map(offer => (
        <OfferProductsSection
          key={offer.offer_id}
          offer={offer}
          onAddToCart={onAddToCart}
          onProductPress={onProductPress}
        />
      ))}
    </>
  );
}

function OfferProductsSection({
  offer,
  onAddToCart,
  onProductPress,
}: Omit<OfferSectionsProps, 'offers'> & { offer: ActiveOffer }) {
  const { data, isLoading, isError, refetch } = useOfferProducts(
    offer.offer_id,
  );

  if (data && data.length > 0) {
    return (
      <ProductSection
        title={offer.title}
        products={data}
        onAddToCart={onAddToCart}
        onProductPress={onProductPress}
      />
    );
  }
  if (isLoading) return <ProductSectionSkeleton />;
  if (isError) {
    return <HomeSectionError title={offer.title} onRetry={() => refetch()} />;
  }
  // The offer exists but currently applies to no listed products.
  return null;
}
