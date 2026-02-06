// frontend/src/types/allegro.types.ts

export interface AllegroParameter {
  id: string;
  name: string;
  values: string[];
  valuesIds?: string[];
  unit?: string;
  rangeValue?: null;
}

export interface IAllegroMarketplace {
  active: boolean;
  productId?: string;
  price?: number;
  stats?: {
    watchersCount: number;
    visitsCount: number;
  };
  publication?: {
    startedAt: string;
    status: string;
  };
  url?: string;
  ean?: string;
  description?: {
    sections?: Array<{
      items?: Array<{
        content?: string;
        type?: string;
      }>;
    }>;
  };
  images?: string[];
  stock?: number;
  soldCount?: number;
  wielkoscMechaniczna?: string;
  waga?: string;
  srednicaWalu?: string;
  shippingRateId?: string;
  napiecie?: string;
  category?: {
    id: string;
  };
  shippingRates?: {
    id: string;
  };
  guaranteeId?: string;
  allegroCategory?: string;
  parameters?: AllegroParameter[];
}

export interface ImageUploadProps {
  onUpload: (files: FileList) => Promise<void>;
  disabled?: boolean;
  maxFiles?: number;
  accept?: string;
}

export interface AllegroOffer {
  id: string;
  name: string;
  category: {
    id: string;
  };
  primaryImage?: {
    url: string;
  };
  sellingMode: {
    format: string;
    price: {
      amount: string;
      currency: string;
    };
  };
  stock: {
    available: number;
    sold: number;
  };
  publication: {
    status: string;
  };
  description?:
    | string
    | {
        sections: Array<{
          items: Array<{
            content: string;
          }>;
        }>;
      };
  parameters?: AllegroParameter[];
  images?: Array<{ url: string }>;
  productSet?: any;
  processedParameters?: {
    power: string;
    voltage: string;
    rpm: string;
  };
}
