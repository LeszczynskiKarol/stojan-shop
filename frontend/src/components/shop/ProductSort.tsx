// frontend/components/shop/ProductSort.tsx
('use client');

export const ProductSort = () => {
  return (
    <select className="w-full p-2 border rounded">
      <option>Sortuj po...</option>
      <option value="price_asc">Cena: od najniższej</option>
      <option value="price_desc">Cena: od najwyższej</option>
      <option value="name_asc">Nazwa: A-Z</option>
      <option value="name_desc">Nazwa: Z-A</option>
    </select>
  );
};
