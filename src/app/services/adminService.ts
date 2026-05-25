import apiClient from "./apiClient";
import type { AxiosRequestConfig } from "axios";

export interface PendingRestaurant {
  id: string;
  name: string;
  cuisine: string;
  owner: string;
  city: string;
  applied: string;
}

export interface PendingDriver {
  id: string;
  fullName: string;
  phone: string;
  vehicleInfo: string;
  licensePlate: string;
  driverLicenseNumber: string;
  nationalIdNumber: string;
  approvalStatus: string;
  createdAt: string;
}

export interface FraudAlert {
  id: string;
  type: string;
  detail: string;
  risk: string;
  time: string;
}

export interface CategoryPieItem {
  name: string;
  value: number;
  color: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  orders: number;
  joined: string;
  status: string;
}

export interface AdminRole {
  id: string;
  name: string;
  code: string;
}

export interface AdminOrderItem {
  id: string;
  customer: string;
  restaurant: string;
  driver: string;
  amount: string;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivering' | 'completed' | 'cancelled' | 'delivered' | 'on_way';
  time: string;
}

export interface SystemKPIs {
  totalRevenue: number;
  activeOrders: number;
  totalRestaurants: number;
  pendingRestaurants: number;
  driversOnline: number;
  totalDrivers: number;
}

export interface ActiveRestaurant {
  id: string;
  name: string;
  cuisine: string;
  owner: string;
  city: string;
  rating: number;
  orders: number;
  status: 'open' | 'closed';
}

export interface ActiveDriver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  rating: number;
  status: 'online' | 'busy' | 'offline';
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  time: string;
  author: string;
}

export interface SystemSettings {
  commissionRate: number;
  autoAssign: boolean;
  baseDeliveryFee: number;
  systemAlertsEnabled: boolean;
  maintenanceMode: boolean;
}

export interface PayoutItem {
  id: string;
  type: string;
  status: string;
  date: string;
  amount: string;
}

// Config đặc biệt: bỏ qua auto-redirect khi gặp lỗi 403
const adminConfig: AxiosRequestConfig & { _skipForbiddenRedirect?: boolean } = {
  _skipForbiddenRedirect: true,
};

// Helper: gọi API admin, bắt lỗi 403 trả về giá trị rỗng thay vì redirect
async function adminGet<T>(url: string, fallback: T): Promise<T> {
  try {
    const response = await apiClient.get(url, adminConfig);
    const data = response.data;
    if (data && typeof data === "object" && "data" in data && data.data !== undefined) {
      return data.data;
    }
    return data;
  } catch (err: any) {
    if (err?.response?.status === 403) {
      console.warn(`[adminService] 403 on ${url} - user may not have admin permissions.`);
      return fallback;
    }
    throw err;
  }
}

export const adminService = {
  getKPIs: async (): Promise<SystemKPIs> => {
    return adminGet<SystemKPIs>("/v1/admin/kpis", {
      totalRevenue: 0,
      activeOrders: 0,
      totalRestaurants: 0,
      pendingRestaurants: 0,
      driversOnline: 0,
      totalDrivers: 0,
    });
  },

  getRevenueData: async (): Promise<any[]> => {
    return adminGet<any[]>("/v1/admin/revenue", []);
  },

  getCategoryPieData: async (): Promise<CategoryPieItem[]> => {
    return adminGet<CategoryPieItem[]>("/v1/admin/categories/stats", []);
  },

  getOrders: async (): Promise<AdminOrderItem[]> => {
    return adminGet<AdminOrderItem[]>("/v1/admin/orders", []);
  },

  getPendingRestaurants: async (): Promise<PendingRestaurant[]> => {
    return adminGet<PendingRestaurant[]>("/v1/admin/restaurants/pending", []);
  },

  getPendingDrivers: async (): Promise<PendingDriver[]> => {
    return adminGet<PendingDriver[]>("/v1/admin/drivers/pending", []);
  },

  getFraudAlerts: async (): Promise<FraudAlert[]> => {
    return adminGet<FraudAlert[]>("/v1/admin/fraud-alerts", []);
  },

  getUsers: async (): Promise<AdminUser[]> => {
    const data = await adminGet<any>("/v1/admin/users", []);
    return data?.data || data?.items || data || [];
  },

  approveRestaurant: async (restaurantId: string): Promise<void> => {
    await apiClient.patch(`/v1/admin/restaurants/${restaurantId}/status`, { status: "approved" }, adminConfig);
  },

  rejectRestaurant: async (restaurantId: string): Promise<void> => {
    await apiClient.patch(`/v1/admin/restaurants/${restaurantId}/status`, { status: "rejected" }, adminConfig);
  },

  approveDriver: async (driverId: string): Promise<void> => {
    await apiClient.patch(`/v1/admin/drivers/${driverId}/status`, { status: "approved" }, adminConfig);
  },

  rejectDriver: async (driverId: string): Promise<void> => {
    await apiClient.patch(`/v1/admin/drivers/${driverId}/status`, { status: "rejected" }, adminConfig);
  },

  updateUserStatus: async (email: string, status: string): Promise<void> => {
    await apiClient.patch(`/v1/admin/users/status`, { email, status }, adminConfig);
  },

  getActiveRestaurants: async (): Promise<ActiveRestaurant[]> => {
    return adminGet<ActiveRestaurant[]>("/v1/admin/restaurants/active", []);
  },

  getActiveDrivers: async (): Promise<ActiveDriver[]> => {
    return adminGet<ActiveDriver[]>("/v1/admin/drivers/active", []);
  },

  getAnnouncements: async (): Promise<Announcement[]> => {
    return adminGet<Announcement[]>("/v1/admin/announcements", []);
  },

  createAnnouncement: async (title: string, content: string): Promise<Announcement> => {
    const response = await apiClient.post("/v1/admin/announcements", { title, content }, adminConfig);
    return response.data?.data || response.data;
  },

  deleteAnnouncement: async (id: number): Promise<void> => {
    await apiClient.delete(`/v1/admin/announcements/${id}`, adminConfig);
  },

  getSettings: async (): Promise<SystemSettings> => {
    return adminGet<SystemSettings>("/v1/admin/settings", {
      commissionRate: 15,
      autoAssign: true,
      baseDeliveryFee: 15000,
      systemAlertsEnabled: true,
      maintenanceMode: false,
    });
  },

  updateSettings: async (settings: SystemSettings): Promise<void> => {
    await apiClient.put("/v1/admin/settings", settings, adminConfig);
  },

  getPayouts: async (): Promise<PayoutItem[]> => {
    return adminGet<PayoutItem[]>("/v1/admin/payouts", []);
  },

  createUser: async (userData: { firstName: string; lastName: string; email: string; roleIds: string[] }): Promise<any> => {
    const response = await apiClient.post("/v1/admin/users", userData, adminConfig);
    return response.data?.data || response.data;
  },

  getUser: async (userId: string): Promise<any> => {
    const response = await apiClient.get(`/v1/admin/users/${userId}`, adminConfig);
    return response.data?.data || response.data;
  },

  updateUser: async (userId: string, userData: { firstName: string; lastName: string; email: string; status: string; roleIds: string[] }): Promise<any> => {
    const response = await apiClient.put(`/v1/admin/users/${userId}`, userData, adminConfig);
    return response.data?.data || response.data;
  },

  deleteUser: async (userId: string): Promise<any> => {
    const response = await apiClient.delete(`/v1/admin/users/${userId}`, adminConfig);
    return response.data?.data || response.data;
  },

  getRoles: async (): Promise<AdminRole[]> => {
    const data = await adminGet<any>("/v1/admin/roles", []);
    return data?.data || data?.items || data || [];
  }
};

