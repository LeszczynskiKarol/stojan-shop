// backend/src/entities/AllegroTypes.ts
export interface AllegroTokenData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface AllegroParameter {
  id: string;
  name: string;
  values: string[];
  valuesIds?: string[];
  unit?: string;
  rangeValue?: null;
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
    sold?: number;
    unit?: string;
  };
  publication?: {
    status: string;
  };
  description?:
    | {
        sections: Array<{
          items: Array<{
            content: string;
            type?: string;
          }>;
        }>;
      }
    | string;
  parameters?: AllegroParameter[];
  images?: string[] | Array<{ url: string }>; // Może być tablica stringów lub obiektów z url
  productSet?: Array<{
    product?: {
      name?: string;
      images?: string[] | Array<{ url: string }>;
      parameters?: AllegroParameter[];
    };
  }>;
  delivery?: {
    handlingTime: string;
    shippingRates: {
      id: string;
    };
  };
  location?: {
    city: string;
    postCode: string;
    countryCode: string;
    province: string;
  };
}

export interface AllegroOffersResponse {
  offers: AllegroOffer[];
  totalCount: number;
}
