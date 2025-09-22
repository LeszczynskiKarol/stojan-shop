// backend/src/utils/handlebars.helpers.ts

import { format as dateFormat } from 'date-fns';
import { pl } from 'date-fns/locale';

export const helpers = {
  json: function (context: unknown) {
    return JSON.stringify(context, null, 2);
  },
  lte: (a: number, b: number) => a <= b,
  formatDate: (date: Date | string | null, formatStr: string) => {
    if (!date) return '';

    try {
      const dateObject = date instanceof Date ? date : new Date(date);

      // Sprawdź czy data jest prawidłowa
      if (isNaN(dateObject.getTime())) {
        console.error('Nieprawidłowa data:', date);
        return '';
      }

      return dateFormat(dateObject, formatStr, { locale: pl });
    } catch (error) {
      console.error('Błąd formatowania daty:', error);
      return '';
    }
  },

  format_price: (price: number) => {
    return price.toLocaleString('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  },
  eq: (a: any, b: any) => a === b,
};
