// frontend/src/app/(admin)/admin/analytics/page.tsx
"use client";
import { SessionsTable } from "@/components/analytics/SessionsTable";
import { Card } from "@/components/ui/Card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { AnalyticsData } from "@/types/analytics.types";
import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange?.from)
        params.append("startDate", dateRange.from.toISOString());
      if (dateRange?.to) params.append("endDate", dateRange.to.toISOString());

      // Dodaj parametry paginacji
      params.append("page", "1");
      params.append("limit", "1000"); // Pobierz więcej sesji

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(
        `${baseUrl}/api/analytics/dashboard?${params}`
      );
      const result = await response.json();

      // Mapowanie danych z backendu na strukturę oczekiwaną przez frontend
      if (result.success && result.data) {
        const mappedData: AnalyticsData = {
          stats: {
            totalSessions: result.data.overall?.totalSessions || 0,
            avgDurationSeconds: result.data.overall?.avgDuration || 0,
            totalPageViews: result.data.overall?.avgPageViews || 0,
            conversions: Math.round(
              (result.data.overall?.totalSessions || 0) *
                ((result.data.overall?.orderSuccessRate || 0) / 100)
            ),
          },
          trafficBreakdown: result.data.trafficSources || [],
          funnel: result.data.funnel || {
            total_sessions: 0,
            product_views: 0,
            add_to_carts: 0,
            purchases: 0,
          },
          sessions: result.data.sessions || [],
        };
        setData(mappedData);
      } else {
        // Ustaw domyślne wartości
        setData({
          stats: {
            totalSessions: 0,
            avgDurationSeconds: 0,
            totalPageViews: 0,
            conversions: 0,
          },
          trafficBreakdown: [],
          funnel: {
            total_sessions: 0,
            product_views: 0,
            add_to_carts: 0,
            purchases: 0,
          },
          sessions: [],
        });
      }
    } catch (error) {
      console.error("Błąd podczas pobierania danych:", error);
      // Ustaw domyślne wartości
      setData({
        stats: {
          totalSessions: 0,
          avgDurationSeconds: 0,
          totalPageViews: 0,
          conversions: 0,
        },
        trafficBreakdown: [],
        funnel: {
          total_sessions: 0,
          product_views: 0,
          add_to_carts: 0,
          purchases: 0,
        },
        sessions: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const prepareFunnelData = (funnel: AnalyticsData["funnel"]) => {
    if (!funnel) return [];

    const totalSessions = funnel.total_sessions || 1; // Zabezpieczenie przed dzieleniem przez 0

    return [
      {
        name: "Sesje",
        value: funnel.total_sessions || 0,
        percentage: 100,
      },
      {
        name: "Wyświetlenia produktów",
        value: funnel.product_views || 0,
        percentage:
          totalSessions > 0
            ? (((funnel.product_views || 0) / totalSessions) * 100).toFixed(1)
            : "0",
      },
      {
        name: "Dodanie do koszyka",
        value: funnel.add_to_carts || 0,
        percentage:
          totalSessions > 0
            ? (((funnel.add_to_carts || 0) / totalSessions) * 100).toFixed(1)
            : "0",
      },
      {
        name: "Zakupy",
        value: funnel.purchases || 0,
        percentage:
          totalSessions > 0
            ? (((funnel.purchases || 0) / totalSessions) * 100).toFixed(1)
            : "0",
      },
    ];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4">Ładowanie danych analitycznych...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500">Nie udało się załadować danych</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analityka</h1>
        <DateRangePicker
          value={dateRange}
          onChange={(range) => setDateRange(range)}
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Przegląd</TabsTrigger>
          <TabsTrigger value="sessions">Sesje</TabsTrigger>
          <TabsTrigger value="traffic">Źródła ruchu</TabsTrigger>
          <TabsTrigger value="funnel">Lejek konwersji</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-8">
            <div className="grid grid-cols-4 gap-4">
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Sesje
                </h3>
                <p className="text-2xl font-bold">{data.stats.totalSessions}</p>
              </Card>
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Średni czas
                </h3>
                <p className="text-2xl font-bold">
                  {Math.floor(data.stats.avgDurationSeconds / 60)}min
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Odsłony
                </h3>
                <p className="text-2xl font-bold">
                  {Math.round(data.stats.totalPageViews)}
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Konwersje
                </h3>
                <p className="text-2xl font-bold">{data.stats.conversions}</p>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">
                Podsumowanie aktywności
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.trafficBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="source" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Liczba sesji"
                    stroke="#8884d8"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions">
          <Card className="p-6">
            <SessionsTable data={data.sessions} />
          </Card>
        </TabsContent>

        <TabsContent value="traffic">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">
              Źródła ruchu i czas trwania sesji
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.trafficBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="source" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="total"
                  fill="#8884d8"
                  name="Liczba sesji"
                />
                <Bar
                  yAxisId="right"
                  dataKey="avgDuration"
                  fill="#82ca9d"
                  name="Średni czas (s)"
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="funnel">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Lejek konwersji</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={prepareFunnelData(data.funnel)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip
                  formatter={(value: number, _name: string, entry: any) => {
                    if (entry && entry.payload && entry.payload.percentage) {
                      return [
                        `${value} (${entry.payload.percentage}%)`,
                        "Liczba",
                      ];
                    }
                    return [value.toString(), "Liczba"];
                  }}
                />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
