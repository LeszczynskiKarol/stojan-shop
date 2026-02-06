// frontend/src/app/[categorySlug]/CategorySchema.tsx

interface CategorySchemaProps {
  products: Array<{
    name: string;
    price: number;
    image: string;
    categorySlug: string;
    productSlug: string;
  }>;
  categoryName: string;
}

export function CategorySchema({
  products,
  categoryName,
}: CategorySchemaProps) {
  const schema = {
    "@context": "https://schema.org/",
    "@type": "ItemList",
    name: categoryName,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: product.name,
        image: product.image,
        url: `https://silniki-elektryczne.com.pl/${product.categorySlug}/${product.productSlug}`,
        offers: {
          "@type": "Offer",
          price: product.price,
          priceCurrency: "PLN",
        },
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
