// frontend/src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthStore {
  token: string | null;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  } | null;
  login: (token: string, user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (token, user) => set({ token, user }),
      logout: () => {
        // Wywołaj endpoint wylogowania
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${useAuthStore.getState().token}`,
          },
        }).finally(() => {
          set({ token: null, user: null });
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
