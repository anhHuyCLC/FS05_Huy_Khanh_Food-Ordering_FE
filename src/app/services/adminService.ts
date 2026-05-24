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
  name: string;
  email: string;
  role: string;
  orders: number;
  joined: string;
  status: string;
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

// Config đặc biệt: bỏ qua auto-redirect khi gặp lỗi 403
const adminConfig: AxiosRequestConfig & { _skipForbiddenRedirect?: boolean } = {
  _skipForbiddenRedirect: true,
};

// Helper: gọi API admin, bắt lỗi 403 trả về giá trị rỗng thay vì redirect
async function adminGet<T>(url: string, fallback: T): Promise<T> {
  try {
    const response = await apiClient.get(url, adminConfig);
    return response.data;
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

  getFraudAlerts: async (): Promise<FraudAlert[]> => {
    return adminGet<FraudAlert[]>("/v1/admin/fraud-alerts", []);
  },

  getUsers: async (): Promise<AdminUser[]> => {
    const data = await adminGet<any>("/v1/admin/users", []);
    return data?.items || data || [];
  },

  approveRestaurant: async (restaurantId: string): Promise<void> => {
    await apiClient.patch(`/v1/admin/restaurants/${restaurantId}/status`, { status: "approved" }, adminConfig);
  },

  rejectRestaurant: async (restaurantId: string): Promise<void> => {
    await apiClient.patch(`/v1/admin/restaurants/${restaurantId}/status`, { status: "rejected" }, adminConfig);
  },

  updateUserStatus: async (email: string, status: string): Promise<void> => {
    await apiClient.patch(`/v1/admin/users/status`, { email, status }, adminConfig);
  }
};
