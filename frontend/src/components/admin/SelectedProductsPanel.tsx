// frontend/src/components/admin/SelectedProductsPanel.tsx
import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SelectedProduct {
  id: string;
  name: string;
  manufacturer: string;
  power: {
    value: string;
    range: string;
    unit: "W" | "kW";
  };
  mainImage?: string;
  categorySlug?: string;
  slug: string;
}

interface SelectedProductsPanelProps {
  selectedProducts: SelectedProduct[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

export const SelectedProductsPanel: React.FC<SelectedProductsPanelProps> = ({
  selectedProducts,
  onRemove,
  onClearAll,
}) => {
  if (selectedProducts.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-0 left-0 bg-background border-t shadow-lg z-30 transition-all duration-300">
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">
            Wybrane produkty ({selectedProducts.length})
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            className="hover:bg-destructive hover:text-destructive-foreground"
          >
            Wyczyść wszystko
          </Button>
        </div>

        <div className="max-h-48 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {selectedProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-2 p-2 bg-secondary rounded-lg border hover:border-primary transition-colors"
              >
                {product.mainImage && (
                  <img
                    src={product.mainImage}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    title={product.name}
                  >
                    {product.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {product.manufacturer} • {product.power.value}{" "}
                    {product.power.unit}
                  </p>
                </div>

                <button
                  onClick={() => onRemove(product.id)}
                  className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded transition-colors"
                  title="Usuń z zaznaczonych"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t">
          <p className="text-sm text-muted-foreground">
            Możesz wykonać operacje zbiorcze na wybranych produktach używając
            przycisków w górnej części strony.
          </p>
        </div>
      </div>
    </div>
  );
};
