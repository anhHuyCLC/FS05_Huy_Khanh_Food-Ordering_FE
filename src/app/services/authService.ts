import apiClient from "./apiClient"
import type { AuthResponse, RefreshTokenResponse, RegisterPayload, User } from "../types/auth";

const unwrapResponse = <T>(payload: unknown): T => {
    if (
        payload &&
        typeof payload === "object" &&
        "data" in payload &&
        (payload as { data?: unknown }).data
    ) {
        return (payload as { data: T }).data;
    }

    return payload as T;
};

export const login = async (email: string, password: string) => {
    const response = await apiClient.post("/v1/auth/login", {email, password})
    return unwrapResponse<AuthResponse>(response.data)
}

export const register = async (payload: RegisterPayload) => {
    const response = await apiClient.post("/v1/auth/register", payload)
    return response.data
}

export const verifyGoogleIdToken = async (idToken: string) => {
    const response = await apiClient.post("/v1/auth/google/verify", { idToken })
    return unwrapResponse<AuthResponse>(response.data)
}

export const exchangeGoogleCode = async (code: string) => {
    const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/google/callback`;
    const response = await apiClient.post("/v1/auth/google/callback", { code, redirectUri })
    return unwrapResponse<AuthResponse>(response.data)
}

export const refreshAccessToken = async (refreshToken: string) => {
    const response = await apiClient.post("/v1/auth/refresh-token", { refreshToken })
    return unwrapResponse<RefreshTokenResponse>(response.data)
}

export const getMe = async () => {
    try {
        const response = await apiClient.get("/auth/me")
        return unwrapResponse<User>(response.data)
    } catch (error: any) {
        if (error.response?.status !== 404) {
            throw error
        }

        const response = await apiClient.get("/v1/auth/me")
        return unwrapResponse<User>(response.data)
    }
}
