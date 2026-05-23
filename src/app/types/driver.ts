

export type DriverStatus =
  | "online"
  | "offline"
  | "busy";

export type DeliveryStatus =
  | "picked_up"
  | "delivering"
  | "completed";

export type OrderAction =
  | "accepted"
  | "rejected";

export type EarningsPeriod =
  | "today"
  | "week"
  | "month";

/* ───────────────── COMMON ───────────────── */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}

/* ───────────────── DRIVER ───────────────── */

export interface DriverProfile {
  id: string;

  currentStatus: DriverStatus;

  walletBalance: number;

  rating: number;

  commissionRate: number;

  vehicleInfo?: string;

  licensePlate?: string;

  profile: {
    fullName: string;
    phone: string;
    avatarUrl?: string;
  };
}

/* ───────────────── ORDER ───────────────── */

export interface Order {
  id: string;

  status: string;

  finalAmount: number;

  createdAt: string;

  completedAt?: string;

  deliveryAddress?: string;

  restaurant: {
    name: string;
    address: string;

    latitude?: number;
    longitude?: number;
  };

  customer?: {
    fullName: string;
    phone: string;
  };

  orderItems?: {
    quantity: number;

    menuItem: {
      name: string;
    };
  }[];
}

/* ───────────────── HEATMAP ───────────────── */

export interface HeatmapItem {
  name?: string;
  address?: string;

  weight: number;

  latitude?: number;
  longitude?: number;
}

/* ───────────────── ROUTE ───────────────── */

export interface RouteItem {
  orderId: string;

  sequence: number;

  restaurant: {
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };

  customer?: {
    address?: string;
    phone?: string;
  };
}

/* ───────────────── EARNINGS ───────────────── */

export interface Transaction {
  id: string;

  amount: number;

  description: string;

  createdAt: string;
}

export interface Earnings {
  totalEarned: number;

  completedOrders: number;

  transactions: Transaction[];
}