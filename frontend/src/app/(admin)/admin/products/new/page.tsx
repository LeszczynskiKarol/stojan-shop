// frontend/src/app/(admin)/admin/products/new/page.tsx
"use client";
import { ProductForm } from "@/components/products/ProductForm";
import { useToast } from "@/components/ui/use-toast";
import { useManufacturerStore } from "@/store/manufacturerStore";
import { useProductStore } from "@/store/productStore";
import { IManufacturer } from "@/types/manufacturer.types";
import { getManufacturerId } from "@/utils/allegroManufacturers";
import { useEffect, useState } from "react";

export default function NewProductPage() {
  const { toast } = useToast();
  const { createProduct } = useProductStore();
  const [manufacturers, setManufacturers] = useState<IManufacturer[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [addToAllegro, setAddToAllegro] = useState(false);

  useEffect(() => {
    localStorage.removeItem("product_form_draft");
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

      toast({
        title: addToAllegro ? "Tworzenie oferty..." : "Dodawanie produktu...",
        description: addToAllegro
          ? "Dodaję produkt do sklepu i Allegro. To może potrwać kilka sekund..."
          : "Zapisuję produkt w sklepie...",
        duration: 10000,
      });

      if (!data.name || data.name.length < 12) {
        toast({
          title: "Błąd walidacji",
          description: "Nazwa musi mieć min. 12 znaków",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      if (!data.mainImage) {
        toast({
          title: "Błąd walidacji",
          description: "Musisz dodać zdjęcie główne produktu",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      if (addToAllegro && !data.model?.trim()) {
        toast({
          title: "Błąd walidacji",
          description: "Model jest wymagany przy dodawaniu na Allegro",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      if (data.stock === undefined || data.stock === null) {
        toast({
          title: "Błąd walidacji",
          description: "Stan magazynowy jest wymagany",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      // Przetwarzanie producenta
      let manufacturerName = data.manufacturer?.trim() || "silnik";
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
          manufacturerName = "silnik";
        }
      }

      const processedData = {
        ...data,
        manufacturer: manufacturerName,
        categories: data.categories || [],
        price: Number(data.marketplaces?.ownStore?.price) || 0,
        shaftDiameter: Number(data.shaftDiameter) || 0,
        sleeveDiameter: data.sleeveDiameter
          ? Number(data.sleeveDiameter)
          : undefined,
        flangeSize: data.flangeSize ? Number(data.flangeSize) : undefined,
        mechanicalSize: Number(data.mechanicalSize) || 0,
        stock: Number(data.stock) || 0,
        weight: Number(data.weight) || 0,
        marketplaces: {
          ownStore: {
            active: true,
            price: Number(data.marketplaces?.ownStore?.price) || 0,
            slug: data.marketplaces?.ownStore?.slug || "",
          },
        },
      };

      // DODAWANIE NA ALLEGRO
      if (addToAllegro) {
        const cennikSmartDlaWagi = [
          { maxWaga: 1, id: "6c97494e-b06e-463e-8cf5-d36750d2ca31" },
          { maxWaga: 4, id: "38161cbb-1386-4f17-96e3-4fae1f6de5ee" },
          { maxWaga: 5, id: "5720f29c-89d2-4b8a-8e5b-4bc05d03ced4" },
          { maxWaga: 9, id: "28c0b642-2c0c-4b12-8e07-8116fd33f716" },
          { maxWaga: 13, id: "4225471b-4ca3-4a41-8af0-08a8bd8d0622" },
          { maxWaga: 18, id: "8ac507c5-5868-4f17-91cc-b76addadb954" },
          { maxWaga: 22, id: "452b15db-1f8b-4f16-b7cc-c882b7d8f4af" },
          { maxWaga: 27.5, id: "f1570290-5db6-4614-bc16-0aeddbccd58f" },
          { maxWaga: 30, id: "592aba1b-5240-4589-8118-dd9d22306e66" },
          { maxWaga: Infinity, id: "aa79662f-56d6-4f98-89c5-c960482c2c5f" },
        ];

        const wybierzCennik = (waga: number) => {
          const cennik = cennikSmartDlaWagi.find((c) => waga <= c.maxWaga);
          return (
            cennik?.id || cennikSmartDlaWagi[cennikSmartDlaWagi.length - 1].id
          );
        };

        let categoryId = "121456";
        let productParameters = [];

        if (data.categories?.some((cat: any) => cat.slug === "motoreduktory")) {
          categoryId = "121452";
          const powerKw = parseFloat(
            data.power?.value?.replace(",", ".") || "0"
          );
          const powerInWatts = Math.round(powerKw * 1000);
          const manufacturerData = getManufacturerId(data.manufacturer);

          productParameters = [
            {
              id: "11726",
              name: "Moc znamionowa",
              values: [powerInWatts.toString()],
            },
            {
              id: "221421",
              name: "Prędkość obrotowa",
              values: [data.rpm?.value || "0"],
            },
            {
              id: "214694",
              name: "Waga",
              values: [data.weight?.toString() || "0"],
            },
            ...(data.model
              ? [{ id: "237206", name: "Model", values: [data.model] }]
              : []),
            {
              id: "224017",
              name: "Kod producenta",
              values: [data.model || `MR-${Date.now()}`],
            },
            {
              id: "248811",
              name: "Marka",
              values: [manufacturerData.value],
              valuesIds: [manufacturerData.id],
            },
            {
              id: "18654",
              name: "Rodzaj motoreduktora",
              values: ["walcowy"],
              valuesIds: ["18654_1"],
            },
          ];
        } else {
          const manufacturerData = getManufacturerId(data.manufacturer);

          productParameters = [
            { id: "219137", name: "Moc", values: [data.power?.value || "0"] },
            { id: "219153", name: "Obroty", values: [data.rpm?.value || "0"] },
            {
              id: "214478",
              name: "Waga",
              values: [data.weight?.toString() || "0"],
            },
            {
              id: "219149",
              name: "Średnica wału",
              values: [data.shaftDiameter?.toString() || "0"],
            },
            ...(data.model
              ? [{ id: "237206", name: "Model", values: [data.model] }]
              : []),
            {
              id: "224017",
              name: "Kod producenta",
              values: [data.model || `S-${Date.now()}`],
            },
            {
              id: "248811",
              name: "Marka",
              values: [manufacturerData.value],
              valuesIds: [manufacturerData.id],
            },
            {
              id: "219157",
              name: "Rodzaj silnika",
              values: ["elektryczny"],
              valuesIds: ["219157_284941"],
            },
          ];
        }

        const allegroPrice =
          Number(
            data.marketplaces?.allegro?.price ||
              data.marketplaces?.ownStore?.price
          ) || 0;

        const allegroOffer = {
          name: data.name,
          productSet: [
            {
              product: {
                name: data.name,
                images: [data.mainImage, ...(data.galleryImages || [])],
                parameters: productParameters,
              },
            },
          ],
          parameters: [
            {
              id: "11323",
              name: "Stan",
              values: [data.condition === "uzywany" ? "Używany" : "Nowy"],
              valuesIds: [data.condition === "uzywany" ? "11323_2" : "11323_1"],
            },
          ],
          images: [data.mainImage, ...(data.galleryImages || [])],
          category: { id: categoryId },
          location: {
            city: "Łubianka",
            postCode: "87-152",
            countryCode: "PL",
            province: "KUJAWSKO_POMORSKIE",
          },
          description: {
            sections: [
              {
                items: [
                  {
                    type: "TEXT",
                    content:
                      `<h2>${data.name}</h2>` +
                      (data.allegroDescription || data.description || "")
                        .split("\n")
                        .filter((line: string) => line.trim())
                        .map((line: string) => `<p>${line.trim()}</p>`)
                        .join(""),
                  },
                  ...(data.mainImage
                    ? [{ type: "IMAGE", url: data.mainImage }]
                    : []),
                ],
              },
            ],
          },
          delivery: {
            handlingTime: "PT24H",
            shippingRates: { id: wybierzCennik(Number(data.weight) || 0) },
          },
          sellingMode: {
            format: "BUY_NOW",
            price: { amount: allegroPrice.toString(), currency: "PLN" },
          },
          stock: { available: data.stock > 0 ? data.stock : 1, unit: "UNIT" },
        };

        const allegroResponse = await fetch("/api/admin/allegro/offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(allegroOffer),
        });

        const allegroData = await allegroResponse.json();

        if (!allegroResponse.ok) {
          throw new Error(allegroData?.error || "Błąd Allegro");
        }

        if (allegroData?.data?.id) {
          processedData.marketplaces.allegro = {
            active: true,
            productId: allegroData.data.id,
            url: `https://allegro.pl/oferta/${allegroData.data.id}`,
            price: allegroPrice,
          };
        }
      }

      await createProduct(processedData);

      toast({
        title: "Sukces!",
        description: addToAllegro
          ? "Produkt dodany do sklepu i na Allegro"
          : "Produkt dodany do sklepu",
      });

      setTimeout(() => {
        localStorage.removeItem("product_form_draft");
        window.location.href = "/admin/marketplaces/own-store";
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Dodaj nowy produkt</h1>
      <ProductForm
        onSubmit={handleSubmit}
        isUploadingImages={isUploading}
        addToAllegro={addToAllegro}
        setAddToAllegro={setAddToAllegro}
      />
    </div>
  );
}
