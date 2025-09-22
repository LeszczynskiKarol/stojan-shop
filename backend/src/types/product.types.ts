// backend/src/types/product.types.ts
export interface IProduct {
  id?: string;
  _id?: string;
  name: string;
  manufacturer: string;
  weight: number;
  dataSheets?: string[];
  technicalDetails?: string;
  customParameters?: {
    name: string;
    value: string;
  }[];
  parameters?: {
    power?: {
      id: string; // ID parametru (np. "11726" dla mocy)
      name: string; // Nazwa parametru (np. "Moc znamionowa")
      value: string; // Wartość (np. "50")
      unit: string; // Jednostka (np. "W")
    }[];
    manufacturer?: {
      id: string; // "225692"
      name: string; // "Producent"
      value: string; // np. "Engel"
    };
    model?: {
      id: string; // "225693"
      name: string; // "Model"
      value: string; // np. "D 4535/2 B"
    };
    engineType?: {
      id: string; // "225694"
      name: string; // "Rodzaj silnika"
      value: string; // np. "walcowy"
    };
  };
  categories?: {
    id: string;
    name: string;
    slug: string;
  }[];
  power: {
    value: string;
    range: string;
    unit: 'W' | 'kW';
  };
  rpm: {
    value: string;
    range: string;
    unit: 'obr/min';
  };
  startType?:
    | 'bezpośredni - 220/380V'
    | 'bezpośredni - 230/400V'
    | 'gwiazda-trójkąt - 380/660V'
    | 'gwiazda-trójkąt - 400/690V'
    | 'gwiazda-trójkąt - 380V△'
    | 'gwiazda-trójkąt - 400V△'
    | null;
  shaftDiameter: number;
  sleeveDiameter?: number;
  flangeSize?: number;
  flangeBoltCircle?: number;
  condition: 'nowy' | 'uzywany' | 'nieuzywany';
  mechanicalSize: number;
  description?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  marketplaces: {
    allegro?: {
      active: boolean;
      productId?: string;
      price?: number;
      url?: string;
      stats?: {
        watchersCount: number;
        visitsCount: number;
      };
      publication?: {
        startedAt: string;
        status: string;
      };
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
      parameters?: Array<{
        id: string;
        name: string;
        values: string[];
        valuesIds?: string[];
        unit?: string;
      }>;
    };
    olx?: {
      active: boolean;
      productId?: string;
      price?: number;
      url?: string;
    };
    ownStore?: {
      active: boolean;
      price?: number;
      url?: string;
      slug?: string;
      category_path?: string;
      wooCommerceUrl?: string;
      urlVerified?: boolean;
    };
  };
  stock: number;
  images: string[];
  mainImage?: string;
  galleryImages?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  matched_store_product?: {
    store_product_id: string;
    store_product_name: string;
    matched_at: Date;
  } | null;
  legSpacing?: string;
  hasBreak: boolean | 'on';
  hasForeignCooling: boolean | 'on';
  hasEx: boolean | 'on';
}

export interface IAllegroMarketplace {
  active: boolean;
  productId?: string;
  price?: number;
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
  parameters?: Array<{
    id: string;
    values: string[];
  }>;
}

export interface IOlxMarketplace {
  active: boolean;
  productId?: string;
  price?: number;
  url?: string;
}

export interface IMarketplaces {
  allegro?: IAllegroMarketplace;
  olx?: IOlxMarketplace;
  ownStore?: {
    active: boolean;
    price?: number;
    url?: string;
    category_path?: string;
    seo?: {
      title?: string;
      description?: string;
      keywords?: string[];
    };
  };
}

export interface ProductWithId extends IProduct {
  _id: string;
}
