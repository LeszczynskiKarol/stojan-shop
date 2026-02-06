// frontend/src/utils/deliveryDate.ts
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface DeliveryDates {
  shippingDate: Date;
  deliveryDateStart: Date;
  deliveryDateEnd: Date | null;
}

export const calculateDeliveryDates = (weight: number): DeliveryDates => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();

  // Konwersja wagi na liczbę
  const weightNumber = Number(weight);

  let shippingDate = new Date(now);
  let deliveryDateStart = new Date(now);
  let deliveryDateEnd = null;

  // Funkcja pomocnicza do przesuwania daty na następny dzień roboczy
  const moveToNextBusinessDay = (date: Date): Date => {
    const newDate = new Date(date);
    while (newDate.getDay() === 0 || newDate.getDay() === 6) {
      newDate.setDate(newDate.getDate() + 1);
    }
    return newDate;
  };

  // NOWA LOGIKA
  if (weightNumber <= 36.5) {
    // Paczki do 36,5 kg - wysyłka do 12:00 tego samego dnia

    // Jeśli weekend, przesuń na poniedziałek
    if (currentDay === 6 || currentDay === 0) {
      shippingDate = moveToNextBusinessDay(shippingDate);
    } else {
      // W dni robocze - jeśli po 12:00, wysyłka następnego dnia roboczego
      if (currentHour >= 12) {
        shippingDate.setDate(shippingDate.getDate() + 1);
        shippingDate = moveToNextBusinessDay(shippingDate);
      }
    }

    // Dostawa następnego dnia roboczego po wysyłce
    deliveryDateStart.setDate(shippingDate.getDate() + 1);
    deliveryDateStart = moveToNextBusinessDay(deliveryDateStart);
  } else {
    // Duże przesyłki powyżej 36,5 kg - wysyłka codziennie do 10:00

    // Jeśli weekend, przesuń na poniedziałek
    if (currentDay === 6 || currentDay === 0) {
      shippingDate = moveToNextBusinessDay(shippingDate);
    } else {
      // W dni robocze - jeśli po 10:00, wysyłka następnego dnia roboczego
      if (currentHour >= 10) {
        shippingDate.setDate(shippingDate.getDate() + 1);
        shippingDate = moveToNextBusinessDay(shippingDate);
      }
    }

    // Dostawa 1-2 dni robocze po wysyłce dla dużych przesyłek
    deliveryDateStart.setDate(shippingDate.getDate() + 1);
    deliveryDateStart = moveToNextBusinessDay(deliveryDateStart);

    deliveryDateEnd = new Date(shippingDate);
    deliveryDateEnd.setDate(shippingDate.getDate() + 2);
    deliveryDateEnd = moveToNextBusinessDay(deliveryDateEnd);
  }

  return {
    shippingDate,
    deliveryDateStart,
    deliveryDateEnd,
  };
};

export const formatDeliveryInfo = (weight: number): string => {
  const dates = calculateDeliveryDates(weight);

  if (dates.deliveryDateEnd) {
    const startStr = format(dates.deliveryDateStart, "d MMMM", { locale: pl });
    const endStr = format(dates.deliveryDateEnd, "d MMMM", { locale: pl });

    // Jeśli daty są takie same, zwróć tylko jedną
    if (startStr === endStr) {
      return startStr;
    }
    return `${startStr} - ${endStr}`;
  }

  return format(dates.deliveryDateStart, "d MMMM", { locale: pl });
};

// Ale dodaj też funkcję dla daty dostawy jeśli potrzebujesz
export const formatDeliveryDate = (weight: number): string => {
  const dates = calculateDeliveryDates(weight);
  if (dates.deliveryDateEnd) {
    const startStr = format(dates.deliveryDateStart, "d MMMM", { locale: pl });
    const endStr = format(dates.deliveryDateEnd, "d MMMM", { locale: pl });
    return `${startStr} - ${endStr}`;
  }
  return format(dates.deliveryDateStart, "d MMMM", { locale: pl });
};

export const formatShippingDate = (weight: number): string => {
  const dates = calculateDeliveryDates(weight);
  return format(dates.shippingDate, "d MMMM", { locale: pl });
};
