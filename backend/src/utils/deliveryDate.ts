// backend/src/utils/deliveryDate.ts
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface DeliveryDates {
  shippingDate: Date;
  deliveryDateStart: Date;
  deliveryDateEnd: Date | null;
}

export const calculateDeliveryDates = (weight: number): DeliveryDates => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();

  const weightNumber = Number(weight);

  let shippingDate = new Date(now);
  let deliveryDateStart = new Date(now);
  let deliveryDateEnd = null;

  const moveToNextBusinessDay = (date: Date): Date => {
    const newDate = new Date(date);
    while (newDate.getDay() === 0 || newDate.getDay() === 6) {
      newDate.setDate(newDate.getDate() + 1);
    }
    return newDate;
  };

  if (weightNumber <= 36.5) {
    // Paczki do 36,5 kg - bez zmian
    if (currentDay === 6 || currentDay === 0) {
      shippingDate = moveToNextBusinessDay(shippingDate);
    } else {
      if (currentHour >= 12) {
        shippingDate.setDate(shippingDate.getDate() + 1);
        shippingDate = moveToNextBusinessDay(shippingDate);
      }
    }

    deliveryDateStart.setDate(shippingDate.getDate() + 1);
    deliveryDateStart = moveToNextBusinessDay(deliveryDateStart);
  } else {
    // Duże przesyłki powyżej 36,5 kg - POPRAWIONE
    if (currentDay === 6 || currentDay === 0) {
      shippingDate = moveToNextBusinessDay(shippingDate);
    } else {
      if (currentHour >= 10) {
        shippingDate.setDate(shippingDate.getDate() + 1);
        shippingDate = moveToNextBusinessDay(shippingDate);
      }
    }

    // Dostawa 1-2 dni robocze po wysyłce
    deliveryDateStart = new Date(shippingDate);
    deliveryDateStart.setDate(shippingDate.getDate() + 1);
    deliveryDateStart = moveToNextBusinessDay(deliveryDateStart);

    // Końcowa data to +1 dzień roboczy od daty początkowej
    deliveryDateEnd = new Date(deliveryDateStart);
    deliveryDateEnd.setDate(deliveryDateStart.getDate() + 1);
    // Pomijamy weekend
    while (deliveryDateEnd.getDay() === 0 || deliveryDateEnd.getDay() === 6) {
      deliveryDateEnd.setDate(deliveryDateEnd.getDate() + 1);
    }
  }

  return {
    shippingDate,
    deliveryDateStart,
    deliveryDateEnd,
  };
};

// Dodaj nową funkcję dla daty wysyłki
export const formatShippingDate = (weight: number): string => {
  const dates = calculateDeliveryDates(weight);
  return format(dates.shippingDate, 'd MMMM', { locale: pl });
};

// Funkcja dla daty dostawy (do użycia w emailach)
export const formatDeliveryInfo = (weight: number): string => {
  const dates = calculateDeliveryDates(weight);

  if (dates.deliveryDateEnd) {
    const startStr = format(dates.deliveryDateStart, 'd MMMM', { locale: pl });
    const endStr = format(dates.deliveryDateEnd, 'd MMMM', { locale: pl });

    // Jeśli daty są takie same, zwróć tylko jedną
    if (startStr === endStr) {
      return startStr;
    }
    return `${startStr} - ${endStr}`;
  }

  return format(dates.deliveryDateStart, 'd MMMM', { locale: pl });
};
