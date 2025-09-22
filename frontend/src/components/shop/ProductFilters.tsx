// frontend/components/shop/ProductFilters.tsx
'use client';

export const ProductFilters = ({
  type,
  filters,
}: {
  type: string;
  filters?: Record<string, any>;
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Filtrowanie</h3>
      {/* Tu implementacja filtrów */}
    </div>
  );
};
