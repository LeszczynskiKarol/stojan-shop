// frontend/src/components/products/sections/AllegroImagesPanel.tsx
import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/use-toast";
import { X } from "lucide-react";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { IProduct } from "@/types/product.types";

interface AllegroImagesPanelProps {
  product: IProduct;
}

export const AllegroImagesPanel: React.FC<AllegroImagesPanelProps> = ({
  product,
}) => {
  const [images, setImages] = useState<string[]>(
    product.marketplaces?.allegro?.images || []
  );
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = async (files: FileList) => {
    setIsUploading(true);
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("images", file);
    });

    try {
      // Używamy ID produktu z Allegro jeśli istnieje
      const allegroProductId = product.marketplaces?.allegro?.productId;

      if (!allegroProductId) {
        throw new Error("Produkt nie ma przypisanego ID Allegro");
      }

      const response = await fetch(
        `/api/allegro/offers/${allegroProductId}/images`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Błąd przesyłania zdjęć");

      const data = await response.json();
      setImages(data.images || []);

      toast({
        title: "Sukces",
        description: "Zdjęcia zostały przesłane",
      });
    } catch (error) {
      toast({
        title: "Błąd",
        description:
          error instanceof Error
            ? error.message
            : "Nie udało się przesłać zdjęć",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageDelete = async (imageUrl: string, index: number) => {
    try {
      const allegroProductId = product.marketplaces?.allegro?.productId;

      if (!allegroProductId) {
        throw new Error("Produkt nie ma przypisanego ID Allegro");
      }

      const response = await fetch(
        `/api/allegro/offers/${allegroProductId}/images/${index}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Błąd usuwania zdjęcia");

      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);

      toast({
        title: "Sukces",
        description: "Zdjęcie zostało usunięte",
      });
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć zdjęcia",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Zdjęcia produktu Allegro</h3>

      {!product.marketplaces?.allegro?.productId && (
        <div className="text-yellow-600 mb-4">
          ⚠️ Produkt nie jest jeszcze powiązany z ofertą Allegro
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-4">
        {images.map((image: string, index: number) => (
          <div key={index} className="relative">
            <img
              src={image}
              alt={`Zdjęcie ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => handleImageDelete(image, index)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <ImageUpload
        onUpload={handleImageUpload}
        disabled={isUploading || !product.marketplaces?.allegro?.productId}
        maxFiles={8}
        accept="image/*"
      />
    </Card>
  );
};
