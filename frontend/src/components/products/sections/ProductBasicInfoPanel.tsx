// frontend/src/components/products/sections/ProductBasicInfoPanel.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useProductStore } from "@/store/productStore";
import { useToast } from "@/components/ui/use-toast";
import { IProduct } from "@/types/product.types";

interface ProductBasicInfoPanelProps {
  product: IProduct;
}

export const ProductBasicInfoPanel: React.FC<ProductBasicInfoPanelProps> = ({
  product,
}) => {
  const { products } = useProductStore();
  const currentProduct = products.find(
    (p) => p.id === product.id || p._id === product.id
  );
  useEffect(() => {
    const updateFormData = () => {
      const productToUse = currentProduct || product;
      setFormData({
        name: productToUse.name,
        manufacturer: productToUse.manufacturer,

        condition: productToUse.condition,
        power: productToUse.power.value,
        rpm: productToUse.rpm.value,
        shaftDiameter: productToUse.shaftDiameter,
        sleeveDiameter: productToUse.sleeveDiameter,
        flangeSize: productToUse.flangeSize,
        mechanicalSize: productToUse.mechanicalSize,
        stock: productToUse.stock,
        weight: product.weight || 0,
        categories: productToUse.categories || [],
      });
    };

    updateFormData();
  }, [currentProduct, product]);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentProduct?.name || product.name,
    manufacturer: product.manufacturer,
    condition: product.condition,
    power: product.power.value,
    rpm: product.rpm.value,
    shaftDiameter: product.shaftDiameter,
    sleeveDiameter: product.sleeveDiameter,
    flangeSize: product.flangeSize,
    mechanicalSize: product.mechanicalSize,
    stock: product.stock,
    weight: product.weight || 0,
    categories: product.categories || [],
  });

  const { updateProduct } = useProductStore();
  const { toast } = useToast();

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const productId = product.id || product._id;

      if (!productId) {
        throw new Error("Brak ID produktu");
      }

      await updateProduct(productId, {
        ...formData,
        weight: formData.weight, // usunięto parseFloat
        power: { value: formData.power, range: "", unit: "kW" },
        rpm: { value: formData.rpm, range: "", unit: "obr/min" },
      });

      toast({
        title: "Sukces",
        description: "Podstawowe informacje zostały zaktualizowane",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować informacji",
        variant: "destructive",
      });
    }
  };

  if (isEditing) {
    return (
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Podstawowe informacje</h3>
          <div className="space-x-2">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>
              Anuluj
            </Button>
            <Button onClick={handleSubmit}>Zapisz zmiany</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">Nazwa produktu</label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-gray-500">Producent</label>
              <Input
                value={formData.manufacturer}
                onChange={(e) => handleChange("manufacturer", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-gray-500">Stan</label>
              <select
                value={formData.condition}
                onChange={(e) => handleChange("condition", e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="nowy">Nowy</option>
                <option value="uzywany">Używany</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-500">Moc [kW]</label>
              <Input
                type="number"
                step="0.1"
                value={formData.power}
                onChange={(e) => handleChange("power", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">Waga [kg]</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={formData.weight}
                onChange={(e) => handleChange("weight", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm">Obroty [obr/min]</label>
              <Input
                type="number"
                value={formData.rpm}
                onChange={(e) => handleChange("rpm", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-gray-500">
                Średnica wału [mm]
              </label>
              <Input
                type="number"
                step="0.1"
                value={formData.shaftDiameter}
                onChange={(e) => handleChange("shaftDiameter", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-gray-500">
                Średnica tulei [mm]
              </label>
              <Input
                type="number"
                step="0.1"
                value={formData.sleeveDiameter || ""}
                onChange={(e) => handleChange("sleeveDiameter", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-gray-500">
                Rozmiar kołnierza [mm]
              </label>
              <Input
                type="number"
                step="0.1"
                value={formData.flangeSize || ""}
                onChange={(e) => handleChange("flangeSize", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-gray-500">
                Wielkość mechaniczna
              </label>
              <Input
                type="number"
                value={formData.mechanicalSize}
                onChange={(e) => handleChange("mechanicalSize", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-gray-500">Stan magazynowy</label>
              <Input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => handleChange("stock", e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Podstawowe informacje</h3>
        <Button onClick={() => setIsEditing(true)}>Edytuj</Button>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Nazwa produktu</p>
            <p className="font-medium">{product.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Producent</p>
            <p className="font-medium">{product.manufacturer}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Stan</p>
            <p className="font-medium">
              {product.condition === "nowy" ? "Nowy" : "Używany"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Moc</p>
            <p className="font-medium">{product.power.value} kW</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Obroty</p>
            <p className="font-medium">{product.rpm.value} obr/min</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Średnica wału</p>
            <p className="font-medium">{product.shaftDiameter} mm</p>
          </div>
          {product.sleeveDiameter && (
            <div>
              <p className="text-sm text-gray-500">Średnica tulei</p>
              <p className="font-medium">{product.sleeveDiameter} mm</p>
            </div>
          )}
          {product.flangeSize && (
            <div>
              <p className="text-sm text-gray-500">Rozmiar kołnierza</p>
              <p className="font-medium">{product.flangeSize} mm</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">Wielkość mechaniczna</p>
            <p className="font-medium">{product.mechanicalSize}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Stan magazynowy</p>
            <p className="font-medium">{product.stock} szt.</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Waga</p>
            <p className="font-medium">{product.weight || 0} kg</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
