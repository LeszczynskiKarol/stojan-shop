// backend/src/types/order.types.ts
export interface ShippingAddress {
  // Dane podstawowe
  firstName?: string;
  lastName?: string;
  companyName?: string;
  nip?: string;
  email: string;
  phone: string;

  // Adres główny
  street: string;
  postalCode: string;
  city: string;
  country?: string;

  // Adres dostawy (jeśli inny)
  differentShippingAddress?: boolean;
  shippingStreet?: string;
  shippingPostalCode?: string;
  shippingCity?: string;

  // Adres do faktury (jeśli inny)
  differentInvoiceAddress?: boolean;
  invoiceStreet?: string;
  invoicePostalCode?: string;
  invoiceCity?: string;

  // Uwagi
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  items: any[];
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  shipping: ShippingAddress;
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentIntentId?: string;
  paymentMethod: 'prepaid' | 'cod';
  shippingDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  invoiceUrls?: string[];
  totalWeight: number;
  cancellationReason?: string;
  cancelledAt?: Date;
  cancelledBy?: string;
}

export interface ExtendedShippingAddress extends ShippingAddress {
  shippingCompanyName?: string;
  companyName?: string;
  nip?: string;
  invoiceStreet?: string;
  invoicePostalCode?: string;
  invoiceCity?: string;
  differentInvoiceAddress?: boolean;
}

export interface OrderData {
  items: any[];
  shipping: ShippingAddress;
  subtotal: number;
  shippingCost: number;
  total: number;
  returnUrl?: string;
  paymentMethod: 'prepaid' | 'cod';
  analyticsSessionId?: string;
}
