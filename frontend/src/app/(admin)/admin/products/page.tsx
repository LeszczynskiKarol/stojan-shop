// frontend/src/app/(admin)/admin/products/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useProductStore } from "@/store/productStore";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import {
  FileText,
  Edit2,
  Trash2,
  ArrowUpDown,
  Store,
  ShoppingCart,
  Home,
} from "lucide-react";
import { PDFUpload } from "@/components/shared/PDFUpload";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/Badge";
import { IProduct } from "@/types/product.types";

interface SortConfig {
  key: string | null;
  direction: "asc" | "desc";
}

export default function ProductsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    products,
    loading,
    currentPage,
    totalPages,
    itemsPerPage,
    fetchProducts,
    deleteProduct,
    setPage,
    setItemsPerPage,
    updateProduct,
  } = useProductStore();
  const [uploadingDataSheet, setUploadingDataSheet] = useState<
    Record<string, boolean>
  >({});
  const [deletingDataSheet, setDeletingDataSheet] = useState<
    Record<string, boolean>
  >({});

  const handleSort = (key: string) => {
    fetchProducts({ sortBy: key });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Czy na pewno chcesz usunąć ten produkt?")) {
      try {
        await deleteProduct(id);
        toast({
          title: "Sukces",
          description: "Produkt został usunięty",
        });
      } catch (error) {
        toast({
          title: "Błąd",
          description: "Nie udało się usunąć produktu",
          variant: "destructive",
        });
      }
    }
  };

  const getMarketplaceBadges = (product: IProduct) => {
    const badges = [];

    if (product.marketplaces?.ownStore?.active) {
      badges.push(
        <Badge
          key="store"
          variant="success"
          className="flex items-center gap-1"
        >
          <Home className="w-3 h-3" />
          Sklep
        </Badge>
      );
    }

    if (product.marketplaces?.allegro?.active) {
      badges.push(
        <Badge
          key="allegro"
          variant="success"
          className="flex items-center gap-1"
        >
          <ShoppingCart className="w-3 h-3" />
          Allegro
        </Badge>
      );
    }

    return (
      <div className="flex gap-1">
        {badges}
        {badges.length === 0 && (
          <Badge variant="secondary">Brak aktywnych kanałów</Badge>
        )}
      </div>
    );
  };

  const handleDataSheetUpload = async (productId: string, files: FileList) => {
    setUploadingDataSheet((prev) => ({ ...prev, [productId]: true }));
    try {
      const formData = new FormData();
      formData.append("images", files[0]);

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${baseUrl}/api/uploads/datasheets`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success && data.data.urls) {
        // Aktualizujemy dataSheets jako tablicę
        await updateProduct(productId, {
          dataSheets: [data.data.urls[0]], // Zamieniamy na tablicę
        });
        toast({
          title: "Sukces",
          description: "Karta katalogowa została dodana",
        });
        await fetchProducts();
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się dodać karty katalogowej",
        variant: "destructive",
      });
    } finally {
      setUploadingDataSheet((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleDeleteDataSheet = async (
    productId: string,
    _dataSheetUrl: string
  ) => {
    if (!confirm("Czy na pewno chcesz usunąć tę kartę katalogową?")) return;

    setDeletingDataSheet((prev) => ({ ...prev, [productId]: true }));
    try {
      // Czyszczenie tablicy dataSheets
      await updateProduct(productId, { dataSheets: [] });
      toast({
        title: "Sukces",
        description: "Karta katalogowa została usunięta",
      });
      await fetchProducts();
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć karty katalogowej",
        variant: "destructive",
      });
    } finally {
      setDeletingDataSheet((prev) => ({ ...prev, [productId]: false }));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lista produktów</h1>
        <div className="flex items-center gap-4">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setPage(0);
            }}
            className="px-3 py-2 border rounded-lg bg-gray-900"
          >
            <option value="20">20 na stronę</option>
            <option value="50">50 na stronę</option>
            <option value="100">100 na stronę</option>
            <option value="500">500 na stronę</option>
            <option value="1000">1000 na stronę</option>
          </select>

          <Link href="/admin/products/new">
            <Button>Dodaj nowy produkt</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Ładowanie...</div>
      ) : (
        <>
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center text-gray-200"
                    >
                      Nazwa
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">Marketplace</th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("power")}
                      className="flex items-center text-gray-200"
                    >
                      Moc
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("rpm")}
                      className="flex items-center text-gray-200"
                    >
                      Obroty
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">Stan</th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("price")}
                      className="flex items-center text-gray-200"
                    >
                      Cena
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">Zdjęcia</th>
                  <th className="px-4 py-3 text-left">Stock</th>
                  <th className="px-4 py-3 text-left">Karta katalogowa</th>
                  <th className="px-4 py-3 text-left">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-800">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/products/${product._id}`} // POPRAWIONE - backticks
                        className="text-blue-500 hover:text-blue-400"
                      >
                        {product.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {getMarketplaceBadges(product)}
                    </td>
                    <td className="px-4 py-3">{product.power.value} kW</td>
                    <td className="px-4 py-3">{product.rpm.value} obr./min</td>
                    <td className="px-4 py-3">{product.condition}</td>
                    <td className="px-4 py-3">
                      {product.marketplaces?.ownStore?.price?.toLocaleString(
                        "pl-PL",
                        {
                          style: "currency",
                          currency: "PLN",
                        }
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{product.images?.length || 0}</span>
                        {product.images?.[0] && (
                          <Image
                            src={product.images[0]}
                            alt="Miniatura"
                            width={40}
                            height={40}
                            className="object-cover rounded"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{product.stock}</td>
                    <td className="px-4 py-3">
                      <PDFUpload
                        onUpload={(files) =>
                          handleDataSheetUpload(product._id!, files)
                        }
                        onRemove={
                          product.dataSheets && product.dataSheets.length > 0
                            ? () =>
                                handleDeleteDataSheet(
                                  product._id!,
                                  product.dataSheets![0]
                                )
                            : undefined
                        }
                        currentUrls={product.dataSheets} // POPRAWIONE - currentUrls zamiast currentUrl
                        disabled={
                          uploadingDataSheet[product._id!] ||
                          deletingDataSheet[product._id!]
                        }
                      />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={
                            () =>
                              router.push(`/admin/products/${product._id}/edit`) // POPRAWIONE - backticks
                          }
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product._id!)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <Button
              onClick={() => setPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
            >
              Poprzednia strona
            </Button>
            <span>
              Strona {currentPage + 1} z {totalPages}
            </span>
            <Button
              onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
            >
              Następna strona
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
