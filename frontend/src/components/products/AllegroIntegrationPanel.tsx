// frontend/src/components/products/AllegroIntegrationPanel.tsx
import React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/use-toast';

interface AllegroIntegrationPanelProps {
  productId: string;
  onSuccess: () => void;
}

export const AllegroIntegrationPanel: React.FC<AllegroIntegrationPanelProps> = ({
  productId,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [price, setPrice] = React.useState('');

  const handleCreateOffer = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/allegro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price: Number(price) }),
      });

      if (!response.ok) throw new Error('Błąd podczas tworzenia oferty');

      toast({
        title: 'Sukces',
        description: 'Utworzono szkic oferty na Allegro',
      });
      onSuccess();
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się utworzyć oferty na Allegro',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Cena na Allegro</label>
        <Input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Wprowadź cenę"
        />
      </div>
      <Button onClick={handleCreateOffer}>Utwórz ofertę na Allegro</Button>
    </div>
  );
};
