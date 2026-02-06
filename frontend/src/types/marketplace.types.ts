// frontend/src/types/marketplace.types.ts
export type MarketplaceType = 'allegro' | 'olx' | 'ownStore';

export interface MarketplaceStatus {
  active: boolean;
  productId?: string;
  price?: number;
  url?: string;
}

export interface MarketplaceData {
  allegro?: MarketplaceStatus;
  olx?: MarketplaceStatus;
  ownStore?: MarketplaceStatus;
}
