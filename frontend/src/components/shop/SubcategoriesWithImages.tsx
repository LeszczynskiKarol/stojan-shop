// frontend/src/components/shop/SubcategoriesWithImages.tsx
import Image from "next/image";
import Link from "next/link";
import { ICategory } from "@/types/category.types";

interface SubcategoriesWithImagesProps {
  subcategories: ICategory[];
  parentSlug: string;
}

export function SubcategoriesWithImages({
  subcategories,
  parentSlug,
}: SubcategoriesWithImagesProps) {
  if (!subcategories || subcategories.length === 0) return null;

  return (
    <div className="mb-10">
      <h2 className="text-3xl font-bold mb-8 text-center">Wybierz kategorię</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {subcategories.map((subcategory) => (
          <Link
            key={subcategory.id}
            href={`/${parentSlug}/${subcategory.slug}`}
            className="group text-center"
          >
            <div className="relative aspect-square mb-4 overflow-hidden rounded-xl bg-gray-100 border-2 border-transparent group-hover:border-primary transition-all duration-300">
              {subcategory.image ? (
                <Image
                  src={subcategory.image}
                  alt={subcategory.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <svg
                    className="w-16 h-16 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
              {subcategory.name}
            </h3>
            {subcategory.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {subcategory.description}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
