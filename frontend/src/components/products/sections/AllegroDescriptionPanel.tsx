// frontend/src/components/products/sections/AllegroDescriptionPanel.tsx
import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { IProduct } from '@/types/product.types';
import { Textarea } from '@/components/ui/Textarea';

interface AllegroDescriptionPanelProps {
  product: IProduct;
}

export const AllegroDescriptionPanel: React.FC<AllegroDescriptionPanelProps> = ({ product }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [description, setDescription] = useState(
    product.marketplaces?.allegro?.description?.sections?.[0]?.items?.[0]?.content || ''
  );
  const { toast } = useToast();

  const handleDescriptionUpdate = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/allegro/offers/${product._id}/description`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: {
            sections: [
              {
                items: [
                  {
                    type: 'TEXT',
                    content: description,
                  },
                ],
              },
            ],
          },
        }),
      });

      if (!response.ok) throw new Error('Błąd aktualizacji opisu');

      toast({
        title: 'Sukces',
        description: 'Opis został zaktualizowany',
      });
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się zaktualizować opisu',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Function to convert HTML to plain text for preview
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Opis produktu</h3>

      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <label>HTML Opisu</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[200px] font-mono"
            placeholder="Wprowadź opis HTML..."
          />
        </div>

        {description && (
          <div className="border rounded p-4 bg-gray-900">
            <h4 className="font-semibold mb-2">Podgląd:</h4>
            <div dangerouslySetInnerHTML={{ __html: description }} />
          </div>
        )}

        <Button onClick={handleDescriptionUpdate} disabled={isUpdating} className="w-full">
          {isUpdating ? 'Aktualizowanie...' : 'Aktualizuj opis'}
        </Button>
      </div>
    </Card>
  );
};
