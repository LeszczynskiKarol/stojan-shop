// backend/src/types/cart.types.ts
export interface CartItem {
  productId: string;
  quantity: number;
  name: string;
  price: number;
  image?: string;
  weight: number;
  mainImage?: string;
  slug?: string;
  stock: number;
  categorySlug?: string;
  manufacturer: string;
  shaftDiameter: number;
  condition: string;
  mechanicalSize: number;
  categories: { id: string; slug: string }[];
  marketplaces: {
    ownStore: {
      active: boolean;
      price: number;
      slug?: string;
    };
  };
  images: string[];
  power?: { value: string };
  rpm?: { value: string };
  technicalDetails?: string;
  startType?: string;
  sleeveDiameter?: number;
  flangeSize?: number;
  customParameters?: Array<{ name: string; value: string }>;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  orderId?: string | null;
}
