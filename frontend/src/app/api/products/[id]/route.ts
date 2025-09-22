// frontend/app/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { IProduct } from "@/types/product.types";

interface AllegroOfferParameter {
  id: string;
  name: string;
  values: string[];
  valuesIds?: string[];
}

interface AllegroData {
  data: {
    id: string;
    name: string;
    productSet?: Array<{
      product: {
        parameters: AllegroOfferParameter[];
      };
    }>;
    parameters: AllegroOfferParameter[];
    publication: {
      status: string;
    };
    sellingMode?: {
      price?: {
        amount: string;
      };
    };
    stock?: {
      available: number;
    };
    description?: {
      sections?: Array<{
        items?: Array<{
          content?: string;
          type?: string;
        }>;
      }>;
    };
    images?: string[];
    category?: {
      id: string;
    };
  };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const resolvedParams = await context.params;
  try {
    const params = await Promise.resolve(context.params);
    const apiUrl = new URL(
      `/api/allegro/offers/${resolvedParams.id}`,
      process.env.API_URL
    );

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Błąd HTTP: ${response.status}`);
    }

    const allegroData: AllegroData = await response.json();

    const productParams =
      allegroData.data.productSet?.[0]?.product?.parameters || [];
    const baseParams = allegroData.data.parameters || [];

    const getParamValue = (paramName: string, paramId: string) => {
      const param =
        productParams.find(
          (p: AllegroOfferParameter) => p.name === paramName || p.id === paramId
        ) ||
        baseParams.find(
          (p: AllegroOfferParameter) => p.name === paramName || p.id === paramId
        );
      return param?.values?.[0] || "";
    };
    // Ekstrakcja wartości z opisu HTML
    const descriptionHtml =
      allegroData.data.description?.sections?.[0]?.items?.[0]?.content || "";
    const descriptionMatches = {
      power: descriptionHtml.match(/(\d+(?:\.\d+)?)\s*kW/)?.[1] || "",
      rpm: descriptionHtml.match(/(\d+)\s*obr/)?.[1] || "",
      shaftDiameter:
        descriptionHtml.match(/średnica wału:\s*<b>(\d+)mm/)?.[1] || "",
      weight: descriptionHtml.match(/waga:\s*<b>(\d+(?:\.\d+)?)/)?.[1] || "",
    };

    const productData: IProduct = {
      _id: allegroData.data.id,
      name: allegroData.data.name,
      manufacturer:
        getParamValue("Marka", "248929") || allegroData.data.name.split(" ")[0],
      weight: parseFloat(
        getParamValue("Waga", "214694") || descriptionMatches.weight || "0"
      ),
      power: {
        value:
          getParamValue("Moc znamionowa", "11726") ||
          descriptionMatches.power ||
          "0",
        range: "",
        unit: "kW" as const, // DODAJ unit
      },
      rpm: {
        value:
          getParamValue("Prędkość obrotowa", "221421") ||
          descriptionMatches.rpm ||
          "0",
        range: "",
        unit: "obr/min" as const, // DODAJ unit
      },
      startType: "bezpośredni - 230/400V", // ZMIEŃ z "bezpośredni - 400 V ∆"
      shaftDiameter: parseInt(descriptionMatches.shaftDiameter || "0"),
      mechanicalSize: parseInt(
        getParamValue("Model", "237206")?.match(/\d+/)?.[0] || "0"
      ),
      condition:
        getParamValue("Stan", "11323")?.toLowerCase() === "nowy"
          ? "nowy"
          : "uzywany", // ZMIEŃ "używany" na "uzywany"
      stock: allegroData.data.stock?.available || 0,
      images: allegroData.data.images || [],
      marketplaces: {
        allegro: {
          active: allegroData.data.publication.status === "ACTIVE",
          productId: allegroData.data.id,
          price: parseFloat(allegroData.data.sellingMode?.price?.amount || "0"),
          url: `https://allegro.pl/oferta/${allegroData.data.id}`,
          description: allegroData.data.description,
          images: allegroData.data.images,
          stock: allegroData.data.stock?.available || 0,
          parameters: [...baseParams, ...productParams].map((p) => ({
            id: p.id,
            name: p.name,
            values: p.values || [],
            valuesIds: p.valuesIds,
          })),
          category: {
            id: allegroData.data.category?.id || "",
          },
          waga: getParamValue("Waga", "214694") || descriptionMatches.weight,
          napiecie: getParamValue("Napięcie", "11323") || "400",
          wielkoscMechaniczna: getParamValue("Model", "237206") || "",
          srednicaWalu: descriptionMatches.shaftDiameter || "",
        },
      },
      description:
        allegroData.data.description?.sections?.[0]?.items?.[0]?.content || "",
      hasBreak: false, // DODAJ
      hasForeignCooling: false, // DODAJ
      hasEx: false, // DODAJ
    };

    return NextResponse.json({
      success: true,
      message: "Sukces",
      data: productData,
    });
  } catch (error) {
    console.error("Błąd podczas pobierania szczegółów oferty:", error);
    return NextResponse.json(
      { success: false, error: "Nie udało się pobrać szczegółów oferty" },
      { status: 500 }
    );
  }
}
