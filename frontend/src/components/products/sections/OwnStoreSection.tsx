// frontend/src/components/products/sections/OwnStoreSection.tsx
import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { IProduct } from '@/types/product.types';
import { OwnStorePricePanel } from './OwnStorePricePanel';
import { OwnStoreSEOPanel } from './OwnStoreSEOPanel';
import { OwnStoreDescriptionPanel } from './OwnStoreDescriptionPanel';
import { OwnStoreImagesPanel } from './OwnStoreImagesPanel';
import { ProductBasicInfoPanel } from './ProductBasicInfoPanel';
import { ProductCategoriesPanel } from './ProductCategoriesPanel';

interface OwnStoreSectionProps {
  product: IProduct;
}

export const OwnStoreSection = ({ product }: OwnStoreSectionProps) => {
  return (
    <div className="space-y-4">
      <ProductCategoriesPanel product={product} />
      <ProductBasicInfoPanel product={product} />
      <OwnStorePricePanel product={product} />
      <OwnStoreSEOPanel product={product} />
      <OwnStoreDescriptionPanel product={product} />
      <OwnStoreImagesPanel product={product} />
    </div>
  );
};
