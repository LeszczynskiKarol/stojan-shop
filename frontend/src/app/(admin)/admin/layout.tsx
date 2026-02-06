// frontend/src/app/(admin)/admin/layout.tsx
"use client";
import { useEffect, useState } from "react";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { Toaster } from "@/components/ui/toaster";
import { useAuthStore } from "@/store/authStore";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Daj czas na załadowanie stanu z localStorage
    const timer = setTimeout(() => {
      setIsLoading(false);

      if (!token || user?.role !== "admin") {
        console.log("Brak autoryzacji - przekierowuję na /login");
        window.location.href = "/login";
      } else {
        console.log("Użytkownik zalogowany jako admin");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [token, user]);

  if (isLoading) {
    return <div>Ładowanie...</div>;
  }

  if (!token || user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <main className="w-full">{children}</main>
      <Toaster />
    </div>
  );
}
