// frontend/src/components/products/AllegroProductBox.tsx
"use client";
import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/use-toast";
import { ImageUpload } from "@/components/shared/ImageUpload";
import Image from "next/image";
import { X } from "lucide-react";
import { getManufacturerId } from "@/utils/allegroManufacturers";

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
  const [manufacturerCode, setManufacturerCode] = useState("");
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

    // DODAJ WALIDACJĘ MOCY I OBROTÓW
    if (!power || !rpm || !weight) {
      toast({
        title: "Błąd walidacji",
        description: "Moc, obroty i waga są wymagane",
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
        const powerKw = parseFloat(power) || 0;
        const powerInWatts = Math.round(powerKw * 1000);

        if (powerInWatts > 50000) {
          toast({
            title: "Błąd",
            description: "Moc przekracza limit 50 kW dla motoreduktorów",
            variant: "destructive",
          });
          return;
        }

        // UŻYJ FUNKCJI getManufacturerId():
        const manufacturerData = getManufacturerId(manufacturer);

        productParameters = [
          {
            id: "11726",
            name: "Moc znamionowa",
            values: [powerInWatts.toString()],
          },
          { id: "221421", name: "Prędkość obrotowa", values: [rpm] },
          { id: "214694", name: "Waga", values: [weight] },
          ...(model ? [{ id: "237206", name: "Model", values: [model] }] : []),
          {
            id: "224017",
            name: "Kod producenta",
            values: [model || `MR-${Date.now()}`],
          },
          {
            id: "248811",
            name: "Marka",
            values: [manufacturerData.value], // Nazwa producenta
            valuesIds: [manufacturerData.id], // ID z Allegro
          },
          {
            id: "18654",
            name: "Rodzaj motoreduktora",
            values: ["walcowy"],
            valuesIds: ["18654_1"],
          },
        ];
      } else {
        // SILNIKI
        // UŻYJ FUNKCJI getManufacturerId():
        const manufacturerData = getManufacturerId(manufacturer);

        productParameters = [
          { id: "219137", name: "Moc", values: [power] },
          { id: "219153", name: "Obroty", values: [rpm] },
          { id: "214478", name: "Waga", values: [weight] },
          { id: "219149", name: "Średnica wału", values: [shaftDiameter] },
          // ZMIEŃ TĘ LINIĘ - Model TYLKO jeśli wypełniony:
          ...(model ? [{ id: "237206", name: "Model", values: [model] }] : []),
          {
            id: "224017",
            name: "Kod producenta",
            values: [model || `S-${Date.now()}`], // Kod producenta MUSI być
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
              items: allegroDescription
                ? [
                    // Tekst jako pierwszy item
                    {
                      type: "TEXT",
                      content:
                        `<h2>${allegroName}</h2>` +
                        allegroDescription
                          .split("\n")
                          .filter((line) => line.trim())
                          .map((line) => `<p>${line.trim()}</p>`)
                          .join(""),
                    },
                    // Obrazek jako drugi item
                    ...(images[0]
                      ? [
                          {
                            type: "IMAGE",
                            url: images[0],
                          },
                        ]
                      : []),
                  ]
                : [
                    {
                      type: "TEXT",
                      content: `<h1>${allegroName}</h1><p>Moc: ${power}kW, Obroty: ${rpm}obr/min</p>`,
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

  const handleImageUpload = async (files: FileList) => {
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("images", file);
      });

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${baseUrl}/api/uploads/products`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success && data.data.urls) {
        setImages([...images, ...data.data.urls]);
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się przesłać zdjęć",
        variant: "destructive",
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <Card className="p-6 border-2 border-orange-500 bg-orange-50 dark:bg-orange-950 dark:border-orange-700">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-orange-800 dark:text-orange-200">
          📦 Dodaj ten sam produkt NA ALLEGRO
        </h2>
        <p className="text-sm text-orange-600 dark:text-orange-400">
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
              placeholder="np. SEW (lub zostaw puste = 'bez marki')"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Pozostaw puste aby użyć "bez marki"
            </span>
          </div>

          {/* MODEL */}
          <div>
            <label className="text-sm font-medium">Model</label>
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="np. DRS71M4"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Opcjonalnie - identyfikator modelu
            </span>
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

        <div className="space-y-2">
          <label className="text-sm font-medium">Zdjęcia produktu *</label>
          <div className="grid grid-cols-4 gap-4">
            {images.map((url, index) => (
              <div key={url} className="relative group">
                <Image
                  src={url}
                  alt={`Zdjęcie ${index + 1}`}
                  width={150}
                  height={150}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 h-6 w-6"
                  onClick={() => handleRemoveImage(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <ImageUpload onUpload={handleImageUpload} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {images.length} zdjęć dodanych
          </p>
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

        <p className="text-xs text-gray-600 dark:text-gray-400">
          ⚠️ Ten produkt zostanie dodany TYLKO na Allegro, NIE do własnego
          sklepu
        </p>
      </form>
    </Card>
  );
}
