// frontend/src/app/admin/products/allegro/new/page.tsx

"use client";
import { AllegroProductForm } from "@/components/products/AllegroProductForm";
import { useRouter } from "next/navigation";

export default function NewAllegroProductPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch("/api/allegro/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push("/admin/products/allegro");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Dodaj produkt na Allegro</h1>
      <AllegroProductForm onSubmit={handleSubmit} />
    </div>
  );
}
