// frontend/src/components/contact/ContactMap.tsx
"use client";

import { useState } from "react";
import { Loader2, MapPin } from "lucide-react";

export function ContactMap() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] rounded-xl overflow-hidden">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Ładowanie mapy...</p>
          </div>
        </div>
      )}

      {/* Google Maps Iframe */}
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2395.304533405515!2d18.51974433877991!3d53.10472419289336!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x470331a95853e26f%3A0x75a4abff339589ed!2sStojan%20s.c.%20A.%20Kr%C3%B3l%20W.%20Leszczy%C5%84ski!5e0!3m2!1spl!2spl!4v1757248152962!5m2!1spl!2spl"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        onLoad={() => setIsLoading(false)}
        className="w-full h-full"
        title="Lokalizacja firmy Stojan S.C. na mapie Google"
      />

      {/* Map Pin Overlay */}
      <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <div>
          <div className="font-semibold text-sm">Stojan S.C.</div>
          <div className="text-xs text-muted-foreground">
            ul. Wojewódzka 2, Pigża
          </div>
        </div>
      </div>
    </div>
  );
}
