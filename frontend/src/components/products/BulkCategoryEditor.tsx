// frontend/src/components/products/BulkCategoryEditor.tsx
import React, { useEffect, useState } from "react";
import { useProductStore } from "@/store/productStore";
import { useCategoryStore } from "@/store/categoryStore";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/use-toast";

interface BulkCategoryEditorProps {
  selectedProducts: string[];
  onClose: () => void;
}

export const BulkCategoryEditor = ({
  selectedProducts,
  onClose,
}: BulkCategoryEditorProps) => {
  const { categories, loading, fetchCategories } = useCategoryStore();
  const { updateManyCategories } = useProductStore();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async () => {
    try {
      // Pusta tablica obiektów - funkcja updateManyCategories sama doda kategorie
      const updateDataArray = selectedProducts.map(() => ({}));

      await updateManyCategories(
        selectedProducts,
        selectedCategory,
        updateDataArray
      );

      toast({
        title: "Sukces",
        description: `Zaktualizowano kategorie dla ${selectedProducts.length} produktów`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować kategorii",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 bg-black">
      <h3 className="text-lg font-semibold mb-4">
        Masowa zmiana kategorii dla {selectedProducts.length} produktów
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-500 mb-2">
            Wybierz nową kategorię
          </label>
          {loading ? (
            <div>Ładowanie kategorii...</div>
          ) : (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-black"
            >
              <option value="">Wybierz kategorię</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !selectedCategory || selectedProducts.length === 0 || loading
            }
          >
            Zapisz zmiany
          </Button>
        </div>
      </div>
    </div>
  );
};
