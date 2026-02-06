// frontend/src/components/shop/PaymentMethodCard.tsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface PaymentMethodCardProps {
  isSelected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  icon: React.ReactNode;
  cost: number;
  disabled?: boolean;
  additionalInfo?: string;
}

export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  isSelected,
  onSelect,
  title,
  description,
  icon,
  cost,
  disabled = false,
  additionalInfo,
}) => {
  return (
    <motion.div
      whileHover={!disabled ? { scale: 1.01 } : {}}
      whileTap={!disabled ? { scale: 0.99 } : {}}
      onClick={!disabled ? onSelect : undefined}
      className={cn(
        "relative flex items-center gap-4 p-4 rounded-lg border transition-all",
        !disabled && "cursor-pointer hover:bg-accent/50",
        disabled && "opacity-50 cursor-not-allowed",
        isSelected && !disabled && "ring-2 ring-primary bg-accent/20"
      )}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-pressed={isSelected}
      aria-disabled={disabled}
    >
      {/* Ikona */}
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
          isSelected && !disabled
            ? "bg-primary text-primary-foreground"
            : "bg-primary/10 text-primary"
        )}
      >
        {icon}
      </div>

      {/* Treść */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn("font-medium", disabled && "text-muted-foreground")}
          >
            {title}
          </span>
          {disabled && (
            <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
              Niedostępne
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground">
            Koszt dostawy:{" "}
            <span className="font-medium">
              {cost.toLocaleString("pl-PL", {
                style: "currency",
                currency: "PLN",
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </span>
          </p>
          {additionalInfo && (
            <span className="text-xs text-muted-foreground">
              • {additionalInfo}
            </span>
          )}
        </div>
      </div>

      {/* Wskaźnik wyboru */}
      <div
        className={cn(
          "h-5 w-5 rounded-full border-2 transition-all flex items-center justify-center",
          isSelected && !disabled
            ? "border-primary bg-primary"
            : "border-muted-foreground/50"
        )}
      >
        <motion.div
          initial={false}
          animate={{
            scale: isSelected && !disabled ? 1 : 0,
            opacity: isSelected && !disabled ? 1 : 0,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <Check className="h-3 w-3 text-primary-foreground" />
        </motion.div>
      </div>

      {/* Efekt podświetlenia dla wybranej opcji */}
      {isSelected && !disabled && (
        <motion.div
          layoutId="payment-method-highlight"
          className="absolute inset-0 rounded-lg ring-2 ring-primary pointer-events-none"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </motion.div>
  );
};

// Eksport domyślny dla łatwiejszego importu
export default PaymentMethodCard;
