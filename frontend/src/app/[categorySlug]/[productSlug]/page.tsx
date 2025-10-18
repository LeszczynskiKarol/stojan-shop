// frontend/src/app/[categorySlug]/[productSlug]/page.tsx
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { ProductDetails } from "@/components/shop/ProductDetails";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductSchema } from "./ProductSchema";

type GenerateMetadataProps = {
  params: Promise<{
    categorySlug: string;
    productSlug: string;
  }>;
};

export async function generateMetadata({
  params,
}: GenerateMetadataProps): Promise<Metadata> {
  const resolvedParams = await params;
  try {
    const fullSlug = `${resolvedParams.categorySlug}/${resolvedParams.productSlug}`;

    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/${fullSlug}`;

    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return {
        title: "Stojan Shop",
        description: "Sklep z silnikami elektrycznymi",
      };
    }

    const data = await res.json();
    const product = data.data;

    const seoTitle =
      product.marketplaces?.ownStore?.seo?.title ||
      `${product.name} - ${product.manufacturer}`;
    const seoDescription =
      product.marketplaces?.ownStore?.seo?.description ||
      `Kup ${product.name} - Moc: ${product.power.value}kW, Obroty: ${product.rpm.value} obr/min. Dostawa w 24h.`;

    return {
      title: seoTitle,
      description: seoDescription,
      openGraph: {
        title: seoTitle,
        description: seoDescription,
        type: "website",
        images: product.images[0]
          ? [
              {
                url: product.images[0],
                width: 800,
                height: 600,
                alt: product.name,
              },
            ]
          : [],
      },
      keywords: product.marketplaces?.ownStore?.seo?.keywords?.join(", "),
      // ⬇️⬇️⬇️ DODAJ TO ⬇️⬇️⬇️
      other: {
        "product:price:amount":
          product.marketplaces?.ownStore?.price?.toString() || "0",
        "product:price:currency": "PLN",
      },
    };
  } catch (error) {
    console.error("Błąd podczas generowania metadanych:", error);
    return {
      title: "Stojan Shop",
      description: "Sklep z silnikami elektrycznymi",
    };
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{
    categorySlug: string;
    productSlug: string;
  }>;
}) {
  const resolvedParams = await params;
  try {
    const fullSlug = `${resolvedParams.categorySlug}/${resolvedParams.productSlug}`;
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/${fullSlug}`;

    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        notFound();
      }
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    if (!data.success || !data.data) {
      notFound();
    }

    // ⬇️⬇️⬇️ DODAJ - OBLICZ KOSZT WYSYŁKI ⬇️⬇️⬇️
    let shippingCost = 25; // Domyślny koszt jako fallback

    try {
      const shippingResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/shipping/calculate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: [
              {
                productId: data.data._id || data.data.id,
                quantity: 1,
              },
            ],
            paymentMethod: "prepaid",
          }),
          cache: "no-store",
        }
      );

      if (shippingResponse.ok) {
        const shippingData = await shippingResponse.json();
        if (shippingData.success && shippingData.data?.cost) {
          shippingCost = shippingData.data.cost;
        }
      }
    } catch (shippingError) {
      console.error(
        "Błąd obliczania kosztów wysyłki dla Schema:",
        shippingError
      );
      // Używamy domyślnego kosztu
    }
    // ⬆️⬆️⬆️ KONIEC DODANIA ⬆️⬆️⬆️

    return (
      <>
        {/* ⬇️⬇️⬇️ ZMIEŃ - DODAJ shippingCost ⬇️⬇️⬇️ */}
        <ProductSchema
          product={{
            name: data.data.name,
            description: data.data.description || data.data.name,
            price: data.data.marketplaces?.ownStore?.price || 0,
            image: data.data.mainImage || data.data.images[0],
            sku: data.data.sku || data.data._id || data.data.id,
            manufacturer: data.data.manufacturer || "Stojan",
            condition:
              data.data.condition === "nowy"
                ? "new"
                : data.data.condition === "uzywany"
                ? "used"
                : "refurbished",
            inStock: (data.data.stock || 0) > 0,
            url: `https://silniki-elektryczne.com.pl/${resolvedParams.categorySlug}/${resolvedParams.productSlug}`,
            categorySlug: resolvedParams.categorySlug,
            productSlug: resolvedParams.productSlug,
            weight: data.data.weight || 0,
          }}
          shippingCost={shippingCost}
        />
        {/* ⬆️⬆️⬆️ KONIEC ZMIANY ⬆️⬆️⬆️ */}

        <div className="container mx-auto py-8 px-4 flex-grow">
          <div className="container mx-auto px-4 mb-6">
            <Breadcrumbs
              items={[
                {
                  label: data.data.categories[0]?.name || "Kategoria",
                  href: `/${resolvedParams.categorySlug}`,
                },
                {
                  label: data.data.name,
                },
              ]}
            />
          </div>
          <ProductDetails product={data.data} />
        </div>
      </>
    );
  } catch (error) {
    notFound();
  }
}
