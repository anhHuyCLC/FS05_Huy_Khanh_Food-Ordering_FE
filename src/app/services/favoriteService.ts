import apiClient from "./apiClient";
import type { Restaurant } from "../types/restaurant";

export const favoriteService = {
  /** Toggle favorite status of a restaurant */
  toggleFavorite: async (restaurantId: string): Promise<{ success: boolean; favorited: boolean; message: string }> => {
    const response = await apiClient.post(`/v1/restaurants/${restaurantId}/favorite`);
    return response.data.data;
  },

  /** Get the list of user's favorite restaurants */
  listFavorites: async (): Promise<Restaurant[]> => {
    const response = await apiClient.get("/v1/profiles/favorites");
    return response.data.data || [];
  },
};
