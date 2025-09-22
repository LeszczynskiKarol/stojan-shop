// frontend/src/store/allegroAuthStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AllegroAuthStore {
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
  checkAuthStatus: () => Promise<boolean>;
}

export const useAllegroAuthStore = create<AllegroAuthStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      setAuthenticated: (value) => {
        set({ isAuthenticated: value });
      },
      checkAuthStatus: async () => {
        try {
          const response = await fetch('/api/admin/allegro/auth/status');
          const data = await response.json();

          const isAuthenticated = data.data?.isAuthenticated || false;

          set({ isAuthenticated });
          return isAuthenticated;
        } catch (error) {
          console.error('Błąd sprawdzania statusu:', error);
          set({ isAuthenticated: false });
          return false;
        }
      },
    }),
    {
      name: 'allegro-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
