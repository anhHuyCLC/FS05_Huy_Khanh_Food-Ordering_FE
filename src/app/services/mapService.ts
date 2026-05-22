import apiClient from "./apiClient";

export interface AutocompleteSuggestion {
  address: string;
  latitude: number;
  longitude: number;
}

export interface RouteData {
  coordinates: [number, number][]; // [lat, lng]
  distance: number; // in meters
  duration: number; // in seconds
  shippingFee: number; // in VND
}

export interface DistanceData {
  distance: number; // in meters
  duration: number; // in seconds
  shippingFee: number; // in VND
}

export const mapService = {
  autocomplete: async (q: string): Promise<AutocompleteSuggestion[]> => {
    const response = await apiClient.get("/v1/maps/autocomplete", {
      params: { q },
    });
    return response.data.data || response.data || [];
  },

  geocode: async (q: string): Promise<AutocompleteSuggestion | null> => {
    const response = await apiClient.get("/v1/maps/geocode", {
      params: { q },
    });
    return response.data.data || response.data || null;
  },

  reverseGeocode: async (lat: number, lon: number): Promise<string> => {
    const response = await apiClient.get("/v1/maps/geocode", {
      params: { lat, lon },
    });
    const result = response.data.data || response.data || {};
    return result.address || `Địa chỉ tại ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  },

  getRoute: async (
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number
  ): Promise<RouteData> => {
    const response = await apiClient.post("/v1/maps/route", {
      start: { lat: startLat, lon: startLon },
      end: { lat: endLat, lon: endLon },
    });
    return response.data.data || response.data;
  },

  getDistance: async (
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number
  ): Promise<DistanceData> => {
    const response = await apiClient.get("/v1/maps/distance", {
      params: { startLat, startLon, endLat, endLon },
    });
    return response.data.data || response.data;
  },
};
