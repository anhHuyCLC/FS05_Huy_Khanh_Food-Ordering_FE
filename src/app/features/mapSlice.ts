import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  detectCurrentLocation,
  fetchAutocompleteSuggestions,
  reverseGeocodeCoords,
  fetchRouteInfo,
} from "./mapThunk";
import type { AddressInfo, RouteState } from "./mapTypes";

export interface MapState {
  userLocation: { lat: number; lng: number } | null;
  selectedAddress: AddressInfo | null;
  restaurantLocation: { lat: number; lng: number } | null;
  route: RouteState | null;
  autocompleteSuggestions: AddressInfo[];
  loading: {
    location: boolean;
    autocomplete: boolean;
    route: boolean;
    reverseGeocode: boolean;
  };
  error: {
    location: string | null;
    autocomplete: string | null;
    route: string | null;
    reverseGeocode: string | null;
  };
}

// Load persisted address from localStorage
const getPersistedAddress = (): AddressInfo | null => {
  try {
    const saved = localStorage.getItem("selected_delivery_address");
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.error("Failed to parse persisted address:", e);
    return null;
  }
};

const initialState: MapState = {
  userLocation: null,
  selectedAddress: getPersistedAddress(),
  restaurantLocation: null,
  route: null,
  autocompleteSuggestions: [],
  loading: {
    location: false,
    autocomplete: false,
    route: false,
    reverseGeocode: false,
  },
  error: {
    location: null,
    autocomplete: null,
    route: null,
    reverseGeocode: null,
  },
};

const mapSlice = createSlice({
  name: "map",
  initialState,
  reducers: {
    setSelectedAddress(state, action: PayloadAction<AddressInfo | null>) {
      state.selectedAddress = action.payload;
      if (action.payload) {
        localStorage.setItem("selected_delivery_address", JSON.stringify(action.payload));
      } else {
        localStorage.removeItem("selected_delivery_address");
      }
    },
    setRestaurantLocation(state, action: PayloadAction<{ lat: number; lng: number } | null>) {
      state.restaurantLocation = action.payload;
      if (!action.payload) {
        state.route = null;
      }
    },
    clearRoute(state) {
      state.route = null;
    },
    clearSuggestions(state) {
      state.autocompleteSuggestions = [];
    },
  },
  extraReducers: (builder) => {
    // ─────────────────────────────────────────────────────────────
    // detectCurrentLocation Cases
    // ─────────────────────────────────────────────────────────────
    builder
      .addCase(detectCurrentLocation.pending, (state) => {
        state.loading.location = true;
        state.error.location = null;
      })
      .addCase(detectCurrentLocation.fulfilled, (state, action) => {
        state.loading.location = false;
        state.userLocation = action.payload.coords;
        state.selectedAddress = action.payload.addressInfo;
        localStorage.setItem("selected_delivery_address", JSON.stringify(action.payload.addressInfo));
      })
      .addCase(detectCurrentLocation.rejected, (state, action) => {
        state.loading.location = false;
        state.error.location = action.payload as string;
      });

    // ─────────────────────────────────────────────────────────────
    // fetchAutocompleteSuggestions Cases
    // ─────────────────────────────────────────────────────────────
    builder
      .addCase(fetchAutocompleteSuggestions.pending, (state) => {
        state.loading.autocomplete = true;
        state.error.autocomplete = null;
      })
      .addCase(fetchAutocompleteSuggestions.fulfilled, (state, action) => {
        state.loading.autocomplete = false;
        state.autocompleteSuggestions = action.payload;
      })
      .addCase(fetchAutocompleteSuggestions.rejected, (state, action) => {
        state.loading.autocomplete = false;
        state.error.autocomplete = action.payload as string;
      });

    // ─────────────────────────────────────────────────────────────
    // reverseGeocodeCoords Cases
    // ─────────────────────────────────────────────────────────────
    builder
      .addCase(reverseGeocodeCoords.pending, (state) => {
        state.loading.reverseGeocode = true;
        state.error.reverseGeocode = null;
      })
      .addCase(reverseGeocodeCoords.fulfilled, (state, action) => {
        state.loading.reverseGeocode = false;
        state.selectedAddress = action.payload;
        localStorage.setItem("selected_delivery_address", JSON.stringify(action.payload));
      })
      .addCase(reverseGeocodeCoords.rejected, (state, action) => {
        state.loading.reverseGeocode = false;
        state.error.reverseGeocode = action.payload as string;
      });

    // ─────────────────────────────────────────────────────────────
    // fetchRouteInfo Cases
    // ─────────────────────────────────────────────────────────────
    builder
      .addCase(fetchRouteInfo.pending, (state) => {
        state.loading.route = true;
        state.error.route = null;
      })
      .addCase(fetchRouteInfo.fulfilled, (state, action) => {
        state.loading.route = false;
        state.route = action.payload;
      })
      .addCase(fetchRouteInfo.rejected, (state, action) => {
        state.loading.route = false;
        state.error.route = action.payload as string;
      });
  },
});

export const {
  setSelectedAddress,
  setRestaurantLocation,
  clearRoute,
  clearSuggestions,
} = mapSlice.actions;

export default mapSlice.reducer;
