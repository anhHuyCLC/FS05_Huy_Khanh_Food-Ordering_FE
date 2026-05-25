import apiClient from './apiClient';
import type { Order } from '../types/order';

export interface DriverProfile {
  id: string;
  currentStatus: 'online' | 'busy' | 'offline';
  walletBalance: number;
  rating: number;
}

export const driverService = {
  getProfile: async (): Promise<DriverProfile> => {
    const response = await apiClient.get('/v1/driver/profile');
    return response.data?.data || response.data;
  },

  updateStatus: async (status: 'online' | 'offline' | 'busy'): Promise<any> => {
    const response = await apiClient.patch('/v1/driver/status', { status });
    return response.data?.data || response.data;
  },

  getAvailableOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get('/v1/driver/orders/available');
    return response.data?.data || response.data || [];
  },

  getActiveOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get('/v1/driver/orders/active');
    return response.data?.data || response.data || [];
  },

  getOrderHistory: async (skip = 0, take = 20): Promise<Order[]> => {
    const response = await apiClient.get('/v1/driver/orders/history', {
      params: { skip, take }
    });
    return response.data?.data || response.data || [];
  },

  respondToOrder: async (orderId: string, action: 'accepted' | 'rejected', reason?: string): Promise<any> => {
    const response = await apiClient.post(`/v1/driver/orders/${orderId}/respond`, {
      action,
      reason
    });
    return response.data?.data || response.data;
  },

  updateDeliveryStatus: async (orderId: string, status: 'picked_up' | 'delivering' | 'completed'): Promise<any> => {
    const response = await apiClient.patch(`/v1/driver/orders/${orderId}/delivery-status`, {
      status
    });
    return response.data?.data || response.data;
  },

  updateLocation: async (latitude: number, longitude: number): Promise<any> => {
    const response = await apiClient.patch('/v1/driver/location', {
      latitude,
      longitude
    });
    return response.data?.data || response.data;
  }
};
