// frontend/src/hooks/useAnalytics.ts
import { v4 as uuidv4 } from "uuid";

const getSessionId = () => {
  let sessionId = localStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem("analytics_session_id", sessionId);
  }
  return sessionId;
};

export const useAnalytics = () => {
  const trackEvent = async (eventType: string, data: any = {}) => {
    try {
      const sessionId = getSessionId();
      console.log("🔍 Śledzenie eventu:", { eventType, sessionId, data });

      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/track`;
      console.log("URL:", url);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/track`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventType,
            sessionId,
            data: {
              ...data,
              url: window.location.href,
              path: window.location.pathname,
              referrer: document.referrer,
              userAgent: navigator.userAgent,
              screenResolution: `${window.screen.width}x${window.screen.height}`,
              deviceType: /Mobile/.test(navigator.userAgent)
                ? "mobile"
                : "desktop",
            },
          }),
        }
      );

      const result = await response.json();
      console.log("✅ Odpowiedź z API:", result);
      return result;
    } catch (error) {
      console.error("❌ Błąd podczas śledzenia zdarzenia:", error);
    }
  };

  const getPageLocation = () => {
    // Implementacja funkcji getPageLocation
    return window.location.pathname;
  };

  return { trackEvent, getPageLocation };
};
