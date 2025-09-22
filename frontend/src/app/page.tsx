// frontend/src/app/page.tsx
import { Metadata } from "next";
import HomePageClient from "./HomePageClient";

// EXPORT METADATA!
export const metadata: Metadata = {
  title: "Silniki elektryczne - sklep internetowy | Stojan Shop",
  description:
    "Największy wybór silników elektrycznych. Trójfazowe, jednofazowe, z hamulcem, motoreduktory. Szybka dostawa, konkurencyjne ceny.",
  keywords:
    "silniki elektryczne, napędy elektryczne, silnik 3 fazowy, silnik 1 fazowy, motoreduktor",
};

// USUŃ async i pobieranie danych
export default function HomePage() {
  return <HomePageClient />;
}
