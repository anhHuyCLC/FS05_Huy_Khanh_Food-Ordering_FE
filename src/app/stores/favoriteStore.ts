import { create } from "zustand";
import { favoriteService } from "../services/favoriteService";

interface FavoriteStoreState {
  favoriteIds: string[];
  loading: boolean;
  fetchFavorites: () => Promise<void>;
  toggleFavorite: (restaurantId: string) => Promise<boolean>;
  clearFavorites: () => void;
}

export const useFavoriteStore = create<FavoriteStoreState>((set, get) => ({
  favoriteIds: [],
  loading: false,

  fetchFavorites: async () => {
    try {
      set({ loading: true });
      const favs = await favoriteService.listFavorites();
      set({ favoriteIds: favs.map((f) => f.id), loading: false });
    } catch (err) {
      console.error("Failed to fetch favorites:", err);
      set({ loading: false });
    }
  },

  toggleFavorite: async (restaurantId: string) => {
    try {
      const res = await favoriteService.toggleFavorite(restaurantId);
      const current = get().favoriteIds;
      if (res.favorited) {
        set({ favoriteIds: [...current, restaurantId] });
      } else {
        set({ favoriteIds: current.filter((id) => id !== restaurantId) });
      }
      return res.favorited;
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
      throw err;
    }
  },

  clearFavorites: () => set({ favoriteIds: [] }),
}));
