// frontend/src/components/products/sections/AllegroPublishPanel.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { IProduct } from '@/types/product.types';

interface AllegroPublishPanelProps {
  product: IProduct;
}

export const AllegroPublishPanel: React.FC<AllegroPublishPanelProps> = ({ product }) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();
  const allegroData = product.marketplaces?.allegro;

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const response = await fetch(`/api/allegro/offers/${product._id}/publish`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Błąd publikacji');

      toast({
        title: 'Sukces',
        description: 'Oferta została opublikowana na Allegro',
      });
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się opublikować oferty',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Button onClick={handlePublish} disabled={isPublishing || allegroData?.active}>
      {isPublishing ? 'Publikowanie...' : 'Opublikuj na Allegro'}
    </Button>
  );
};
