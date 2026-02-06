// frontend/src/components/products/ProductList.tsx
'use client';

import { useEffect } from 'react';
import { useProductStore } from '@/store/productStore';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/lib/utils';

export function ProductList() {
  const { products, loading, error, fetchProducts } = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  if (loading) return <div>Ładowanie...</div>;
  if (error) return <div>Błąd: {error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <Card key={product._id} className="overflow-hidden">
          <div className="aspect-square relative">
            {product.images[0] ? (
              <img
                src={product.images[0]}
                alt={product.manufacturer}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                Brak zdjęcia
              </div>
            )}
          </div>

          <div className="p-4">
            <h3 className="font-semibold mb-2">{product.manufacturer}</h3>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Moc:</span>
                <span>{product.power.value} kW</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Obroty:</span>
                <span>{product.rpm.value} obr/min</span>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <Badge variant={product.condition === 'nowy' ? 'success' : 'secondary'}>
                  {product.condition}
                </Badge>
                <span className="font-bold">
                  {formatPrice(product.marketplaces?.ownStore?.price || 0)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
