// frontend/src/components/shop/CategoryGrid.tsx
"use client";
import React from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

interface CategoryGridProps {
  isHomePage?: boolean;
}

interface Category {
  name: string;
  slug: string;
  description: string;
  image: string;
}

const categories: Category[] = [
  {
    name: "Silniki trójfazowe",
    slug: "trojfazowe",
    description: "Niezawodne silniki do zastosowań przemysłowych",
    image: "/categories/Silniki-trojfazowe.jpg",
  },
  {
    name: "Motoreduktory",
    slug: "motoreduktory",
    description: "Precyzyjne sterowanie prędkością obrotową",
    image: "/categories/Motoreduktory-przekladnie.jpg",
  },
  {
    name: "Silniki jednofazowe",
    slug: "jednofazowe",
    description: "Idealne do lżejszych zastosowań",
    image: "/categories/silniki-jednofazowe.jpg",
  },
  {
    name: "Silniki z hamulcem",
    slug: "z-hamulcem",
    description: "Bezpieczne zatrzymywanie i pozycjonowanie",
    image: "/categories/silniki-elektryczne-z-hamulcem.jpg",
  },
  {
    name: "Silniki dwubiegowe",
    slug: "dwubiegowe",
    description: "Dwie prędkości w jednym silniku",
    image: "/categories/silniki-dwubiegowe.jpg",
  },
  {
    name: "Pompy",
    slug: "pompy",
    description: "Niezawodne i trwałe pompy",
    image:
      "https://s3.eu-north-1.amazonaws.com/piszemy.com.pl/products/products-1739621982737.JPG",
  },
  {
    name: "Wentylatory",
    slug: "wentylatory-przemyslowe",
    description: "Wydajne rozwiązania wentylacyjne",
    image: "/categories/wentylatory-przemyslowe.jpg",
  },
  {
    name: "Akcesoria",
    slug: "akcesoria",
    description: "Części zamienne i dodatki",
    image: "/categories/accessories.webp",
  },
];

export const CategoryGrid = ({ isHomePage = false }: CategoryGridProps) => {
  const { trackEvent } = useAnalytics();

  const handleCategoryClick = async (
    e: React.MouseEvent,
    category: Category,
    isMiddleClick = false
  ) => {
    if (isHomePage) {
      try {
        e.preventDefault();
        const isNewTab =
          e.ctrlKey || e.metaKey || e.button === 1 || isMiddleClick;

        await trackEvent("home_category_click", {
          location: "home_page",
          category_name: category.name,
          category_slug: category.slug,
          open_method: isNewTab ? "new_tab" : "same_tab",
          timestamp: new Date().toISOString(),
        });

        if (isNewTab) {
          window.open(`/${category.slug}`, "_blank");
        } else {
          window.location.href = `/${category.slug}`;
        }
      } catch (error) {
        console.error("❌ Błąd trackowania:", error);
        window.location.href = `/${category.slug}`;
      }
    } else {
      window.location.href = `/${category.slug}`;
    }
  };

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-8">Kategorie produktów</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((category) => (
          <div
            key={category.slug}
            className="group block rounded-lg border bg-card overflow-hidden hover:shadow-md transition-all cursor-pointer h-full"
            onClick={(e) => handleCategoryClick(e, category)}
            onAuxClick={(e) => {
              if (e.button === 1) {
                e.preventDefault();
                handleCategoryClick(e, category, true);
              }
            }}
          >
            <div className="aspect-[4/3] relative">
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4 flex flex-col h-[140px]">
              <h3 className="font-bold text-lg mb-1 line-clamp-2">
                {category.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-auto">
                {category.description}
              </p>
              <div className="flex items-center text-primary text-sm font-medium mt-3">
                <span>Zobacz produkty</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
