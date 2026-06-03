import apiClient from "./apiClient";

export const profileService = {
  updateProfile: async (userId: string, data: {
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
  }) => {
    const response = await apiClient.put(`/v1/profiles/${userId}`, data);
    return response.data;
  },
};
