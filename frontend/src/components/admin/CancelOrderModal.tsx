// frontend/src/components/admin/CancelOrderModal.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, X } from "lucide-react";

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  orderCount?: number;
  orderNumber?: string;
}

export const CancelOrderModal = ({
  isOpen,
  onClose,
  onConfirm,
  orderCount = 1,
  orderNumber,
}: CancelOrderModalProps) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Predefiniowane powody anulowania
  const predefinedReasons = [
    "Klient zrezygnował z zakupu",
    "Błąd w zamówieniu",
    "Produkt niedostępny",
    "Problem z płatnością",
    "Błędne dane adresowe",
    "Duplikat zamówienia",
    "Podejrzenie oszustwa",
    "Inne",
  ];

  // Reset stanu przy otwieraniu/zamykaniu
  useEffect(() => {
    if (!isOpen) {
      setReason("");
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Blokowanie scrollowania body gdy modal jest otwarty
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup przy odmontowaniu
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("Powód anulowania jest wymagany");
      return;
    }

    if (reason.trim().length < 5) {
      setError("Powód musi zawierać minimum 5 znaków");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (err) {
      setError("Wystąpił błąd podczas anulowania zamówienia");
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSubmit();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            aria-hidden="true"
          />

          {/* Modal Container - dodatkowy wrapper dla pewności centrowania */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-lg bg-background border rounded-lg shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto"
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-background z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      Anuluj{" "}
                      {orderCount > 1 ? `${orderCount} zamówień` : "zamówienie"}
                    </h2>
                    {orderNumber && (
                      <p className="text-sm text-muted-foreground">
                        Numer: {orderNumber}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Warning message */}
                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Uwaga!</strong> Ta operacja jest nieodwracalna.
                    {orderCount > 1
                      ? ` Wszystkie ${orderCount} zaznaczone zamówienia zostaną anulowane.`
                      : " Zamówienie zostanie oznaczone jako anulowane i nie będzie mogło być przywrócone."}
                  </p>
                </div>

                {/* Predefined reasons */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Wybierz powód anulowania:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {predefinedReasons.map((predefinedReason) => (
                      <Button
                        key={predefinedReason}
                        variant={
                          reason === predefinedReason ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setReason(predefinedReason)}
                        disabled={isSubmitting}
                        className="justify-start text-left"
                      >
                        {predefinedReason}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom reason input */}
                <div className="space-y-2">
                  <label htmlFor="reason" className="text-sm font-medium">
                    Lub wpisz własny powód:
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      setError("");
                    }}
                    placeholder="Opisz powód anulowania zamówienia..."
                    className="w-full min-h-[100px] px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    disabled={isSubmitting}
                    autoFocus
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      Minimum 5 znaków • {reason.length}/500
                    </p>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                  </div>
                </div>

                {/* Additional info */}
                <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
                  <p>• Klient otrzyma powiadomienie o anulowaniu zamówienia</p>
                  <p>• Stan magazynowy zostanie automatycznie przywrócony</p>
                  {orderCount > 1 && (
                    <p className="font-medium text-primary">
                      • Anulowanych zostanie {orderCount} zamówień
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t bg-muted/50 sticky bottom-0">
                <div className="text-xs text-muted-foreground">
                  <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border rounded">
                    Ctrl
                  </kbd>
                  +
                  <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border rounded">
                    Enter
                  </kbd>
                  aby potwierdzić
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Anuluj
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !reason.trim()}
                  >
                    {isSubmitting
                      ? "Anulowanie..."
                      : `Potwierdź anulowanie${
                          orderCount > 1 ? ` (${orderCount})` : ""
                        }`}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
