// frontend/src/app/[categorySlug]/[productSlug]/ProductSchema.tsx

interface ProductSchemaProps {
  product: {
    name: string;
    description: string;
    price: number;
    image: string;
    sku: string;
    manufacturer: string;
    condition: "new" | "used" | "refurbished";
    inStock: boolean;
    url: string;
    categorySlug: string;
    productSlug: string;
  };
}

export function ProductSchema({ product }: ProductSchemaProps) {
  const conditionMap = {
    nowy: "NewCondition",
    uzywany: "UsedCondition",
    nieuzywany: "RefurbishedCondition",
  };

  const schema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    description: product.description || product.name,
    image: product.image,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: product.manufacturer || "Stojan",
    },
    offers: {
      "@type": "Offer",
      url: product.url,
      priceCurrency: "PLN",
      price: product.price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      itemCondition: `https://schema.org/${
        conditionMap[product.condition as keyof typeof conditionMap] ||
        "NewCondition"
      }`,
      availability: `https://schema.org/${
        product.inStock ? "InStock" : "OutOfStock"
      }`,
      seller: {
        "@type": "Organization",
        name: "Stojan - Silniki Elektryczne",
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
