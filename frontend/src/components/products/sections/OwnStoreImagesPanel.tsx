// frontend/src/components/products/sections/OwnStoreImagesPanel.tsx
import React from 'react';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { IProduct } from '@/types/product.types';
import { useProductStore } from '@/store/productStore';
import { X, Upload } from 'lucide-react';
import Image from 'next/image';

interface OwnStoreImagesPanelProps {
  product: IProduct;
}

export const OwnStoreImagesPanel = ({ product }: OwnStoreImagesPanelProps) => {
  const { updateProduct } = useProductStore();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [currentImages, setCurrentImages] = useState(product.images);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);

    const productId = product._id || product.id;
    if (!productId) {
      toast({
        title: 'Błąd',
        description: 'Nie można znaleźć ID produktu',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    Array.from(e.target.files).forEach((file) => {
      formData.append('images', file);
    });

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${baseUrl}/api/uploads/products`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Błąd przesyłania zdjęć');
      }

      const data = await response.json();
      if (data.success) {
        const updatedImages = [...product.images, ...data.data.urls];
        await updateProduct(productId, {
          name: product.name,
          manufacturer: product.manufacturer,
          images: updatedImages,
          condition: product.condition,
          power: product.power,
          rpm: product.rpm,
          shaftDiameter: product.shaftDiameter,
          mechanicalSize: product.mechanicalSize,
          weight: product.weight || 0,
          description: product.description || '',
          stock: product.stock || 0,
          categories: product.categories || [],
          marketplaces: product.marketplaces || {
            ownStore: {
              active: true,
              price: 0,
            },
          },
        });

        setCurrentImages(updatedImages);

        toast({
          title: 'Sukces',
          description: 'Zdjęcia zostały dodane',
        });
      } else {
        throw new Error(data.error || 'Błąd przesyłania zdjęć');
      }
    } catch (error: any) {
      console.error('Błąd:', error);
      toast({
        title: 'Błąd',
        description: error.message || 'Nie udało się przesłać zdjęć',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImageDelete = async (index: number) => {
    const productId = product._id || product.id;
    if (!productId) {
      toast({
        title: 'Błąd',
        description: 'Nie można znaleźć ID produktu',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newImages = product.images.filter((_, i) => i !== index);
      await updateProduct(productId, {
        name: product.name,
        manufacturer: product.manufacturer,
        images: newImages,
        condition: product.condition,
        power: product.power,
        rpm: product.rpm,
        shaftDiameter: product.shaftDiameter,
        mechanicalSize: product.mechanicalSize,
        weight: product.weight || 0,
        description: product.description || '',
        stock: product.stock || 0,
        categories: product.categories || [],
        marketplaces: product.marketplaces || {
          ownStore: {
            active: true,
            price: 0,
          },
        },
      });

      setCurrentImages(newImages);

      toast({
        title: 'Sukces',
        description: 'Zdjęcie zostało usunięte',
      });
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się usunąć zdjęcia',
        variant: 'destructive',
      });
    }
  };

  const getImageUrl = (url: string) => {
    return url;
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Zdjęcia produktu</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {currentImages.map((url, index) => (
          <div key={url} className="relative group">
            <Image
              src={getImageUrl(url)}
              alt={`Zdjęcie ${index + 1}`}
              width={200}
              height={200}
              className="w-full h-40 object-cover rounded-lg"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleImageDelete(index)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center w-full">
        <label className="w-full flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-2" />
            <p className="mb-2 text-sm">
              <span className="font-semibold">Kliknij aby dodać</span> lub przeciągnij i upuść
            </p>
            <p className="text-xs text-gray-500">PNG, JPG do 10MB</p>
          </div>
          <input
            type="file"
            className="hidden"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
          />
        </label>
      </div>
    </Card>
  );
};
