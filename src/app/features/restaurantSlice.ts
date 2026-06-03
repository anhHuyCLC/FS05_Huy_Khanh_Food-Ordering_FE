import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
    listRestaurants,
    getMyRestaurant,
    getMenuItems,
    listPromotions,
    createMenuItem,
    updateMenuItem,
    toggleMenuItemAvailability,
    deleteMenuItem,
    createPromotion,
    updatePromotion,
    deletePromotion,
} from "../services/restaurantService";
import type {
    Restaurant, MenuItem, Promotion,
    CreateMenuItemInput, UpdateMenuItemInput,
    CreatePromotionInput, UpdatePromotionInput,
    ToggleAvailabilityInput,
} from "../types/restaurant";

// ─── State ────────────────────────────────────────────────────────────────────

interface RestaurantState {
    // public list (customer)
    restaurants: Restaurant[];
    // owner's own restaurant
    myRestaurant: Restaurant | null;
    menuItems: MenuItem[];
    promotions: Promotion[];
    // loading flags
    loading: boolean;
    menuLoading: boolean;
    promoLoading: boolean;
    // errors
    error: string | null;
    menuError: string | null;
    promoError: string | null;
}

const initialState: RestaurantState = {
    restaurants: [],
    myRestaurant: null,
    menuItems: [],
    promotions: [],
    loading: false,
    menuLoading: false,
    promoLoading: false,
    error: null,
    menuError: null,
    promoError: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

/** Danh sách nhà hàng public */
export const fetchRestaurants = createAsyncThunk(
    "restaurants/fetchAll",
    async (_, { rejectWithValue }) => {
        try { return await listRestaurants(); }
        catch (e) { return rejectWithValue((e as any).response?.data?.message ?? (e as any).message); }
    }
);

/** Nhà hàng của owner đang đăng nhập */
export const fetchMyRestaurant = createAsyncThunk(
    "restaurants/fetchMine",
    async (_, { rejectWithValue }) => {
        try { return await getMyRestaurant(); }
        catch (e) { return rejectWithValue((e as any).response?.data?.message ?? (e as any).message); }
    }
);

/** Lấy menu của nhà hàng */
export const fetchMenuItems = createAsyncThunk(
    "restaurants/fetchMenuItems",
    async (restaurantId: string, { rejectWithValue }) => {
        try { return await getMenuItems(restaurantId); }
        catch (e) { return rejectWithValue((e as any).response?.data?.message ?? (e as any).message); }
    }
);

/** Thêm món */
export const addMenuItem = createAsyncThunk(
    "restaurants/addMenuItem",
    async ({ restaurantId, data }: { restaurantId: string; data: CreateMenuItemInput }, { rejectWithValue }) => {
        try { return await createMenuItem(restaurantId, data); }
        catch (e) { return rejectWithValue((e as any).response?.data?.message ?? (e as any).message); }
    }
);

/** Cập nhật món */
export const editMenuItem = createAsyncThunk(
    "restaurants/editMenuItem",
    async ({ menuItemId, data }: { menuItemId: string; data: UpdateMenuItemInput }, { rejectWithValue }) => {
        try { return await updateMenuItem(menuItemId, data); }
        catch (e) { return rejectWithValue((e as any).response?.data?.message ?? (e as any).message); }
    }
);

/** Ẩn/Hiện món */
export const toggleMenuItem = createAsyncThunk(
    "restaurants/toggleMenuItem",
    async ({ menuItemId, input }: { menuItemId: string; input: ToggleAvailabilityInput }, { rejectWithValue }) => {
        try { return await toggleMenuItemAvailability(menuItemId, input.isAvailable, input.reason); }
        catch (e) { return rejectWithValue((e as any).response?.data?.message ?? (e as any).message); }
    }
);

/** Xóa món */
export const removeMenuItem = createAsyncThunk(
    "restaurants/removeMenuItem",
    async (menuItemId: string, { rejectWithValue }) => {
        try { await deleteMenuItem(menuItemId); return menuItemId; }
        catch (e) { return rejectWithValue((e as any).response?.data?.message ?? (e as any).message); }
    }
);

/** Lấy danh sách khuyến mãi */
export const fetchPromotions = createAsyncThunk(
    "restaurants/fetchPromotions",
    async (restaurantId: string, { rejectWithValue }) => {
        try { return await listPromotions(restaurantId); }
        catch (e) { return rejectWithValue((e as any).response?.data?.message ?? (e as any).message); }
    }
);

/** Tạo khuyến mãi */
export const addPromotion = createAsyncThunk(
    "restaurants/addPromotion",
    async ({ restaurantId, data }: { restaurantId: string; data: CreatePromotionInput }, { rejectWithValue }) => {
        try { return await createPromotion(restaurantId, data); }
        catch (e) { return rejectWithValue((e as any).response?.data?.message ?? (e as any).message); }
    }
);

/** Cập nhật khuyến mãi */
export const editPromotion = createAsyncThunk(
    "restaurants/editPromotion",
    async ({ promotionId, data }: { promotionId: string; data: UpdatePromotionInput }, { rejectWithValue }) => {
        try { return await updatePromotion(promotionId, data); }
        catch (e) { return rejectWithValue((e as any).response?.data?.message ?? (e as any).message); }
    }
);

/** Xóa khuyến mãi */
export const removePromotion = createAsyncThunk(
    "restaurants/removePromotion",
    async (promotionId: string, { rejectWithValue }) => {
        try { await deletePromotion(promotionId); return promotionId; }
        catch (e) { return rejectWithValue((e as any).response?.data?.message ?? (e as any).message); }
    }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const restaurantSlice = createSlice({
    name: "restaurants",
    initialState,
    reducers: {
        clearErrors: (state) => {
            state.error = null;
            state.menuError = null;
            state.promoError = null;
        },
        clearMyRestaurant: (state) => {
            state.myRestaurant = null;
            state.menuItems = [];
            state.promotions = [];
        },
    },
    extraReducers: (builder) => {
        // fetchRestaurants
        builder
            .addCase(fetchRestaurants.pending, (s) => { s.loading = true; s.error = null; })
            .addCase(fetchRestaurants.fulfilled, (s, a) => { s.loading = false; s.restaurants = a.payload; })
            .addCase(fetchRestaurants.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; });

        // fetchMyRestaurant
        builder
            .addCase(fetchMyRestaurant.pending, (s) => { s.loading = true; s.error = null; })
            .addCase(fetchMyRestaurant.fulfilled, (s, a) => { s.loading = false; s.myRestaurant = a.payload; })
            .addCase(fetchMyRestaurant.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; });

        // fetchMenuItems
        builder
            .addCase(fetchMenuItems.pending, (s) => { s.menuLoading = true; s.menuError = null; })
            .addCase(fetchMenuItems.fulfilled, (s, a) => { s.menuLoading = false; s.menuItems = a.payload; })
            .addCase(fetchMenuItems.rejected, (s, a) => { s.menuLoading = false; s.menuError = a.payload as string; });

        // addMenuItem
        builder
            .addCase(addMenuItem.pending, (s) => { s.menuLoading = true; })
            .addCase(addMenuItem.fulfilled, (s, a) => { s.menuLoading = false; s.menuItems.unshift(a.payload); })
            .addCase(addMenuItem.rejected, (s, a) => { s.menuLoading = false; s.menuError = a.payload as string; });

        // editMenuItem
        builder
            .addCase(editMenuItem.fulfilled, (s, a) => {
                const idx = s.menuItems.findIndex(m => m.id === a.payload.id);
                if (idx !== -1) s.menuItems[idx] = a.payload;
            });

        // toggleMenuItem
        builder
            .addCase(toggleMenuItem.fulfilled, (s, a) => {
                const idx = s.menuItems.findIndex(m => m.id === a.payload.id);
                if (idx !== -1) s.menuItems[idx] = { ...s.menuItems[idx], isAvailable: a.payload.isAvailable };
            });

        // removeMenuItem
        builder
            .addCase(removeMenuItem.fulfilled, (s, a) => {
                s.menuItems = s.menuItems.filter(m => m.id !== a.payload);
            });

        // fetchPromotions
        builder
            .addCase(fetchPromotions.pending, (s) => { s.promoLoading = true; s.promoError = null; })
            .addCase(fetchPromotions.fulfilled, (s, a) => { s.promoLoading = false; s.promotions = a.payload; })
            .addCase(fetchPromotions.rejected, (s, a) => { s.promoLoading = false; s.promoError = a.payload as string; });

        // addPromotion
        builder
            .addCase(addPromotion.fulfilled, (s, a) => { s.promotions.unshift(a.payload); });

        // editPromotion
        builder
            .addCase(editPromotion.fulfilled, (s, a) => {
                const idx = s.promotions.findIndex(p => p.id === a.payload.id);
                if (idx !== -1) s.promotions[idx] = a.payload;
            });

        // removePromotion
        builder
            .addCase(removePromotion.fulfilled, (s, a) => {
                s.promotions = s.promotions.filter(p => p.id !== a.payload);
            });
    },
});

export const { clearErrors, clearMyRestaurant } = restaurantSlice.actions;
export default restaurantSlice.reducer;

// Backward compat alias
export { fetchRestaurants as listRestaurant };