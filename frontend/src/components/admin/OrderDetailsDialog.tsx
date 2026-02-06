// frontend/src/components/admin/OrderDetailsDialog.tsx
import { Order } from "@/types/order.types";
import { ShipmentConfirmation } from "@/components/admin/ShipmentConfirmation";
import { useOrderStore } from "@/store/orderStore";
import { CartItem } from "@/types/cart.types";
import {
  MessageSquare,
  FileText,
  Upload,
  X,
  CreditCard,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useProductStore } from "@/store/productStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

interface OrderDetailsDialogProps {
  order: Order;
  onClose: () => void;
}

export const OrderDetailsDialog = ({
  order,
  onClose,
}: OrderDetailsDialogProps) => {
  const [showShipmentConfirmation, setShowShipmentConfirmation] =
    useState(false);
  const { uploadInvoice, deleteInvoice, fetchOrders, updateOrderStatus } =
    useOrderStore();
  const { products } = useProductStore();
  const [uploadingInvoices, setUploadingInvoices] = useState<
    Record<string, boolean>
  >({});
  const [deletingInvoices, setDeletingInvoices] = useState<
    Record<string, boolean>
  >({});
  const { toast } = useToast();

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
        throw new Error("Błąd podczas dodawania faktur");
      }

      const result = await response.json();

      // Od razu aktualizujemy stan lokalnie
      order.invoiceUrls = [
        ...(order.invoiceUrls || []),
        ...result.data.invoiceUrls,
      ];

      // Dodatkowo odświeżamy dane
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
        description: "Nie udało się dodać niektórych faktur",
        variant: "destructive",
      });
    } finally {
      setUploadingInvoices((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleDeleteInvoice = async (orderId: string, invoiceUrl: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tę fakturę?")) return;

    setDeletingInvoices((prev) => ({ ...prev, [orderId]: true }));
    try {
      const match = invoiceUrl.match(/[^/]+$/);
      if (!match) throw new Error("Nieprawidłowy URL faktury");
      const fileName = match[0];

      await deleteInvoice(orderId, fileName);
      await fetchOrders();
      toast({
        title: "Sukces",
        description: "Dokument został usunięty",
      });
    } catch (error) {
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

  const formatFileName = (fileName: string) => {
    const maxLength = 12;
    const name = fileName.split(".")[0];
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

    const productUrl = `/${item.categorySlug}/${item.slug}`;
    window.open(productUrl, "_blank");
  };

  return (
    <Dialog open={true} onOpenChange={onClose} className="mr-12 mt-6 ml-12">
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full">
        {/* Header */}
        <div className="flex-none sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-3 border-b">
          <DialogHeader className="relative pr-8">
            <DialogTitle>Szczegóły zamówienia #{order.orderNumber}</DialogTitle>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-sm">(ID: {order.id})</p>
              {/* Podsumowanie kwoty u góry */}
              <div className="text-sm flex items-center gap-3">
                <span className="font-bold text-primary">
                  Wartość całkowita:
                </span>
                <span className="text-muted-foreground">
                  Produkty:{" "}
                  {order.subtotal.toLocaleString("pl-PL", {
                    style: "currency",
                    currency: "PLN",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-muted-foreground">
                  + Dostawa:{" "}
                  {order.shippingCost.toLocaleString("pl-PL", {
                    style: "currency",
                    currency: "PLN",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="font-bold text-primary">
                  ={" "}
                  {order.total.toLocaleString("pl-PL", {
                    style: "currency",
                    currency: "PLN",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 rounded-full"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto h-[calc(95vh-130px)] py-4">
          <div className="space-y-6">
            {/* Produkty */}
            <div className="space-y-4">
              <h4 className="font-semibold">Zamówione produkty</h4>
              {order.items.map((item, idx) => {
                const fullProduct = products.find(
                  (p) => p.id === item.productId
                );
                return (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <img
                        src={item.mainImage || item.image || "/placeholder.png"}
                        alt={item.name}
                        className="w-full md:w-24 h-48 md:h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleProductClick(item)}
                      />
                      <div className="flex-1">
                        <h5 className="font-medium">{item.name}</h5>
                        <div className="flex flex-col gap-1 mt-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Ilość:{" "}
                            </span>
                            <span className="font-medium">
                              {item.quantity} szt.
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Cena:{" "}
                            </span>
                            <span className="font-medium">
                              {item.price.toLocaleString("pl-PL", {
                                style: "currency",
                                currency: "PLN",
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>

                        {fullProduct && (
                          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t text-sm">
                            {fullProduct.power?.value && (
                              <span>Moc: {fullProduct.power.value}kW</span>
                            )}
                            {fullProduct.rpm?.value && (
                              <span>
                                Obroty: {fullProduct.rpm.value} obr/min
                              </span>
                            )}
                            {fullProduct.shaftDiameter && (
                              <span>
                                Śr. wału: {fullProduct.shaftDiameter}mm
                              </span>
                            )}
                            {fullProduct.mechanicalSize && (
                              <span>
                                Wiel. mech.: {fullProduct.mechanicalSize}
                              </span>
                            )}
                            {fullProduct.condition && (
                              <span>
                                Stan:{" "}
                                {fullProduct.condition === "nowy"
                                  ? "Nowy"
                                  : "Używany"}
                              </span>
                            )}
                            {fullProduct.weight && (
                              <span>Waga: {fullProduct.weight}kg</span>
                            )}
                            {fullProduct.stock !== undefined && (
                              <span>Stan magaz.: {fullProduct.stock} szt.</span>
                            )}
                            {fullProduct.manufacturer && (
                              <span>Producent: {fullProduct.manufacturer}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dane klienta z rozróżnieniem faktury */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                {order.shipping.nip ? "DANE DO FAKTURY VAT" : "DANE KLIENTA"}
              </h4>

              {/* Jeśli klient NIE chce faktury */}
              {!order.shipping.nip ? (
                <div className="space-y-3">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      ⚠️ Klient nie zaznaczył opcji faktury VAT
                    </p>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {order.paymentMethod === "prepaid"
                        ? "💳 Online"
                        : "📦 Pobranie"}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="font-medium">
                      {order.shipping.firstName} {order.shipping.lastName}
                    </div>
                    <div>{order.shipping.street}</div>
                    <div>
                      {order.shipping.postalCode} {order.shipping.city}
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-muted-foreground mb-1">
                        Dane kontaktowe:
                      </div>
                      <div>
                        <span className="font-medium">Email:</span>{" "}
                        {order.shipping.email}
                      </div>
                      <div>
                        <span className="font-medium">Tel:</span>{" "}
                        {order.shipping.phone}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-muted-foreground mb-1">
                        Sposób płatności:
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {order.paymentMethod === "prepaid"
                            ? "Płatność online"
                            : "Płatność przy odbiorze (pobranie)"}
                        </span>
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
                          {order.shipping.firstName} {order.shipping.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          (osoba prywatna)
                        </div>
                        <div className="font-medium text-red-600">
                          NIP: {order.shipping.nip}
                        </div>
                      </>
                    )}
                    <div className="mt-2 pt-2 border-t">
                      <div className="text-xs text-muted-foreground mb-1">
                        Adres do faktury:
                      </div>
                      <div>
                        {order.shipping.invoiceStreet || order.shipping.street}
                      </div>
                      <div>
                        {order.shipping.invoicePostalCode ||
                          order.shipping.postalCode}{" "}
                        {order.shipping.invoiceCity || order.shipping.city}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-muted-foreground mb-1">
                        Dane kontaktowe:
                      </div>
                      <div>
                        <span className="font-medium">Email:</span>{" "}
                        {order.shipping.email}
                      </div>
                      <div>
                        <span className="font-medium">Tel:</span>{" "}
                        {order.shipping.phone}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-muted-foreground mb-1">
                        Sposób płatności:
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {order.paymentMethod === "prepaid"
                            ? "Płatność online"
                            : "Płatność przy odbiorze (pobranie)"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Podsumowanie pod danymi klienta */}
              <div className="mt-4 pt-4 border-t bg-muted/30 rounded-lg p-3">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Wartość zamówienia:</span>
                  </div>
                  <div className="flex flex-col gap-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Produkty:</span>
                      <span>
                        {order.subtotal.toLocaleString("pl-PL", {
                          style: "currency",
                          currency: "PLN",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dostawa:</span>
                      <span>
                        {order.shippingCost.toLocaleString("pl-PL", {
                          style: "currency",
                          currency: "PLN",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-semibold">Razem:</span>
                      <span className="text-lg font-bold text-primary">
                        {order.total.toLocaleString("pl-PL", {
                          style: "currency",
                          currency: "PLN",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Adres dostawy - z czerwonym kolorem */}
            <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
              <h4 className="font-semibold mb-4 flex items-center gap-2 text-red-700 dark:text-red-300">
                <Truck className="w-5 h-5 text-red-600 dark:text-red-400" />
                ADRES DOSTAWY
              </h4>
              <div className="space-y-2 text-sm">
                <div className="font-medium">
                  {order.shipping.firstName} {order.shipping.lastName}
                </div>
                <div>
                  {order.shipping.shippingStreet || order.shipping.street}
                </div>
                <div>
                  {order.shipping.shippingPostalCode ||
                    order.shipping.postalCode}{" "}
                  {order.shipping.shippingCity || order.shipping.city}
                </div>
                <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                  <div className="text-xs text-muted-foreground mb-1">
                    Dane kontaktowe do dostawy:
                  </div>
                  <div>
                    <span className="font-medium">Telefon:</span>{" "}
                    {order.shipping.phone}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>{" "}
                    {order.shipping.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Płatności i faktury */}
            <div>
              <h4 className="font-semibold mb-4">Płatność i dokumenty</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">Metoda płatności:</span>
                    <span>
                      {order.paymentMethod === "prepaid"
                        ? "Płatność online"
                        : "Płatność przy odbiorze"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">Koszt wysyłki:</span>
                    <span>
                      {order.shippingCost.toLocaleString("pl-PL", {
                        style: "currency",
                        currency: "PLN",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

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
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        disabled={uploadingInvoices[order.id]}
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.multiple = true;
                          input.accept = ".pdf";
                          input.onchange = (e: Event) => {
                            const target = e.target as HTMLInputElement;
                            if (!target || !target.files) return;

                            const files = target.files;
                            if (files.length > 0) {
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
                          };
                          input.click();
                        }}
                      >
                        <Upload className="h-4 w-4" />
                        {uploadingInvoices[order.id]
                          ? "Wysyłanie..."
                          : "Dodaj dokumenty"}
                      </Button>
                    </div>
                  )}
                </div>

                {order.status === "paid" && (
                  <Button
                    onClick={() => setShowShipmentConfirmation(true)}
                    className="gap-2"
                  >
                    <Truck className="w-4 h-4" />
                    Zakończ zamówienie
                  </Button>
                )}
              </div>
            </div>

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

            {/* Podsumowanie kosztów na dole (istniejące) */}
            <div className="border-t pt-4 mr-20 ml-2">
              <div className="flex flex-col gap-2">
                <h4 className="font-semibold">Podsumowanie zamówienia:</h4>
                <div className="flex flex-col gap-1 text-sm ml-2">
                  <div>
                    <span className="text-gray-500">Produkty: </span>
                    <span className="font-medium">
                      {order.subtotal.toLocaleString("pl-PL", {
                        style: "currency",
                        currency: "PLN",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Dostawa: </span>
                    <span className="font-medium">
                      {order.shippingCost.toLocaleString("pl-PL", {
                        style: "currency",
                        currency: "PLN",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="font-medium mt-2 pt-2 border-t">
                    <span>Razem: </span>
                    <span className="font-bold text-lg text-primary">
                      {order.total.toLocaleString("pl-PL", {
                        style: "currency",
                        currency: "PLN",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showShipmentConfirmation && (
          <ShipmentConfirmation
            orderId={order.id}
            onClose={() => setShowShipmentConfirmation(false)}
            onConfirm={async () => {
              await updateOrderStatus(order.id, "shipped");
              onClose();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
