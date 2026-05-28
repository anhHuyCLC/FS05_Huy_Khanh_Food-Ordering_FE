import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
// import { PayloadAction } from "@reduxjs/toolkit";
import {
  getMyOrders, getOrder, createOrder, cancelOrder, updateOrderStatus,
  getRestaurantOrdersPaginated, getOrderHistory,checkPromotion, getPromotions,submitReview,
} from "../services/orderService";
import type {
  Order, OrderStatusHistory, OrderMeta,CreateOrderInput, OrderMetaCreateOrderInput, CancelOrderInput, UpdateOrderStatusInput, Promotion,

} from "../types/order";

// ─── State ────────────────────────────────────────────────────────────────────

interface OrderState {
  myOrders:         Order[];
  restaurantOrders: Order[];
  currentOrder:     Order | null;
  orderHistory:     OrderStatusHistory[];
  meta:             OrderMeta | null;
  loading:          boolean;
  actionLoading:    boolean;   // accept/reject/status update
  error:            string | null;
}

const initialState: OrderState = {
  myOrders:         [],
  restaurantOrders: [],
  currentOrder:     null,
  orderHistory:     [],
  meta:             null,
  loading:          false,
  actionLoading:    false,
  error:            null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchMyOrders = createAsyncThunk<
  Order[],
  void,
  { rejectValue: string }
>(
  "orders/fetchMine",
  async (_, { rejectWithValue }) => {
    try {
      return await getMyOrders();
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.message ?? e.message
      );
    }
  }
);

export const fetchOrder = createAsyncThunk<
  Order,
  string,
  { rejectValue: string }
>(
  "orders/fetchOne",
  async (orderId: string, { rejectWithValue }) => {
    try { return await getOrder(orderId); }
    catch (e: any) { return rejectWithValue(e.response?.data?.message ?? e.message); }
  }
);

export const placeOrder = createAsyncThunk<
  Order,
  CreateOrderInput,
  { rejectValue: string }
>(
  "orders/create",
  async (data: CreateOrderInput, { rejectWithValue }) => {
    try { return await createOrder(data); }
    catch (e: any) { return rejectWithValue(e.response?.data?.message ?? e.message); }
  }
);

export const cancelMyOrder = createAsyncThunk<
  Order,
  { orderId: string; data: CancelOrderInput },
  { rejectValue: string }
>(
  "orders/cancel",
  async ({ orderId, data }: { orderId: string; data: CancelOrderInput }, { rejectWithValue }) => {
    try { return await cancelOrder(orderId, data); }
    catch (e: any) { return rejectWithValue(e.response?.data?.message ?? e.message); }
  }
);

export const changeOrderStatus = createAsyncThunk<
  Order,
  { orderId: string; data: UpdateOrderStatusInput },
  { rejectValue: string }
>(
  "orders/updateStatus",
  async ({ orderId, data }: { orderId: string; data: UpdateOrderStatusInput }, { rejectWithValue }) => {
    try { return await updateOrderStatus(orderId, data); }
    catch (e: any) { return rejectWithValue(e.response?.data?.message ?? e.message); }
  }
);

export const fetchRestaurantOrders = createAsyncThunk<
  { items: Order[]; meta: OrderMeta },
  { restaurantId: string; params?: { status?: string; page?: number; limit?: number } },
  { rejectValue: string }
>(
  "orders/fetchForRestaurant",
  async ({ restaurantId, params }: { restaurantId: string; params?: { status?: string; page?: number; limit?: number } }, { rejectWithValue }) => {
    try { return await getRestaurantOrdersPaginated(restaurantId, params); }
    catch (e: any) { return rejectWithValue(e.response?.data?.message ?? e.message); }
  }
);

export const fetchOrderHistory = createAsyncThunk<
  OrderStatusHistory[],
  string,
  { rejectValue: string }
>(
  "orders/fetchHistory",
  async (orderId: string, { rejectWithValue }) => {
    try { return await getOrderHistory(orderId); }
    catch (e: any) { return rejectWithValue(e.response?.data?.message ?? e.message); }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    clearCurrentOrder: (s) => { s.currentOrder = null; },
    clearError:        (s) => { s.error = null; },
    // Real-time update từ socket
    upsertRestaurantOrder: (s, a:PayloadAction<Order>) => {
      const idx = s.restaurantOrders.findIndex(o => o.id === a.payload.id);
      if (idx !== -1) s.restaurantOrders[idx] = a.payload;
      else s.restaurantOrders.unshift(a.payload);
    },
  },
  extraReducers: (builder) => {
    // fetchMyOrders
    builder
      .addCase(fetchMyOrders.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchMyOrders.fulfilled, (s, a) => { s.loading = false; s.myOrders = a.payload; })
      .addCase(fetchMyOrders.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; });

    // fetchOrder
    builder
      .addCase(fetchOrder.pending,   (s) => { s.loading = true; })
      .addCase(fetchOrder.fulfilled, (s, a) => { s.loading = false; s.currentOrder = a.payload; })
      .addCase(fetchOrder.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; });

    // placeOrder
    builder
      .addCase(placeOrder.pending,   (s) => { s.actionLoading = true; })
      .addCase(placeOrder.fulfilled, (s, a) => {
        s.actionLoading = false;
        s.currentOrder = a.payload;
        s.myOrders.unshift(a.payload);
      })
      .addCase(placeOrder.rejected,  (s, a) => { s.actionLoading = false; s.error = a.payload as string; });

    // cancelMyOrder
    builder
      .addCase(cancelMyOrder.fulfilled, (s, a) => {
        s.currentOrder = a.payload;
        const idx = s.myOrders.findIndex(o => o.id === a.payload.id);
        if (idx !== -1) s.myOrders[idx] = a.payload;
      });

    // changeOrderStatus
    builder
      .addCase(changeOrderStatus.pending,   (s) => { s.actionLoading = true; })
      .addCase(changeOrderStatus.fulfilled, (s, a) => {
        s.actionLoading = false;
        // Update trong restaurantOrders list
        const idx = s.restaurantOrders.findIndex(o => o.id === a.payload.id);
        if (idx !== -1) s.restaurantOrders[idx] = a.payload;
        if (s.currentOrder?.id === a.payload.id) s.currentOrder = a.payload;
      })
      .addCase(changeOrderStatus.rejected,  (s, a) => { s.actionLoading = false; s.error = a.payload as string; });

    // fetchRestaurantOrders
    builder
      .addCase(fetchRestaurantOrders.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchRestaurantOrders.fulfilled, (s, a) => {
        s.loading = false;
        s.restaurantOrders = a.payload.items;
        s.meta = a.payload.meta;
      })
      .addCase(fetchRestaurantOrders.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; });

    // fetchOrderHistory
    builder
      .addCase(fetchOrderHistory.fulfilled, (s, a) => { s.orderHistory = a.payload; });
  },
});

export const { clearCurrentOrder, clearError, upsertRestaurantOrder } = orderSlice.actions;
export default orderSlice.reducer;