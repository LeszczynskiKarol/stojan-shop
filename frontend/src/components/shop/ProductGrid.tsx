// frontend/src/components/shop/ProductGrid.tsx
import { useAnalytics } from "@/hooks/useAnalytics";
import { IProduct } from "@/types/product.types";
import React from "react";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: IProduct[];
  isHomePage?: boolean;
}

export const ProductGrid = ({
  products,
  isHomePage = false,
}: ProductGridProps) => {
  if (!Array.isArray(products)) {
    console.error("ProductGrid otrzymał nieprawidłowe dane:", products);
    return null;
  }

  // Sprawdź strukturę każdego produktu
  products.forEach((product, index) => {
    if (!product.categories || !product.marketplaces?.ownStore?.slug) {
      console.warn(`Produkt #${index} ma nieprawidłową strukturę:`, product);
    }
  });

  const { trackEvent, getPageLocation } = useAnalytics();

  const getProductUrl = (product: IProduct) => {
    if (!product.categories || !product.marketplaces?.ownStore?.slug) {
      return "/";
    }

    // Lista wszystkich głównych kategorii
    const mainCategories = [
      "trojfazowe",
      "jednofazowe",
      "wentylatory-przemyslowe",
      "motoreduktory",
      "z-hamulcem",
      "dwubiegowe",
      "pierscieniowe",
      "akcesoria",
    ];

    // Szukamy pierwszej głównej kategorii produktu
    const mainCategory = product.categories.find((cat) =>
      mainCategories.includes(cat.slug)
    );

    // Jeśli znaleziono główną kategorię, użyj jej
    if (mainCategory) {
      return `/${mainCategory.slug}/${product.marketplaces.ownStore.slug}`;
    }

    // Jeśli nie znaleziono głównej, użyj pierwszej kategorii
    if (product.categories.length > 0) {
      return `/${product.categories[0].slug}/${product.marketplaces.ownStore.slug}`;
    }

    // Domyślny zwrot jeśli brak kategorii
    return "/";
  };

  const handleProductClick = (e: React.MouseEvent, product: IProduct) => {
    const isNewTab = e.ctrlKey || e.metaKey || e.button === 1;

    trackEvent("product_click", {
      location: getPageLocation(),
      product_id: product.id,
      product_name: product.name,
      product_category: product.categories?.[0]?.name,
      open_method: isNewTab ? "new_tab" : "same_tab",
      timestamp: new Date().toISOString(),
    })
      .then(() => {
        const url = getProductUrl(product);
        if (isNewTab) {
          window.open(url, "_blank");
        } else {
          window.location.href = url;
        }
      })
      .catch((error) => {
        console.error("❌ Błąd rejestracji kliknięcia w produkt:", error);
      });
  };

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <div
          key={product.id}
          onClick={(e) => handleProductClick(e, product)}
          onAuxClick={(e) => {
            // Obsługa kliknięcia środkowym przyciskiem
            if (e.button === 1) {
              e.preventDefault();
              handleProductClick(e, product);
            }
          }}
        >
          <ProductCard product={product} isHomePage={isHomePage} />
        </div>
      ))}
    </div>
  );
};
