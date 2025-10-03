// frontend/src/components/products/AllegroProductBox.tsx
"use client";
import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/use-toast";

interface AllegroProductBoxProps {
  // Opcjonalnie możesz przekazać dane z górnego formularza
  productData?: {
    name?: string;
    power?: string;
    rpm?: string;
    weight?: number;
    shaftDiameter?: number;
    mainImage?: string;
    galleryImages?: string[];
  };
}

export function AllegroProductBox({ productData }: AllegroProductBoxProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Kategoria - silniki lub motoreduktory
  const [categoryId, setCategoryId] = useState("121456");

  // Dane specyficzne dla Allegro
  const [allegroName, setAllegroName] = useState(productData?.name || "");
  const [allegroPrice, setAllegroPrice] = useState("");
  const [allegroStock, setAllegroStock] = useState("1");
  const [allegroDescription, setAllegroDescription] = useState("");

  // Parametry produktowe
  const [power, setPower] = useState(productData?.power || "");
  const [rpm, setRpm] = useState(productData?.rpm || "");
  const [weight, setWeight] = useState(productData?.weight?.toString() || "");
  const [shaftDiameter, setShaftDiameter] = useState(
    productData?.shaftDiameter?.toString() || ""
  );
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");

  // Stan
  const [condition, setCondition] = useState<"uzywany" | "nowy">("uzywany");

  // Zdjęcia
  const [images, setImages] = useState<string[]>(
    productData?.mainImage
      ? [productData.mainImage, ...(productData.galleryImages || [])]
      : []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allegroName || allegroName.length < 12) {
      toast({
        title: "Błąd walidacji",
        description: "Nazwa musi mieć min. 12 znaków (wymagane przez Allegro)",
        variant: "destructive",
      });
      return;
    }

    if (images.length === 0) {
      toast({
        title: "Błąd walidacji",
        description: "Dodaj co najmniej 1 zdjęcie",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Logika cenników Smart
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

      // Parametry w zależności od kategorii
      let productParameters = [];

      if (categoryId === "121452") {
        // MOTOREDUKTORY
        productParameters = [
          { id: "11726", name: "Moc znamionowa", values: [power] },
          { id: "221421", name: "Prędkość obrotowa", values: [rpm] },
          { id: "214694", name: "Waga", values: [weight] },
          {
            id: "237206",
            name: "Model",
            values: [model || `MR-${Date.now()}`],
          },
          { id: "248929", name: "Marka", values: [manufacturer || "STOJAN"] },
          {
            id: "18654",
            name: "Rodzaj motoreduktora",
            values: ["walcowy"],
            valuesIds: ["18654_1"],
          },
        ];
      } else {
        // SILNIKI
        productParameters = [
          { id: "219137", name: "Moc", values: [power] },
          { id: "219153", name: "Obroty", values: [rpm] },
          { id: "214478", name: "Waga", values: [weight] },
          { id: "219149", name: "Średnica wału", values: [shaftDiameter] },
          { id: "237206", name: "Model", values: [model || `S-${Date.now()}`] },
          { id: "248811", name: "Marka", values: [manufacturer || "STOJAN"] },
          {
            id: "219157",
            name: "Rodzaj silnika",
            values: ["elektryczny"],
            valuesIds: ["219157_284941"],
          },
        ];
      }

      // Payload dla Allegro
      const allegroOffer = {
        name: allegroName,
        productSet: [
          {
            product: {
              name: allegroName,
              images: images,
              parameters: productParameters,
            },
          },
        ],
        parameters: [
          {
            id: "11323",
            name: "Stan",
            values: [condition === "uzywany" ? "Używany" : "Nowy"],
            valuesIds: [condition === "uzywany" ? "11323_2" : "11323_1"],
          },
        ],
        images: images,
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
                    allegroDescription ||
                    `<h1>${allegroName}</h1><p>${power}kW ${rpm}obr.</p>`,
                },
              ],
            },
          ],
        },
        delivery: {
          handlingTime: "PT24H",
          shippingRates: {
            id: wybierzCennik(parseFloat(weight) || 0),
          },
        },
        sellingMode: {
          format: "BUY_NOW",
          price: {
            amount: allegroPrice,
            currency: "PLN",
          },
        },
        stock: {
          available: parseInt(allegroStock) || 1,
          unit: "UNIT",
        },
      };

      console.log("Wysyłam na Allegro:", allegroOffer);

      const response = await fetch("/api/admin/allegro/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(allegroOffer),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Błąd Allegro API");
      }

      toast({
        title: "Sukces!",
        description: `Produkt dodany na Allegro (ID: ${data.data?.id})`,
      });

      // Wyczyść formularz
      setAllegroName("");
      setAllegroPrice("");
      setAllegroDescription("");
      setModel("");
    } catch (error: any) {
      console.error("Błąd:", error);
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 border-2 border-orange-500 bg-orange-50">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-orange-800">
          📦 Dodaj ten sam produkt NA ALLEGRO
        </h2>
        <p className="text-sm text-orange-600">
          Osobny panel tylko do Allegro - wypełnij wymagane pola
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Kategoria */}
        <div>
          <label className="text-sm font-medium">Kategoria Allegro</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="121456">Silniki elektryczne (121456)</option>
            <option value="121452">Motoreduktory (121452)</option>
          </select>
        </div>

        {/* Nazwa */}
        <div>
          <label className="text-sm font-medium">Nazwa produktu *</label>
          <Input
            value={allegroName}
            onChange={(e) => setAllegroName(e.target.value)}
            placeholder="Min. 12 znaków"
            minLength={12}
            maxLength={75}
            required
          />
          <span className="text-xs text-gray-500">
            {allegroName.length}/75 znaków
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Moc */}
          <div>
            <label className="text-sm font-medium">Moc [kW] *</label>
            <Input
              value={power}
              onChange={(e) => setPower(e.target.value)}
              placeholder="np. 2.2"
              required
            />
          </div>

          {/* Obroty */}
          <div>
            <label className="text-sm font-medium">Obroty [obr/min] *</label>
            <Input
              value={rpm}
              onChange={(e) => setRpm(e.target.value)}
              placeholder="np. 1400"
              required
            />
          </div>

          {/* Waga */}
          <div>
            <label className="text-sm font-medium">Waga [kg] *</label>
            <Input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />
          </div>

          {/* Średnica wału */}
          <div>
            <label className="text-sm font-medium">Średnica wału [mm]</label>
            <Input
              type="number"
              value={shaftDiameter}
              onChange={(e) => setShaftDiameter(e.target.value)}
            />
          </div>

          {/* Producent */}
          <div>
            <label className="text-sm font-medium">Producent</label>
            <Input
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              placeholder="np. SEW"
            />
          </div>

          {/* Stan */}
          <div>
            <label className="text-sm font-medium">Stan *</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as any)}
              className="w-full p-2 border rounded"
            >
              <option value="uzywany">Używany</option>
              <option value="nowy">Nowy</option>
            </select>
          </div>

          {/* Cena */}
          <div>
            <label className="text-sm font-medium">Cena Allegro [PLN] *</label>
            <Input
              type="number"
              step="0.01"
              value={allegroPrice}
              onChange={(e) => setAllegroPrice(e.target.value)}
              placeholder="np. 1200.00"
              required
            />
          </div>

          {/* Stock */}
          <div>
            <label className="text-sm font-medium">Ilość *</label>
            <Input
              type="number"
              value={allegroStock}
              onChange={(e) => setAllegroStock(e.target.value)}
              min="1"
              required
            />
          </div>
        </div>

        {/* Opis */}
        <div>
          <label className="text-sm font-medium">Opis Allegro</label>
          <Textarea
            value={allegroDescription}
            onChange={(e) => setAllegroDescription(e.target.value)}
            rows={4}
            placeholder="Opcjonalny opis..."
          />
        </div>

        {/* Przyciski */}
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isSubmitting ? "Wysyłam..." : "🚀 Dodaj TYLKO na Allegro"}
          </Button>
        </div>

        <p className="text-xs text-gray-600">
          ⚠️ Ten produkt zostanie dodany TYLKO na Allegro, NIE do własnego
          sklepu
        </p>
      </form>
    </Card>
  );
}
