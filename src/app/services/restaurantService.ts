import apiClient from "./apiClient"
import type { Promotion } from "../types/order"
import type { Restaurant, MenuItem, ComboSuggestion } from "../types/restaurant"


export const restaurantService = {
  /** Lấy danh sách nhà hàng (public) */
  listRestaurants: async () => {
    const response = await apiClient.get("/v1/restaurant/list");
    return Array.isArray(response.data) ? response.data : response.data.data;
  },

  /** Lấy nhà hàng của owner đang đăng nhập */
  getMyRestaurant: async (): Promise<Restaurant> => {
    const response = await apiClient.get("/v1/restaurant/me");
    return response.data.data;
  },

  /** Lấy danh sách menu items của nhà hàng */
  getMenuItems: async (restaurantId: string): Promise<MenuItem[]> => {
    const response = await apiClient.get(`/v1/restaurants/${restaurantId}/menu-items`);
    return response.data.data || [];
  },

  /** Lấy danh sách khuyến mãi của nhà hàng */
  listPromotions: async (restaurantId: string): Promise<Promotion[]> => {
    const response = await apiClient.get(`/v1/restaurant/${restaurantId}/promotions`);
    return response.data.data || [];
  },

  /** Tạo chương trình khuyến mãi mới */
  createPromotion: async (restaurantId: string, data: {
    code: string;
    description?: string;
    discountPercentage?: number;
    fixedDiscount?: number;
    minOrderValue: number;
    validFrom: string;
    validTo: string;
    isActive: boolean;
  }): Promise<Promotion> => {
    const response = await apiClient.post(`/v1/restaurant/${restaurantId}/promotions`, data);
    return response.data.data;
  },

  /** Cập nhật chương trình khuyến mãi */
  updatePromotion: async (promotionId: string, data: {
    code?: string;
    description?: string;
    discountPercentage?: number;
    fixedDiscount?: number;
    minOrderValue?: number;
    validFrom?: string;
    validTo?: string;
    isActive?: boolean;
  }): Promise<Promotion> => {
    const response = await apiClient.patch(`/v1/restaurant/promotions/${promotionId}`, data);
    return response.data.data;
  },

  /** Xóa chương trình khuyến mãi */
  deletePromotion: async (promotionId: string): Promise<void> => {
    await apiClient.delete(`/v1/restaurant/promotions/${promotionId}`);
  },

  /** Cập nhật trạng thái ẩn/hiện món ăn */
  updateMenuItemAvailability: async (
    menuItemId: string,
    isAvailable: boolean,
    reason?: string
  ): Promise<MenuItem> => {
    const response = await apiClient.patch(`/v1/menu-items/${menuItemId}/availability`, {
      isAvailable,
      reason,
    });
    return response.data.data;
  },

  /** Tạo món ăn mới */
  createMenuItem: async (restaurantId: string, data: {
    name: string;
    description?: string;
    basePrice: string;
    categoryId?: string;
    imageUrl?: string;
    isAvailable?: boolean;
  }): Promise<MenuItem> => {
    const response = await apiClient.post(`/v1/restaurants/${restaurantId}/menu-items`, data);
    return response.data.data;
  },

  /** Cập nhật món ăn */
  updateMenuItem: async (menuItemId: string, data: {
    name?: string;
    description?: string;
    basePrice?: string;
    categoryId?: string;
    imageUrl?: string;
    isAvailable?: boolean;
  }): Promise<MenuItem> => {
    const response = await apiClient.put(`/v1/menu-items/${menuItemId}`, data);
    return response.data.data;
  },

  /** Xóa món ăn */
  deleteMenuItem: async (menuItemId: string): Promise<void> => {
    await apiClient.delete(`/v1/menu-items/${menuItemId}`);
  },

  /** Lấy danh sách gợi ý combo (AI suggestions) */
  getComboSuggestions: async (restaurantId: string): Promise<ComboSuggestion[]> => {
    const response = await apiClient.get(`/v1/restaurant/${restaurantId}/combo-suggestions`);
    return response.data.data || [];
  },
  togglePromotion: async (promotionId: string, isActive: boolean): Promise<Promotion> => {
    const response = await apiClient.patch(
      `/v1/restaurant/promotions/${promotionId}/toggle`,
      { isActive }
    );
    return response.data.data;
  },
  getRecommendations: async (): Promise<Restaurant[]> => {
    const response = await apiClient.get("/v1/restaurant/recommendations");
    return response.data;
  },
};

// Backward compatibility
export const listRestaurants = restaurantService.listRestaurants;
export const getMyRestaurant = restaurantService.getMyRestaurant;
export const getMenuItems = restaurantService.getMenuItems;
export const createMenuItem = restaurantService.createMenuItem;
export const updateMenuItem = restaurantService.updateMenuItem;
export const toggleMenuItemAvailability = restaurantService.updateMenuItemAvailability;
export const deleteMenuItem = restaurantService.deleteMenuItem;
export const listPromotions = restaurantService.listPromotions;
export const createPromotion = restaurantService.createPromotion;
export const updatePromotion = restaurantService.updatePromotion;
export const deletePromotion = restaurantService.deletePromotion;
export const getComboSuggestions = restaurantService.getComboSuggestions;
export const togglePromotion = restaurantService.togglePromotion;
export const getRecommendations = restaurantService.getRecommendations;
