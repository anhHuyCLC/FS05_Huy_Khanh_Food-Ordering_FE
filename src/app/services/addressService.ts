import apiClient from './apiClient';
import type { SavedAddress, CreateAddressInput, UpdateAddressInput } from '../types/address';

export const addressService = {
  getMyAddresses: async (): Promise<SavedAddress[]> => {
    const response = await apiClient.get('/v1/addresses');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data && typeof response.data === 'object' && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  },

  getAddress: async (id: string): Promise<SavedAddress> => {
    const response = await apiClient.get(`/v1/addresses/${id}`);
    return response.data.data || response.data;
  },

  createAddress: async (data: CreateAddressInput): Promise<SavedAddress> => {
    const response = await apiClient.post('/v1/addresses', data);
    return response.data.data || response.data;
  },

  updateAddress: async (id: string, data: UpdateAddressInput): Promise<SavedAddress> => {
    const response = await apiClient.patch(`/v1/addresses/${id}`, data);
    return response.data.data || response.data;
  },

  deleteAddress: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/addresses/${id}`);
  },
};
