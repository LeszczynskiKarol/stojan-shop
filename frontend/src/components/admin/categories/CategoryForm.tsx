// frontend/src/components/admin/categories/CategoryForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ICategory } from "@/types/category.types";

interface CategoryFormProps {
  initialData?: ICategory | null;
}

export function CategoryForm({ initialData }: CategoryFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    metadata: {
      title: initialData?.metadata?.title || "",
      description: initialData?.metadata?.description || "",
      keywords: initialData?.metadata?.keywords?.join(", ") || "",
    },
    productFilters: {
      powerRange: {
        min: initialData?.productFilters?.powerRange?.min || "",
        max: initialData?.productFilters?.powerRange?.max || "",
      },
      specificCategories: initialData?.productFilters?.specificCategories || [],
      manufacturers: initialData?.productFilters?.manufacturers || [],
    },
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log("Wysyłam dane:", {
      ...formData,
      metadata: {
        ...formData.metadata,
        keywords: formData.metadata.keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
      },
      productFilters: {
        powerRange: {
          min: "1",
          max: "10",
        },
        specificCategories: ["trojfazowe"],
        manufacturers: [],
      },
    });

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://www.silniki-elektryczne.com.pl";
      const url = initialData
        ? `${baseUrl}/api/categories/${initialData.id}`
        : `${baseUrl}/api/categories`;

      const method = initialData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          metadata: {
            ...formData.metadata,
            keywords: formData.metadata.keywords
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Wystąpił błąd podczas zapisywania kategorii"
        );
      }

      router.push("/admin/categories");
      router.refresh();
    } catch (error) {
      console.error("Błąd podczas zapisywania kategorii:", error);
      setError(
        error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nazwa</label>
          <Input
            value={formData.name}
            onChange={(e) => {
              const newName = e.target.value;
              setFormData((prev) => ({
                ...prev,
                name: newName,
                // Automatycznie generuj slug tylko jeśli pole jest puste lub nie było modyfikowane
                slug: prev.slug === "" ? generateSlug(newName) : prev.slug,
              }));
            }}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">URL</label>
          <Input
            value={formData.slug}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, slug: e.target.value }))
            }
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Opis</label>
          <Textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            rows={4}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Filtrowanie produktów</h3>

          <div>
            <label className="block text-sm font-medium mb-1">
              Zakres mocy (kW)
            </label>
            <div className="flex gap-4">
              <Input
                type="number"
                placeholder="Min"
                value={formData.productFilters.powerRange.min}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    productFilters: {
                      ...prev.productFilters,
                      powerRange: {
                        ...prev.productFilters.powerRange,
                        min: e.target.value,
                      },
                    },
                  }))
                }
              />
              <Input
                type="number"
                placeholder="Max"
                value={formData.productFilters.powerRange.max}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    productFilters: {
                      ...prev.productFilters,
                      powerRange: {
                        ...prev.productFilters.powerRange,
                        max: e.target.value,
                      },
                    },
                  }))
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Powiązane kategorie
            </label>
            <select
              multiple
              className="w-full border rounded p-2"
              value={formData.productFilters.specificCategories}
              onChange={(e) => {
                const selectedOptions = Array.from(
                  e.target.selectedOptions,
                  (option) => option.value
                );
                setFormData((prev) => ({
                  ...prev,
                  productFilters: {
                    ...prev.productFilters,
                    specificCategories: selectedOptions,
                  },
                }));
              }}
            >
              <option value="trojfazowe">Silniki trójfazowe</option>
              <option value="jednofazowe">Silniki jednofazowe</option>
              <option value="z-hamulcem">Silniki z hamulcem</option>
              <option value="pierscieniowe">Silniki pierścieniowe</option>
              <option value="dwubiegowe">Silniki dwubiegowe</option>
              <option value="silniki-elektryczne">Wszystkie silniki</option>
              <option value="motoreduktory">Motoreduktory</option>
              <option value="shop">Wszystkie napędy (shop)</option>
              <option value="wentylatory-przemyslowe">Wentylatory</option>
              <option value="akcesoria">Akcesoria</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Producenci</label>
            <select
              multiple
              className="w-full border rounded p-2"
              value={formData.productFilters.manufacturers}
              onChange={(e) => {
                const selectedOptions = Array.from(
                  e.target.selectedOptions,
                  (option) => option.value
                );
                setFormData((prev) => ({
                  ...prev,
                  productFilters: {
                    ...prev.productFilters,
                    manufacturers: selectedOptions,
                  },
                }));
              }}
            >
              <option value="siemens">Siemens</option>
              <option value="abb">ABB</option>
              {/* dodaj więcej producentów */}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">SEO</h3>

          <div>
            <label className="block text-sm font-medium mb-1">Tytuł SEO</label>
            <Input
              value={formData.metadata.title}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  metadata: { ...prev.metadata, title: e.target.value },
                }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Opis SEO</label>
            <Textarea
              value={formData.metadata.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  metadata: { ...prev.metadata, description: e.target.value },
                }))
              }
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Słowa kluczowe (oddzielone przecinkami)
            </label>
            <Input
              value={formData.metadata.keywords}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  metadata: { ...prev.metadata, keywords: e.target.value },
                }))
              }
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Zapisywanie..." : "Zapisz"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/categories")}
        >
          Anuluj
        </Button>
      </div>
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded mb-4">{error}</div>
      )}
    </form>
  );
}
