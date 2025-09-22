// frontend/src/app/[categorySlug]/[productSlug]/page.tsx
import { notFound } from "next/navigation";
import { ProductDetails } from "@/components/shop/ProductDetails";
import { Metadata } from "next";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";

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

    return (
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
    );
  } catch (error) {}
}
