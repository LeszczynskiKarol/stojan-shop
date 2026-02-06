// // frontend/src/components/orders/OrderPage.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Order } from "@/types/order.types";
import { useOrderStore } from "@/store/orderStore";
import { Button } from "@/components/ui/Button";
import {
  FileText,
  MessageSquare,
  Printer,
  Package,
  CreditCard,
  Truck,
  Mail,
  Phone,
  AlertCircle,
  User,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";

const statusLabels = {
  pending: "Oczekujące",
  paid: "Opłacone",
  shipped: "Wysłane",
  delivered: "Dostarczone",
  cancelled: "Anulowane",
};

const statusColors = {
  pending: "bg-yellow-500 text-white",
  paid: "bg-green-500 text-white",
  shipped: "bg-blue-500 text-white",
  delivered: "bg-purple-500 text-white",
  cancelled: "bg-red-500 text-white",
};

const paymentMethodLabels = {
  prepaid: "Przedpłata online",
  cod: "Płatność przy odbiorze",
};

export default function OrderPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const formattedOrderNumber = orderNumber?.toString().replace(/-/g, "/");
        const response = await fetch(
          `/api/orders/details/by-number/${formattedOrderNumber}`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );
        const data = await response.json();

        if (data.success) {
          setOrder(data.data);
        }
      } catch (error) {
        console.error("Błąd:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nie znaleziono zamówienia o numerze {orderNumber}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  // Pomocnicze funkcje do określenia adresów
  const getDeliveryAddress = () => {
    if (order.shipping.differentShippingAddress) {
      return {
        street: order.shipping.shippingStreet,
        postalCode: order.shipping.shippingPostalCode,
        city: order.shipping.shippingCity,
      };
    }
    return {
      street: order.shipping.street,
      postalCode: order.shipping.postalCode,
      city: order.shipping.city,
    };
  };

  const getInvoiceAddress = () => {
    if (order.shipping.differentInvoiceAddress) {
      return {
        street: order.shipping.invoiceStreet,
        postalCode: order.shipping.invoicePostalCode,
        city: order.shipping.invoiceCity,
      };
    }
    return {
      street: order.shipping.street,
      postalCode: order.shipping.postalCode,
      city: order.shipping.city,
    };
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Nagłówek zamówienia */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">
              Zamówienie #{order.orderNumber}
            </h1>
            <Badge
              variant="secondary"
              className={`${statusColors[order.status]} text-sm px-3 py-1`}
            >
              {statusLabels[order.status]}
            </Badge>
          </div>
          <div className="mt-2 space-y-1 text-muted-foreground">
            <p>
              Data złożenia: {new Date(order.createdAt).toLocaleString("pl-PL")}
            </p>
            <p className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              {paymentMethodLabels[order.paymentMethod]}
            </p>
            {order.shippingDate && (
              <p className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Przewidywana data dostawy:{" "}
                {new Date(order.shippingDate).toLocaleDateString("pl-PL")}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-4 print:hidden">
          <div className="flex flex-col gap-2">
            {order.invoiceUrls?.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <FileText className="w-4 h-4" />
                Faktura {index + 1}
              </a>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Drukuj
          </Button>
        </div>
      </div>

      {/* Sekcja danych */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Dane klienta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Dane klienta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {order.shipping.companyName ? (
                <div>
                  <p className="font-medium text-lg flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {order.shipping.companyName}
                  </p>
                  {order.shipping.nip && (
                    <p className="text-sm text-muted-foreground mt-1">
                      NIP: {order.shipping.nip}
                    </p>
                  )}
                </div>
              ) : (
                <p className="font-medium text-lg">
                  {order.shipping.firstName} {order.shipping.lastName}
                </p>
              )}

              <div className="pt-3 space-y-1 text-sm">
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {order.shipping.email}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  {order.shipping.phone}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Adres dostawy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Adres dostawy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {order.shipping.differentShippingAddress && (
                <p className="text-xs text-orange-600 font-medium">
                  ⚠ Inny niż adres główny
                </p>
              )}
              <div>
                <p>{getDeliveryAddress().street}</p>
                <p>
                  {getDeliveryAddress().postalCode} {getDeliveryAddress().city}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dane do faktury */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Dane do faktury
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {order.shipping.nip ? (
                <>
                  <p className="font-medium">{order.shipping.companyName}</p>
                  <p className="text-sm text-muted-foreground">
                    NIP: {order.shipping.nip}
                  </p>
                  {order.shipping.differentInvoiceAddress && (
                    <p className="text-xs text-orange-600 font-medium mt-2">
                      ⚠ Inny adres do faktury
                    </p>
                  )}
                  <div className="pt-2">
                    <p>{getInvoiceAddress().street}</p>
                    <p>
                      {getInvoiceAddress().postalCode}{" "}
                      {getInvoiceAddress().city}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-medium">
                    {order.shipping.firstName} {order.shipping.lastName}
                  </p>
                  <div className="pt-2">
                    <p>{order.shipping.street}</p>
                    <p>
                      {order.shipping.postalCode} {order.shipping.city}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">Paragon</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {order.shipping.notes && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Uwagi do zamówienia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {order.shipping.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lista produktów */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Zamówione produkty
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left">Produkt</th>
                  <th className="px-4 py-2 text-right">Ilość</th>
                  <th className="px-4 py-2 text-right">Cena</th>
                  <th className="px-4 py-2 text-right">Suma</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-4">
                        <img
                          src={
                            item.mainImage || item.image || "/placeholder.png"
                          }
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <div className="text-sm text-muted-foreground space-y-1">
                            {item.weight && <p>Waga: {item.weight}kg</p>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      {item.quantity} szt.
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      {item.price.toLocaleString("pl-PL", {
                        style: "currency",
                        currency: "PLN",
                      })}
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      {(item.price * item.quantity).toLocaleString("pl-PL", {
                        style: "currency",
                        currency: "PLN",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50">
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-right font-medium">
                    Suma produktów:
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    {order.subtotal.toLocaleString("pl-PL", {
                      style: "currency",
                      currency: "PLN",
                    })}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-right font-medium">
                    Koszt wysyłki:
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    {order.shippingCost.toLocaleString("pl-PL", {
                      style: "currency",
                      currency: "PLN",
                    })}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-right font-medium">
                    Razem:
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap font-bold">
                    {order.total.toLocaleString("pl-PL", {
                      style: "currency",
                      currency: "PLN",
                    })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dodatkowe informacje */}
      <div className="print:hidden">
        <Alert>
          <AlertDescription>
            W razie pytań dotyczących zamówienia, prosimy o kontakt mailowy na
            adres{" "}
            <a
              href="mailto:stojan@silniki-elektryczne.com.pl"
              className="text-primary hover:underline"
            >
              stojan@silniki-elektryczne.com.pl
            </a>{" "}
            lub telefoniczny pod numerem{" "}
            <a href="tel:+48500385112" className="text-primary hover:underline">
              500 385 112
            </a>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
