import apiClient from './apiClient';
import type { Order, CreateOrderInput, UpdateOrderStatusInput, CancelOrderInput, OrderStatusHistory, Promotion } from '../types/order';

const parseResponse = <T>(response: unknown): T => {
  const resObj = response as { data?: { data?: T } };
  return resObj?.data?.data ?? (resObj?.data as T);
};

export interface CheckPromotionResponse {
  success: boolean;
  discountAmount: number;
  promotionCode?: string;
  promotionType?: string;
  foodDiscount: number;
  shippingDiscount: number;
  foodPromo?: { code: string; promotionType: string } | null;
  shippingPromo?: { code: string; promotionType: string } | null;
}

export const orderService = {
  createOrder: async (data: CreateOrderInput): Promise<Order> => {
    const response = await apiClient.post('/v1/orders', data);
    return parseResponse<Order>(response);
  },

  checkPromotion: async (data: { promotionCode?: string; shippingPromotionCode?: string; restaurantId: string; totalAmount: number; deliveryFee?: number }): Promise<CheckPromotionResponse> => {
    const response = await apiClient.post('/v1/orders/check-promotion', data);
    return parseResponse<CheckPromotionResponse>(response);
  },

   getPromotions: async (restaurantId?: string): Promise<Promotion[]> => {
    const res = await apiClient.get("/v1/promotions", {
      params: restaurantId ? { restaurantId } : {},
    });
    return parseResponse<Promotion[]>(res);
  },

  getMyOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get('/v1/orders');
    const data = parseResponse<unknown>(response);
    if (Array.isArray(data)) {
      return data as Order[];
    }
    if (data && typeof data === 'object' && 'items' in data) {
      const obj = data as { items?: unknown };
      if (Array.isArray(obj.items)) {
        return obj.items as Order[];
      }
    }
    return [];
  },

  getOrder: async (orderId: string): Promise<Order> => {
    const response = await apiClient.get(`/v1/orders/${orderId}`);
    return parseResponse<Order>(response);
  },

  cancelOrder: async (orderId: string, data: CancelOrderInput): Promise<Order> => {
    const response = await apiClient.patch(`/v1/orders/${orderId}/cancel`, data);
    return parseResponse<Order>(response);
  },

  submitReview: async (
    orderId: string,
    data: {
      restaurantRating: number;
      restaurantComment?: string;
      driverRating?: number;
      driverComment?: string;
    }
  ): Promise<unknown> => {
    const response = await apiClient.post(`/v1/orders/${orderId}/review`, data);
    return response.data;
  },

  getOrderHistory: async (orderId: string): Promise<OrderStatusHistory[]> => {
    const response = await apiClient.get(`/v1/orders/${orderId}/history`);
    return parseResponse<OrderStatusHistory[]>(response) || [];
  },

  updateOrderStatus: async (orderId: string, data: UpdateOrderStatusInput): Promise<Order> => {
    const response = await apiClient.patch(`/v1/orders/${orderId}/status`, data);
    return parseResponse<Order>(response);
  },

  getRestaurantOrders: async (
    restaurantId: string,
    params?: { status?: string; page?: number; limit?: number }
  ): Promise<{ items: Order[]; meta: { total: number; page: number; limit: number } }> => {
    const response = await apiClient.get(`/v1/restaurants/${restaurantId}/orders`, {
      params: {
        status: params?.status && params.status !== "all" ? params.status : undefined,
        page:   params?.page  ?? 1,
        limit:  params?.limit ?? 20,
      },
    });
    const data = parseResponse<unknown>(response);
    // BE trả { items: [], meta: {} }
    if (data && typeof data === 'object' && 'items' in data) {
      return data as { items: Order[]; meta: { total: number; page: number; limit: number } };
    }
    // fallback nếu BE trả array thẳng
    const items = Array.isArray(data) ? (data as Order[]) : [];
    return { items, meta: { total: items.length, page: 1, limit: 20 } };
  },
};
export const createOrder = orderService.createOrder;
export const checkPromotion = orderService.checkPromotion;
export const getPromotions = orderService.getPromotions;
export const getMyOrders = orderService.getMyOrders;
export const getOrder = orderService.getOrder;
export const cancelOrder = orderService.cancelOrder;
export const submitReview = orderService.submitReview;
export const getOrderHistory = orderService.getOrderHistory;
export const updateOrderStatus = orderService.updateOrderStatus;
export const getRestaurantOrdersPaginated = orderService.getRestaurantOrders;

