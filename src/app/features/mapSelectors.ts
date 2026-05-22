import type { RootState } from "../stores/store";

export const selectMapState = (state: RootState) => state.map;

export const selectUserLocation = (state: RootState) => state.map.userLocation;

export const selectSelectedAddress = (state: RootState) => state.map.selectedAddress;

export const selectRestaurantLocation = (state: RootState) => state.map.restaurantLocation;

export const selectRoute = (state: RootState) => state.map.route;

export const selectAutocompleteSuggestions = (state: RootState) => state.map.autocompleteSuggestions;

export const selectMapLoading = (state: RootState) => state.map.loading;

export const selectMapError = (state: RootState) => state.map.error;
