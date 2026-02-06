// frontend/src/components/layout/Header.tsx
"use client";
import React, { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { CartWidget } from "../shop/CartWidget";
import { ThemeToggle } from "../theme-toggle";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/authStore";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { user, logout } = useAuthStore();
  const [shouldShow, setShouldShow] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const menuItems = [
    { name: "Silniki trójfazowe", href: "/trojfazowe" },
    { name: "Silniki jednofazowe", href: "/jednofazowe" },
    { name: "Motoreduktory", href: "/motoreduktory" },
    { name: "Akcesoria", href: "/akcesoria" },
  ];

  useEffect(() => {
    const controlHeader = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY) {
        setShouldShow(true);
      } else if (currentScrollY > 100 && currentScrollY > lastScrollY) {
        setShouldShow(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", controlHeader);
    return () => window.removeEventListener("scroll", controlHeader);
  }, [lastScrollY]);

  // Obsługa zamykania menu po kliknięciu gdziekolwiek
  useEffect(() => {
    const handleClickOutside = () => {
      if (isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  // Zatrzymanie propagacji kliknięcia w przycisk menu
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <motion.header
      initial={{ y: 0 }}
      animate={{ y: shouldShow ? 0 : -100 }}
      transition={{ duration: 0.3 }}
      className="bg-background border-b border-border fixed top-0 left-0 right-0 z-50"
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="relative w-[160px] h-[64px] sm:w-[249px] sm:h-[99px]"
            >
              <Image
                src="/stopka.png"
                alt="Logo"
                fill
                style={{ objectFit: "contain" }}
                priority
              />
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Menu mobilne */}
            <div className="relative">
              <button
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md hover:bg-accent transition-colors text-sm sm:text-base"
                onClick={handleMenuClick}
              >
                <span className="font-medium hidden sm:inline">Oferta</span>
                <span className="font-medium sm:hidden"></span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-0 mt-2 w-48 sm:w-64 bg-card rounded-md shadow-lg border border-border py-2 z-50"
                    style={{
                      filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {menuItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-4 py-2 text-sm sm:text-base hover:bg-accent transition-colors"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/kontakt">
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline">Kontakt</span>
                </div>
              </Link>
            </div>

            {/* Ikony w headerze */}
            <div className="flex items-center gap-2 sm:gap-4">
              {user?.role === "admin" && (
                <Link href="/admin">
                  <div className="flex items-center gap-2">
                    <span className="text-sm hidden sm:inline">
                      Panel admina ({user.name})
                    </span>
                    <button
                      onClick={handleLogout}
                      className="text-sm px-3 py-1 rounded-md hover:bg-destructive/10 transition-colors"
                    >
                      Wyloguj
                    </button>
                  </div>
                </Link>
              )}
              <CartWidget />
              {isMounted && <ThemeToggle />}
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
