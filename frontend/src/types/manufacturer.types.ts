// frontend/src/types/manufacturer.types.ts
export interface IManufacturer {
  id: string;
  name: string;
  slug: string;
  description?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}
