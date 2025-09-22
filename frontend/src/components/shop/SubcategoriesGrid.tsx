// frontend/src/components/shop/SubcategoriesGrid.tsx
import Link from "next/link";
import { ICategory } from "@/types/category.types";
import { ChevronRight } from "lucide-react";

interface SubcategoriesGridProps {
  subcategories: ICategory[];
  parentSlug: string;
}

export function SubcategoriesGrid({
  subcategories,
  parentSlug,
}: SubcategoriesGridProps) {
  if (!subcategories || subcategories.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-6">Kategorie produktów</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {subcategories.map((subcategory) => (
          <Link
            key={subcategory.id}
            href={`/${parentSlug}/${subcategory.slug}`}
            className="group relative bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:border-primary/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                  {subcategory.name}
                </h3>
                {subcategory.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {subcategory.description}
                  </p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors ml-2" />
            </div>

            {/* Opcjonalnie: wyświetl liczbę produktów jeśli jest dostępna */}
            {subcategory.productCount !== undefined && (
              <div className="mt-3 text-xs text-gray-500">
                {subcategory.productCount}{" "}
                {subcategory.productCount === 1 ? "produkt" : "produktów"}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
