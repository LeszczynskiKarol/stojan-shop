// frontend/src/components/shop/CartItemList.tsx
import React from "react";
import { motion } from "framer-motion";
import { Truck, Trash2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/cartStore";
import { CartItem } from "@/types/cart.types";
import Link from "next/link";

interface CartItemListProps {
  items: CartItem[];
  isCompact?: boolean;
  withLinks?: boolean;
}

export const CartItemList = ({
  items,
  isCompact = false,
}: CartItemListProps) => {
  const { removeItem, updateQuantity, paymentMethod } = useCartStore();
  const totalWeight = items.reduce(
    (sum, item) => sum + (item.weight || 0) * item.quantity,
    0
  );
  const isPaymentMethodAllowed =
    totalWeight <= 575 || paymentMethod === "prepaid";

  return (
    <div className="space-y-4">
      {!isCompact && !isPaymentMethodAllowed && (
        <div className="bg-amber-50 p-4 rounded-lg flex items-start gap-3">
          <Truck className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Ze względu na wagę zamówienia ({totalWeight.toFixed(2)} kg) dostępna
            jest tylko płatność przelewem.
          </p>
        </div>
      )}
      {items.map((item) => (
        <motion.div
          key={item.productId}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="flex items-center gap-3 group"
        >
          {item.image && (
            <div
              className={`relative rounded-md overflow-hidden border border-border ${
                isCompact ? "h-12 w-12" : "h-20 w-20"
              }`}
            >
              <img
                src={item.image}
                alt={item.name}
                className="object-cover absolute inset-0"
              />
            </div>
          )}
          <div className="flex-1 min-w-0 pr-2">
            <Link
              href={`${item.slug || item.productId}`}
              className="font-medium hover:text-primary block truncate text-foreground"
            >
              <p
                className={
                  isCompact ? "text-sm truncate" : "text-base truncate"
                }
              >
                {item.name}
              </p>
            </Link>
            <p
              className={`text-muted-foreground ${
                isCompact ? "text-xs" : "text-sm"
              }`}
            >
              {item.quantity} ×{" "}
              {item.price.toLocaleString("pl-PL", {
                style: "currency",
                currency: "PLN",
              })}
            </p>
            {!isCompact && (
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    updateQuantity(
                      item.productId,
                      Math.max(1, item.quantity - 1)
                    )
                  }
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity + 1)
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => removeItem(item.productId)}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
          </Button>
        </motion.div>
      ))}
    </div>
  );
};
