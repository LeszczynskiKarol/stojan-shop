// src/app/(shop)/products/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { Filters } from '@/components/shop/Filters';
import { useShopStore } from '@/store/shopStore';

interface Filters {
  power: [number, number];
  condition: string;
  inStock: boolean;
}

export default function ProductsPage() {
  const { products, fetchProducts } = useShopStore();

  // Dodajemy stan dla filtrów
  const [filters, setFilters] = useState<Filters>({
    power: [0, 100],
    condition: '',
    inStock: false,
  });

  useEffect(() => {
    fetchProducts(filters);
  }, [filters, fetchProducts]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        <div className="w-64 flex-shrink-0">
          <Filters onFilterChange={setFilters} currentFilters={filters} />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-8">Wszystkie produkty</h1>
          <ProductGrid products={products} />
        </div>
      </div>
    </div>
  );
}
