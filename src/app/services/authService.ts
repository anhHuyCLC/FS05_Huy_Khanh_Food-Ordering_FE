import apiClient from "./apiClient"

export const login = async (email: string, password: string) => {
    const response = await apiClient.post("/auth/login", {email, password})
    return response.data
}

export const register = async (firstname: string, middlename: string, lastname: string,avatarlink: string, email: string, password: string) => {
    const response = await apiClient.post("/auth/register", { firstname, middlename, lastname, avatarlink, email, password })
    return response.data
}

export const loginWithGoogle = async (token: string) => {
    const response = await apiClient.post("/auth/google", { token })
    return response.data
}

/**
 * Verify Google ID token and get access/refresh tokens
 * Used when frontend receives ID token from Google SDK
 */
export const verifyGoogleIdToken = async (idToken: string) => {
    const response = await apiClient.post("/v1/auth/google/verify", { idToken })
    return response.data
}

/**
 * Exchange Google authorization code for tokens
 * Used in OAuth callback flow (Frontend initiated)
 */
export const exchangeGoogleCode = async (code: string) => {
    const response = await apiClient.post("/v1/auth/google/callback", { code })
    return response.data
}

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (refreshToken: string) => {
    const response = await apiClient.post("/v1/auth/refresh-token", { refreshToken })
    return response.data
}