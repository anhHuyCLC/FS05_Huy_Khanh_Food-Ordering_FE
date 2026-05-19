import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { listRestaurants } from "../services/restaurantService";

export interface RestaurantCategory {
    id: string;
    name: string;
    sortOrder: number;
}

export interface RestaurantOwner {
    id: string;
    fullName: string;
    avatarUrl: string | null;
}

export interface MenuItem {
    id: string;
    name: string;
    description: string;
    basePrice: string;
    imageUrl: string;
}

export interface Restaurant {
    id: string;
    name: string;
    description: string | null;
    address: string | null;
    latitude: string | null;
    longitude: string | null;
    rating: string | null;
    isActive: boolean;
    createdAt: string;
    owner: RestaurantOwner | null;
    categories: RestaurantCategory[];
    menuItems: MenuItem[];
}

interface RestaurantState {
    restaurants: Restaurant[];
    loading: boolean;
    error: string | null;
}

const initialState: RestaurantState = {
    restaurants: [],
    loading: false,
    error: null,
};

export const fetchRestaurants = createAsyncThunk(
    "restaurants/list",
    async (_, {rejectWithValue}) => {
        try{
            const response = await listRestaurants();
            return response as Restaurant[];
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || "Lấy danh sách nhà hàng thất bại.";
            return rejectWithValue(message);
        }
    }
)

const restaurantSlice = createSlice({
    name: "restaurants",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchRestaurants.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchRestaurants.fulfilled, (state, action) => {
                state.loading = false;
                state.restaurants = action.payload;
            })
            .addCase(fetchRestaurants.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default restaurantSlice.reducer;
export { fetchRestaurants as listRestaurant };
