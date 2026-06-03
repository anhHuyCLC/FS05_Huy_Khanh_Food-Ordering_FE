import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  getDriverProfile,
  updateDriverStatus as updateDriverStatusService,
  getAvailableOrders,
  getActiveOrders,
  respondOrder as respondOrderService,
  updateDeliveryStatus as updateDeliveryStatusService,
  getDemandHeatmap,
  optimizeRoute as optimizeRouteService,
  updateLocation as updateLocationService,
  getMyLocation,
  getEarnings as getEarningsService,
  getOrderHistory,
} from "../services/driverService";
import type {
  DriverProfile,
  DriverStatus,
  Order,
  HeatmapItem,
  RouteItem,
  Earnings,
  DeliveryStatus,
  EarningsPeriod,
} from "../types/driver";

export interface DriverState {
  profile: DriverProfile | null;
  status: DriverStatus;
  availableOrders: Order[];
  activeOrders: Order[];
  orderHistory: Order[]; // MỚI
  historyLoading: boolean; // MỚI
  historyHasMore: boolean; // MỚI
  heatmap: HeatmapItem[];
  route: RouteItem[];
  earnings: Earnings | null;
  locationCoords: { latitude: number; longitude: number } | null;
  loading: boolean;
  actionLoading: boolean; // MỚI: loading cho accept/reject
  error: string | null;
}

const initialState: DriverState = {
  profile: null,
  status: "offline",
  availableOrders: [],
  activeOrders: [],
  orderHistory: [],
  historyLoading: false,
  historyHasMore: true,
  heatmap: [],
  route: [],
  earnings: null,
  locationCoords: null,
  loading: false,
  actionLoading: false,
  error: null,
};

export const loadDriverDashboard = createAsyncThunk(
  "driver/loadDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const locationPromise = getMyLocation()
        .then((res) => res.data)
        .catch(() => null);

      const [
        profileRes,
        availableRes,
        activeRes,
        heatmapRes,
        locationCoords,
        earningsRes,
      ] = await Promise.all([
        getDriverProfile(),
        getAvailableOrders(),
        getActiveOrders(),
        getDemandHeatmap(),
        locationPromise,
        getEarningsService("week").catch((err) => {
          console.error("EARNINGS ERROR", err);
          return { success: false, data: null };
        }),
      ]);
      // console.log("earningsRes =", earningsRes);
      // console.log(profileRes);
      return {
        profile: profileRes.data,
        availableOrders: Array.isArray(availableRes.data)
          ? availableRes.data
          : [],
        activeOrders: Array.isArray(activeRes.data) ? activeRes.data : [],
        heatmap: Array.isArray(heatmapRes.data) ? heatmapRes.data : [],
        locationCoords,
        earnings: earningsRes.data,
      };
    } catch (error: unknown) {
      return rejectWithValue(
        (error as Error).message || " Không thể tải dữ liệu tài xế.",
      );
    }
  },
);

export const fetchAvailableOrdersThunk = createAsyncThunk(
  "driver/fetchAvailableOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAvailableOrders();
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        (error as Error).message || "Không thể tải đơn chờ.",
      );
    }
  },
);

export const fetchActiveOrdersThunk = createAsyncThunk(
  "driver/fetchActiveOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getActiveOrders();
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        (error as Error).message || "Không thể tải đơn đang giao.",
      );
    }
  },
);
export const fetchOrderHistoryThunk = createAsyncThunk(
  "driver/fetchOrderHistory",
  async (
    { skip = 0, take = 20 }: { skip?: number; take?: number },
    { rejectWithValue },
  ) => {
    try {
      const res = await getOrderHistory(skip, take);
      return { orders: res.data, skip, take };
    } catch (e: unknown) {
      return rejectWithValue((e as Error).message);
    }
  },
);

export const fetchHeatmapThunk = createAsyncThunk(
  "driver/fetchHeatmap",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getDemandHeatmap();
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        (error as Error).message || "Không thể tải heatmap.",
      );
    }
  },
);

export const fetchLocationThunk = createAsyncThunk(
  "driver/fetchLocation",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMyLocation();
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        (error as Error).message || "Không thể lấy vị trí tài xế.",
      );
    }
  },
);

export const fetchEarningsThunk = createAsyncThunk(
  "driver/fetchEarnings",
  async (period: EarningsPeriod | undefined, { rejectWithValue }) => {
    try {
      const response = await getEarningsService(period);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        (error as Error).message || "Không thể tải thu nhập.",
      );
    }
  },
);

export const updateDriverStatusThunk = createAsyncThunk(
  "driver/updateStatus",
  async (status: DriverStatus, { rejectWithValue }) => {
    try {
      await updateDriverStatusService(status);
      return status;
    } catch (error: unknown) {
      return rejectWithValue(
        (error as Error).message || "Không thể cập nhật trạng thái.",
      );
    }
  },
);

export const respondOrderThunk = createAsyncThunk(
  "driver/respondOrder",
  async (
    payload: { orderId: string; action: "accepted" | "rejected" },
    { rejectWithValue },
  ) => {
    try {
      const response = await respondOrderService(
        payload.orderId,
        payload.action,
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        (error as Error).message || "Không thể xử lý yêu cầu đơn.",
      );
    }
  },
);

export const updateDeliveryStatusThunk = createAsyncThunk(
  "driver/updateDeliveryStatus",
  async (
    payload: { orderId: string; status: DeliveryStatus },
    { rejectWithValue },
  ) => {
    try {
      await updateDeliveryStatusService(payload.orderId, payload.status);
      return payload;
    } catch (error: unknown) {
      return rejectWithValue(
        (error as Error).message || "Không thể cập nhật trạng thái giao.",
      );
    }
  },
);

export const updateLocationThunk = createAsyncThunk(
  "driver/updateLocation",
  async (
    payload: { latitude: number; longitude: number },
    { rejectWithValue },
  ) => {
    try {
      await updateLocationService(payload.latitude, payload.longitude);
      return payload;
    } catch (error: unknown) {
      return rejectWithValue(
        (error as Error).message || "Không thể cập nhật vị trí.",
      );
    }
  },
);

export const optimizeRouteThunk = createAsyncThunk(
  "driver/optimizeRoute",
  async (orderIds: string[], { rejectWithValue }) => {
    try {
      const response = await optimizeRouteService(orderIds);
      return Array.isArray(response.data?.route) ? response.data.route : [];
    } catch (error: unknown) {
      return rejectWithValue(
        (error as Error).message || "Không thể tối ưu lộ trình.",
      );
    }
  },
);

const driverSlice = createSlice({
  name: "driver",
  initialState,
  reducers: {
    setRoute: (state, action: PayloadAction<RouteItem[]>) => {
      state.route = action.payload;
    },
    setDriverStatus: (state, action: PayloadAction<DriverStatus>) => {
      state.status = action.payload;
    },
    clearHistory: (s) => {
      s.orderHistory = [];
      s.historyHasMore = true;
    }, // MỚI
    // MỚI: real-time upsert active order khi socket báo status changed
    upsertActiveOrder: (s, a: PayloadAction<Order>) => {
      const idx = s.activeOrders.findIndex((o) => o.id === a.payload.id);
      if (idx !== -1) s.activeOrders[idx] = a.payload;
      else s.activeOrders.unshift(a.payload);
    },
    upsertAvailableOrder: (s, a: PayloadAction<Order>) => {
      const idx = s.availableOrders.findIndex((o) => o.id === a.payload.id);
      if (idx !== -1) s.availableOrders[idx] = a.payload;
      else s.availableOrders.unshift(a.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadDriverDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadDriverDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload.profile;
        state.status = action.payload.profile?.currentStatus ?? "offline";
        state.availableOrders = Array.isArray(action.payload.availableOrders)
          ? action.payload.availableOrders
          : [];
        state.activeOrders = Array.isArray(action.payload.activeOrders)
          ? action.payload.activeOrders
          : [];
        state.heatmap = Array.isArray(action.payload.heatmap)
          ? action.payload.heatmap
          : [];
        state.locationCoords = action.payload.locationCoords;
        state.earnings = action.payload.earnings;
      })
      .addCase(loadDriverDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAvailableOrdersThunk.fulfilled, (state, action) => {
        state.availableOrders = Array.isArray(action.payload)
          ? action.payload
          : [];
      })
      .addCase(fetchActiveOrdersThunk.fulfilled, (state, action) => {
        state.activeOrders = Array.isArray(action.payload)
          ? action.payload
          : [];
      })
      .addCase(fetchOrderHistoryThunk.pending, (s) => {
        s.historyLoading = true;
      })
      .addCase(fetchOrderHistoryThunk.fulfilled, (s, a) => {
        s.historyLoading = false;
        const orders = Array.isArray(a.payload.orders) ? a.payload.orders : [];
        if (a.payload.skip === 0) {
          s.orderHistory = orders;
        } else {
          s.orderHistory = [...s.orderHistory, ...orders];
        }
        s.historyHasMore = orders.length === a.payload.take;
      })
      .addCase(fetchOrderHistoryThunk.rejected, (s) => {
        s.historyLoading = false;
      })
      .addCase(fetchHeatmapThunk.fulfilled, (state, action) => {
        state.heatmap = action.payload;
      })
      .addCase(fetchLocationThunk.fulfilled, (state, action) => {
        state.locationCoords = action.payload;
      })
      .addCase(fetchEarningsThunk.fulfilled, (state, action) => {
        state.earnings = action.payload;
      })
      .addCase(updateDriverStatusThunk.fulfilled, (state, action) => {
        state.status = action.payload;
      })
      .addCase(updateLocationThunk.fulfilled, (state, action) => {
        state.locationCoords = action.payload;
      })
      .addCase(optimizeRouteThunk.fulfilled, (state, action) => {
        state.route = action.payload;
      })
      .addCase(respondOrderThunk.pending, s => { s.actionLoading = true; })
      .addCase(respondOrderThunk.fulfilled, (s, a) => {
        s.actionLoading = false;
        // Nếu accepted, chuyển sang activeOrders
        const payload = a.payload as Order;
        const isAccepted = a.meta?.arg?.action === "accepted" || (payload && ["accepted", "preparing", "ready"].includes(payload.status));
        if (payload && isAccepted) {
          s.activeOrders = [payload, ...s.activeOrders];
        }
        const targetId = payload?.id || a.meta?.arg?.orderId;
        s.availableOrders = s.availableOrders.filter(o => o.id !== targetId);
      })
      .addCase(respondOrderThunk.rejected, s => { s.actionLoading = false; })
  },
});

export const { setRoute, setDriverStatus, clearHistory, upsertAvailableOrder } = driverSlice.actions;
export default driverSlice.reducer;
