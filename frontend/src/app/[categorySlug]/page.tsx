// frontend/src/app/[categorySlug]/page.tsx
import { Metadata } from "next";
import CategoryPageClient from "./CategoryPageClient";

// Mapowanie mocy dla meta tagów
const POWER_MAPPING: Record<string, number> = {
  "silniki-elektryczne-009-kw": 0.09,
  "silniki-elektryczne-012-kw": 0.12,
  "silniki-elektryczne-018-kw": 0.18,
  "silniki-elektryczne-025-kw": 0.25,
  "silniki-elektryczne-037-kw": 0.37,
  "silniki-elektryczne-055-kw": 0.55,
  "silniki-elektryczne-075-kw": 0.75,
  "silniki-elektryczne-1-1-kw": 1.1,
  "silniki-elektryczne-1-5-kw": 1.5,
  "silniki-elektryczne-2-2-kw": 2.2,
  "silniki-elektryczne-3-kw": 3,
  "silniki-elektryczne-4-kw": 4,
  "silniki-elektryczne-5-5-kw": 5.5,
  "silniki-elektryczne-7-5-kw": 7.5,
  "silniki-elektryczne-11-kw": 11,
  "silniki-elektryczne-18-5-kw": 18.5,
  "silniki-elektryczne-22-kw": 22,
  "silniki-elektryczne-30-kw": 30,
  "silniki-elektryczne-55-kw": 55,
  "silniki-elektryczne-75-kw": 75,
  "silniki-elektryczne-110-kw": 110,
  "silniki-elektryczne-160-kw": 160,
  "silniki-elektryczne-200-kw": 200,
};

type PageProps = {
  params: Promise<{ categorySlug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { categorySlug } = await params;

  // Sprawdź czy to favicon
  if (categorySlug === "favicon.ico") {
    return {
      title: "Silniki elektryczne - sklep internetowy Stojan",
      description: "Sklep z silnikami elektrycznymi",
    };
  }

  // SPRAWDŹ CZY TO STRONA MOCY
  const powerValue = POWER_MAPPING[categorySlug];
  if (powerValue) {
    const formattedPower = powerValue.toString().replace(".", ",");
    return {
      title: `Silniki elektryczne ${formattedPower} kW - oferta, ceny | sklep internetowy Stojan`,
      description: `Silniki elektryczne o mocy ${formattedPower} kW. Szeroki wybór napędów ${formattedPower} kW różnych producentów. Sprawdź dostępność i ceny!`,
      keywords: `silnik ${formattedPower} kw, silnik elektryczny ${formattedPower} kw, motor ${formattedPower} kw, napęd ${formattedPower} kw`,
      openGraph: {
        title: `Silniki elektryczne ${formattedPower} kW - sklep internetowy Stojan`,
        description: `Silniki elektryczne o mocy ${formattedPower} kW w ofercie sklep internetowy Stojan`,
        type: "website",
      },
    };
  }

  // DLA KATEGORII - istniejąca logika
  try {
    const resolvedSlug =
      categorySlug === "hamulcem" ? "z-hamulcem" : categorySlug;
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/categories/${resolvedSlug}`;

    const res = await fetch(url, {
      next: { revalidate: 60 }, // Cache na 1 minutę zamiast no-store
    });

    if (!res.ok) {
      // Zwróć domyślne metadata dla znanych kategorii
      const defaultTitles: Record<string, string> = {
        trojfazowe: "Silniki trójfazowe elektryczne",
        jednofazowe: "Silniki jednofazowe 230V",
        "z-hamulcem": "Silniki z hamulcem",
        motoreduktory: "Motoreduktory",
        akcesoria: "Akcesoria do silników",
      };

      if (defaultTitles[resolvedSlug]) {
        return {
          title: defaultTitles[resolvedSlug],
          description: `${defaultTitles[resolvedSlug]} - sprawdź ofertę`,
        };
      }

      return {
        title: "Kategoria produktów",
        description: "Zobacz nasze produkty",
      };
    }

    const data = await res.json();
    const category = data.data;

    return {
      title:
        category.seo?.title || `${category.name} - sklep internetowy Stojan`,
      description: category.seo?.description || `${category.name} w ofercie`,
    };
  } catch (error) {
    return {
      title: "Produkty - sklep internetowy Stojan",
      description: "Zobacz naszą ofertę",
    };
  }
}

export default function CategoryPage() {
  const categoryMapper: Record<string, string> = {
    hamulcem: "z-hamulcem",
  };
  return <CategoryPageClient categoryMapper={categoryMapper} />;
}
