export type DriverStatus   = "online" | "offline" | "busy";
export type DeliveryStatus = "picked_up" | "delivering" | "completed";
export type OrderAction    = "accepted" | "rejected";
export type EarningsPeriod = "today" | "week" | "month";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}

export interface DriverProfile {
  id: string;
  currentStatus: DriverStatus;
  approvalStatus: ApprovalStatus; // MỚI
  walletBalance: number;
  codDebt?: number;
  rating: number| string;
  commissionRate: number;
  vehicleInfo?: string;
  licensePlate?: string;
  profile: {
    fullName: string;
    phone: string;
    avatarUrl?: string;
  };
}

export interface OrderItem {
  quantity: number;
  menuItem: { name: string };
}

export interface Order {
  id: string;
  status: string;
  finalAmount: number;
  deliveryFee?: number;
  note?: string; // MỚI: ghi chú của khách
  createdAt: string;
  completedAt?: string;
  assignmentExpiresAt?: string; // MỚI: countdown timer
  driverId?: string;
  currentDriverId?: string | null;
  deliveryAddress?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  distance?: number | null;
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
  orderItems?: OrderItem[];
  payment?: {
    status?: string;
    method?: string;
    amount?: number;
  }[];
}

export interface HeatmapItem {
  name?: string;
  address?: string;
  weight: number;
  latitude?: number;
  longitude?: number;
}

export interface RouteItem {
  orderId: string;
  sequence: number;
  restaurant: { name: string; address?: string; latitude?: number; longitude?: number };
  customer?: { address?: string; phone?: string };
}


export interface Transaction {
  id: string;
  amount: number;
  transactionType?: string;
  description: string;
  createdAt: string;
}

// MỚI: dailyBreakdown cho BarChart
export interface DailyEarning {
  day: string;     // "T2" | "T3" | ... | "CN" hoặc "DD/MM"
  earnings: number; // đơn vị nghìn đồng
}

export interface Earnings {
  walletBalance?: number;
  codDebt?: number;
  commissionRate?: number;
  rating?: number;
  period?: string;
  totalEarned: number;
  totalWithdrawn?: number;
  completedOrders: number;
  transactions: Transaction[];
  dailyBreakdown?: DailyEarning[]; // MỚI
}

// Input types
export interface UpdateProfileInput {
  vehicleInfo?: string;
  licensePlate?: string;
  avatarUrl?: string;
}