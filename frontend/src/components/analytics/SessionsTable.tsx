// frontend/src/components/analytics/SessionsTable.tsx
"use client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { AnalyticsSession } from "@/types/analytics.types";
import { formatDuration } from "@/utils/format";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  Banknote,
  CheckCircle,
  CreditCard,
  Loader2,
  Package,
  ShoppingCart,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

interface SessionDetailsProps {
  data: AnalyticsSession[];
}

const ITEMS_PER_PAGE = 20;

export function SessionsTable({ data }: SessionDetailsProps) {
  const [selectedSession, setSelectedSession] =
    useState<AnalyticsSession | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [displayedItems, setDisplayedItems] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Reset displayed items when data changes
  useEffect(() => {
    setDisplayedItems(ITEMS_PER_PAGE);
  }, [data]);

  const visibleData = data.slice(0, displayedItems);
  const hasMore = displayedItems < data.length;

  const loadMore = () => {
    setIsLoadingMore(true);
    // Symulacja ładowania
    setTimeout(() => {
      setDisplayedItems((prev) => Math.min(prev + ITEMS_PER_PAGE, data.length));
      setIsLoadingMore(false);
    }, 300);
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-4xl mb-4">📊</div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        Brak danych do wyświetlenia
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
        Nie znaleziono żadnych sesji w wybranym okresie. Spróbuj zmienić zakres
        dat lub sprawdź później.
      </p>
    </div>
  );

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "home_page_view":
        return "🏠";
      case "product_view":
        return "🔍";
      case "home_category_click":
        return "📂";
      case "add_to_cart":
      case "add_to_cart_conversion":
        return "🛒";
      case "checkout":
      case "order_pending":
        return "💳";
      case "order_success":
        return "✅";
      case "order_cancelled":
        return "❌";
      default:
        return "📌";
    }
  };

  const getPaymentMethodFromEvents = (session: AnalyticsSession) => {
    // Szukamy informacji o metodzie płatności w eventach
    const orderEvent = session.events.find(
      (event) =>
        event.eventType === "order_success" ||
        event.eventType === "order_pending"
    );

    if (orderEvent && orderEvent.data) {
      // Sprawdzamy różne możliwe nazwy pól
      return (
        orderEvent.data.paymentMethod ||
        orderEvent.data.payment_method ||
        orderEvent.data.paymentType ||
        session.conversion?.paymentMethod
      );
    }

    return session.conversion?.paymentMethod;
  };

  const getPaymentMethodIcon = (method?: string) => {
    if (!method) return null;

    const normalizedMethod = method.toLowerCase();
    if (
      normalizedMethod === "cod" ||
      normalizedMethod === "pobranie" ||
      normalizedMethod === "cash_on_delivery"
    ) {
      return <Banknote className="h-4 w-4" />;
    } else if (
      normalizedMethod === "online" ||
      normalizedMethod === "transfer" ||
      normalizedMethod === "card"
    ) {
      return <CreditCard className="h-4 w-4" />;
    }
    return null;
  };

  const formatPaymentMethod = (method?: string) => {
    if (!method) return null;

    const normalizedMethod = method.toLowerCase();
    if (
      normalizedMethod === "cod" ||
      normalizedMethod === "pobranie" ||
      normalizedMethod === "cash_on_delivery"
    ) {
      return "Pobranie";
    } else if (
      normalizedMethod === "online" ||
      normalizedMethod === "transfer" ||
      normalizedMethod === "card"
    ) {
      return "Online";
    }
    return method;
  };

  const hasAddedToCart = (session: AnalyticsSession) => {
    return session.events.some(
      (event) =>
        event.eventType === "add_to_cart" ||
        event.eventType === "add_to_cart_conversion"
    );
  };

  const renderEventData = (data: any) => {
    const excludeKeys = [
      "userAgent",
      "timestamp",
      "deviceType",
      "screenResolution",
    ];
    return Object.entries(data)
      .filter(([key]) => !excludeKeys.includes(key))
      .map(([key, value]) => (
        <div key={key} className="mb-2">
          <span className="font-medium">{key}: </span>
          <span>{value as string}</span>
        </div>
      ));
  };

  const renderTimelineDot = (eventType: string) => (
    <div className="absolute -left-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white text-xs">
      {getEventIcon(eventType)}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-medium">Sesje użytkowników</h2>
          <p className="text-sm text-muted-foreground">
            Szczegółowy widok wszystkich sesji i interakcji użytkowników
            {data.length > 0 && (
              <span className="ml-2 font-medium">
                (Wyświetlono {visibleData.length} z {data.length})
              </span>
            )}
          </p>
        </div>
      </div>

      {data.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-medium">
                    Data rozpoczęcia
                  </TableHead>
                  <TableHead className="font-medium">Źródło ruchu</TableHead>
                  <TableHead className="font-medium">Odsłony</TableHead>
                  <TableHead className="font-medium">Urządzenie</TableHead>
                  <TableHead className="font-medium">Czas trwania</TableHead>
                  <TableHead className="font-medium text-center">
                    Koszyk
                  </TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="font-medium">Płatność</TableHead>
                  <TableHead className="font-medium w-[100px]">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleData.map((session) => {
                  const addedToCart = hasAddedToCart(session);
                  const paymentMethod = getPaymentMethodFromEvents(session);

                  return (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {format(new Date(session.startTime), "dd MMM", {
                              locale: pl,
                            })}
                          </span>
                          <span className="text-muted-foreground">
                            {format(new Date(session.startTime), "HH:mm:ss")}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 text-xs">
                            {session.trafficSource === "direct" && "🌐"}
                            {session.trafficSource === "referral" && "↩️"}
                            {session.trafficSource === "search_engine" && "🔍"}
                            {session.trafficSource === "social" && "👥"}
                            {session.trafficSource === "google_ads" && "G"}
                          </span>
                          <span className="capitalize text-sm">
                            {session.trafficSource.replace("_", " ")}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        {session.pageViews}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{session.deviceType}</span>
                          <span className="text-xs text-muted-foreground">
                            {session.browserName}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>{formatDuration(session.duration)}</TableCell>

                      <TableCell className="text-center">
                        {addedToCart ? (
                          <ShoppingCart className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            -
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {session.conversion?.type === "order_success" ? (
                          <Badge className="bg-green-500 hover:bg-green-600 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Zamówienie
                          </Badge>
                        ) : session.conversion?.type === "order_pending" ? (
                          <Badge variant="outline">
                            <Package className="h-3 w-3 mr-1" />W trakcie
                          </Badge>
                        ) : session.conversion?.type ===
                          "add_to_cart_conversion" ? (
                          <Badge variant="secondary">
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Koszyk
                          </Badge>
                        ) : session.conversion?.type === "order_cancelled" ? (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Anulowane
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            -
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {paymentMethod ? (
                          <div className="flex items-center gap-1">
                            {getPaymentMethodIcon(paymentMethod)}
                            <span className="text-sm">
                              {formatPaymentMethod(paymentMethod)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            -
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSession(session);
                            setIsModalOpen(true);
                          }}
                        >
                          Szczegóły
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {hasMore && (
            <div className="flex justify-center py-4">
              <Button
                onClick={loadMore}
                disabled={isLoadingMore}
                variant="outline"
                size="lg"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Ładowanie...
                  </>
                ) : (
                  <>
                    Załaduj więcej
                    <span className="ml-2 text-muted-foreground">
                      (pozostało {data.length - displayedItems})
                    </span>
                  </>
                )}
              </Button>
            </div>
          )}

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Szczegóły sesji</DialogTitle>
              </DialogHeader>

              {selectedSession && (
                <Tabs defaultValue="timeline">
                  <TabsList>
                    <TabsTrigger value="timeline">Oś czasu</TabsTrigger>
                    <TabsTrigger value="device">Urządzenie</TabsTrigger>
                    <TabsTrigger value="geo">Lokalizacja</TabsTrigger>
                    {selectedSession.conversion?.occurred && (
                      <TabsTrigger value="conversion">Konwersja</TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="timeline" className="space-y-4">
                    <div className="relative border-l-2 border-primary pl-6 ml-4 space-y-6">
                      {selectedSession.events.map(
                        (event: any, index: number) => (
                          <div key={index} className="relative">
                            {renderTimelineDot(event.eventType)}
                            <Card className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium">
                                  {event.eventType}
                                </h4>
                                <time className="text-sm text-muted-foreground">
                                  {format(
                                    new Date(event.timestamp),
                                    "HH:mm:ss",
                                    {
                                      locale: pl,
                                    }
                                  )}
                                </time>
                              </div>
                              <div className="text-sm space-y-1">
                                {renderEventData(event.data)}
                              </div>
                            </Card>
                          </div>
                        )
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="device">
                    <Card className="p-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-medium mb-4">Urządzenie</h3>
                          <div className="space-y-2">
                            <div>
                              <span className="text-muted-foreground">
                                Typ:{" "}
                              </span>
                              {selectedSession.deviceType}
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                System:{" "}
                              </span>
                              {selectedSession.osName}{" "}
                              {selectedSession.osVersion}
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Przeglądarka:{" "}
                              </span>
                              {selectedSession.browserName}{" "}
                              {selectedSession.browserVersion}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-medium mb-4">
                            Szczegóły techniczne
                          </h3>
                          <div className="space-y-2">
                            <div>
                              <span className="text-muted-foreground">
                                IP Address:{" "}
                              </span>
                              {selectedSession.ipAddress}
                            </div>
                            {selectedSession.referringUrl && (
                              <div>
                                <span className="text-muted-foreground">
                                  Referrer:{" "}
                                </span>
                                {selectedSession.referringUrl}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="geo">
                    <Card className="p-6">
                      <div className="space-y-4">
                        {selectedSession.geoLocation.country && (
                          <div>
                            <span className="text-muted-foreground">
                              Kraj:{" "}
                            </span>
                            {selectedSession.geoLocation.country}
                          </div>
                        )}
                        {selectedSession.geoLocation.city && (
                          <div>
                            <span className="text-muted-foreground">
                              Miasto:{" "}
                            </span>
                            {selectedSession.geoLocation.city}
                          </div>
                        )}
                        {selectedSession.geoLocation.region && (
                          <div>
                            <span className="text-muted-foreground">
                              Region:{" "}
                            </span>
                            {selectedSession.geoLocation.region}
                          </div>
                        )}
                      </div>
                    </Card>
                  </TabsContent>

                  {selectedSession.conversion?.occurred && (
                    <TabsContent value="conversion">
                      <Card className="p-6">
                        <h3 className="font-medium mb-4">
                          Szczegóły konwersji
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <span className="text-muted-foreground">Typ: </span>
                            <Badge className="ml-2">
                              {selectedSession.conversion.type}
                            </Badge>
                          </div>
                          {selectedSession.conversion.value && (
                            <div>
                              <span className="text-muted-foreground">
                                Wartość:{" "}
                              </span>
                              <span className="font-bold">
                                {selectedSession.conversion.value.toFixed(2)}{" "}
                                PLN
                              </span>
                            </div>
                          )}
                          {selectedSession.conversion.orderId && (
                            <div>
                              <span className="text-muted-foreground">
                                ID zamówienia:{" "}
                              </span>
                              <span className="font-mono">
                                {selectedSession.conversion.orderId}
                              </span>
                            </div>
                          )}
                          {selectedSession.conversion.paymentMethod && (
                            <div>
                              <span className="text-muted-foreground">
                                Metoda płatności:{" "}
                              </span>
                              {selectedSession.conversion.paymentMethod ===
                              "cod"
                                ? "Pobranie"
                                : "Online"}
                            </div>
                          )}
                        </div>
                      </Card>
                    </TabsContent>
                  )}
                </Tabs>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
