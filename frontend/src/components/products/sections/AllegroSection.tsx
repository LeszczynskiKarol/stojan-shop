// frontend/src/components/products/sections/AllegroSection.tsx
import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAllegroAuthStore } from '@/store/allegroAuthStore';
import { ProductBasicInfoPanel } from './ProductBasicInfoPanel';
import { AllegroPublishPanel } from './AllegroPublishPanel';
import { AllegroPricePanel } from './AllegroPricePanel';
import { AllegroStockPanel } from './AllegroStockPanel';
import { AllegroImagesPanel } from './AllegroImagesPanel';
import { AllegroParametersPanel } from './AllegroParametersPanel';
import { AllegroDescriptionPanel } from './AllegroDescriptionPanel';
import { IProduct } from '@/types/product.types';

interface AllegroSectionProps {
  product: IProduct;
}

export const AllegroSection: React.FC<AllegroSectionProps> = ({ product }) => {
  const { isAuthenticated } = useAllegroAuthStore();
  const allegroData = product.marketplaces?.allegro;

  if (!isAuthenticated) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Wymagana autoryzacja Allegro</h3>
          <p className="mt-2 text-muted-foreground">
            Aby zarządzać ofertami na Allegro, musisz najpierw się zalogować.
          </p>
          <Button onClick={() => (window.location.href = '/api/allegro/auth')} className="mt-4">
            Zaloguj się do Allegro
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      <Card className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Status na Allegro</h3>
            <Badge variant={allegroData?.active ? 'success' : 'secondary'}>
              {allegroData?.active ? 'Aktywne' : 'Nieaktywne'}
            </Badge>
          </div>
          <AllegroPublishPanel product={product} />
        </div>
      </Card>
      <ProductBasicInfoPanel product={product} />
      <div className="grid md:grid-cols-2 gap-4">
        <AllegroPricePanel product={product} />
        <AllegroStockPanel product={product} />
      </div>

      <AllegroParametersPanel product={product} />
      <AllegroDescriptionPanel product={product} />
      <AllegroImagesPanel product={product} />
    </div>
  );
};
