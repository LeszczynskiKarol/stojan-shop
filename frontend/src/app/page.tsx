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
export default async function HomePage() {
  let products = [];
  let categories = [];

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      fetch(`${process.env.API_URL}/api/products?limit=8&inStock=true`, {
        next: { revalidate: 3600 },
      }),
      fetch(`${process.env.API_URL}/api/categories`, {
        next: { revalidate: 3600 },
      }),
    ]);

    if (productsRes.ok) {
      products = (await productsRes.json()).data.products;
    }
    if (categoriesRes.ok) {
      categories = (await categoriesRes.json()).data;
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }

  return (
    <HomePageClient initialProducts={products} initialCategories={categories} />
  );
}
