// frontend/src/types/category.types.ts
export interface ICategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  order: number;
  children?: ICategory[];
  parent?: ICategory;
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  productFilters?: {
    powerRange?: {
      min: string;
      max: string;
    };
    specificCategories?: string[];
    manufacturers?: string[];
  };
}
