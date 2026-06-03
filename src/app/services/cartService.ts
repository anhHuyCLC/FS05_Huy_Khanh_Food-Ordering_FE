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

const parseResponse = <T>(response: unknown): T => {
  const resObj = response as { data?: { success?: boolean; data?: T } };
  if (resObj && resObj.data && typeof resObj.data === "object" && "success" in resObj.data) {
    return resObj.data.data !== undefined ? resObj.data.data : (resObj.data as unknown as T);
  }
  return resObj?.data as unknown as T;
};

export const cartService = {
  getMyCarts: async (): Promise<CartResponse[]> => {
    const response = await apiClient.get("/v1/carts");
    return parseResponse<CartResponse[]>(response);
  },

  getCart: async (cartId: string): Promise<CartResponse> => {
    const response = await apiClient.get(`/v1/carts/${cartId}`);
    return parseResponse<CartResponse>(response);
  },

  getOrCreateCart: async (
    restaurantId: string,
    isGroupCart = false
  ): Promise<CartResponse> => {
    const response = await apiClient.post("/v1/carts", { restaurantId, isGroupCart });
    return parseResponse<CartResponse>(response);
  },

  deleteCart: async (cartId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/v1/carts/${cartId}`);
    return parseResponse<{ message: string }>(response);
  },

  clearCart: async (cartId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/v1/carts/${cartId}/clear`);
    return parseResponse<{ message: string }>(response);
  },

  addItemToCart: async (
    cartId: string,
    menuItemId: string,
    quantity: number,
    selectedOptions?: Record<string, OptionChoice | OptionChoice[]>,
    note?: string
  ): Promise<CartItemResponse> => {
    const response = await apiClient.post(`/v1/carts/${cartId}/items`, {
      menuItemId,
      quantity,
      selectedOptions,
      note,
    });
    return parseResponse<CartItemResponse>(response);
  },

  updateCartItem: async (
    cartId: string,
    cartItemId: string,
    data: { quantity?: number; selectedOptions?: Record<string, OptionChoice | OptionChoice[]>; note?: string }
  ): Promise<CartItemResponse> => {
    const response = await apiClient.patch(`/v1/carts/${cartId}/items/${cartItemId}`, data);
    return parseResponse<CartItemResponse>(response);
  },

  removeCartItem: async (
    cartId: string,
    cartItemId: string
  ): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/v1/carts/${cartId}/items/${cartItemId}`);
    return parseResponse<{ message: string }>(response);
  },

  shareCart: async (
    cartId: string
  ): Promise<{ sessionToken: string }> => {
    const response = await apiClient.post(`/v1/carts/${cartId}/share`);
    return parseResponse<{ sessionToken: string }>(response);
  },

  getCartByToken: async (
    token: string
  ): Promise<CartResponse> => {
    const response = await apiClient.get(`/v1/carts/share/${token}`);
    return parseResponse<CartResponse>(response);
  },
};
