// frontend/src/app/(admin)/admin/marketplaces/allegro/[productId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProductDetailsCard } from '@/components/products/ProductDetailsCard';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { ProductWithId } from '@/types/product.types';
import { useAllegroAuthStore } from '@/store/allegroAuthStore';

const ProductDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [product, setProduct] = useState<ProductWithId | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, checkAuthStatus } = useAllegroAuthStore();

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const authStatus = await checkAuthStatus();

      if (!authStatus) {
        setLoading(false);
        router.push('/marketplaces/allegro'); // Przenosimy przekierowanie tutaj
        return;
      }

      try {
        const response = await fetch(`/api/allegro/offers/${params.productId}`);
        if (!response.ok) throw new Error('Nie udało się pobrać produktu');
        const data = await response.json();
        setProduct(data.data);
      } catch (error) {
        toast({
          title: 'Błąd',
          description: 'Nie udało się pobrać szczegółów produktu',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [params.productId, router, checkAuthStatus, toast]);

  if (loading) return <div className="p-6">Ładowanie...</div>;
  if (!product) return null;

  return (
    <div className="container mx-auto py-6">
      <Button onClick={() => router.back()} variant="ghost" className="mb-6">
        ← Powrót
      </Button>
      <ProductDetailsCard product={product} />
    </div>
  );
};

export default ProductDetailsPage;
