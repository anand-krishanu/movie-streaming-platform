// src/context/useAuthStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import userApi from "../api/userApi";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,           // Firebase user
      dbUser: null,         // MongoDB user from Spring Boot
      userData: null,       // Full user data with favorites/watchLater

      // Login action - called after Firebase authentication
      setUser: async (firebaseUser) => {
        set({ user: firebaseUser });

        if (firebaseUser) {
          try {
            // Sync user with Spring Boot backend
            const response = await userApi.syncUser();
            set({ dbUser: response, userData: response });
            
            console.log("✅ User synced with backend:", response);
            
          } catch (error) {
            console.error("❌ Failed to sync user with backend:", error);
            
            // Fallback for offline mode
            const fallbackDbUser = {
              _id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || firebaseUser.email,
              picture: firebaseUser.photoURL,
              favoriteMovieIds: [],
              watchLaterMovieIds: [],
              _isFallback: true
            };
            set({ dbUser: fallbackDbUser, userData: fallbackDbUser });
          }
        }
      },

      // Refresh user data from backend
      refreshUserData: async () => {
        try {
          const userData = await userApi.getCurrentUser();
          set({ userData, dbUser: userData });
          return userData;
        } catch (error) {
          console.error("Failed to refresh user data:", error);
          return null;
        }
      },

      // Toggle favorite (handles add/remove automatically)
      toggleFavorite: async (movieId) => {
        try {
          await userApi.toggleFavorite(movieId);
          // Refresh user data to get updated favorites
          await get().refreshUserData();
        } catch (error) {
          console.error("Failed to toggle favorite:", error);
        }
      },

      // Toggle watch later (handles add/remove automatically)
      toggleWatchLater: async (movieId) => {
        try {
          await userApi.toggleWatchLater(movieId);
          // Refresh user data to get updated watch later list
          await get().refreshUserData();
        } catch (error) {
          console.error("Failed to toggle watch later:", error);
        }
      },

      clearUser: () => set({ user: null, dbUser: null, userData: null }),
    }),
    {
      name: "auth-storage", // Persist to localStorage
    }
  )
);

export default useAuthStore;