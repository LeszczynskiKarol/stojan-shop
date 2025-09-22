// frontend/src/app/(admin)/admin/analytics/page.tsx
"use client";
import { useState, useEffect } from "react";
import { AnalyticsData } from "@/types/analytics.types";
import { Card } from "@/components/ui/Card";
import { DateRange } from "react-day-picker";
import { SessionsTable } from "@/components/analytics/SessionsTable";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import {
  BarChart,
  LineChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
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

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(
        `${baseUrl}/api/analytics/dashboard?${params}`
      );
      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error("Błąd podczas pobierania danych:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const prepareFunnelData = (funnel: AnalyticsData["funnel"]) => {
    return [
      {
        name: "Sesje",
        value: funnel.total_sessions,
        percentage: 100,
      },
      {
        name: "Wyświetlenia produktów",
        value: funnel.product_views,
        percentage: (
          (funnel.product_views / funnel.total_sessions) *
          100
        ).toFixed(1),
      },
      {
        name: "Dodanie do koszyka",
        value: funnel.add_to_carts,
        percentage: (
          (funnel.add_to_carts / funnel.total_sessions) *
          100
        ).toFixed(1),
      },
      {
        name: "Zakupy",
        value: funnel.purchases,
        percentage: ((funnel.purchases / funnel.total_sessions) * 100).toFixed(
          1
        ),
      },
    ];
  };

  if (isLoading) {
    return <div>Ładowanie...</div>;
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
          {data && (
            <div className="space-y-8">
              <div className="grid grid-cols-4 gap-4">
                <Card className="p-6">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Sesje
                  </h3>
                  <p className="text-2xl font-bold">
                    {data.stats.totalSessions}
                  </p>
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
                    {data.stats.totalPageViews}
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
                    <XAxis dataKey="trafficSource" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Liczba sesji"
                      stroke="#8884d8"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions">
          <Card className="p-6">
            <SessionsTable data={data?.sessions || []} />
          </Card>
        </TabsContent>

        <TabsContent value="traffic">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">
              Źródła ruchu i czas trwania sesji
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data?.trafficBreakdown || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="trafficSource" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="count"
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
              <BarChart
                data={data ? prepareFunnelData(data.funnel) : []}
                layout="vertical"
              >
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
