import apiClient from "./apiClient"

export const listRestaurants = async () => {
    const response = await apiClient.get("/v1/restaurant/list");
    return Array.isArray(response.data) ? response.data : response.data.data;
}
