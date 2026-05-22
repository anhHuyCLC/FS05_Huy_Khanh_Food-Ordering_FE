import apiClient from './apiClient';
import type { Order, CreateOrderInput, UpdateOrderStatusInput, CancelOrderInput, OrderStatusHistory } from '../types/order';

export const orderService = {
  createOrder: async (data: CreateOrderInput): Promise<Order> => {
    const response = await apiClient.post('/v1/orders', data);
    return response.data.data;
  },

  checkPromotion: async (data: { promotionCode: string; restaurantId: string; totalAmount: number }) => {
    const response = await apiClient.post('/v1/orders/check-promotion', data);
    return response.data;
  },

  getMyOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get('/v1/orders');
    return response.data.data.items || [];
  },

  getOrder: async (orderId: string): Promise<Order> => {
    const response = await apiClient.get(`/v1/orders/${orderId}`);
    return response.data.data;
  },

  cancelOrder: async (orderId: string, data: CancelOrderInput): Promise<Order> => {
    const response = await apiClient.patch(`/v1/orders/${orderId}/cancel`, data);
    return response.data.data;
  },

  getOrderHistory: async (orderId: string): Promise<OrderStatusHistory[]> => {
    const response = await apiClient.get(`/v1/orders/${orderId}/history`);
    return response.data.data;
  },

  updateOrderStatus: async (orderId: string, data: UpdateOrderStatusInput): Promise<Order> => {
    const response = await apiClient.patch(`/v1/orders/${orderId}/status`, data);
    return response.data.data;
  },

  getRestaurantOrders: async (restaurantId: string): Promise<Order[]> => {
    const response = await apiClient.get(`/v1/restaurants/${restaurantId}/orders`);
    return response.data.data.items || [];
  }
};
