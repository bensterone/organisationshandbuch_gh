import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import env from '../config/env';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      setUser: (user) => set({ user, isAuthenticated: true }),
      
      setToken: (token) => {
        localStorage.setItem(env.TOKEN_KEY, token);
        set({ token, isAuthenticated: true });
      },
      
      logout: () => {
        localStorage.removeItem(env.TOKEN_KEY);
        set({ user: null, token: null, isAuthenticated: false });
      }
    }),
    { name: 'auth-storage' }
  )
);