import apiClient from "./apiClient";
import type { OptionChoice, OptionGroup } from "../types/restaurant";

export interface CartItemResponse {
  id: string;
  cartId: string;
  menuItemId: string;
  addedByUserId: string;
  quantity: number;
  selectedOptions: Record<string, OptionChoice | OptionChoice[]>;
  note: string | null;
  menuItem: {
    id: string;
    name: string;
    basePrice: number | string;
    imageUrl: string | null;
    isAvailable: boolean;
    optionGroups?: OptionGroup[];
  };
}

export interface CartResponse {
  id: string;
  ownerId: string;
  restaurantId: string;
  isGroupCart: boolean;
  sessionToken: string | null;
  restaurant: {
    id: string;
    name: string;
    address: string;
    latitude?: string | number | null;
    longitude?: string | number | null;
  };
  items: CartItemResponse[];
}

export const cartService = {
  getMyCarts: async (): Promise<{ success: boolean; data: CartResponse[]; count: number }> => {
    const response = await apiClient.get("/v1/carts");
    return response.data.data;
  },

  getCart: async (cartId: string): Promise<{ success: boolean; data: CartResponse }> => {
    const response = await apiClient.get(`/v1/carts/${cartId}`);
    return response.data.data;
  },

  getOrCreateCart: async (
    restaurantId: string,
    isGroupCart = false
  ): Promise<{ success: boolean; data: CartResponse; message: string }> => {
    const response = await apiClient.post("/v1/carts", { restaurantId, isGroupCart });
    return response.data.data;
  },

  deleteCart: async (cartId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/v1/carts/${cartId}`);
    return response.data.data;
  },

  clearCart: async (cartId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/v1/carts/${cartId}/clear`);
    return response.data.data;
  },

  addItemToCart: async (
    cartId: string,
    menuItemId: string,
    quantity: number,
    selectedOptions?: Record<string, OptionChoice | OptionChoice[]>,
    note?: string
  ): Promise<{ success: boolean; data: CartItemResponse; message: string }> => {
    const response = await apiClient.post(`/v1/carts/${cartId}/items`, {
      menuItemId,
      quantity,
      selectedOptions,
      note,
    });
    return response.data.data;
  },

  updateCartItem: async (
    cartId: string,
    cartItemId: string,
    data: { quantity?: number; selectedOptions?: Record<string, OptionChoice | OptionChoice[]>; note?: string }
  ): Promise<{ success: boolean; data: CartItemResponse; message: string }> => {
    const response = await apiClient.patch(`/v1/carts/${cartId}/items/${cartItemId}`, data);
    return response.data.data;
  },

  removeCartItem: async (
    cartId: string,
    cartItemId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/v1/carts/${cartId}/items/${cartItemId}`);
    return response.data.data;
  },
};
