// frontend/src/components/shop/SimilarProducts.tsx
'use client';

import { useState, useEffect } from 'react';
import { IProduct } from '@/types/product.types';
import { ProductCard } from './ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/Button';

interface SimilarProductsProps {
  productId: string;
}

export const SimilarProducts = ({ productId }: SimilarProductsProps) => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 4;

  const fetchSimilarProducts = async (pageNum: number = 0) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/${productId}/similar?page=${pageNum}&limit=${ITEMS_PER_PAGE}`
      );
      const data = await response.json();

      if (data.success) {
        if (pageNum === 0) {
          setProducts(data.data.products);
        } else {
          setProducts((prev) => [...prev, ...data.data.products]);
        }
        setHasMore(data.data.products.length === ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error('Błąd podczas pobierania podobnych produktów:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSimilarProducts();
  }, [productId]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchSimilarProducts(nextPage);
  };

  if (loading) {
    return (
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-8">Podobne produkty</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold mb-8">Podobne produkty</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {hasMore && (
        <div className="mt-8 text-center">
          <Button onClick={handleLoadMore} variant="outline" className="min-w-[200px]">
            Pokaż więcej podobnych
          </Button>
        </div>
      )}
    </section>
  );
};
