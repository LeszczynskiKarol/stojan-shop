// frontend/src/hooks/usePostalCode.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface PostalCodeData {
  kod: string;
  nazwa?: string;
  miejscowosc: string;
  ulica?: string;
  numer?: string;
  gmina: string;
  powiat: string;
  wojewodztwo: string;
  dzielnica?: string;
  numeracja?: Array<{
    od: string;
    do: string;
    parzystosc?: 'PARZYSTE' | 'NIEPARZYSTE';
  }>;
}

interface UsePostalCodeReturn {
  fetchPostalCodeData: (postalCode: string) => Promise<PostalCodeData[] | null>;
  fetchCitiesForPostalCode: (postalCode: string) => Promise<string[]>;
  isLoading: boolean;
  error: string | null;
}

const POSTAL_CODE_API_URL = 'https://kodpocztowy.intami.pl/api';

export const usePostalCode = (): UsePostalCodeReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPostalCodeData = useCallback(
    async (postalCode: string): Promise<PostalCodeData[] | null> => {
      // Walidacja formatu kodu
      if (!postalCode || !/^\d{2}-\d{3}$/.test(postalCode)) {
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${POSTAL_CODE_API_URL}/${postalCode}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

        if (response.status === 429) {
          const errorMsg =
            'Przekroczono limit zapytań do API kodów pocztowych. Spróbuj ponownie później.';
          setError(errorMsg);
          toast.error(errorMsg);
          return null;
        }

        if (response.status === 404) {
          const errorMsg = 'Nie znaleziono miejscowości dla tego kodu pocztowego';
          setError(errorMsg);
          return null;
        }

        if (!response.ok) {
          throw new Error('Błąd pobierania danych kodu pocztowego');
        }

        const data = await response.json();

        // API może zwrócić pojedynczy obiekt lub tablicę
        // Zawsze normalizuj do tablicy
        const normalizedData = Array.isArray(data) ? data : [data];

        // Usuń duplikaty miejscowości (zachowaj unikalne)
        const uniqueCities = new Map<string, PostalCodeData>();
        normalizedData.forEach((item: PostalCodeData) => {
          const key = `${item.miejscowosc}_${item.gmina}_${item.powiat}`;
          if (!uniqueCities.has(key)) {
            uniqueCities.set(key, item);
          }
        });

        return Array.from(uniqueCities.values());
      } catch (err) {
        console.error('Błąd API kodów pocztowych:', err);
        setError('Nie udało się pobrać danych kodu pocztowego');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const fetchCitiesForPostalCode = useCallback(
    async (postalCode: string): Promise<string[]> => {
      const data = await fetchPostalCodeData(postalCode);

      if (!data || data.length === 0) {
        return [];
      }

      // Zwróć unikalne miejscowości z dodatkowymi informacjami dla rozróżnienia
      const cities = data.map((item) => {
        // Jeśli jest więcej niż jedna miejscowość, dodaj informacje rozróżniające
        if (data.length > 1) {
          // Dla miast na prawach powiatu (gmina zaczyna się od "M.")
          if (item.gmina && item.gmina.startsWith('M.')) {
            return `${item.miejscowosc} (miasto)`;
          }
          // Dla innych miejscowości pokazuj gminę
          else if (item.gmina && item.gmina !== item.miejscowosc) {
            return `${item.miejscowosc} (gm. ${item.gmina})`;
          }
          // Jeśli gmina = miejscowość, pokazuj powiat
          else if (item.powiat) {
            return `${item.miejscowosc} (pow. ${item.powiat})`;
          }
          return item.miejscowosc;
        }
        return item.miejscowosc;
      });

      // Usuń duplikaty
      return [...new Set(cities)];
    },
    [fetchPostalCodeData]
  );

  return {
    fetchPostalCodeData,
    fetchCitiesForPostalCode,
    isLoading,
    error,
  };
};

// Hook do cache'owania wyników
export const usePostalCodeWithCache = (): UsePostalCodeReturn => {
  const [cache, setCache] = useState<Map<string, PostalCodeData[]>>(new Map());
  const baseHook = usePostalCode();

  const fetchPostalCodeData = useCallback(
    async (postalCode: string): Promise<PostalCodeData[] | null> => {
      // Sprawdź cache
      if (cache.has(postalCode)) {
        return cache.get(postalCode) || null;
      }

      // Pobierz dane
      const data = await baseHook.fetchPostalCodeData(postalCode);

      // Zapisz w cache
      if (data) {
        setCache((prev) => new Map(prev).set(postalCode, data));
      }

      return data;
    },
    [cache, baseHook]
  );

  const fetchCitiesForPostalCode = useCallback(
    async (postalCode: string): Promise<string[]> => {
      const data = await fetchPostalCodeData(postalCode);

      if (!data || data.length === 0) {
        return [];
      }

      // Zwróć miejscowości z dodatkowymi informacjami jeśli jest ich więcej niż jedna
      const cities = data.map((item) => {
        if (data.length > 1) {
          // Dla miast na prawach powiatu (gmina zaczyna się od "M.")
          if (item.gmina && item.gmina.startsWith('M.')) {
            return `${item.miejscowosc} (miasto)`;
          }
          // Dla innych miejscowości pokazuj gminę
          else if (item.gmina && item.gmina !== item.miejscowosc) {
            return `${item.miejscowosc} (gm. ${item.gmina})`;
          }
          // Jeśli gmina = miejscowość, pokazuj powiat
          else if (item.powiat) {
            return `${item.miejscowosc} (pow. ${item.powiat})`;
          }
          return item.miejscowosc;
        }
        return item.miejscowosc;
      });

      return [...new Set(cities)];
    },
    [fetchPostalCodeData]
  );

  return {
    ...baseHook,
    fetchPostalCodeData,
    fetchCitiesForPostalCode,
  };
};
