// frontend/src/app/(admin)/admin/page.tsx
"use client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FileText, Shield } from "lucide-react";
import Link from "next/link";
//import InventoryAlerts from "@/components/admin/InventoryAlerts";
import { useAuthStore } from "@/store/authStore";
import { useOrderStore } from "@/store/orderStore";
import { useProductStore } from "@/store/productStore";
import { Order } from "@/types/order.types";
import { IProduct } from "@/types/product.types";
import {
  Clock,
  Package,
  PlusCircle,
  ShoppingBag,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";

interface DashboardStats {
  totalProducts: number;
  lowStock: number;
  recentOrders: Order[];
  pendingOrders: number;
}

const initialStats: DashboardStats = {
  totalProducts: 0,
  lowStock: 0,
  recentOrders: [],
  pendingOrders: 0,
};

const TwoFactorSetup = () => {
  const { token, user } = useAuthStore();
  const [qrCode, setQrCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  useEffect(() => {
    const check2FAStatus = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        setIs2FAEnabled(data.data.isTwoFactorEnabled);
      } catch (error) {
        console.error("Błąd podczas sprawdzania statusu 2FA:", error);
      }
    };

    check2FAStatus();
  }, [token]);

  const setupTwoFactor = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/2fa/setup`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Błąd podczas konfiguracji 2FA");
      }

      const responseData = await response.json();

      if (!responseData.data?.otpAuthUrl || !responseData.data?.secret) {
        throw new Error("Nieprawidłowa odpowiedź z serwera");
      }

      setQrCode(responseData.data.otpAuthUrl);
      setSecretKey(responseData.data.secret);
    } catch (error) {
      console.error("Szczegóły błędu:", error);
      setError(
        error instanceof Error ? error.message : "Błąd podczas konfiguracji 2FA"
      );
    }
  };

  const verifyAndEnable = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/2fa/verify`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: verificationCode }),
        }
      );

      if (!response.ok) {
        throw new Error("Nieprawidłowy kod weryfikacyjny");
      }

      setSuccess("Weryfikacja dwuetapowa została włączona");
      setQrCode("");
      setVerificationCode("");
      setIs2FAEnabled(true);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const disable2FA = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/2fa/disable`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Błąd podczas wyłączania 2FA");
      }

      setIs2FAEnabled(false);
      setSuccess("Weryfikacja dwuetapowa została wyłączona");
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {error && <div className="text-red-500 text-sm">{error}</div>}
      {success && <div className="text-green-500 text-sm">{success}</div>}

      {is2FAEnabled ? (
        <div className="space-y-4">
          <p className="text-green-500">Weryfikacja dwuetapowa jest włączona</p>
          <Button
            onClick={disable2FA}
            className="w-full bg-destructive hover:bg-destructive/90"
          >
            Wyłącz weryfikację dwuetapową
          </Button>
        </div>
      ) : qrCode ? (
        <div className="space-y-4">
          <QRCode value={qrCode} size={200} level="H" />
          <p className="text-sm text-muted-foreground">
            Zeskanuj kod QR w aplikacji Google Authenticator
          </p>
          {secretKey && (
            <p className="text-sm text-muted-foreground">
              Lub wprowadź ten kod ręcznie:{" "}
              <code className="bg-gray-100 p-1 rounded">{secretKey}</code>
            </p>
          )}
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Kod weryfikacyjny"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
            <Button onClick={verifyAndEnable} className="w-full">
              Weryfikuj i włącz
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={setupTwoFactor} className="w-full">
          Włącz weryfikację dwuetapową
        </Button>
      )}
    </div>
  );
};

export default function AdminDashboard() {
  const { products, fetchProducts } = useProductStore();
  const { orders, fetchOrders } = useOrderStore();
  const [stats, setStats] = useState<DashboardStats>(initialStats);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        await Promise.all([
          fetchProducts(),
          fetchOrders(0), // Pobieramy pierwszą stronę zamówień
        ]);
      } catch (error) {
        console.error("Błąd podczas ładowania danych:", error);
      }
    };

    initializeDashboard();
  }, [fetchProducts, fetchOrders]);

  useEffect(() => {
    if (Array.isArray(products) && Array.isArray(orders)) {
      const lowStockProducts = products.filter(
        (p: IProduct) => (p.stock || 0) < 5
      ).length;
      const pendingOrders = orders.filter(
        (o: Order) => o.status === "pending"
      ).length;

      setStats({
        totalProducts: products.length,
        lowStock: lowStockProducts,
        recentOrders: orders.slice(0, 5),
        pendingOrders,
      });
    }
  }, [products, orders]);

  const getStatusStyle = (status: Order["status"]) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status: Order["status"]) => {
    const texts = {
      pending: "Oczekujące",
      paid: "Opłacone",
      shipped: "Wysłane",
      delivered: "Dostarczone",
      cancelled: "Anulowane",
    };
    return texts[status] || status;
  };

  return (
    <div className="min-h-screen p-8 space-y-12">
      {/* Główne karty nawigacyjne */}
      <div className="grid md:grid-cols-5 gap-8">
        <Link href="/admin/marketplaces/own-store">
          <div className="group relative overflow-hidden rounded-xl bg-card p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl border hover:border-primary">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 transition-all duration-300 group-hover:scale-150" />
            <Zap className="h-12 w-12 text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sklep własny</h2>
            <p className="text-sm text-muted-foreground">
              Zarządzaj katalogiem produktów w sklepie
            </p>
          </div>
        </Link>

        <Link href="/admin/marketplaces/allegro">
          <div className="group relative overflow-hidden rounded-xl bg-card p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl border hover:border-primary">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 transition-all duration-300 group-hover:scale-150" />
            <ShoppingBag className="h-12 w-12 text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Allegro</h2>
            <p className="text-sm text-muted-foreground">
              Przeglądaj produkty z Allegro w&nbsp;tabeli
            </p>
          </div>
        </Link>

        <Link href="/admin/orders">
          <div className="group relative overflow-hidden rounded-xl bg-card p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl border hover:border-primary">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 transition-all duration-300 group-hover:scale-150" />
            <Package className="h-12 w-12 text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Zamówienia</h2>
            <p className="text-sm text-muted-foreground">
              Zarządzaj zamówieniami w&nbsp;sklepie
            </p>
          </div>
        </Link>

        <Link href="/admin/products/new">
          <div className="group relative overflow-hidden rounded-xl bg-card p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl border hover:border-primary">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 transition-all duration-300 group-hover:scale-150" />
            <PlusCircle className="h-12 w-12 text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nowy produkt</h2>
            <p className="text-sm text-muted-foreground">
              Dodaj nowy produkt (na razie tylko w sklepie)
            </p>
          </div>
        </Link>
        <Link href="/admin/price-manager">
          <div className="group relative overflow-hidden rounded-xl bg-card p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl border hover:border-primary">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 transition-all duration-300 group-hover:scale-150" />
            <TrendingUp className="h-12 w-12 text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Zarządzanie cenami</h2>
            <p className="text-sm text-muted-foreground">
              Masowa aktualizacja cen produktów
            </p>
          </div>
        </Link>
        {/*<Link href="/admin/tasks">
          <div className="group relative overflow-hidden rounded-xl bg-card p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl border hover:border-primary">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 transition-all duration-300 group-hover:scale-150" />
            <ClipboardList className="h-12 w-12 text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Zadania</h2>
            <p className="text-sm text-muted-foreground">
              Zarządzaj zadaniami i projektami
            </p>
          </div>
        </Link>

        <TaskBoard />*/}

        <Link href="/admin/analytics">
          <div className="group relative overflow-hidden rounded-xl bg-card p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl border hover:border-primary">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 transition-all duration-300 group-hover:scale-150" />
            <TrendingUp className="h-12 w-12 text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Analityka</h2>
            <p className="text-sm text-muted-foreground">
              Przeglądaj sesje userów i statysyki ruchu
            </p>
          </div>
        </Link>
        <Link href="/admin/blog">
          <div className="group relative overflow-hidden rounded-xl bg-card p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl border hover:border-primary">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 transition-all duration-300 group-hover:scale-150" />
            <FileText className="h-12 w-12 text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Blog</h2>
            <p className="text-sm text-muted-foreground">
              Zarządzaj postami blogowymi
            </p>
          </div>
        </Link>
      </div>

      <div className="group relative overflow-hidden rounded-xl bg-card p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl border hover:border-primary">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 transition-all duration-300 group-hover:scale-150" />
        <Shield className="h-12 w-12 text-primary mb-4" />
        <h2 className="text-xl font-semibold mb-2">Weryfikacja dwuetapowa</h2>
        <TwoFactorSetup />
      </div>

      {/* Sekcja statystyk */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Alert o stanach magazynowych 
        <InventoryAlerts products={products} />*/}

        {/* Ostatnie zamówienia */}
        <div className="bg-card p-6 rounded-xl border hover:border-primary transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Ostatnie zamówienia</h3>
          </div>
          <div className="space-y-3">
            {stats.recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 bg-accent rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    Zamówienie #{order.id.slice(-6)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("pl-PL")}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${getStatusStyle(
                    order.status
                  )}`}
                >
                  {getStatusText(order.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
