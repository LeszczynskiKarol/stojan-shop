// frontend/src/components/analytics/SessionsTable.tsx
"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { AnalyticsSession } from "@/types/analytics.types";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { formatDuration } from "@/utils/format";

interface SessionDetailsProps {
  data: AnalyticsSession[];
}

export function SessionsTable({ data }: SessionDetailsProps) {
  const [selectedSession, setSelectedSession] =
    useState<AnalyticsSession | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
        return "🛒";
      case "checkout":
        return "💳";
      default:
        return "📌";
    }
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
    <div className="absolute -left-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white">
      {getEventIcon(eventType)}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Sesje użytkowników</h2>
          <p className="text-sm text-muted-foreground">
            Szczegółowy widok wszystkich sesji i interakcji użytkowników
          </p>
        </div>
      </div>

      {data.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-medium">Data rozpoczęcia</TableHead>
                <TableHead className="font-medium">Źródło ruchu</TableHead>
                <TableHead className="font-medium">Odsłony</TableHead>
                <TableHead className="font-medium">Urządzenie</TableHead>
                <TableHead className="font-medium">Czas trwania</TableHead>
                <TableHead className="font-medium w-[100px]">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((session) => (
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
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/10">
                        {session.trafficSource === "direct" && "🌐"}
                        {session.trafficSource === "referral" && "↩️"}
                        {session.trafficSource === "search_engine" && "🔍"}
                        {session.trafficSource === "social" && "👥"}
                      </span>
                      <span className="capitalize">
                        {session.trafficSource.replace("_", " ")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{session.pageViews}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{session.deviceType}</span>
                      <span className="text-xs text-muted-foreground">
                        {session.browserName} {session.browserVersion}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDuration(session.duration)}</TableCell>
                  <TableCell>
                    <Button
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
              ))}
            </TableBody>
          </Table>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span>Szczegóły sesji</span>
                    {selectedSession && (
                      <span className="text-sm text-muted-foreground">
                        {format(
                          new Date(selectedSession.startTime),
                          "dd MMMM yyyy, HH:mm:ss",
                          {
                            locale: pl,
                          }
                        )}
                      </span>
                    )}
                  </DialogTitle>
                </DialogHeader>
              </DialogHeader>

              {selectedSession && (
                <Tabs defaultValue="timeline">
                  <TabsList>
                    <TabsTrigger value="timeline">Oś czasu</TabsTrigger>
                    <TabsTrigger value="device">Urządzenie</TabsTrigger>
                    <TabsTrigger value="geo">Lokalizacja</TabsTrigger>
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
                </Tabs>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
