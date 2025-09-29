// frontend/src/hooks/useTracking.ts
import { useConsent } from "@/context/ConsentContext";

interface ConversionParams {
  value?: number;
  currency?: string;
  transaction_id?: string;
  send_to?: string;
  gclid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export function useTracking() {
  const { consentSettings } = useConsent();

  const trackEvent = (eventName: string, params?: Record<string, any>) => {
    if (typeof window === "undefined" || typeof window.gtag !== "function") {
      return;
    }

    // Sprawdź czy mamy zgodę na analytics
    if (consentSettings.analytics_storage === "granted") {
      window.gtag("event", eventName, params);
    }
  };

  const trackPageView = (path: string) => {
    if (typeof window === "undefined" || typeof window.gtag !== "function") {
      return;
    }

    if (consentSettings.analytics_storage === "granted") {
      window.gtag("config", "G-VPV7V6L3KW", {
        page_path: path,
      });
    }
  };

  const trackConversion = (params: ConversionParams) => {
    if (typeof window === "undefined" || typeof window.gtag !== "function") {
      return;
    }

    // Sprawdź czy mamy zgodę na reklamy
    if (consentSettings.ad_storage === "granted") {
      window.gtag("event", "conversion", {
        send_to: "AW-988030143/KEWXCLKemJoaEL_JkNcD",
        ...params,
      });
    }
  };

  const trackPurchase = (params: {
    value: number;
    currency: string;
    transaction_id: string;
    items?: any[];
  }) => {
    if (typeof window === "undefined" || typeof window.gtag !== "function") {
      return;
    }

    // Enhanced ecommerce tracking
    if (consentSettings.analytics_storage === "granted") {
      window.gtag("event", "purchase", {
        currency: params.currency,
        value: params.value,
        transaction_id: params.transaction_id,
        items: params.items,
      });
    }

    // Conversion tracking dla Google Ads
    if (consentSettings.ad_storage === "granted") {
      trackConversion({
        value: params.value,
        currency: params.currency,
        transaction_id: params.transaction_id,
      });
    }
  };

  return {
    trackEvent,
    trackPageView,
    trackConversion,
    trackPurchase,
  };
}
