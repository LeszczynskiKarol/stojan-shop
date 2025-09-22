// frontend/src/components/shop/PopularProducts.tsx
import Link from "next/link";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { IProduct } from "@/types/product.types";

interface PopularProductsProps {
  isHomePage?: boolean;
}

export const PopularProducts = ({
  isHomePage = false,
}: PopularProductsProps) => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    const fetchPopularProducts = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/products/popular?limit=8`
        );
        if (!res.ok) {
          throw new Error("Failed to fetch popular products");
        }
        const data = await res.json();
        setProducts(data.data.products);
      } catch (error) {
        console.error("Error fetching popular products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularProducts();
  }, []);

  const handleProductClick = async (
    e: React.MouseEvent,
    product: IProduct,
    isMiddleClick = false
  ) => {
    if (isHomePage) {
      try {
        e.preventDefault();
        const isNewTab =
          e.ctrlKey || e.metaKey || e.button === 1 || isMiddleClick;

        await trackEvent("home_popular_product_click", {
          location: "home_page",
          product_id: product.id,
          product_name: product.name,
          category_name: product.categories?.[0]?.name,
          open_method: isNewTab ? "new_tab" : "same_tab",
          timestamp: new Date().toISOString(),
        });

        const productUrl = `/${product.categories?.[0]?.slug}/${product.marketplaces.ownStore?.slug}`;
        if (isNewTab) {
          window.open(productUrl, "_blank");
        } else {
          window.location.href = productUrl;
        }
      } catch (error) {
        console.error("❌ Błąd trackowania:", error);
        const productUrl = `/${product.categories?.[0]?.slug}/${product.marketplaces.ownStore?.slug}`;
        window.location.href = productUrl;
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">Ładowanie...</div>
    );
  }

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-8">Najpopularniejsze produkty</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/${product.categories?.[0]?.slug}/${product.marketplaces.ownStore?.slug}`}
            onClick={async (e) => {
              if (isHomePage) {
                const isNewTab = e.ctrlKey || e.metaKey;
                if (!isNewTab) {
                  e.preventDefault();
                }

                try {
                  await trackEvent("home_popular_product_click", {
                    location: "home_page",
                    product_id: product.id,
                    product_name: product.name,
                    category_name: product.categories?.[0]?.name,
                    open_method: isNewTab ? "new_tab" : "same_tab",
                    timestamp: new Date().toISOString(),
                  });

                  if (!isNewTab) {
                    window.location.href = `/${product.categories?.[0]?.slug}/${product.marketplaces.ownStore?.slug}`;
                  }
                } catch (error) {
                  console.error("❌ Błąd trackowania:", error);
                  if (!isNewTab) {
                    window.location.href = `/${product.categories?.[0]?.slug}/${product.marketplaces.ownStore?.slug}`;
                  }
                }
              }
            }}
          >
            <div className="group block rounded-lg border bg-card overflow-hidden hover:shadow-md transition-all cursor-pointer">
              <div className="aspect-[4/3] relative">
                <Image
                  src={product.images[0] || "/placeholder.png"}
                  alt={product.name}
                  fill
                  className="object-contain p-4"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1 line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {product.power.value} | {product.rpm.value} obr./min
                </p>
                <p className="text-lg font-bold text-primary mb-3">
                  {formatPrice(product.marketplaces.ownStore?.price || 0)}
                </p>
                <div className="flex items-center text-primary text-sm font-medium">
                  <span>Zobacz szczegóły</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PopularProducts;
