// frontend/src/types/order.types.ts
import { CartItem } from "@/types/cart.types";

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
  differentInvoiceAddress?: boolean; // TO BRAKUJE
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
  shippingDate?: Date;
  items: CartItem[];
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  shipping: ShippingAddress;
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentIntentId?: string;
  paymentMethod: "prepaid" | "cod";
  totalWeight: number;
  createdAt: Date;
  updatedAt: Date;
  invoiceUrls?: string[];
  invoiceData?: {
    companyName?: string;
    nip?: string;
    street?: string;
    postalCode?: string;
    city?: string;
    isDifferentAddress: boolean;
  };
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
