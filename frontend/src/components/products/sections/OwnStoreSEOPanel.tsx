// frontend/src/components/products/sections/OwnStoreSEOPanel.tsx
import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { IProduct } from '@/types/product.types';
import { useProductStore } from '@/store/productStore';

interface OwnStoreSEOPanelProps {
  product: IProduct;
}

export const OwnStoreSEOPanel = ({ product }: OwnStoreSEOPanelProps) => {
  const [seoData, setSeoData] = useState({
    title: product.seo?.title || '',
    description: product.seo?.description || '',
    keywords: product.seo?.keywords?.join(', ') || '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const { updateProduct } = useProductStore();
  const { toast } = useToast();

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateProduct(product._id!, {
        seo: {
          ...seoData,
          keywords: seoData.keywords
            .split(',')
            .map((k) => k.trim())
            .filter((k) => k),
        },
      });

      toast({
        title: 'Sukces',
        description: 'Dane SEO zostały zaktualizowane',
      });
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się zaktualizować danych SEO',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">SEO</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Meta Title</label>
          <Input
            value={seoData.title}
            onChange={(e) => setSeoData({ ...seoData, title: e.target.value })}
            maxLength={60}
          />
          <p className="text-xs text-gray-500 mt-1">{seoData.title.length}/60 znaków</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Meta Description</label>
          <Textarea
            value={seoData.description}
            onChange={(e) => setSeoData({ ...seoData, description: e.target.value })}
            maxLength={160}
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">{seoData.description.length}/160 znaków</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Keywords</label>
          <Input
            value={seoData.keywords}
            onChange={(e) => setSeoData({ ...seoData, keywords: e.target.value })}
            placeholder="Słowa kluczowe oddzielone przecinkami"
          />
        </div>

        <Button onClick={handleUpdate} disabled={isUpdating} className="w-full">
          {isUpdating ? 'Aktualizowanie...' : 'Zapisz dane SEO'}
        </Button>
      </div>
    </Card>
  );
};
