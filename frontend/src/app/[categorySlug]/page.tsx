// frontend/src/app/[categorySlug]/page.tsx
import { Metadata } from "next";
import CategoryPageClient from "./CategoryPageClient";

// Mapowanie mocy dla meta tagów
interface PowerPageConfig {
  power: number;
  rpmMin?: number;
  rpmMax?: number;
  rpmLabel?: string;
}

const POWER_MAPPING: Record<string, PowerPageConfig> = {
  // SAME MOCE (bez obrotów)
  "silniki-elektryczne-009-kw": { power: 0.09 },
  "silniki-elektryczne-012-kw": { power: 0.12 },
  "silniki-elektryczne-018-kw": { power: 0.18 },
  "silniki-elektryczne-025-kw": { power: 0.25 },
  "silniki-elektryczne-037-kw": { power: 0.37 },
  "silniki-elektryczne-055-kw": { power: 0.55 },
  "silniki-elektryczne-075-kw": { power: 0.75 },
  "silniki-elektryczne-1-1-kw": { power: 1.1 },
  "silniki-elektryczne-1-5-kw": { power: 1.5 },
  "silniki-elektryczne-2-2-kw": { power: 2.2 },
  "silniki-elektryczne-3-kw": { power: 3 },
  "silniki-elektryczne-4-kw": { power: 4 },
  "silniki-elektryczne-5-5-kw": { power: 5.5 },
  "silniki-elektryczne-7-5-kw": { power: 7.5 },
  "silniki-elektryczne-11-kw": { power: 11 },
  "silniki-elektryczne-18-5-kw": { power: 18.5 },
  "silniki-elektryczne-22-kw": { power: 22 },
  "silniki-elektryczne-30-kw": { power: 30 },
  "silniki-elektryczne-55-kw": { power: 55 },
  "silniki-elektryczne-75-kw": { power: 75 },
  "silniki-elektryczne-110-kw": { power: 110 },
  "silniki-elektryczne-160-kw": { power: 160 },
  "silniki-elektryczne-200-kw": { power: 200 },

  // MOC + OBROTY (NOWE!)
  "silniki-elektryczne-3-kw-1400-obr": {
    power: 3,
    rpmMin: 1200,
    rpmMax: 1600,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-3-kw-3000-obr": {
    power: 3,
    rpmMin: 2700,
    rpmMax: 3100,
    rpmLabel: "3000",
  },
  "silniki-elektryczne-5-5-kw-1400-obr": {
    power: 5.5,
    rpmMin: 1200,
    rpmMax: 1600,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-5-5-kw-3000-obr": {
    power: 5.5,
    rpmMin: 2700,
    rpmMax: 3100,
    rpmLabel: "3000",
  },
  // DODAJ WIĘCEJ KOMBINACJI TUTAJ

  // 0.09 kW
  "silniki-elektryczne-009-kw-700-obr": {
    power: 0.09,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-009-kw-900-obr": {
    power: 0.09,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-009-kw-1400-obr": {
    power: 0.09,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-009-kw-2900-obr": {
    power: 0.09,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 0.12 kW
  "silniki-elektryczne-012-kw-700-obr": {
    power: 0.12,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-012-kw-900-obr": {
    power: 0.12,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-012-kw-1400-obr": {
    power: 0.12,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-012-kw-2900-obr": {
    power: 0.12,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 0.18 kW
  "silniki-elektryczne-018-kw-700-obr": {
    power: 0.18,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-018-kw-900-obr": {
    power: 0.18,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-018-kw-1400-obr": {
    power: 0.18,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-018-kw-2900-obr": {
    power: 0.18,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 0.25 kW
  "silniki-elektryczne-025-kw-700-obr": {
    power: 0.25,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-025-kw-900-obr": {
    power: 0.25,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-025-kw-1400-obr": {
    power: 0.25,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-025-kw-2900-obr": {
    power: 0.25,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 0.37 kW
  "silniki-elektryczne-037-kw-700-obr": {
    power: 0.37,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-037-kw-900-obr": {
    power: 0.37,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-037-kw-1400-obr": {
    power: 0.37,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-037-kw-2900-obr": {
    power: 0.37,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 0.55 kW
  "silniki-elektryczne-055-kw-700-obr": {
    power: 0.55,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-055-kw-900-obr": {
    power: 0.55,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-055-kw-1400-obr": {
    power: 0.55,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-055-kw-2900-obr": {
    power: 0.55,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 0.75 kW
  "silniki-elektryczne-075-kw-700-obr": {
    power: 0.75,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-075-kw-900-obr": {
    power: 0.75,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-075-kw-1400-obr": {
    power: 0.75,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-075-kw-2900-obr": {
    power: 0.75,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 1.1 kW
  "silniki-elektryczne-1-1-kw-700-obr": {
    power: 1.1,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-1-1-kw-900-obr": {
    power: 1.1,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-1-1-kw-1400-obr": {
    power: 1.1,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-1-1-kw-2900-obr": {
    power: 1.1,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 1.5 kW
  "silniki-elektryczne-1-5-kw-700-obr": {
    power: 1.5,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-1-5-kw-900-obr": {
    power: 1.5,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-1-5-kw-1400-obr": {
    power: 1.5,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-1-5-kw-2900-obr": {
    power: 1.5,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 2.2 kW
  "silniki-elektryczne-2-2-kw-700-obr": {
    power: 2.2,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-2-2-kw-900-obr": {
    power: 2.2,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-2-2-kw-1400-obr": {
    power: 2.2,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-2-2-kw-2900-obr": {
    power: 2.2,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 3 kW
  "silniki-elektryczne-3-kw-700-obr": {
    power: 3,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-3-kw-900-obr": {
    power: 3,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },

  "silniki-elektryczne-3-kw-2900-obr": {
    power: 3,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 4 kW
  "silniki-elektryczne-4-kw-700-obr": {
    power: 4,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-4-kw-900-obr": {
    power: 4,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-4-kw-1400-obr": {
    power: 4,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-4-kw-2900-obr": {
    power: 4,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 5.5 kW
  "silniki-elektryczne-5-5-kw-700-obr": {
    power: 5.5,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-5-5-kw-900-obr": {
    power: 5.5,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },

  "silniki-elektryczne-5-5-kw-2900-obr": {
    power: 5.5,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 7.5 kW
  "silniki-elektryczne-7-5-kw-700-obr": {
    power: 7.5,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-7-5-kw-900-obr": {
    power: 7.5,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-7-5-kw-1400-obr": {
    power: 7.5,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-7-5-kw-2900-obr": {
    power: 7.5,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 11 kW
  "silniki-elektryczne-11-kw-700-obr": {
    power: 11,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-11-kw-900-obr": {
    power: 11,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-11-kw-1400-obr": {
    power: 11,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-11-kw-2900-obr": {
    power: 11,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 18.5 kW
  "silniki-elektryczne-18-5-kw-700-obr": {
    power: 18.5,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-18-5-kw-900-obr": {
    power: 18.5,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-18-5-kw-1400-obr": {
    power: 18.5,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-18-5-kw-2900-obr": {
    power: 18.5,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },
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
  const powerConfig = POWER_MAPPING[categorySlug];
  if (powerConfig) {
    const formattedPower = powerConfig.power.toString().replace(".", ",");
    const rpmSuffix = powerConfig.rpmLabel
      ? ` ${powerConfig.rpmLabel} obr/min`
      : "";
    const rpmKeyword = powerConfig.rpmLabel
      ? ` ${powerConfig.rpmLabel} obr`
      : "";

    return {
      title: `Silnik elektryczny ${formattedPower} kW${rpmSuffix} - oferta, ceny | sklep internetowy Stojan`,
      description: `Silniki elektryczne o mocy ${formattedPower} kW${rpmSuffix}. Szeroki wybór napędów ${formattedPower} kW${rpmKeyword} różnych producentów. Sprawdź dostępność i ceny!`,
      keywords: `silnik ${formattedPower} kw${rpmKeyword}, silnik elektryczny ${formattedPower} kw${rpmKeyword}, motor ${formattedPower} kw, napęd ${formattedPower} kw`,
      openGraph: {
        title: `Silnik elektryczny ${formattedPower} kW${rpmSuffix} - sklep internetowy Stojan`,
        description: `Silniki elektryczne o mocy ${formattedPower} kW${rpmSuffix} w ofercie sklep internetowy Stojan`,
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
