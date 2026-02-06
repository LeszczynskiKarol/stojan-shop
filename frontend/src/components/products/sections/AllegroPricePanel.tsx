// frontend/src/components/products/sections/AllegroPricePanel.tsx
import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { IProduct } from '@/types/product.types';

interface AllegroPricePanelProps {
  product: IProduct;
}

export const AllegroPricePanel: React.FC<AllegroPricePanelProps> = ({ product }) => {
  const [price, setPrice] = useState<string>(
    (product.marketplaces?.allegro?.price || '').toString()
  );

  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handlePriceUpdate = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/allegro/offers/${product._id}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: Number(price) }),
      });

      if (!response.ok) throw new Error('Błąd aktualizacji ceny');

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
      <h3 className="font-semibold mb-4">Cena na Allegro</h3>
      <div className="flex gap-2">
        <Input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Cena w PLN"
        />
        <Button onClick={handlePriceUpdate} disabled={isUpdating}>
          Aktualizuj
        </Button>
      </div>
    </Card>
  );
};
