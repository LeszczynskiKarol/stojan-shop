// frontend/src/context/ConsentContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

type ConsentType = "granted" | "denied";

interface ConsentSettings {
  ad_storage: ConsentType;
  ad_user_data: ConsentType;
  ad_personalization: ConsentType;
  analytics_storage: ConsentType;
}

interface ConsentContextType {
  consentSettings: ConsentSettings;
  updateConsent: (settings: Partial<ConsentSettings>) => void;
  hasInitialConsent: boolean;
  setHasInitialConsent: (value: boolean) => void;
  isMinimized: boolean;
  setIsMinimized: (value: boolean) => void;
}

const defaultSettings: ConsentSettings = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
};

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consentSettings, setConsentSettings] =
    useState<ConsentSettings>(defaultSettings);
  const [hasInitialConsent, setHasInitialConsent] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Inicjalizacja przy pierwszym załadowaniu
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedSettings = localStorage.getItem("consentSettings");
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setConsentSettings(parsedSettings);
        setHasInitialConsent(true);

        // Aktualizuj GTM jeśli istnieje
        if (window.gtag) {
          window.gtag("consent", "update", parsedSettings);
        }
      }
    } catch (error) {
      console.error("Błąd podczas odczytu ustawień consent:", error);
    }
  }, []);

  const updateConsent = useCallback((newSettings: Partial<ConsentSettings>) => {
    setConsentSettings((prev) => {
      const updated = { ...prev, ...newSettings };

      // Zapisz do localStorage
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("consentSettings", JSON.stringify(updated));

          // Aktualizuj GTM
          if (window.gtag) {
            window.gtag("consent", "update", updated);
          }
        } catch (error) {
          console.error("Błąd podczas zapisywania ustawień consent:", error);
        }
      }

      return updated;
    });
  }, []);

  return (
    <ConsentContext.Provider
      value={{
        consentSettings,
        updateConsent,
        hasInitialConsent,
        setHasInitialConsent,
        isMinimized,
        setIsMinimized,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export const useConsent = () => {
  const context = useContext(ConsentContext);
  if (context === undefined) {
    throw new Error("useConsent must be used within a ConsentProvider");
  }
  return context;
};
