// frontend/src/app/(admin)/admin/marketplaces/olx/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import {
  Download,
  Check,
  X,
  Edit2,
  Save,
  Upload,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Image as ImageIcon,
  Database,
  Cloud,
} from "lucide-react";

interface OlxAdvert {
  id: string;
  title: string;
  description?: string;
  status: string;
  price?: {
    value: number;
    currency: string;
  };
  valid_to?: string;
  advert_views?: number;
  url?: string;
  images?: Array<{ url: string }>;
  created_at?: string;
  external_id?: string;
}

const OlxPage = () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const router = useRouter();
  const { toast } = useToast();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adverts, setAdverts] = useState<OlxAdvert[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAdverts, setTotalAdverts] = useState(0);
  const [editingField, setEditingField] = useState<{
    id: string;
    field: string;
  } | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<"local" | "olx">("local");
  const itemsPerPage = 20;

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("token");
    const fullUrl = `${API_URL}${url}`;

    return fetch(fullUrl, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    });
  };

  useEffect(() => {
    checkAuthStatus();
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("auth") === "success") {
      setIsAuthenticated(true);
      toast({
        title: "Sukces",
        description: "Pomyślnie połączono z OLX",
      });
      router.replace("/admin/marketplaces/olx");
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetchWithAuth("/api/olx/auth/status");
      const data = await response.json();

      if (data.success && data.data.authenticated) {
        setIsAuthenticated(true);
        // Domyślnie pobierz z lokalnej bazy
        fetchAdverts(1, "local");
      }
    } catch (error) {
      console.error("Błąd sprawdzania autoryzacji:", error);
    }
  };

  const fetchAdverts = async (
    page: number,
    source: "local" | "olx" = dataSource
  ) => {
    setLoading(true);
    try {
      const offset = (page - 1) * itemsPerPage;
      const response = await fetchWithAuth(
        `/api/olx/adverts?limit=${itemsPerPage}&offset=${offset}&source=${source}`
      );
      const data = await response.json();

      if (data.success && data.data) {
        const advertsData = data.data.data || [];
        const totalCount = data.data.total_count || 0;

        setAdverts(advertsData);
        setTotalAdverts(totalCount);
        setTotalPages(Math.ceil(totalCount / itemsPerPage));
        setCurrentPage(page);

        console.log(
          `Pobrano ${advertsData.length} ofert, łącznie: ${totalCount}`
        );
      }
    } catch (error) {
      console.error("Błąd pobierania ofert:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać ofert",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (advertId: string, field: string, currentValue: any) => {
    setEditingField({ id: advertId, field });
    setEditValues({ ...editValues, [`${advertId}_${field}`]: currentValue });
  };

  const handleSave = async (advertId: string, field: string) => {
    const value = editValues[`${advertId}_${field}`];

    try {
      const response = await fetchWithAuth(`/api/olx/adverts/${advertId}`, {
        method: "PATCH",
        body: JSON.stringify({ [field]: value }),
      });

      if (response.ok) {
        toast({
          title: "Sukces",
          description: `Zaktualizowano ${field}`,
        });

        setAdverts(
          adverts.map((advert) =>
            advert.id === advertId
              ? {
                  ...advert,
                  [field]:
                    field === "price" ? { ...advert.price, value } : value,
                }
              : advert
          )
        );
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować oferty",
        variant: "destructive",
      });
    }

    setEditingField(null);
  };

  const handleExtend = async (advertId: string) => {
    try {
      const response = await fetchWithAuth(
        `/api/olx/adverts/${advertId}/extend`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        toast({
          title: "Sukces",
          description: "Oferta została przedłużona",
        });
        fetchAdverts(currentPage);
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się przedłużyć oferty",
        variant: "destructive",
      });
    }
  };

  const handleAuth = async () => {
    try {
      const response = await fetchWithAuth("/api/olx/auth");
      const data = await response.json();

      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się rozpocząć autoryzacji",
        variant: "destructive",
      });
    }
  };

  const handleImportAll = async () => {
    setIsImporting(true);
    try {
      const response = await fetchWithAuth("/api/olx/adverts/import", {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sukces",
          description: `Zaimportowano ${data.data.totalImported} ofert z OLX do lokalnej bazy`,
        });
        // Po imporcie przełącz na lokalną bazę i odśwież
        setDataSource("local");
        fetchAdverts(1, "local");
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zaimportować ofert",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const switchDataSource = (source: "local" | "olx") => {
    setDataSource(source);
    setCurrentPage(1);
    fetchAdverts(1, source);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchAdverts(page, dataSource);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Zarządzanie OLX</h1>
        <div className="border rounded-lg p-8 text-center">
          <p className="mb-4">Nie jesteś połączony z OLX</p>
          <button
            onClick={handleAuth}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            Połącz z OLX
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Zarządzanie OLX</h1>
          <p className="text-gray-400 mt-1">
            Łącznie ofert: {totalAdverts} | Strona {currentPage} z {totalPages}
          </p>
        </div>

        <div className="flex gap-4">
          {/* Przełącznik źródła danych */}
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => switchDataSource("local")}
              className={`px-4 py-2 rounded ${
                dataSource === "local"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Database className="w-4 h-4 inline mr-2" />
              Lokalna baza
            </button>
            <button
              onClick={() => switchDataSource("olx")}
              className={`px-4 py-2 rounded ${
                dataSource === "olx"
                  ? "bg-green-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Cloud className="w-4 h-4 inline mr-2" />
              OLX API
            </button>
          </div>

          <button
            onClick={handleImportAll}
            disabled={isImporting}
            className={`px-4 py-2 ${
              isImporting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            } text-white rounded-lg flex items-center gap-2`}
          >
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Importowanie...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Importuj wszystko do bazy
              </>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600" />
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-x-auto relative">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-900">
                  <th className="px-4 py-3 text-left w-32">Zdjęcia</th>
                  <th className="px-4 py-3 text-left">Tytuł</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Cena</th>
                  <th className="px-4 py-3 text-left">Ważne do</th>
                  <th className="px-4 py-3 text-left">Wyświetlenia</th>
                  <th className="px-4 py-3 text-left">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {adverts.map((advert) => (
                  <tr key={advert.id} className="hover:bg-gray-800">
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {advert.images?.slice(0, 3).map((img, idx) => (
                          <div
                            key={idx}
                            className="relative"
                            onMouseEnter={() =>
                              setHoveredImage(`${advert.id}-${idx}`)
                            }
                            onMouseLeave={() => setHoveredImage(null)}
                          >
                            <img
                              src={img.url}
                              alt=""
                              className="w-10 h-10 object-cover rounded cursor-pointer"
                            />
                          </div>
                        )) || (
                          <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-gray-500" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {editingField?.id === advert.id &&
                      editingField?.field === "title" ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editValues[`${advert.id}_title`] || ""}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                [`${advert.id}_title`]: e.target.value,
                              })
                            }
                            className="px-2 py-1 bg-gray-700 rounded flex-1"
                            onKeyPress={(e) => {
                              if (e.key === "Enter")
                                handleSave(advert.id, "title");
                            }}
                          />
                          <button
                            onClick={() => handleSave(advert.id, "title")}
                            className="p-1 hover:bg-gray-700 rounded"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer hover:text-blue-400"
                          onClick={() =>
                            handleEdit(advert.id, "title", advert.title)
                          }
                        >
                          {advert.title}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {advert.status === "active" ? (
                        <span className="bg-green-500 text-white px-2 py-1 rounded-full text-sm">
                          Aktywne
                        </span>
                      ) : (
                        <span className="bg-gray-500 text-white px-2 py-1 rounded-full text-sm">
                          {advert.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingField?.id === advert.id &&
                      editingField?.field === "price" ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={editValues[`${advert.id}_price`] || ""}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                [`${advert.id}_price`]: e.target.value,
                              })
                            }
                            className="px-2 py-1 bg-gray-700 rounded w-24"
                            onKeyPress={(e) => {
                              if (e.key === "Enter")
                                handleSave(advert.id, "price");
                            }}
                          />
                          <button
                            onClick={() => handleSave(advert.id, "price")}
                            className="p-1 hover:bg-gray-700 rounded"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer hover:text-blue-400"
                          onClick={() =>
                            handleEdit(advert.id, "price", advert.price?.value)
                          }
                        >
                          {advert.price?.value} {advert.price?.currency}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {advert.valid_to
                        ? new Date(advert.valid_to).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3">{advert.advert_views || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleExtend(advert.id)}
                          className="p-1 hover:bg-gray-700 rounded"
                          title="Przedłuż ofertę"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        {advert.url && (
                          <a
                            href={advert.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-gray-700 rounded inline-block"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Powiększone zdjęcia przy hover - POZA tabelą */}
            {hoveredImage &&
              adverts.map((advert) =>
                advert.images?.map((img, idx) => {
                  const imageId = `${advert.id}-${idx}`;
                  if (hoveredImage === imageId) {
                    return (
                      <div
                        key={imageId}
                        className="fixed z-50 pointer-events-none"
                        style={{
                          left: "50%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        <div className="bg-black rounded-lg shadow-2xl p-2">
                          <img
                            src={img.url}
                            alt=""
                            className="max-w-[500px] max-h-[500px] object-contain"
                          />
                        </div>
                      </div>
                    );
                  }
                  return null;
                })
              )}
          </div>

          {/* Paginacja */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded ${
                  currentPage === 1
                    ? "bg-gray-700 cursor-not-allowed opacity-50"
                    : "bg-gray-600 hover:bg-gray-500"
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Numery stron */}
              <div className="flex gap-1">
                {currentPage > 3 && (
                  <>
                    <button
                      onClick={() => goToPage(1)}
                      className="px-3 py-2 rounded bg-gray-600 hover:bg-gray-500 min-w-[40px]"
                    >
                      1
                    </button>
                    {currentPage > 4 && <span className="px-2 py-2">...</span>}
                  </>
                )}

                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  if (pageNum < 1 || pageNum > totalPages) return null;
                  if (
                    totalPages <= 5 ||
                    (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`px-3 py-2 rounded min-w-[40px] ${
                          pageNum === currentPage
                            ? "bg-blue-600 font-bold"
                            : "bg-gray-600 hover:bg-gray-500"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}

                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && (
                      <span className="px-2 py-2">...</span>
                    )}
                    <button
                      onClick={() => goToPage(totalPages)}
                      className="px-3 py-2 rounded bg-gray-600 hover:bg-gray-500 min-w-[40px]"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded ${
                  currentPage === totalPages
                    ? "bg-gray-700 cursor-not-allowed opacity-50"
                    : "bg-gray-600 hover:bg-gray-500"
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OlxPage;
