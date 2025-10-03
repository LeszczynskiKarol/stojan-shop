// frontend/src/app/(admin)/admin/products/new/page.tsx - NOWA WERSJA
"use client";
import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { ProductForm } from "@/components/products/ProductForm";
import { AllegroProductBox } from "@/components/products/AllegroProductBox";
import { useProductStore } from "@/store/productStore";
import { useManufacturerStore } from "@/store/manufacturerStore";
import { IManufacturer } from "@/types/manufacturer.types";

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { createProduct } = useProductStore();
  const [manufacturers, setManufacturers] = useState<IManufacturer[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    localStorage.removeItem("product_form_draft");

    // Dodatkowo czyszczenie przy odmontowaniu
    return () => {
      localStorage.removeItem("product_form_draft");
    };
  }, []);

  useEffect(() => {
    const fetchManufacturers = async () => {
      const { fetchManufacturers } = useManufacturerStore.getState();
      await fetchManufacturers();
      const manufacturersList = useManufacturerStore.getState().manufacturers;
      setManufacturers(manufacturersList);
    };

    fetchManufacturers();
  }, []);

  const handleSubmit = async (data: any) => {
    try {
      setIsUploading(true);
      console.log("🚀 [DEBUG] Rozpoczynam dodawanie produktu");
      console.log("🚀 [DEBUG] Dane wejściowe:", data);

      if (!data.name || data.name.length < 12) {
        toast({
          title: "Błąd walidacji",
          description:
            "Nazwa produktu musi mieć co najmniej 12 znaków - tego wymaga Allegro",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      // Walidacja zdjęcia głównego - musi być dodane
      if (!data.mainImage) {
        toast({
          title: "Błąd walidacji",
          description: "Musisz dodać zdjęcie główne produktu",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      // Walidacja stanu magazynowego - wymagane, ale może być 0
      if (data.stock === undefined || data.stock === null) {
        toast({
          title: "Błąd walidacji",
          description: "Stan magazynowy jest wymagany",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      if (
        data.legSpacing === "" ||
        data.legSpacing === undefined ||
        data.legSpacing === null
      ) {
        data.legSpacing = null; // Ustawiamy na null zamiast pustego stringa
      } else if (!data.legSpacing.includes("x")) {
        // Jeśli użytkownik podał tylko jedną wartość bez 'x', formatujemy jako "wartość x wartość"
        data.legSpacing = `${data.legSpacing} x ${data.legSpacing}`;
      }

      // Sprawdzamy i ustawiamy producenta
      let manufacturerName = data.manufacturer?.trim() || "silnik";

      // Próba znalezienia istniejącego producenta
      const existingManufacturer = manufacturers.find(
        (m) => m.name.toLowerCase() === manufacturerName.toLowerCase()
      );

      if (!existingManufacturer) {
        try {
          await useManufacturerStore.getState().createManufacturer({
            name: manufacturerName,
            description: "",
            slug: `marka-producent/${manufacturerName
              .toLowerCase()
              .replace(/\s+/g, "-")}`,
            images: [],
          });
        } catch (err) {
          console.error("Błąd podczas tworzenia producenta:", err);
          // Jeśli nie udało się utworzyć producenta, używamy domyślnego
          manufacturerName = "silnik";
        }
      }

      // Reszta przetwarzania danych
      const processedData = {
        ...data,
        startType: data.startType || null,
        manufacturer: manufacturerName, // Ustawiamy przetworzoną nazwę producenta
        categories: data.categories || [],
        price: Number(data.marketplaces?.ownStore?.price) || 0,
        shaftDiameter: Number(data.shaftDiameter) || 0,
        sleeveDiameter: data.sleeveDiameter
          ? Number(data.sleeveDiameter)
          : undefined,
        flangeSize: data.flangeSize ? Number(data.flangeSize) : undefined,
        flangeBoltCircle: data.flangeBoltCircle
          ? Number(data.flangeBoltCircle)
          : undefined,
        mechanicalSize: Number(data.mechanicalSize) || 0,
        stock: Number(data.stock) || 0,
        weight: Number(data.weight) || 0,
        images: data.images || [],
        mainImage: data.mainImage,
        galleryImages: data.galleryImages || [],
        dataSheets: data.dataSheets || [],
        power: {
          value: data.power?.value || "",
          range: data.power?.range || "",
        },
        rpm: {
          value: data.rpm?.value || "",
          range: data.rpm?.range || "",
        },
        marketplaces: {
          ownStore: {
            active: true,
            price: Number(data.marketplaces?.ownStore?.price) || 0,
            slug: data.marketplaces?.ownStore?.slug || "",
          },
        },
      };

      await createProduct(processedData);

      console.log("✅ [DEBUG] Produkt zapisany pomyślnie");

      sessionStorage.setItem("block_form_saving", "true");
      localStorage.removeItem("product_form_draft");

      toast({
        title: "Produkt został dodany do sklepu",
      });

      setTimeout(() => {
        localStorage.removeItem("product_form_draft");
      }, 2000); // Zwiększamy timeout do 2 sekund dla lepszej widoczności toastów
    } catch (error: any) {
      console.error("❌ [DEBUG] Główny błąd:", error);
      console.error("❌ [DEBUG] Stack trace:", error.stack);

      toast({
        title: "Błąd",
        description: error.message || "Nie udało się dodać produktu",
        variant: "destructive",
        duration: 10000, // Dłuższy czas dla błędów
      });
    } finally {
      setIsUploading(false);
      console.log("🏁 [DEBUG] Zakończono proces dodawania produktu");
    }
  };

  useEffect(() => {
    localStorage.removeItem("product_form_draft");
  }, []);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Dodaj nowy produkt</h1>

      <ProductForm onSubmit={handleSubmit} isUploadingImages={isUploading} />
      <AllegroProductBox />
      <div className="mt-8"></div>
    </div>
  );
}
