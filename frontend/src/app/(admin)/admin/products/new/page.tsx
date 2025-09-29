// frontend/src/app/(admin)/admin/products/new/page.tsx
"use client";
import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { ProductForm } from "@/components/products/ProductForm";
import { useProductStore } from "@/store/productStore";
import { useManufacturerStore } from "@/store/manufacturerStore";
import { IManufacturer } from "@/types/manufacturer.types";

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { createProduct } = useProductStore();
  const [manufacturers, setManufacturers] = useState<IManufacturer[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [addToAllegro, setAddToAllegro] = useState(false);

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
      console.log("🚀 [DEBUG] Czy dodać na Allegro?", addToAllegro);

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

      // Walidacja stanu magazynowego - minimum 1 sztuka
      if (!data.stock || Number(data.stock) < 1) {
        toast({
          title: "Błąd walidacji",
          description: "Stan magazynowy musi wynosić co najmniej 1",
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
          allegro: {
            active: addToAllegro,
            price:
              Number(
                data.marketplaces?.allegro?.price ||
                  data.marketplaces?.ownStore?.price
              ) || 0,
          },
        },
      };

      if (addToAllegro) {
        console.log(
          "📦 [DEBUG ALLEGRO] Rozpoczynam proces dodawania na Allegro"
        );

        const cennikSmartDlaWagi = [
          { maxWaga: 1, id: "6c97494e-b06e-463e-8cf5-d36750d2ca31" }, // do 1kg
          { maxWaga: 4, id: "38161cbb-1386-4f17-96e3-4fae1f6de5ee" }, // do 4kg
          { maxWaga: 5, id: "5720f29c-89d2-4b8a-8e5b-4bc05d03ced4" }, // 4,5-5kg
          { maxWaga: 9, id: "28c0b642-2c0c-4b12-8e07-8116fd33f716" }, // 6,5-9kg
          { maxWaga: 13, id: "4225471b-4ca3-4a41-8af0-08a8bd8d0622" }, // 9,5-13kg
          { maxWaga: 18, id: "8ac507c5-5868-4f17-91cc-b76addadb954" }, // 13,5-18kg
          { maxWaga: 22, id: "452b15db-1f8b-4f16-b7cc-c882b7d8f4af" }, // 18,5-22kg
          { maxWaga: 27.5, id: "f1570290-5db6-4614-bc16-0aeddbccd58f" }, // 22,5-27,5kg
          { maxWaga: 30, id: "592aba1b-5240-4589-8118-dd9d22306e66" }, // 28-30kg
          { maxWaga: Infinity, id: "6c97494e-b06e-463e-8cf5-d36750d2ca31" }, // powyżej 30kg - bez Smart!
        ];

        const wybierzCennikSmart = (waga: number): string => {
          const cennik = cennikSmartDlaWagi.find((c) => waga <= c.maxWaga);
          return cennik
            ? cennik.id
            : cennikSmartDlaWagi[cennikSmartDlaWagi.length - 1].id;
        };

        const productWeight = Number(data.weight) || 0;

        let categoryId = "121456"; // Domyślnie silniki
        let productParameters = [];

        if (data.mainCategory && data.mainCategory.includes("motoreduktor")) {
          categoryId = "121452"; // ID kategorii motoreduktorów

          // Parametry tylko dla motoreduktorów (kategoria 121452)
          productParameters = [
            {
              id: "11726", // Moc znamionowa
              name: "Moc znamionowa",
              values: [data.power?.value || "0"],
            },
            {
              id: "221421", // Prędkość obrotowa
              name: "Prędkość obrotowa",
              values: [data.rpm?.value || "0"],
            },
            {
              id: "214694", // Waga dla motoreduktorów
              name: "Waga",
              values: [data.weight ? data.weight.toString() : "0"],
            },
            {
              id: "237206", // Model
              name: "Model",
              values: [`MR-${Math.floor(Math.random() * 10000)}`],
            },
            {
              id: "248929", // Marka
              name: "Marka",
              values: ["Stojan"],
              valuesIds: ["248929_969280"],
            },
            {
              id: "18654", // Rodzaj motoreduktora
              name: "Rodzaj motoreduktora",
              values: ["walcowy"],
              valuesIds: ["18654_1"],
            },
            {
              id: "224017", // Kod producenta
              name: "Kod producenta",
              values: [`MR-${Math.floor(Math.random() * 10000)}`],
            },
          ];
        } else {
          // Parametry tylko dla silników elektrycznych (kategoria 121456)
          productParameters = [
            {
              id: "219137", // Moc dla silników
              name: "Moc",
              values: [data.power?.value || "0"],
            },
            {
              id: "219153", // Obroty dla silników
              name: "Obroty",
              values: [data.rpm?.value || "0"],
            },
            {
              id: "214478", // Waga
              name: "Waga",
              values: [data.weight ? data.weight.toString() : "0"],
            },
            {
              id: "219149", // Średnica wału
              name: "Średnica wału",
              values: [
                data.shaftDiameter ? data.shaftDiameter.toString() : "0",
              ],
            },
            {
              id: "237206", // Model
              name: "Model",
              values: [`S-${Math.floor(Math.random() * 10000)}`],
            },
            {
              id: "248811", // Marka
              name: "Marka",
              values: ["bez marki"],
            },
            {
              id: "219157", // Rodzaj silnika
              name: "Rodzaj silnika",
              values: ["elektryczny"],
              valuesIds: ["219157_284941"],
            },
            {
              id: "224017", // Kod producenta
              name: "Kod producenta",
              values: [`S-${Math.floor(Math.random() * 10000)}`],
            },
            {
              id: "219145", // Typ silnika
              name: "Typ silnika",
              values: [
                data.mainCategory?.toLowerCase().includes("jednofazowy")
                  ? "jednofazowy"
                  : "trójfazowy",
              ],
              valuesIds: [
                data.mainCategory?.toLowerCase().includes("jednofazowy")
                  ? "219145_284933"
                  : "219145_284937",
              ],
            },
          ];
        }

        // Przygotuj opis w zależności od kategorii
        let productDescription = "";
        if (categoryId === "121452") {
          productDescription = `<h1>MOTOREDUKTOR</h1>
      <h2>TRÓJFAZOWY</h2>
      <p><b>${data.power?.value || ""}kW ${data.rpm?.value || ""}obr.</b></p>
      <p>(${
        data.condition === "uzywany"
          ? "używany, po regeneracji"
          : "nowy, gotowy do pracy"
      })</p>
      <p>średnica wału: <b>${data.shaftDiameter || ""}mm</b></p>
      ${
        data.flangeSize
          ? `<p>średnica zamka kołnierza (kryzy): <b>${data.flangeSize}mm</b></p>`
          : ""
      }
      <p>waga: <b>${data.weight || ""}kg</b></p>`;
        } else {
          productDescription = `<h1>SILNIK ELEKTRYCZNY</h1>
    <h2>${data.power?.value || ""}kW ${data.rpm?.value || ""}obr.</h2>
    <p>${data.description || "Brak opisu"}</p>`;
        }

        const allegroPrice =
          Number(data.marketplaces?.allegro?.price) ||
          Number(data.marketplaces?.ownStore?.price) ||
          0;

        // Tworzymy allegroOffer z parametrami odpowiednimi do kategorii
        const allegroOffer = {
          name: data.name,
          productSet: [
            {
              product: {
                name: data.name,
                images: [
                  ...(data.mainImage ? [data.mainImage] : []),
                  ...(data.galleryImages || []).filter((img: string) => img),
                ],
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
          images: [
            ...(data.mainImage ? [data.mainImage] : []),
            ...(data.galleryImages || []).filter((img: string) => img),
          ],
          category: {
            id: categoryId,
          },
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
                    content: productDescription,
                  },
                ],
              },
            ],
          },
          delivery: {
            handlingTime: "PT24H",
            shippingRates: {
              id: wybierzCennikSmart(productWeight),
            },
          },
          sellingMode: {
            format: "BUY_NOW",
            price: {
              amount: allegroPrice.toString(),
              currency: "PLN",
            },
          },
          stock: {
            available: data.stock > 0 ? data.stock : 1,
            unit: "UNIT",
          },
        };

        let allegroCategoryId = "121456"; // Domyślnie silniki elektryczne

        console.log(
          "Finalna kategoria produktu na Allegro:",
          allegroCategoryId
        );
        console.log(
          "📦 [DEBUG ALLEGRO] Przygotowana oferta Allegro:",
          JSON.stringify(allegroOffer, null, 2)
        );
        toast({
          title: "Wysyłam na Allegro...",
          description: "Trwa dodawanie produktu na Allegro",
        });

        console.log(
          "📦 [DEBUG ALLEGRO] Wywołuję API: /api/admin/allegro/offers"
        );

        // Wywołanie API do utworzenia produktu na Allegro
        const allegroResponse = await fetch("/api/admin/allegro/offers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(allegroOffer),
        });

        console.log(
          "📦 [DEBUG ALLEGRO] Status odpowiedzi:",
          allegroResponse.status
        );
        console.log(
          "📦 [DEBUG ALLEGRO] Headers odpowiedzi:",
          allegroResponse.headers
        );

        const responseText = await allegroResponse.text();
        console.log("📦 [DEBUG ALLEGRO] Surowa odpowiedź:", responseText);

        let allegroData;
        try {
          allegroData = JSON.parse(responseText);
          console.log("📦 [DEBUG ALLEGRO] Sparsowana odpowiedź:", allegroData);
        } catch (parseError) {
          console.error(
            "❌ [DEBUG ALLEGRO] Błąd parsowania odpowiedzi:",
            parseError
          );
          console.error("❌ [DEBUG ALLEGRO] Treść odpowiedzi:", responseText);
          throw new Error(
            `Nieprawidłowa odpowiedź z serwera Allegro: ${responseText}`
          );
        }

        if (!allegroResponse.ok) {
          console.error("❌ [DEBUG ALLEGRO] Błąd HTTP:", {
            status: allegroResponse.status,
            data: allegroData,
          });

          toast({
            title: "Błąd Allegro",
            description: allegroData?.error || `Błąd ${allegroResponse.status}`,
            variant: "destructive",
          });

          throw new Error(
            allegroData?.error || "Błąd podczas dodawania na Allegro"
          );
        }

        if (allegroData?.data?.id) {
          console.log(
            "✅ [DEBUG ALLEGRO] Produkt dodany na Allegro z ID:",
            allegroData.data.id
          );
          console.log(
            "✅ [DEBUG ALLEGRO] URL oferty:",
            `https://allegro.pl/oferta/${allegroData.data.id}`
          );

          toast({
            title: "Sukces Allegro",
            description: `Produkt dodany na Allegro (ID: ${allegroData.data.id})`,
          });

          // Dodaj ID oferty z Allegro do danych produktu
          processedData.marketplaces.allegro = {
            active: true,
            productId: allegroData.data.id,
            url: `https://allegro.pl/oferta/${allegroData.data.id}`,
            price: allegroPrice,
            category: {
              id: categoryId,
            },
            parameters: productParameters,
            description: {
              sections: allegroData.data.description?.sections || [],
            },
            stock: allegroData.data.stock?.available || data.stock,
            images: allegroData.data.images || [],
            lastSyncAt: new Date(),
          };

          console.log(
            "✅ [DEBUG ALLEGRO] Dane Allegro dodane do produktu:",
            processedData.marketplaces.allegro
          );
        } else {
          console.error(
            "❌ [DEBUG ALLEGRO] Brak ID w odpowiedzi:",
            allegroData
          );
          throw new Error("Nie otrzymano ID oferty z Allegro");
        }
      } else {
        console.log(
          "⏭️ [DEBUG] Pomijam dodawanie na Allegro (opcja wyłączona)"
        );
      }

      console.log("💾 [DEBUG] Zapisuję produkt do bazy danych");
      console.log("💾 [DEBUG] Finalne dane produktu:", processedData);

      await createProduct(processedData);

      console.log("✅ [DEBUG] Produkt zapisany pomyślnie");

      sessionStorage.setItem("block_form_saving", "true");
      localStorage.removeItem("product_form_draft");

      toast({
        title: "Sukces",
        description: addToAllegro
          ? "Produkt został dodany do sklepu i na Allegro"
          : "Produkt został dodany do sklepu",
      });

      setTimeout(() => {
        localStorage.removeItem("product_form_draft");
        window.location.href = "/admin/marketplaces/own-store";
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
      <ProductForm
        onSubmit={handleSubmit}
        isUploadingImages={isUploading}
        addToAllegro={addToAllegro}
        setAddToAllegro={setAddToAllegro}
      />
    </div>
  );
}
