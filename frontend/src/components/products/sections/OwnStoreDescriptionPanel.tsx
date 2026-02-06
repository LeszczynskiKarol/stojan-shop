// frontend/src/components/products/sections/OwnStoreDescriptionPanel.tsx
import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { IProduct } from '@/types/product.types';
import { useProductStore } from '@/store/productStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

interface OwnStoreDescriptionPanelProps {
  product: IProduct;
}

export const OwnStoreDescriptionPanel = ({ product }: OwnStoreDescriptionPanelProps) => {
  const [description, setDescription] = useState(product.description || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const { updateProduct } = useProductStore();
  const { toast } = useToast();

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateProduct(product._id!, {
        description,
      });

      toast({
        title: 'Sukces',
        description: 'Opis produktu został zaktualizowany',
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

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Opis produktu</h3>
      <Tabs defaultValue="edit">
        <TabsList className="mb-4">
          <TabsTrigger value="edit">Edycja</TabsTrigger>
          <TabsTrigger value="preview">Podgląd</TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={10}
            placeholder="Wprowadź opis produktu..."
            className="mb-4"
          />
          <Button onClick={handleUpdate} disabled={isUpdating} className="w-full">
            {isUpdating ? 'Aktualizowanie...' : 'Zapisz opis'}
          </Button>
        </TabsContent>

        <TabsContent value="preview">
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
};
