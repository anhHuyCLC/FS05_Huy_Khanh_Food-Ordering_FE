import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
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
  heatmap: HeatmapItem[];
  route: RouteItem[];
  earnings: Earnings | null;
  locationCoords: { latitude: number; longitude: number } | null;
  loading: boolean;
  error: string | null;
}

const initialState: DriverState = {
  profile: null,
  status: "offline",
  availableOrders: [],
  activeOrders: [],
  heatmap: [],
  route: [],
  earnings: null,
  locationCoords: null,
  loading: false,
  error: null,
};

export const loadDriverDashboard = createAsyncThunk(
  "driver/loadDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const locationPromise = getMyLocation()
        .then((res) => res.data)
        .catch(() => null);

      const [profileRes, availableRes, activeRes, heatmapRes, locationCoords, earningsRes] = await Promise.all([
        getDriverProfile(),
        getAvailableOrders(),
        getActiveOrders(),
        getDemandHeatmap(),
        locationPromise,
        getEarningsService("week"),
      ]);

      return {
        profile: profileRes.data,
        availableOrders: availableRes.data,
        activeOrders: activeRes.data,
        heatmap: heatmapRes.data,
        locationCoords,
        earnings: earningsRes.data,
      };
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || " Không thể tải dữ liệu tài xế.");
    }
  }
);

export const fetchAvailableOrdersThunk = createAsyncThunk(
  "driver/fetchAvailableOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAvailableOrders();
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || "Không thể tải đơn chờ.");
    }
  }
);

export const fetchActiveOrdersThunk = createAsyncThunk(
  "driver/fetchActiveOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getActiveOrders();
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || "Không thể tải đơn đang giao.");
    }
  }
);

export const fetchHeatmapThunk = createAsyncThunk(
  "driver/fetchHeatmap",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getDemandHeatmap();
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || "Không thể tải heatmap.");
    }
  }
);

export const fetchLocationThunk = createAsyncThunk(
  "driver/fetchLocation",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMyLocation();
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || "Không thể lấy vị trí tài xế.");
    }
  }
);

export const fetchEarningsThunk = createAsyncThunk(
  "driver/fetchEarnings",
  async (period: EarningsPeriod | undefined, { rejectWithValue }) => {
    try {
      const response = await getEarningsService(period);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || "Không thể tải thu nhập.");
    }
  }
);

export const updateDriverStatusThunk = createAsyncThunk(
  "driver/updateStatus",
  async (status: DriverStatus, { rejectWithValue }) => {
    try {
      await updateDriverStatusService(status);
      return status;
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || "Không thể cập nhật trạng thái.");
    }
  }
);

export const respondOrderThunk = createAsyncThunk(
  "driver/respondOrder",
  async (
    payload: { orderId: string; action: "accepted" | "rejected" },
    { rejectWithValue }
  ) => {
    try {
      const response = await respondOrderService(payload.orderId, payload.action);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || "Không thể xử lý yêu cầu đơn.");
    }
  }
);

export const updateDeliveryStatusThunk = createAsyncThunk(
  "driver/updateDeliveryStatus",
  async (
    payload: { orderId: string; status: DeliveryStatus },
    { rejectWithValue }
  ) => {
    try {
      await updateDeliveryStatusService(payload.orderId, payload.status);
      return payload;
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || "Không thể cập nhật trạng thái giao.");
    }
  }
);

export const updateLocationThunk = createAsyncThunk(
  "driver/updateLocation",
  async (
    payload: { latitude: number; longitude: number },
    { rejectWithValue }
  ) => {
    try {
      await updateLocationService(payload.latitude, payload.longitude);
      return payload;
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || "Không thể cập nhật vị trí.");
    }
  }
);

export const optimizeRouteThunk = createAsyncThunk(
  "driver/optimizeRoute",
  async (orderIds: string[], { rejectWithValue }) => {
    try {
      const response = await optimizeRouteService(orderIds);
      return response.data.route;
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || "Không thể tối ưu lộ trình.");
    }
  }
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
        state.status = action.payload.profile.currentStatus;
        state.availableOrders = action.payload.availableOrders;
        state.activeOrders = action.payload.activeOrders;
        state.heatmap = action.payload.heatmap;
        state.locationCoords = action.payload.locationCoords;
        state.earnings = action.payload.earnings;
      })
      .addCase(loadDriverDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAvailableOrdersThunk.fulfilled, (state, action) => {
        state.availableOrders = action.payload;
      })
      .addCase(fetchActiveOrdersThunk.fulfilled, (state, action) => {
        state.activeOrders = action.payload;
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
      });
  },
});

export const { setRoute, setDriverStatus } = driverSlice.actions;
export default driverSlice.reducer;
