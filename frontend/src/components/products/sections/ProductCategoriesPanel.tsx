// frontend/src/components/products/sections/ProductCategoriesPanel.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { useProductStore } from '@/store/productStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useToast } from '@/components/ui/use-toast';
import { IProduct } from '@/types/product.types';
import Link from 'next/link';

interface ProductCategoriesPanelProps {
  product: IProduct;
}

export const ProductCategoriesPanel = ({ product }: ProductCategoriesPanelProps) => {
  const { categories, fetchCategories, loading } = useCategoryStore();
  const { updateProduct } = useProductStore();
  const { toast } = useToast();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    product.categories?.[0]?.id || ''
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCategoryChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = event.target.value;
    setSelectedCategoryId(categoryId);

    try {
      const selectedCategory = categories.find((cat) => cat.id === categoryId);
      if (!selectedCategory) return;

      await updateProduct(product.id || product._id!, {
        name: product.name,
        manufacturer: product.manufacturer,
        condition: product.condition,
        power: product.power,
        rpm: product.rpm,
        shaftDiameter: product.shaftDiameter,
        sleeveDiameter: product.sleeveDiameter,
        flangeSize: product.flangeSize,
        mechanicalSize: product.mechanicalSize,
        stock: product.stock,
        categories: [
          {
            id: selectedCategory.id,
            name: selectedCategory.name,
            slug: selectedCategory.slug,
          },
        ],
        marketplaces: {
          ...product.marketplaces,
          ownStore: {
            active: true,
            price: product.marketplaces.ownStore?.price,
            url: product.marketplaces.ownStore?.url,
            slug: `${selectedCategory.slug}/${product.name.toLowerCase().replace(/\s+/g, '-')}`,
          },
        },
      });

      toast({
        title: 'Sukces',
        description: 'Kategoria została zaktualizowana',
      });
    } catch (error) {
      console.error('Błąd aktualizacji kategorii:', error);
      toast({
        title: 'Błąd',
        description: 'Nie udało się zaktualizować kategorii',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Ładowanie kategorii...</div>;
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Kategorie</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-500 mb-2">Wybierz kategorię</label>
          <select
            value={selectedCategoryId}
            onChange={handleCategoryChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Wybierz kategorię</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {product.marketplaces?.ownStore?.slug && (
          <div className="mt-4">
            <p className="text-sm text-gray-500">URL produktu w sklepie:</p>
            <Link
              href={`/${product.marketplaces.ownStore.slug}`}
              className="text-primary hover:underline break-all"
            >
              {`${window.location.origin}/${product.marketplaces.ownStore.slug}`}
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
};
