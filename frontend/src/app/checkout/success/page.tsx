// frontend/app/checkout/success/page.tsx
"use client";
import { Suspense } from "react";
import CheckoutSuccessContent from "./CheckoutSuccessContent";
export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div>Ładowanie...</div>}>
      {" "}
      <CheckoutSuccessContent />{" "}
    </Suspense>
  );
}
