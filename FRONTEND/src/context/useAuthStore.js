// src/context/useAuthStore.js
import { create } from "zustand";

const useAuthStore = create((set) => ({
  user: null,
  // store the minimal user info you need across the app
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));

export default useAuthStore;
