import { createAsyncThunk } from "@reduxjs/toolkit";
import { mapService, type RouteData } from "../services/mapService";
import type { AddressInfo, RouteState } from "./mapTypes";

// Helper to wrap Geolocation API in a Promise
const getCurrentPositionPromise = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Trình duyệt không hỗ trợ định vị GPS."));
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
};

// 1. Detect current geolocation and reverse geocode it
export const detectCurrentLocation = createAsyncThunk(
  "map/detectCurrentLocation",
  async (_, { rejectWithValue }) => {
    try {
      const position = await getCurrentPositionPromise();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      // Reverse geocode to get formatted address text
      const address = await mapService.reverseGeocode(lat, lng);
      
      const addressInfo: AddressInfo = {
        address,
        lat,
        lng,
      };

      return {
        coords: { lat, lng },
        addressInfo,
      };
    } catch (error: unknown) {
      const geoErr = error as Partial<GeolocationPositionError> & Partial<Error>;
      const msg = geoErr.code === 1
        ? "Quyền truy cập vị trí bị từ chối."
        : geoErr.message || "Không thể tự động xác định vị trí của bạn.";
      return rejectWithValue(msg);
    }
  }
);

// 2. Fetch autocomplete suggestions from backend proxy
export const fetchAutocompleteSuggestions = createAsyncThunk(
  "map/fetchAutocompleteSuggestions",
  async (q: string, { rejectWithValue }) => {
    try {
      if (!q.trim()) return [];
      const suggestions = await mapService.autocomplete(q);
      return suggestions.map((item) => ({
        address: item.address,
        lat: item.latitude,
        lng: item.longitude,
      }));
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(e.response?.data?.message || "Lấy danh sách gợi ý địa chỉ thất bại.");
    }
  }
);

// 3. Reverse geocode a latitude and longitude to get details
export const reverseGeocodeCoords = createAsyncThunk(
  "map/reverseGeocodeCoords",
  async ({ lat, lng }: { lat: number; lng: number }, { rejectWithValue }) => {
    try {
      const address = await mapService.reverseGeocode(lat, lng);
      return {
        address,
        lat,
        lng,
      } as AddressInfo;
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(e.response?.data?.message || "Không thể lấy địa chỉ từ tọa độ.");
    }
  }
);

// 4. Fetch route details, distance, ETA and shipping fee
export const fetchRouteInfo = createAsyncThunk(
  "map/fetchRouteInfo",
  async (
    {
      startLat,
      startLon,
      endLat,
      endLon,
    }: {
      startLat: number;
      startLon: number;
      endLat: number;
      endLon: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const data: RouteData = await mapService.getRoute(startLat, startLon, endLat, endLon);
      
      // ETA calculation: driving duration in minutes + 15 minutes preparation buffer
      const eta = Math.ceil(data.duration / 60) + 15;

      const routeState: RouteState = {
        coordinates: data.coordinates,
        distance: data.distance,
        duration: data.duration,
        eta: eta,
        shippingFee: data.shippingFee,
      };

      return routeState;
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(
        e.response?.data?.message || "Không thể tính toán đường đi giao hàng."
      );
    }
  }
);
