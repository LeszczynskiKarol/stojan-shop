// frontend/src/store/cartStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Cart } from "@/types/cart.types";

export interface CartStore {
  cart: Cart;
  isDropdownOpen: boolean;
  setDropdownOpen: (isOpen: boolean) => void;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  calculateTotals: () => void;
  handleOrderCancellation: (orderId: string) => Promise<void>;
  setOrderId: (orderId: string) => void;
  paymentMethod: "prepaid" | "cod";
  setPaymentMethod: (method: "prepaid" | "cod") => void;
  calculateShippingCost: () => Promise<void>;
}

const initialCart: Cart = {
  items: [],
  subtotal: 0,
  shipping: 0,
  total: 0,
  orderId: null,
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: initialCart,
      isDropdownOpen: false,

      setDropdownOpen: (isOpen: boolean) => {
        set({ isDropdownOpen: isOpen });
      },

      setOrderId: (orderId: string) => {
        const { cart } = get();
        set({ cart: { ...cart, orderId } });
      },

      clearCart: () => {
        set({ cart: initialCart, isDropdownOpen: false });
      },

      handleOrderCancellation: async (orderId: string) => {
        const { cart } = get();
        if (cart.orderId === orderId) {
          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}`
            );
            const order = await response.json();

            if (order.data.status === "paid") {
              set({ cart: initialCart, isDropdownOpen: false });
            }
          } catch (error) {
            console.error(
              "Błąd podczas sprawdzania statusu zamówienia:",
              error
            );
          }
        }
      },

      addItem: (item: CartItem) => {
        if (!item.productId || !item.name || typeof item.price !== "number") {
          console.error("Nieprawidłowe dane produktu:", item);
          return;
        }

        if (!item.mainImage && !item.image) {
          console.warn("Brak zdjęcia dla produktu:", {
            productId: item.productId,
            mainImage: item.mainImage,
            image: item.image,
          });
        }

        const { cart } = get();
        const existingItem = cart.items.find(
          (i) => i.productId === item.productId
        );

        if (existingItem) {
          const updatedItems = cart.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          );
          set({ cart: { ...cart, items: updatedItems } });
        } else {
          set({ cart: { ...cart, items: [...cart.items, item] } });
        }
        get().calculateTotals();

        // Otwórz dropdown po dodaniu produktu
        set({ isDropdownOpen: true });
      },

      removeItem: (productId) => {
        const { cart } = get();

        const newCart = {
          ...cart,
          items: cart.items.filter((item) => item.productId !== productId),
        };

        // Jeśli koszyk jest pusty, zamknij dropdown
        if (newCart.items.length === 0) {
          set({ isDropdownOpen: false });
        }

        localStorage.setItem(
          "cart-storage",
          JSON.stringify({ state: { cart: newCart } })
        );

        set({ cart: newCart });
        get().calculateTotals();
      },

      updateQuantity: (productId, quantity) => {
        const { cart } = get();
        const item = cart.items.find((i) => i.productId === productId);

        if (!item) return;

        // Sprawdź dostępność w magazynie
        const stock = item.stock || 0;
        const validQuantity = Math.max(1, Math.min(quantity, stock));

        const updatedItems = cart.items.map((item) =>
          item.productId === productId
            ? { ...item, quantity: validQuantity }
            : item
        );

        set({ cart: { ...cart, items: updatedItems } });
        get().calculateTotals();
      },

      calculateTotals: () => {
        const { cart } = get();
        const subtotal = cart.items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
        set({
          cart: {
            ...cart,
            subtotal,
            total: subtotal,
          },
        });
      },

      paymentMethod: "prepaid",

      setPaymentMethod: (method) => {
        set((state) => ({ ...state, paymentMethod: method }));
        get().calculateShippingCost();
      },

      calculateShippingCost: async () => {
        const { cart, paymentMethod } = get();
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/shipping/calculate`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                items: cart.items,
                paymentMethod,
              }),
            }
          );

          if (!response.ok)
            throw new Error("Błąd podczas obliczania kosztu wysyłki");

          const { shippingCost } = await response.json();
          set((state) => ({
            cart: {
              ...state.cart,
              shipping: shippingCost,
              total: state.cart.subtotal + shippingCost,
            },
          }));
        } catch (error) {
          console.error("Błąd podczas obliczania kosztu wysyłki:", error);
        }
      },
    }),
    {
      name: "cart-storage",
      version: 2,
      storage: {
        getItem: (name) => {
          const value = localStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
      migrate: async (persistedState: unknown, version: number) => {
        if (version !== 2) {
          return {
            cart: initialCart,
            isDropdownOpen: false,
            paymentMethod: "prepaid",
          } as CartStore;
        }
        return persistedState as CartStore;
      },
    }
  )
);
