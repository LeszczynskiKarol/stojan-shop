// frontend/src/components/products/sections/AllegroStockPanel.tsx
import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { IProduct } from '@/types/product.types';

interface AllegroStockPanelProps {
  product: IProduct;
}

export const AllegroStockPanel: React.FC<AllegroStockPanelProps> = ({ product }) => {
  const [stock, setStock] = useState<number>(
    product.marketplaces?.allegro?.stock || product.stock || 0
  );

  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleStockUpdate = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/allegro/offers/${product._id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: Number(stock) }),
      });

      if (!response.ok) throw new Error('Błąd aktualizacji stanu magazynowego');

      toast({
        title: 'Sukces',
        description: 'Stan magazynowy został zaktualizowany',
      });
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się zaktualizować stanu magazynowego',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStock(Number(e.target.value) || 0);
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Stan magazynowy</h3>
      <div className="flex gap-2">
        <Input type="number" value={stock} onChange={handleInputChange} placeholder="Ilość sztuk" />

        <Button onClick={handleStockUpdate} disabled={isUpdating}>
          Aktualizuj
        </Button>
      </div>
    </Card>
  );
};
