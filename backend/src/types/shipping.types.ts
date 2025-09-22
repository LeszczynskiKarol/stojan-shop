// backend/src/types/shipping.types.ts
export interface ShippingRate {
  minWeight: number;
  maxWeight: number;
  prepaidCost: number;
  codCost: number | null;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  maxWeight: number;
  estimatedDays: string;
  rates: ShippingRate[];
}
