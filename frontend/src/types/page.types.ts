// frontend/types/page.types.ts
export interface IBasePage {
  id: string;
  title: string;
  slug: string;
  type: 'category' | 'manufacturer' | 'power'; // Dodajemy type do IBasePage
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  content: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  categoryId?: string;
  manufacturerName?: string;
  powerValue?: number;
  filters?: Record<string, any>;
}

// Te interfejsy będą teraz bardziej szczegółowe
export interface ICategoryPage extends IBasePage {
  type: 'category';
  categoryId: string;
}

export interface IManufacturerPage extends IBasePage {
  type: 'manufacturer';
  manufacturerName: string;
}

export interface IPowerPage extends IBasePage {
  type: 'power';
  powerValue: number;
}
