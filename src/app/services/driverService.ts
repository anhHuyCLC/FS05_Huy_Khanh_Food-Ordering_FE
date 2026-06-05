// import apiClient from "./apiClient";

import type {
  ApiResponse,
  DriverProfile,
  DriverStatus,
  Order,
  OrderAction,
  DeliveryStatus,
  HeatmapItem,
  RouteItem,
  Earnings,
  EarningsPeriod,
} from "../types/driver";



/* ───────────────── REQUEST ───────────────── */
const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api/v1/driver";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {

  const token =  localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,

    headers: {
      "Content-Type": "application/json",

      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),

      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));

    throw new Error(
      err.message ?? `HTTP ${res.status}`
    );
  }

  const data = await res.json();
  const isUnwrappedPath =
    path.startsWith("/location") ||
    path.startsWith("/heatmap") ||
    path.startsWith("/route-optimize");

  if (isUnwrappedPath) {
    return {
      success: true,
      data: data as T,
    };
  }

  return data;
}

/* ───────────────── PROFILE ───────────────── */

export const getDriverProfile =
  () => request<DriverProfile>("/profile");

/* ───────────────── STATUS ───────────────── */

export const updateDriverStatus = (
  status: DriverStatus
) =>
  request<null>("/status", {
    method: "PATCH",

    body: JSON.stringify({ status }),
  });

/* ───────────────── ORDERS ───────────────── */

export const getAvailableOrders =
  () => request<Order[]>("/orders/available");

export const getActiveOrders =
  () => request<Order[]>("/orders/active");

export const getOrderHistory = (
  skip = 0,
  take = 20
) =>
  request<Order[]>(
    `/orders/history?skip=${skip}&take=${take}`
  );

export const respondOrder = (
  orderId: string,
  action: OrderAction,
  reason?: string
) =>
  request<Order>(
    `/orders/${orderId}/respond`,
    {
      method: "POST",

      body: JSON.stringify({
        action,
        reason,
      }),
    }
  );

export const updateDeliveryStatus = (
  orderId: string,
  status: DeliveryStatus
) =>
  request<null>(
    `/orders/${orderId}/delivery-status`,
    {
      method: "PATCH",

      body: JSON.stringify({ status }),
    }
  );

/* ───────────────── LOCATION ───────────────── */

export const updateLocation = (
  latitude: number,
  longitude: number
) =>
  request<null>("/location", {
    method: "PATCH",

    body: JSON.stringify({
      latitude,
      longitude,
    }),
  });

export const getMyLocation = async () => {
  try {
    return await request<{ latitude: number; longitude: number }>("/location");
  } catch {
    return { success: false, data: null };
  }
};

export const getDriverLocation = (
  driverId: string
) =>
  request<{ latitude: number; longitude: number }>(
    `/location/${driverId}`
  );

/* ───────────────── MAP ───────────────── */

export const getDemandHeatmap =
  () => request<HeatmapItem[]>("/heatmap");

export const optimizeRoute = (
  orderIds?: string[]
) =>
  request<{ route: RouteItem[] }>(
    "/route-optimize",
    {
      method: "POST",

      body: JSON.stringify({
        orderIds,
      }),
    }
  );

/* ───────────────── EARNINGS ───────────────── */

export const getEarnings = (
  period?: EarningsPeriod,
  from?: string,
  to?: string
) => {

  const params = new URLSearchParams();

  if (period)
    params.set("period", period);

  if (from)
    params.set("from", from);

  if (to)
    params.set("to", to);

  const qs = params.toString();

  return request<Earnings>(
    `/earnings${qs ? `?${qs}` : ""}`
  );
};

// Tạo yêu cầu nạp tiền qua VNPay — trả về payment URL
export const requestDeposit = (amount: number) =>
  request<{
    requestId: string;
    paymentUrl: string;
  }>("/wallet/deposit", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });

// Yêu cầu rút tiền — gửi thông tin ngân hàng cho admin
export const requestWithdraw = (
  amount: number,
  bankName: string,
  bankAccount: string,
  bankOwner: string,
  note?: string
) =>
  request<{ requestId: string; amount: number; status: string; message: string }>(
    "/wallet/withdraw",
    {
      method: "POST",
      body: JSON.stringify({ amount, bankName, bankAccount, bankOwner, note }),
    }
  );

// Lấy lịch sử yêu cầu ví
export const getWalletRequests = () =>
  request<
    Array<{
      id: string;
      type: "deposit" | "withdraw";
      amount: number;
      status: "pending" | "approved" | "rejected";
      note: string | null;
      adminNote: string | null;
      bankName: string | null;
      bankAccount: string | null;
      bankOwner: string | null;
      reviewedAt: string | null;
      createdAt: string;
    }>
  >("/wallet/requests");