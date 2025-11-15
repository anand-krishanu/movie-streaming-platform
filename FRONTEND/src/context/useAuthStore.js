// src/context/useAuthStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import userApi from "../api/userApi";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      dbUser: null,
      userData: null, // Full user data with populated favorites/watchLater
      setUser: async (firebaseUser) => {
        set({ user: firebaseUser });
        
        // Save Firebase user to MongoDB
        if (firebaseUser) {
          try {
            const response = await userApi.upsertUser({
              email: firebaseUser.email,
              name: firebaseUser.displayName || firebaseUser.email,
              picture: firebaseUser.photoURL
            });
            
            set({ dbUser: response.user });
            
            // Fetch full user data with populated movies
            await get().refreshUserData();
            
            // Log whether it's a new or returning user
            if (response.isNewUser) {
              console.log("🎉 New user created:", response.message);
            } else {
              console.log("👋 Returning user:", response.message);
            }
            
          } catch (error) {
            console.error("Failed to save user to database:", error);
            
            // Simple fallback without retry mechanism
            const fallbackDbUser = {
              _id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || firebaseUser.email,
              picture: firebaseUser.photoURL,
              favorites: [],
              watchLater: [],
              _isFallback: true
            };
            set({ dbUser: fallbackDbUser });
          }
        }
      },
      refreshUserData: async () => {
        const { dbUser } = get();
        if (!dbUser || dbUser._isFallback) return null;
        
        try {
          const userData = await userApi.getUser(dbUser._id);
          set({ userData });
          return userData;
        } catch (error) {
          console.error("Failed to refresh user data:", error);
          return null;
        }
      },
      updateFavorites: (movieId, isAdd = true) => {
        const { userData } = get();
        if (!userData) return;
        
        const updatedFavorites = isAdd 
          ? [...(userData.favorites || [])]
          : (userData.favorites || []).filter(movie => movie._id !== movieId);
          
        set({ 
          userData: { 
            ...userData, 
            favorites: updatedFavorites 
          } 
        });
      },
      updateWatchLater: (movieId, isAdd = true) => {
        const { userData } = get();
        if (!userData) return;
        
        const updatedWatchLater = isAdd 
          ? [...(userData.watchLater || [])]
          : (userData.watchLater || []).filter(movie => movie._id !== movieId);
          
        set({ 
          userData: { 
            ...userData, 
            watchLater: updatedWatchLater 
          } 
        });
      },
      clearUser: () => set({ user: null, dbUser: null, userData: null }),
    }),
    {
      name: "auth-storage", // localStorage key
    }
  )
);

export default useAuthStore;