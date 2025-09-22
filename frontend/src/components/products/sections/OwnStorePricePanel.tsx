// frontend/src/components/products/sections/OwnStorePricePanel.tsx
import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { IProduct } from '@/types/product.types';
import { useProductStore } from '@/store/productStore';

interface OwnStorePricePanelProps {
  product: IProduct;
}

export const OwnStorePricePanel: React.FC<OwnStorePricePanelProps> = ({ product }) => {
  const [price, setPrice] = useState(product.marketplaces.ownStore?.price || 0);
  const [isUpdating, setIsUpdating] = useState(false);
  const { updateProduct } = useProductStore();
  const { toast } = useToast();

  const handlePriceUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateProduct(product._id!, {
        marketplaces: {
          ...product.marketplaces,
          ownStore: {
            active: true,
            ...product.marketplaces.ownStore,
            price: Number(price),
            slug: product.marketplaces.ownStore?.slug,
          },
        },
      });

      toast({
        title: 'Sukces',
        description: 'Cena została zaktualizowana',
      });
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się zaktualizować ceny',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Cena w sklepie</h3>
      <div className="flex gap-2">
        <Input
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          placeholder="Cena w PLN"
        />
        <Button onClick={handlePriceUpdate} disabled={isUpdating}>
          Aktualizuj
        </Button>
      </div>
    </Card>
  );
};
