import React from 'react';

import type { Product, ProductVariant } from '@/components';
import { HomeSectionError } from './HomeSectionError';
import { ProductSection } from './ProductSection';
import { ProductSectionSkeleton } from './ProductCardSkeleton';
import { useCampaignPreview } from '../hooks/useHomeContent';
import type { HomeCampaign } from '../types/home.types';

interface CampaignSectionsProps {
  campaigns: HomeCampaign[] | undefined;
  onSeeAll: (campaign: HomeCampaign) => void;
  onAddToCart?: (
    product: Product,
    variant: ProductVariant,
    quantity: number,
  ) => void;
  onProductPress?: (product: Product) => void;
}

/**
 * One product section per live campaign, in the server's order. Each
 * section loads its own first 10 products, so one slow or failed campaign
 * never holds up the rest. No campaigns renders nothing.
 */
export function CampaignSections({
  campaigns,
  onSeeAll,
  onAddToCart,
  onProductPress,
}: CampaignSectionsProps) {
  if (!campaigns || campaigns.length === 0) return null;
  return (
    <>
      {campaigns.map(campaign => (
        <CampaignSection
          key={campaign.id}
          campaign={campaign}
          onSeeAll={onSeeAll}
          onAddToCart={onAddToCart}
          onProductPress={onProductPress}
        />
      ))}
    </>
  );
}

function CampaignSection({
  campaign,
  onSeeAll,
  onAddToCart,
  onProductPress,
}: Omit<CampaignSectionsProps, 'campaigns'> & { campaign: HomeCampaign }) {
  const { data, isLoading, isError, refetch } = useCampaignPreview(campaign.id);
  console.log("🚀 ~ CampaignSection ~ data:", data)

  // Data first, so a failed background refetch never hides content that is
  // already on screen.
  if (data && data.length > 0) {
    return (
      <ProductSection
        title={campaign.campaign_name}
        subtitle={campaign.subtitle}
        products={data}
        onViewAll={() => onSeeAll(campaign)}
        onAddToCart={onAddToCart}
        onProductPress={onProductPress}
      />
    );
  }
  if (isLoading) return <ProductSectionSkeleton />;
  if (isError) {
    return (
      <HomeSectionError
        title={campaign.campaign_name}
        onRetry={() => refetch()}
      />
    );
  }
  // A live campaign whose variants are all unavailable shows nothing.
  return null;
}
