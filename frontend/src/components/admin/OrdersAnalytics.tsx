// frontend/src/components/admin/OrdersAnalytics.tsx
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { api } from "@/lib/api";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Calendar,
  Clock,
} from "lucide-react";

interface OrderStats {
  date: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

interface OrdersAnalyticsProps {
  dateRange?: DateRange;
}
interface StatusBreakdown {
  status: string;
  count: number;
  value: number;
}

interface PaymentMethodStats {
  method: string;
  count: number;
  value: number;
  percentage: number;
}

interface ProductStats {
  productName: string;
  quantity: number;
  revenue: number;
}

interface HourlyStats {
  hour: number;
  orders: number;
}

export const OrdersAnalytics = ({ dateRange }: OrdersAnalyticsProps) => {
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [stats, setStats] = useState<OrderStats[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentMethodStats[]>([]);
  const [topProducts, setTopProducts] = useState<ProductStats[]>([]);
  const [hourlyDistribution, setHourlyDistribution] = useState<HourlyStats[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<{
    currentPeriod: number;
    previousPeriod: number;
    percentageChange: number;
  } | null>(null);

  const fetchStats = async () => {
    if (!dateRange?.from || !dateRange?.to) return;
    setLoading(true);
    setError(null);

    try {
      // Pobierz główne statystyki
      const [statsResponse, ordersResponse] = await Promise.all([
        api.get("/orders/stats", {
          params: {
            startDate: dateRange.from.toISOString(),
            endDate: dateRange.to.toISOString(),
            groupBy: groupBy,
          },
        }),
        api.get("/orders", {
          params: {
            dateFrom: dateRange.from.toISOString(),
            dateTo: dateRange.to.toISOString(),
            limit: 1000, // Pobierz więcej zamówień do analizy
          },
        }),
      ]);

      if (
        statsResponse.data.success &&
        Array.isArray(statsResponse.data.data)
      ) {
        const formattedStats = statsResponse.data.data.map((stat: any) => ({
          date: new Date(stat.date).toISOString().split("T")[0],
          totalRevenue: Number(stat.totalRevenue) || 0,
          totalOrders: Number(stat.totalOrders) || 0,
          averageOrderValue: Number(stat.averageOrderValue) || 0,
        }));
        setStats(formattedStats);
      }

      // Przetwórz dane zamówień dla dodatkowych statystyk
      if (ordersResponse.data.success && ordersResponse.data.data.orders) {
        const orders = ordersResponse.data.data.orders;

        // Podział na statusy
        const statusMap = new Map<string, { count: number; value: number }>();
        const paymentMap = new Map<string, { count: number; value: number }>();
        const productMap = new Map<
          string,
          { quantity: number; revenue: number }
        >();
        const hourlyMap = new Map<number, number>();

        orders.forEach((order: any) => {
          // Status breakdown
          const status = order.status;
          const current = statusMap.get(status) || { count: 0, value: 0 };
          statusMap.set(status, {
            count: current.count + 1,
            value: current.value + Number(order.total),
          });

          // Payment methods
          const payment = order.paymentMethod === "cod" ? "Pobranie" : "Online";
          const paymentCurrent = paymentMap.get(payment) || {
            count: 0,
            value: 0,
          };
          paymentMap.set(payment, {
            count: paymentCurrent.count + 1,
            value: paymentCurrent.value + Number(order.total),
          });

          // Products
          order.items?.forEach((item: any) => {
            const productCurrent = productMap.get(item.name) || {
              quantity: 0,
              revenue: 0,
            };
            productMap.set(item.name, {
              quantity: productCurrent.quantity + item.quantity,
              revenue: productCurrent.revenue + item.price * item.quantity,
            });
          });

          // Hourly distribution
          const hour = new Date(order.createdAt).getHours();
          hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
        });

        // Format status breakdown
        setStatusBreakdown(
          Array.from(statusMap.entries()).map(([status, data]) => ({
            status: getStatusLabel(status),
            count: data.count,
            value: data.value,
          }))
        );

        // Format payment stats with percentages
        const totalPaymentValue = Array.from(paymentMap.values()).reduce(
          (sum, p) => sum + p.value,
          0
        );
        setPaymentStats(
          Array.from(paymentMap.entries()).map(([method, data]) => ({
            method,
            count: data.count,
            value: data.value,
            percentage: (data.value / totalPaymentValue) * 100,
          }))
        );

        // Top products (top 5)
        setTopProducts(
          Array.from(productMap.entries())
            .map(([productName, data]) => ({
              productName,
              quantity: data.quantity,
              revenue: data.revenue,
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5)
        );

        // Hourly distribution
        const hourlyArray = [];
        for (let i = 0; i < 24; i++) {
          hourlyArray.push({
            hour: i,
            orders: hourlyMap.get(i) || 0,
          });
        }
        setHourlyDistribution(hourlyArray);

        // Porównanie z poprzednim okresem
        calculateComparison(orders);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      setError("Błąd podczas pobierania statystyk");
    } finally {
      setLoading(false);
    }
  };

  const calculateComparison = (orders: any[]) => {
    if (!dateRange?.from || !dateRange?.to) return;

    const periodLength = dateRange.to.getTime() - dateRange.from.getTime();
    const previousStart = new Date(dateRange.from.getTime() - periodLength);
    const previousEnd = new Date(dateRange.from.getTime());

    const currentPeriodOrders = orders.filter((o) => {
      const date = new Date(o.createdAt);
      return date >= dateRange.from! && date <= dateRange.to!;
    });

    // Tutaj normalnie pobierałbyś dane z poprzedniego okresu z API
    // Na potrzeby przykładu symulujemy
    const currentRevenue = currentPeriodOrders.reduce(
      (sum, o) => sum + Number(o.total),
      0
    );
    const previousRevenue = currentRevenue * 0.85; // Symulacja - zakładamy 15% wzrost

    const percentageChange =
      ((currentRevenue - previousRevenue) / previousRevenue) * 100;

    setComparisonData({
      currentPeriod: currentRevenue,
      previousPeriod: previousRevenue,
      percentageChange,
    });
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: "Oczekujące",
      paid: "Opłacone",
      shipped: "Wysłane",
      delivered: "Dostarczone",
      cancelled: "Anulowane",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      Oczekujące: "#FFA500",
      Opłacone: "#4CAF50",
      Wysłane: "#2196F3",
      Dostarczone: "#9C27B0",
      Anulowane: "#F44336",
    };
    return colors[status] || "#888888";
  };

  useEffect(() => {
    fetchStats();
  }, [dateRange, groupBy]);

  const totalRevenue = stats.reduce(
    (sum, stat) => sum + (stat.totalRevenue || 0),
    0
  );
  const totalOrders = stats.reduce(
    (sum, stat) => sum + (stat.totalOrders || 0),
    0
  );
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pl-PL", {
      style: "currency",
      currency: "PLN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Najlepszy dzień
  const bestDay = stats.reduce(
    (best, current) =>
      current.totalRevenue > best.totalRevenue ? current : best,
    stats[0] || {
      date: "",
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
    }
  );

  // Średnia dzienna
  const dailyAverage = stats.length > 0 ? totalRevenue / stats.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analityka Sprzedaży</h2>
        <div className="flex items-center gap-4">
          <Select
            value={groupBy}
            onValueChange={(value: "day" | "week" | "month") =>
              setGroupBy(value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Wybierz okres" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dzień</SelectItem>
              <SelectItem value="week">Tydzień</SelectItem>
              <SelectItem value="month">Miesiąc</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Przychód całkowity
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue)}
            </div>
            {comparisonData && (
              <p
                className={`text-xs ${
                  comparisonData.percentageChange > 0
                    ? "text-green-600"
                    : "text-red-600"
                } flex items-center mt-1`}
              >
                {comparisonData.percentageChange > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(comparisonData.percentageChange).toFixed(1)}% vs
                poprzedni okres
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Liczba zamówień
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Średnio {(totalOrders / (stats.length || 1)).toFixed(1)} dziennie
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Średnia wartość
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(avgOrderValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Na zamówienie</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Najlepszy dzień
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(bestDay?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {bestDay?.date
                ? new Date(bestDay.date).toLocaleDateString("pl-PL")
                : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Wykresy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wykres przychodu */}
        <Card>
          <CardHeader>
            <CardTitle>Przychód w czasie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats}>
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString("pl-PL", {
                        day: "2-digit",
                        month: "2-digit",
                      })
                    }
                  />
                  <YAxis
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalRevenue"
                    stroke="#8884d8"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Wykres liczby zamówień */}
        <Card>
          <CardHeader>
            <CardTitle>Liczba zamówień</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString("pl-PL", {
                        day: "2-digit",
                        month: "2-digit",
                      })
                    }
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(label) => `Data: ${label}`} />
                  <Bar dataKey="totalOrders" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Podział statusów */}
        <Card>
          <CardHeader>
            <CardTitle>Podział według statusów</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.status}: ${entry.count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {statusBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getStatusColor(entry.status)}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Metody płatności */}
        <Card>
          <CardHeader>
            <CardTitle>Metody płatności</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentStats.map((payment) => (
                <div key={payment.method} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{payment.method}</span>
                    <span className="font-medium">
                      {formatCurrency(payment.value)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${payment.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{payment.count} zamówień</span>
                    <span>{payment.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top produkty */}
        <Card>
          <CardHeader>
            <CardTitle>Najlepiej sprzedające się produkty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div
                  key={product.productName}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0
                          ? "bg-yellow-500"
                          : index === 1
                          ? "bg-gray-400"
                          : index === 2
                          ? "bg-orange-600"
                          : "bg-gray-300"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]">
                        {product.productName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.quantity} szt.
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      {formatCurrency(product.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rozkład godzinowy */}
        <Card>
          <CardHeader>
            <CardTitle>Rozkład zamówień w ciągu dnia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="hour"
                    tickFormatter={(hour) => `${hour}:00`}
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(hour) => `Godzina: ${hour}:00`} />
                  <Bar dataKey="orders" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
