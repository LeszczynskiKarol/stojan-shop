// frontend/src/utils/formatPrice.ts
export const formatPrice = (price: number): string => {
  // Sprawdź czy cena jest liczbą całkowitą
  if (price % 1 === 0) {
    // Jeśli tak, formatuj bez części dziesiętnej
    return price.toLocaleString("pl-PL", {
      style: "currency",
      currency: "PLN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  } else {
    // Jeśli nie, formatuj z częścią dziesiętną
    return price.toLocaleString("pl-PL", {
      style: "currency",
      currency: "PLN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
};
