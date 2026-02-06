// frontend/src/components/products/sections/OwnStoreStatusPanel.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { IProduct } from '@/types/product.types';
import { useProductStore } from '@/store/productStore';

interface OwnStoreStatusPanelProps {
  product: IProduct;
}

export const OwnStoreStatusPanel = ({ product }: OwnStoreStatusPanelProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { updateProduct } = useProductStore();
  const { toast } = useToast();

  const toggleStatus = async () => {
    setIsUpdating(true);
    try {
      await updateProduct(product._id!, {
        marketplaces: {
          ...product.marketplaces,
          ownStore: {
            ...product.marketplaces.ownStore,
            active: !product.marketplaces.ownStore?.active,
          },
        },
      });

      toast({
        title: 'Sukces',
        description: `Produkt został ${
          product.marketplaces.ownStore?.active ? 'deaktywowany' : 'aktywowany'
        } w sklepie`,
      });
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się zmienić statusu produktu',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };
};
