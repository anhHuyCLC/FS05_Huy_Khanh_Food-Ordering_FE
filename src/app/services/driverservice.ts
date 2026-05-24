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

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {

const token = localStorage.getItem("access_token") ?? localStorage.getItem("token");
  // console.log("TOKEN =", token);
const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api/v1/driver";
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

  return res.json();
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