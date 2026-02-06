// frontend/src/components/CookieConsent.tsx
"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConsent } from "@/context/ConsentContext";
import { Button } from "@/components/ui/Button";
import { Settings } from "lucide-react";
import CookieSettings from "./CookieSettings";

export default function CookieConsent() {
  const {
    updateConsent,
    hasInitialConsent,
    setHasInitialConsent,
    isMinimized,
    setIsMinimized,
  } = useConsent();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleAcceptAll = () => {
    updateConsent({
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      analytics_storage: "granted",
    });
    setHasInitialConsent(true);
    setIsMinimized(true);
  };

  const handleRejectAll = () => {
    updateConsent({
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
    setHasInitialConsent(true);
    setIsMinimized(true);
  };

  return (
    <>
      <AnimatePresence>
        {!hasInitialConsent && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-4 shadow-lg z-50"
          >
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm">
                  <p>
                    Używamy plików cookie i podobnych technologii, aby poprawić
                    Twoje doświadczenia.
                  </p>
                  <p className="mt-1">
                    Możesz zaakceptować wszystkie lub dostosować ustawienia.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsSettingsOpen(true)}
                  >
                    Ustawienia
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleRejectAll}>
                    Odrzuć
                  </Button>
                  <Button size="sm" onClick={handleAcceptAll}>
                    Akceptuj
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {hasInitialConsent && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => setIsSettingsOpen(true)}
            className="fixed bottom-4 right-4 p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg z-50 hover:shadow-xl transition-all"
          >
            <Settings className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <CookieSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
