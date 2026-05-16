import apiClient from "./apiClient"

export const login = async (email: string, password: string) => {
    const response = await apiClient.post("/auth/login", {email, password})
    return response.data
}

export const register = async (firstname: string, middlename: string, lastname: string,avatarlink: string, email: string, password: string) => {
    const response = await apiClient.post("/auth/register", { firstname, middlename, lastname, avatarlink, email, password })
    return response.data
}

// export const loginWithGoogle = async (token: string) => {
//     const response = await apiClient.post("/auth/google", { token })
//     return response.data
// }

export const verifyGoogleIdToken = async (idToken: string) => {
    const response = await apiClient.post("/v1/auth/google/verify", { idToken })
    return response.data
}

export const exchangeGoogleCode = async (code: string) => {
    const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/google/callback`;
    const response = await apiClient.post("/v1/auth/google/callback", { code, redirectUri })
    return response.data
}

export const refreshAccessToken = async (refreshToken: string) => {
    const response = await apiClient.post("/v1/auth/refresh-token", { refreshToken })
    return response.data
}