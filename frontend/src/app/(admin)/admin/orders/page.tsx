// frontend/src/app/(admin)/admin/orders/page.tsx
"use client";

import { CancelOrderModal } from "@/components/admin/CancelOrderModal";
import { useProductStore } from "@/store/productStore";
import { ShipmentConfirmation } from "@/components/admin/ShipmentConfirmation";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { useEffect, useState } from "react";
import { OrdersAnalytics } from "@/components/admin/OrdersAnalytics";
import { motion, AnimatePresence } from "framer-motion";
import { useOrderStore } from "@/store/orderStore";
import { Button } from "@/components/ui/Button";
import { CartItem } from "@/types/cart.types";
import { Order } from "@/types/order.types";
import { OrderDetailsDialog } from "@/components/admin/OrderDetailsDialog";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/Input";
import {
  ChevronDown,
  X,
  Trash,
  CreditCard,
  Truck,
  Upload,
  MessageSquare,
  Search,
  Trash2,
  Info,
  ArrowUpDown,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

type SortableFields =
  | "orderNumber"
  | "createdAt"
  | "orderDetails"
  | "status"
  | "total";

const statusColors = {
  pending: "bg-yellow-500 text-white",
  paid: "bg-green-500 text-white",
  shipped: "bg-blue-500 text-white",
  delivered: "bg-purple-500 text-white",
  cancelled: "bg-red-500 text-white",
};

const statusLabels = {
  pending: "Oczekujące",
  paid: "Opłacone",
  shipped: "Wysłane",
  delivered: "Dostarczone",
  cancelled: "Anulowane",
};

export default function OrdersPage() {
  const [selectedPreset, setSelectedPreset] = useState<string>("all");
  const [itemsPerPage, setItemsPerPage] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ordersPerPage");
      return saved ? parseInt(saved) : 20;
    }
    return 20;
  });
  const [showCancellationReason, setShowCancellationReason] = useState<
    string | null
  >(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [ordersToCancel, setOrdersToCancel] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Order["status"] | "all">(
    "all"
  );
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [hidePending, setHidePending] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateRange | undefined>({
    from: new Date("2020-01-01"),
    to: new Date(),
  });

  const [sort, setSort] = useState<{
    field: SortableFields;
    direction: "asc" | "desc";
  }>({
    field: "createdAt",
    direction: "desc",
  });
  const [hideCancelled, setHideCancelled] = useState(true);

  const handleCancelOrder = (orderId: string) => {
    setOrderToCancel(orderId);
    setCancelModalOpen(true);
  };

  const handleCancelMultipleOrders = () => {
    if (markedOrders.length === 0) {
      toast({
        title: "Uwaga",
        description: "Nie zaznaczono żadnych zamówień",
        variant: "destructive",
      });
      return;
    }
    setOrdersToCancel(markedOrders.map((o) => o.id));
    setCancelModalOpen(true);
  };

  const confirmCancellation = async (reason: string) => {
    try {
      if (orderToCancel) {
        // Anulowanie pojedynczego zamówienia
        await cancelOrder(orderToCancel, reason);
        toast({
          title: "Sukces",
          description: "Zamówienie zostało anulowane",
        });
      } else if (ordersToCancel.length > 0) {
        // Anulowanie wielu zamówień
        await cancelMultipleOrders(ordersToCancel, reason);
        setMarkedOrders([]);
        toast({
          title: "Sukces",
          description: `Anulowano ${ordersToCancel.length} zamówień`,
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się anulować zamówień",
        variant: "destructive",
      });
    } finally {
      setCancelModalOpen(false);
      setOrderToCancel(null);
      setOrdersToCancel([]);
    }
  };

  const [customLimit, setCustomLimit] = useState<string>("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const {
    orders,
    loading,
    currentPage,
    totalPages,
    total,
    fetchOrders,
    setFilters,
    filters,
    deleteInvoice,
    updateOrderStatus,
    uploadInvoice,
    deleteOrder,
    deleteMultipleOrders,
    cancelOrder,
    cancelMultipleOrders,
  } = useOrderStore();
  const [markedOrders, setMarkedOrders] = useState<Order[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("markedOrdersData");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [orderToFinish, setOrderToFinish] = useState<string | null>(null);
  const { products, fetchProducts } = useProductStore();
  const [uploadingInvoices, setUploadingInvoices] = useState<
    Record<string, boolean>
  >({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { toast } = useToast();
  const [deletingInvoices, setDeletingInvoices] = useState<
    Record<string, boolean>
  >({});
  const [isStatsVisible, setIsStatsVisible] = useState(true);

  // Komponent widgetu zaznaczonych zamówień
  const MarkedOrdersWidget = () => {
    const [isOpen, setIsOpen] = useState(false);

    if (markedOrders.length === 0) return null;

    return (
      <>
        {/* Pływający przycisk - bez zmian */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="fixed bottom-20 right-4 z-50"
        >
          <Button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-full h-14 w-14 p-0 shadow-lg relative"
            variant={markedOrders.length > 0 ? "default" : "outline"}
          >
            <div className="flex flex-col items-center justify-center">
              <ChevronDown
                className={`h-5 w-5 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                {markedOrders.length}
              </span>
            </div>
          </Button>
        </motion.div>

        {/* Panel z listą zaznaczonych */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-36 right-6 z-40 bg-background border rounded-lg shadow-2xl w-[420px] max-h-[500px] overflow-hidden"
            >
              {/* Nagłówek */}
              <div className="bg-muted p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <span>Zaznaczone zamówienia</span>
                  <span className="text-sm text-muted-foreground">
                    ({markedOrders.length})
                  </span>
                </h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setMarkedOrders([]);
                      toast({
                        title: "Odznaczono wszystkie",
                        description: "Wszystkie zamówienia zostały odznaczone",
                      });
                    }}
                  >
                    Odznacz wszystkie
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Lista zamówień - UŻYWAMY DANYCH Z markedOrders */}
              <div className="overflow-y-auto max-h-[350px] p-2">
                {markedOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg mb-1 group"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative flex-shrink-0">
                        <img
                          src={
                            order.items[0]?.mainImage ||
                            order.items[0]?.image ||
                            "/placeholder.png"
                          }
                          alt={order.items[0]?.name}
                          className="w-12 h-12 object-cover rounded border"
                        />
                        {order.items.length > 1 && (
                          <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                            +{order.items.length - 1}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {order.orderNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs flex-shrink-0 ${
                              order.paymentMethod === "cod" &&
                              order.status === "paid"
                                ? "bg-red-100 text-red-700"
                                : statusColors[order.status]
                            }`}
                          >
                            {order.paymentMethod === "cod" &&
                            order.status === "paid"
                              ? "Pobranie"
                              : statusLabels[order.status]}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 truncate">
                          {order.items[0]?.name}
                          {order.items.length > 1 &&
                            ` +${order.items.length - 1}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.shipping.firstName} {order.shipping.lastName} •{" "}
                          {order.total.toLocaleString("pl-PL", {
                            style: "currency",
                            currency: "PLN",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setMarkedOrders(
                          markedOrders.filter((o) => o.id !== order.id)
                        );
                        toast({
                          title: "Odznaczono",
                          description: `Zamówienie ${order.orderNumber} zostało odznaczone`,
                        });
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>

              {/* Stopka z akcjami */}
              <div className="border-t p-4 bg-muted/50">
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      // Filtruj tylko te które nie są anulowane
                      const ordersToCancel = markedOrders.filter(
                        (o) => o.status !== "cancelled"
                      );

                      if (ordersToCancel.length === 0) {
                        toast({
                          title: "Uwaga",
                          description:
                            "Wszystkie zaznaczone zamówienia są już anulowane",
                          variant: "destructive",
                        });
                        return;
                      }

                      if (ordersToCancel.length < markedOrders.length) {
                        toast({
                          title: "Informacja",
                          description: `${
                            markedOrders.length - ordersToCancel.length
                          } zamówień jest już anulowanych i zostanie pominiętych`,
                          variant: "default",
                        });
                      }

                      setOrdersToCancel(ordersToCancel.map((o) => o.id));
                      setCancelModalOpen(true);
                      setIsOpen(false);
                    }}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Anuluj zaznaczone
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const csvHeader = "Numer,Status,Wartość,Klient,Produkt\n";
                      const csv =
                        csvHeader +
                        markedOrders
                          .map((order) => {
                            return `${order.orderNumber},${order.status},${order.total},"${order.shipping.firstName} ${order.shipping.lastName}","${order.items[0]?.name}"`;
                          })
                          .join("\n");

                      const blob = new Blob([csv], { type: "text/csv" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `zaznaczone-zamowienia-${
                        new Date().toISOString().split("T")[0]
                      }.csv`;
                      a.click();

                      toast({
                        title: "Eksportowano",
                        description:
                          "Lista zaznaczonych zamówień została wyeksportowana",
                      });
                    }}
                  >
                    Eksportuj CSV
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    console.log("🔥 FRONTEND - Zmiana filtrów:", {
      hidePending,
      hideCancelled,
      statusFilter,
      searchTerm: debouncedSearchTerm,
    });
    setFilters({
      status: statusFilter,
      searchTerm: debouncedSearchTerm,
      dateFrom: dateFilter?.from,
      dateTo: dateFilter?.to,
      hidePending,
      hideCancelled,
      sortField: sort.field,
      sortDirection: sort.direction,
    });

    fetchOrders(0, itemsPerPage);
  }, [
    debouncedSearchTerm,
    statusFilter,
    hidePending,
    hideCancelled,
    dateFilter,
    sort,
    itemsPerPage,
  ]); // <- dodaj hideCancelled

  const handlePageChange = (newPage: number) => {
    fetchOrders(newPage, itemsPerPage);
  };

  const handleSort = (field: SortableFields) => {
    // Zmień typ z string na SortableFields
    setSort((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  useEffect(() => {
    fetchOrders(0, itemsPerPage).catch((error) => {
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać zamówień",
        variant: "destructive",
      });
    });
  }, [itemsPerPage]);

  useEffect(() => {
    localStorage.setItem("markedOrdersData", JSON.stringify(markedOrders));
  }, [markedOrders]);

  const handleLimitChange = (value: string) => {
    if (value === "custom") {
      setShowCustomInput(true);
      return;
    }

    const newLimit = parseInt(value);
    setItemsPerPage(newLimit);
    localStorage.setItem("ordersPerPage", newLimit.toString());
    setShowCustomInput(false);
    fetchOrders(0, newLimit);
  };

  const handleCustomLimitSubmit = () => {
    const limit = parseInt(customLimit);
    if (limit > 0 && limit <= 500) {
      setItemsPerPage(limit);
      localStorage.setItem("ordersPerPage", limit.toString());
      setShowCustomInput(false);
      setCustomLimit("");
      fetchOrders(0, limit);
    } else {
      toast({
        title: "Błąd",
        description: "Liczba musi być między 1 a 500",
        variant: "destructive",
      });
    }
  };

  const handleInvoiceUpload = async (orderId: string, files: FileList) => {
    setUploadingInvoices((prev) => ({ ...prev, [orderId]: true }));
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("invoice", file);
      });

      const response = await fetch(`/api/orders/${orderId}/invoice`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Błąd podczas dodawania dokumentów");
      }

      const result = await response.json();
      const newUrls = result.data.invoiceUrls || [];

      // Znajdujemy zamówienie i aktualizujemy jego URLs
      const orderIndex = orders.findIndex((o) => o.id === orderId);
      if (orderIndex !== -1) {
        const updatedOrder = { ...orders[orderIndex] };
        updatedOrder.invoiceUrls = [
          ...(updatedOrder.invoiceUrls || []),
          ...newUrls,
        ];
        orders[orderIndex] = updatedOrder;
      }

      // Dodajemy małe opóźnienie przed odświeżeniem
      await new Promise((resolve) => setTimeout(resolve, 500));
      await fetchOrders();

      toast({
        title: "Sukces",
        description: `Pomyślnie dodano ${files.length} ${
          files.length === 1 ? "dokument" : "dokumenty"
        }`,
      });
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się dodać niektórych dokumentów",
        variant: "destructive",
      });
    } finally {
      setUploadingInvoices((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć to zamówienie?")) return;

    try {
      await deleteOrder(orderId);
      toast({
        title: "Sukces",
        description: "Zamówienie zostało usunięte",
      });
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć zamówienia",
        variant: "destructive",
      });
    }
  };

  const orderStats = {
    totalOrders: orders.filter((o) =>
      ["paid", "shipped", "delivered"].includes(o.status)
    ).length,
    totalRevenue: orders
      .filter((o) => ["paid", "shipped", "delivered"].includes(o.status))
      .reduce((sum, order) => Number(sum) + Number(order.total), 0),
    get averageValue() {
      return this.totalOrders > 0 ? this.totalRevenue / this.totalOrders : 0;
    },
  };

  const handleDeleteMultipleOrders = async () => {
    if (markedOrders.length === 0) {
      toast({
        title: "Uwaga",
        description: "Nie zaznaczono żadnych zamówień",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Czy na pewno chcesz usunąć ${markedOrders.length} zamówień?`))
      return;

    try {
      // Wyciągnij tylko ID do wysłania
      const orderIds = markedOrders.map((o) => o.id);
      await deleteMultipleOrders(orderIds);
      setMarkedOrders([]);
      toast({
        title: "Sukces",
        description: `Usunięto ${markedOrders.length} zamówień`,
      });
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć zamówień",
        variant: "destructive",
      });
    }
  };

  const handleDeleteInvoice = async (orderId: string, invoiceUrl: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tę fakturę?")) return;

    setDeletingInvoices((prev) => ({ ...prev, [orderId]: true }));
    try {
      // Wyciągamy samą nazwę pliku, ale bez domeny i ścieżki
      const match = invoiceUrl.match(/[^/]+$/);
      if (!match) throw new Error("Nieprawidłowy URL faktury");
      const fileName = match[0];

      await deleteInvoice(orderId, fileName);
      await fetchOrders(currentPage); // odświeżamy po usunięciu
      toast({
        title: "Sukces",
        description: "Dokument został usunięty",
      });
    } catch (error) {
      console.error("Błąd podczas usuwania faktury:", error);
      toast({
        title: "Błąd",
        description:
          error instanceof Error
            ? error.message
            : "Nie udało się usunąć faktury",
        variant: "destructive",
      });
    } finally {
      setDeletingInvoices((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const AnimatedStatsPanel = () => (
    <motion.div
      initial="expanded"
      animate={isStatsVisible ? "expanded" : "collapsed"}
      variants={{
        expanded: {
          height: "auto",
          opacity: 1,
          marginBottom: "1.5rem",
          marginTop: "1.5rem",
          marginRight: "2rem",
        },
        collapsed: {
          height: 0,
          opacity: 0,
          marginTop: "1.5rem",
          marginBottom: 0,
        },
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      className="overflow-hidden"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Szybkie presety */}
          <Select
            value={selectedPreset}
            onValueChange={(key) => {
              setSelectedPreset(key);
              if (datePresets[key as keyof typeof datePresets]) {
                setDateFilter(
                  datePresets[key as keyof typeof datePresets].dates
                );
              }
            }}
          >
            <SelectTrigger className="w-[180px] mb-6">
              <SelectValue placeholder="Wybierz okres" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg">
              <SelectItem value="today">Dziś</SelectItem>
              <SelectItem value="yesterday">Wczoraj</SelectItem>
              <SelectItem value="thisWeek">Ten tydzień</SelectItem>
              <SelectItem value="thisMonth">Ten miesiąc</SelectItem>
              <SelectItem value="lastMonth">Poprzedni miesiąc</SelectItem>
              <div className="my-2 border-t" />
              <SelectItem value="q1">{`Q1 ${new Date().getFullYear()}`}</SelectItem>
              <SelectItem value="q2">{`Q2 ${new Date().getFullYear()}`}</SelectItem>
              <SelectItem value="q3">{`Q3 ${new Date().getFullYear()}`}</SelectItem>
              <SelectItem value="q4">{`Q4 ${new Date().getFullYear()}`}</SelectItem>
              <div className="my-2 border-t" />
              {Array.from({ length: 12 }, (_, i) => {
                const monthDate = new Date(new Date().getFullYear(), i, 1);
                const monthName = monthDate.toLocaleDateString("pl-PL", {
                  month: "long",
                });
                return (
                  <SelectItem key={`month_${i}`} value={`month_${i}`}>
                    {monthName.charAt(0).toUpperCase() + monthName.slice(1)}{" "}
                    {new Date().getFullYear()}
                  </SelectItem>
                );
              })}
              <div className="my-2 border-t" />
              <SelectItem value="thisYear">
                Rok {new Date().getFullYear()}
              </SelectItem>
              <SelectItem value="all">Wszystkie</SelectItem>
            </SelectContent>
          </Select>

          {/* Custom date picker */}
          <DateRangePicker
            value={dateFilter}
            onChange={(newRange) => {
              setDateFilter(newRange);
              setSelectedPreset("");
            }}
            className="w-[300px]"
          />

          {/* Pokaż aktualny zakres */}
          {dateFilter?.from && dateFilter?.to && (
            <div className="text-sm text-muted-foreground">
              {dateFilter.from.toLocaleDateString("pl-PL")} -{" "}
              {dateFilter.to.toLocaleDateString("pl-PL")}
            </div>
          )}
        </div>
      </div>
      <OrdersAnalytics dateRange={dateFilter} />
    </motion.div>
  );

  const formatFileName = (fileName: string) => {
    const maxLength = 12;
    const name = fileName.split(".")[0]; // bierzemy nazwę bez rozszerzenia
    return name.length > maxLength ? `${name.slice(0, maxLength)}...` : name;
  };

  const handleProductClick = (item: CartItem) => {
    if (!item?.categorySlug || !item?.slug) {
      toast({
        title: "Błąd",
        description: "Link do produktu jest niedostępny",
        variant: "destructive",
      });
      window.open("/", "_blank");
      return;
    }

    // Budujemy pełny URL
    const productUrl = `/${item.categorySlug}/${item.slug}`;
    window.open(productUrl, "_blank");
  };

  const handleStatusChange = async (
    orderId: string,
    newStatus: Order["status"]
  ) => {
    if (newStatus === "shipped") {
      setOrderToFinish(orderId);
      return;
    }
    await updateOrderStatus(orderId, newStatus);
  };

  const datePresets = {
    // Bieżące okresy
    today: {
      label: "Dziś",
      dates: {
        from: new Date(new Date().setHours(0, 0, 0, 0)),
        to: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    },
    yesterday: {
      label: "Wczoraj",
      dates: (() => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          from: new Date(yesterday.setHours(0, 0, 0, 0)),
          to: new Date(yesterday.setHours(23, 59, 59, 999)),
        };
      })(),
    },
    thisWeek: {
      label: "Ten tydzień",
      dates: (() => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        // W JS niedziela = 0, poniedziałek = 1
        const startOfWeek = new Date(now);
        // Jeśli niedziela (0), ustaw na -6, inaczej 1-dayOfWeek
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startOfWeek.setDate(now.getDate() + daysToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(now);
        endOfWeek.setHours(23, 59, 59, 999);

        return {
          from: startOfWeek,
          to: endOfWeek,
        };
      })(),
    },

    thisMonth: {
      label: "Ten miesiąc",
      dates: {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(),
      },
    },
    lastMonth: {
      label: "Poprzedni miesiąc",
      dates: (() => {
        const date = new Date();
        return {
          from: new Date(date.getFullYear(), date.getMonth() - 1, 1),
          to: new Date(date.getFullYear(), date.getMonth(), 0),
        };
      })(),
    },
    // Kwartały
    q1: {
      label: `Q1 ${new Date().getFullYear()}`,
      dates: {
        from: new Date(new Date().getFullYear(), 0, 1),
        to: new Date(new Date().getFullYear(), 2, 31),
      },
    },
    q2: {
      label: `Q2 ${new Date().getFullYear()}`,
      dates: {
        from: new Date(new Date().getFullYear(), 3, 1),
        to: new Date(new Date().getFullYear(), 5, 30),
      },
    },
    q3: {
      label: `Q3 ${new Date().getFullYear()}`,
      dates: {
        from: new Date(new Date().getFullYear(), 6, 1),
        to: new Date(new Date().getFullYear(), 8, 30),
      },
    },
    q4: {
      label: `Q4 ${new Date().getFullYear()}`,
      dates: {
        from: new Date(new Date().getFullYear(), 9, 1),
        to: new Date(new Date().getFullYear(), 11, 31),
      },
    },
    // Konkretne miesiące
    ...Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => {
        const monthDate = new Date(new Date().getFullYear(), i, 1);
        const monthName = monthDate.toLocaleDateString("pl-PL", {
          month: "long",
        });
        return [
          `month_${i}`,
          {
            label: monthName.charAt(0).toUpperCase() + monthName.slice(1),
            dates: {
              from: new Date(new Date().getFullYear(), i, 1),
              to: new Date(new Date().getFullYear(), i + 1, 0),
            },
          },
        ];
      })
    ),
    // Cały rok
    thisYear: {
      label: `Rok ${new Date().getFullYear()}`,
      dates: {
        from: new Date(new Date().getFullYear(), 0, 1),
        to: new Date(new Date().getFullYear(), 11, 31),
      },
    },

    all: {
      label: "Wszystkie",
      dates: {
        from: new Date("2020-01-01"),
        to: new Date(),
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Tabela zamówień */}
      <div className="space-y-4 mr-8">
        <h2 className="text-2xl font-bold">Zarządzanie zamówieniami</h2>

        {/* Filtry */}
        <div className="flex gap-4 flex-wrap items-center">
          <div className="relative">
            <Input
              type="text"
              placeholder="Szukaj..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as Order["status"] | "all")
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Wybierz status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie statusy</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setHidePending(!hidePending)}
            className={!hidePending ? "bg-yellow-100 dark:bg-yellow-900" : ""}
          >
            {hidePending ? "Pokaż oczekujące" : "Ukryj oczekujące"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setHideCancelled(!hideCancelled)}
            className={!hideCancelled ? "bg-red-100 dark:bg-red-900" : ""}
          >
            {hideCancelled ? "Pokaż anulowane" : "Ukryj anulowane"}
          </Button>
          {markedOrders.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteMultipleOrders}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Usuń zaznaczone ({markedOrders.length})
            </Button>
          )}

          {/* Selektor liczby zamówień */}
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              const newLimit = parseInt(value);
              setItemsPerPage(newLimit);
              localStorage.setItem("ordersPerPage", newLimit.toString());
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20 zamówień</SelectItem>
              <SelectItem value="50">50 zamówień</SelectItem>
              <SelectItem value="100">100 zamówień</SelectItem>
              <SelectItem value="200">200 zamówień</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => fetchOrders(currentPage, itemsPerPage)}>
            Odśwież
          </Button>
        </div>

        {/* Informacja o zamówieniach */}
        <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm">
            Znaleziono <strong>{total}</strong> zamówień
          </span>
          <span className="text-sm text-muted-foreground">
            Strona {currentPage + 1} z {totalPages}({orders.length} na tej
            stronie)
          </span>
        </div>

        {/* Tabela - używaj orders bezpośrednio, bez lokalnego filtrowania */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left">Lp.</th>

                {[
                  ["mark", "", "w-[50px]"],
                  ["orderNumber", "Numer"],
                  ["createdAt", "Data"],
                  ["orderDetails", "Zamówienie"],
                  ["status", "Status"],
                  ["total", "Wartość"],
                ].map(([field, label]) => (
                  <th
                    key={field}
                    className="px-4 py-2 text-left cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort(field as SortableFields)}
                  >
                    <div className="flex items-center gap-2">
                      {label}
                      <ArrowUpDown
                        className={`h-4 w-4 ${
                          sort.field === field
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-2 text-left">Szczegóły</th>
                <th className="px-4 py-2 text-left">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr
                  key={order.id}
                  className={`border-t hover:bg-muted/50 ${
                    markedOrders.some((o) => o.id === order.id)
                      ? "bg-gray-100 dark:bg-gray-800"
                      : ""
                  }`}
                >
                  <td className="px-4 py-2">
                    {index + 1 + currentPage * itemsPerPage}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={markedOrders.some((o) => o.id === order.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Dodaj całe zamówienie, nie tylko ID
                          setMarkedOrders([...markedOrders, order]);
                        } else {
                          // Usuń po ID
                          setMarkedOrders(
                            markedOrders.filter((o) => o.id !== order.id)
                          );
                        }
                      }}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                  </td>
                  <td className="px-4 py-2 font-medium">
                    <span
                    //                      className="cursor-pointer text-primary hover:underline"
                    //onClick={() => handleOrderNumberClick(order.orderNumber)}
                    >
                      {order.orderNumber}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {new Date(order.createdAt).toLocaleString("pl")}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2 relative group">
                      <img
                        src={
                          order.items[0]?.mainImage ||
                          order.items[0]?.image ||
                          "/placeholder.png"
                        }
                        alt="Produkt"
                        className="w-12 h-12 object-cover rounded cursor-pointer"
                        onClick={() => handleProductClick(order.items[0])}
                      />

                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {order.items[0]?.name}
                            {order.items.length > 1 &&
                              ` +${order.items.length - 1}`}
                          </span>
                          {order.paymentMethod === "cod" && (
                            <div
                              className="bg-red-500 text-white rounded-full p-1"
                              title="Płatność za pobraniem"
                            >
                              <Truck className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Ilość:{" "}
                          {order.items.reduce(
                            (sum, item) => sum + item.quantity,
                            0
                          )}
                        </span>
                      </div>

                      {/* Chmurka ze szczegółami */}
                      <AnimatePresence>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{
                            delay: 0.2,
                            duration: 0.15,
                            ease: "easeOut",
                          }}
                          className="absolute z-20 invisible group-hover:visible backdrop-blur-md bg-background/95 p-4 rounded-lg shadow-lg -translate-y-full left-0 top-0 mt-1 border min-w-[500px]"
                        >
                          <div className="space-y-4">
                            {/* Sekcja produktów */}
                            <div>
                              <h4 className="font-semibold mb-4">
                                Zamówione produkty
                              </h4>
                              {order.items.map((item, idx) => {
                                // Znajdujemy pełne dane produktu z productStore
                                const fullProduct = products.find(
                                  (p) =>
                                    p.id === item.productId ||
                                    p._id === item.productId
                                );

                                return (
                                  <div
                                    key={idx}
                                    className="border rounded-lg p-4 mb-4"
                                  >
                                    <div className="flex flex-col md:flex-row gap-4">
                                      <img
                                        src={
                                          item.mainImage ||
                                          item.image ||
                                          "/placeholder.png"
                                        }
                                        alt={item.name}
                                        className="w-24 h-24 object-cover rounded cursor-pointer"
                                        onClick={() => handleProductClick(item)}
                                      />
                                      <div className="flex-1">
                                        <h5 className="font-medium">
                                          {item.name}
                                        </h5>

                                        {/* Podstawowe informacje */}
                                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                          <span>Ilość: {item.quantity}</span>
                                          <span>
                                            Cena:{" "}
                                            {item.price.toLocaleString(
                                              "pl-PL",
                                              {
                                                style: "currency",
                                                currency: "PLN",
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 2,
                                              }
                                            )}
                                          </span>
                                        </div>

                                        {/* Szczegółowe parametry z pełnego produktu */}
                                        {fullProduct && (
                                          <div className="mt-3 border-t pt-3">
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground">
                                              <span>
                                                <span className="font-medium">
                                                  Moc:
                                                </span>{" "}
                                                {fullProduct.power.value}
                                              </span>
                                              <span>
                                                <span className="font-medium">
                                                  Obroty:
                                                </span>{" "}
                                                {fullProduct.rpm.value}
                                              </span>
                                              <span>
                                                <span className="font-medium">
                                                  Wielkość mech.:
                                                </span>{" "}
                                                {fullProduct.mechanicalSize}
                                              </span>
                                              <span>
                                                <span className="font-medium">
                                                  Średnica wału:
                                                </span>{" "}
                                                {fullProduct.shaftDiameter} mm
                                              </span>
                                              {fullProduct.startType && (
                                                <span>
                                                  <span className="font-medium">
                                                    Rozruch:
                                                  </span>{" "}
                                                  {fullProduct.startType}
                                                </span>
                                              )}
                                              {fullProduct.sleeveDiameter && (
                                                <span>
                                                  <span className="font-medium">
                                                    Średnica tulei:
                                                  </span>{" "}
                                                  {fullProduct.sleeveDiameter}{" "}
                                                  mm
                                                </span>
                                              )}
                                              {fullProduct.flangeSize && (
                                                <span>
                                                  <span className="font-medium">
                                                    Kołnierz:
                                                  </span>{" "}
                                                  {fullProduct.flangeSize} mm
                                                </span>
                                              )}
                                              <span>
                                                <span className="font-medium">
                                                  Stan:
                                                </span>{" "}
                                                {fullProduct.condition ===
                                                "nowy"
                                                  ? "Nowy"
                                                  : fullProduct.condition ===
                                                    "uzywany"
                                                  ? "Używany"
                                                  : "Nieużywany"}
                                              </span>
                                              <span>
                                                <span className="font-medium">
                                                  Waga:
                                                </span>{" "}
                                                {fullProduct.weight} kg
                                              </span>
                                              <span>
                                                <span className="font-medium">
                                                  Producent:
                                                </span>{" "}
                                                {fullProduct.manufacturer}
                                              </span>
                                              {fullProduct.technicalDetails && (
                                                <span className="col-span-2">
                                                  <span className="font-medium">
                                                    Szczegóły tech.:
                                                  </span>{" "}
                                                  {fullProduct.technicalDetails}
                                                </span>
                                              )}
                                              {fullProduct.customParameters?.map(
                                                (param, idx) => (
                                                  <span
                                                    key={idx}
                                                    className="col-span-2"
                                                  >
                                                    <span className="font-medium">
                                                      {param.name}:
                                                    </span>{" "}
                                                    {param.value}
                                                  </span>
                                                )
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Grid z danymi do faktury i wysyłki */}
                            <div className="grid grid-cols-2 gap-8">
                              {/* Sekcja faktury/danych klienta */}
                              <div className="border rounded-lg p-4">
                                <h4 className="font-semibold mb-4 flex items-center gap-2">
                                  <CreditCard className="w-5 h-5" />
                                  {order.shipping.nip
                                    ? "FAKTURA VAT"
                                    : "DANE KLIENTA"}
                                </h4>

                                {/* Jeśli klient NIE chce faktury */}
                                {!order.shipping.nip ? (
                                  <div className="space-y-3">
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                        ⚠️ Klient nie zaznaczył opcji faktury
                                        VAT
                                      </p>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                      <div className="font-medium">
                                        {order.shipping.companyName ||
                                          `${order.shipping.firstName} ${order.shipping.lastName}`}
                                      </div>
                                      <div>{order.shipping.street}</div>
                                      <div>
                                        {order.shipping.postalCode}{" "}
                                        {order.shipping.city}
                                      </div>
                                      <div className="mt-3 pt-3 border-t">
                                        <div className="text-xs text-muted-foreground">
                                          Dane kontaktowe:
                                        </div>
                                        <div className="mt-1">
                                          <span className="font-medium">
                                            Tel:
                                          </span>{" "}
                                          {order.shipping.phone}
                                        </div>
                                        <div>
                                          <span className="font-medium">
                                            Email:
                                          </span>{" "}
                                          {order.shipping.email}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  /* Jeśli klient CHCE fakturę */
                                  <div className="space-y-3">
                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                        ✓ Klient zaznaczył fakturę VAT
                                      </p>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                      {order.shipping.companyName ? (
                                        <>
                                          <div className="font-medium text-primary">
                                            {order.shipping.companyName}
                                          </div>
                                          <div className="font-medium text-red-600">
                                            NIP: {order.shipping.nip}
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <div className="font-medium">
                                            {order.shipping.firstName}{" "}
                                            {order.shipping.lastName}
                                          </div>
                                          <div className="text-sm text-muted-foreground">
                                            (osoba prywatna)
                                          </div>
                                          {order.shipping.nip && (
                                            <div className="font-medium text-red-600">
                                              NIP: {order.shipping.nip}
                                            </div>
                                          )}
                                        </>
                                      )}
                                      <div className="mt-2 pt-2 border-t">
                                        <div className="text-xs text-muted-foreground mb-1">
                                          Adres do faktury:
                                        </div>
                                        <div>
                                          {order.shipping.invoiceStreet ||
                                            order.shipping.street}
                                        </div>
                                        <div>
                                          {order.shipping.invoicePostalCode ||
                                            order.shipping.postalCode}{" "}
                                          {order.shipping.invoiceCity ||
                                            order.shipping.city}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Sekcja wysyłki */}
                              <div className="border rounded-lg p-4">
                                <h4 className="font-semibold mb-4 flex items-center gap-2">
                                  <Truck className="w-5 h-5" />
                                  ADRES DOSTAWY
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="font-medium">
                                    {order.shipping.firstName}{" "}
                                    {order.shipping.lastName}
                                  </div>
                                  <div>
                                    {order.shipping.differentShippingAddress
                                      ? order.shipping.shippingStreet
                                      : order.shipping.street}
                                  </div>
                                  <div>
                                    {order.shipping.differentShippingAddress
                                      ? order.shipping.shippingPostalCode
                                      : order.shipping.postalCode}{" "}
                                    {order.shipping.differentShippingAddress
                                      ? order.shipping.shippingCity
                                      : order.shipping.city}
                                  </div>
                                  <div className="mt-4 pt-3 border-t">
                                    <div className="text-xs text-muted-foreground mb-1">
                                      Dane kontaktowe do dostawy:
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Telefon:
                                      </span>{" "}
                                      {order.shipping.phone}
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Email:
                                      </span>{" "}
                                      {order.shipping.email}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Sekcja płatności */}
                            <div className="border-t pt-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    Metoda płatności:
                                  </span>
                                  <span>
                                    {order.paymentMethod === "prepaid"
                                      ? "Płatność online"
                                      : "Płatność przy odbiorze"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Truck className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    Koszt wysyłki:
                                  </span>
                                  <span>
                                    {order.shippingCost.toLocaleString(
                                      "pl-PL",
                                      {
                                        style: "currency",
                                        currency: "PLN",
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 2,
                                      }
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Podsumowanie kosztów */}
                            <div className="border-t pt-4">
                              <div className="flex justify-between font-medium">
                                <span>Suma:</span>
                                <span>
                                  {order.total.toLocaleString("pl-PL", {
                                    style: "currency",
                                    currency: "PLN",
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                            </div>

                            {/* Uwagi */}
                            {order.shipping.notes && (
                              <div className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20">
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                  <MessageSquare className="w-5 h-5" />
                                  UWAGI DO ZAMÓWIENIA
                                </h4>
                                <p className="text-sm whitespace-pre-wrap">
                                  {order.shipping.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        order.paymentMethod === "cod" && order.status === "paid"
                          ? "bg-red-100 text-red-700"
                          : statusColors[order.status]
                      }`}
                    >
                      {order.paymentMethod === "cod" && order.status === "paid"
                        ? "Pobranie"
                        : statusLabels[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {order.total.toLocaleString("pl-PL", {
                      style: "currency",
                      currency: "PLN",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setSelectedOrder(order)}
                        variant="outline"
                        size="sm"
                      >
                        Szczegóły
                      </Button>
                      {order.status === "paid" && (
                        <Button
                          onClick={() =>
                            handleStatusChange(order.id, "shipped")
                          }
                          size="sm"
                        >
                          Zakończ zamówienie
                        </Button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2 items-center flex-wrap">
                      {order.invoiceUrls?.map((url, index) => (
                        <div key={url} className="flex items-center gap-1">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            {formatFileName(url.split("/").pop() || "")}
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteInvoice(order.id, url)}
                            disabled={deletingInvoices[order.id]}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {(!order.invoiceUrls || order.invoiceUrls.length < 4) && (
                        <div className="relative">
                          <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            accept=".pdf"
                            multiple // dodajemy atrybut multiple
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files && files.length > 0) {
                                // Sprawdzamy czy nie przekroczymy limitu 4 plików
                                if (
                                  order.invoiceUrls &&
                                  order.invoiceUrls.length + files.length > 4
                                ) {
                                  toast({
                                    title: "Błąd",
                                    description: `Możesz dodać maksymalnie ${
                                      4 - (order.invoiceUrls?.length || 0)
                                    } ${
                                      4 - (order.invoiceUrls?.length || 0) === 1
                                        ? "plik"
                                        : "pliki"
                                    }`,
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                handleInvoiceUpload(order.id, files);
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            disabled={uploadingInvoices[order.id]}
                          >
                            <Upload className="h-4 w-4" />
                            {uploadingInvoices[order.id]
                              ? "Wysyłanie..."
                              : "Dodaj dokumenty"}
                          </Button>
                        </div>
                      )}

                      {order.status !== "cancelled" ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={loading}
                          className="ml-2"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      ) : (
                        <div className="relative ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-muted"
                            onClick={() =>
                              setShowCancellationReason(
                                showCancellationReason === order.id
                                  ? null
                                  : order.id
                              )
                            }
                            title="Zobacz powód anulowania"
                          >
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </Button>

                          {/* Tooltip z powodem anulowania */}
                          {showCancellationReason === order.id &&
                            order.cancellationReason && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
                                <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 min-w-[200px] max-w-[300px]">
                                  <div className="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400">
                                    Powód anulowania:
                                  </div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {order.cancellationReason}
                                  </div>
                                  {order.cancelledAt && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 border-t pt-2">
                                      {new Date(
                                        order.cancelledAt
                                      ).toLocaleString("pl-PL")}
                                    </div>
                                  )}
                                  {order.cancelledBy && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      przez: {order.cancelledBy}
                                    </div>
                                  )}
                                  {/* Strzałka tooltipa */}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white dark:border-t-gray-800"></div>
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginacja */}
        <div className="flex justify-between items-center">
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
          >
            Poprzednia
          </Button>
          <div className="flex items-center gap-2">
            {/* Szybkie przejście do strony */}
            <span>Strona</span>
            <Input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage + 1}
              onChange={(e) => {
                const page = parseInt(e.target.value) - 1;
                if (page >= 0 && page < totalPages) {
                  handlePageChange(page);
                }
              }}
              className="w-16 text-center"
            />
            <span>z {totalPages}</span>
          </div>
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
          >
            Następna
          </Button>
        </div>
      </div>
      {/* Nagłówek ze statystykami */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setIsStatsVisible(!isStatsVisible)}
          className="flex items-center gap-2"
        >
          {isStatsVisible ? "Ukryj statystyki" : "Pokaż statystyki"}
          <motion.div
            animate={{ rotate: isStatsVisible ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ArrowUpDown className="h-4 w-4" />
          </motion.div>
        </Button>
      </div>

      {/* Panel ze statystykami */}
      <AnimatedStatsPanel />
      {/* Dialog ze szczegółami */}
      {selectedOrder && (
        <OrderDetailsDialog
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
      <AnimatePresence>
        {orderToFinish && (
          <ShipmentConfirmation
            orderId={orderToFinish}
            onClose={() => setOrderToFinish(null)}
            onConfirm={async () => {
              await updateOrderStatus(orderToFinish, "shipped");
            }}
          />
        )}
      </AnimatePresence>
      <MarkedOrdersWidget />
      <CancelOrderModal
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setOrderToCancel(null);
          setOrdersToCancel([]);
        }}
        onConfirm={confirmCancellation}
        orderCount={ordersToCancel.length || 1}
        orderNumber={
          orderToCancel
            ? orders.find((o) => o.id === orderToCancel)?.orderNumber
            : undefined
        }
      />
    </div>
  );
}
