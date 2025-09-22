// frontend/src/components/admin/AdminNavbar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, ShoppingCart, Plus, Store, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AdminNavbar() {
  const pathname = usePathname();
  const [isShopMenuOpen, setIsShopMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsShopMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const shopRoutes = [
    {
      href: "/admin/marketplaces/own-store",
      label: "Baza produktów",
      active: pathname.startsWith("/admin/marketplaces/own-store"),
    },
    {
      href: "/admin/categories",
      label: "Kategorie produktów",
      active: pathname.startsWith("/admin/categories"),
    },
    {
      href: "/admin/manufacturers",
      label: "Producenci",
      active: pathname.startsWith("/admin/manufacturers"),
    },
  ];

  const isAnyShopRouteActive = shopRoutes.some((route) => route.active);

  return (
    <header className="sticky top-0 z-50 w-full border-border bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/admin" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">Panel</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {/* Rozwijane menu Sklep */}
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={() => setIsShopMenuOpen(!isShopMenuOpen)}
                className={cn(
                  "flex items-center space-x-1 transition-colors hover:text-foreground",
                  isShopMenuOpen || isAnyShopRouteActive
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                <Store className="h-4 w-4" />
                <span>Sklep</span>
                <motion.div
                  animate={{ rotate: isShopMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </button>

              <AnimatePresence>
                {isShopMenuOpen && (
                  <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 mt-2 w-56 rounded-md bg-card border border-border shadow-md"
                  >
                    <div className="py-1">
                      {shopRoutes.map((route) => (
                        <Link
                          key={route.href}
                          href={route.href}
                          className={cn(
                            "block px-4 py-2 text-sm transition-colors hover:bg-muted",
                            route.active
                              ? "text-foreground font-medium"
                              : "text-muted-foreground"
                          )}
                          onClick={() => setIsShopMenuOpen(false)}
                        >
                          {route.label}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Link Zamówienia */}
            <Link
              href="/admin/orders"
              className={cn(
                "flex items-center space-x-1 transition-colors hover:text-foreground",
                pathname.startsWith("/admin/orders")
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Zamówienia</span>
            </Link>

            {/* Link Dodaj produkt */}
            <Link
              href="/admin/products/new"
              className={cn(
                "flex items-center space-x-1 transition-colors hover:text-foreground",
                pathname.startsWith("/admin/products/new")
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <Plus className="h-4 w-4" />
              <span>Dodaj produkt</span>
            </Link>

            {/* Link Allegro */}
            <Link
              href="/admin/marketplaces/allegro"
              className={cn(
                "flex items-center space-x-1 transition-colors hover:text-foreground",
                pathname.startsWith("/admin/marketplaces/allegro")
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <Package className="h-4 w-4" />
              <span>Allegro</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
