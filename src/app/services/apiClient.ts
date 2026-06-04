import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';
import type { RefreshTokenResponse } from '../types/auth';

const API_URL = (import.meta.env.VITE_API_URL || "https://gout-atop-protract.ngrok-free.dev") + "/api";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    'ngrok-skip-browser-warning': 'true'
  },
});

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _skipForbiddenRedirect?: boolean;
};

const publicClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    'ngrok-skip-browser-warning': 'true'
  },
});

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

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async () => {
  const { refreshToken, user, clearAuth, setAuth } = useAuthStore.getState();

  if (!refreshToken) {
    clearAuth();
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = publicClient
      .post("/v1/auth/refresh-token", { refreshToken })
      .then((response) => {
        const payload = unwrapResponse<RefreshTokenResponse>(response.data);
        setAuth({
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken ?? refreshToken,
          user: payload.user ?? user ?? undefined,
        });
        return payload.accessToken;
      })
      .catch(() => {
        clearAuth();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url ?? "";

    if (status === 401 && originalRequest && !originalRequest._retry && !requestUrl.includes("/auth/refresh-token")) {
      originalRequest._retry = true;
      const nextAccessToken = await refreshAccessToken();

      if (nextAccessToken) {
        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
        return apiClient(originalRequest);
      }
    }

    if (status === 401) {
      if (requestUrl.includes('/cancel')) {
        return Promise.reject(error);
      }
      useAuthStore.getState().clearAuth();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    if (status === 403 && window.location.pathname !== "/403") {
      // Chỉ redirect khi request không tự xử lý lỗi 403
      const skipRedirect = originalRequest?._skipForbiddenRedirect;
      if (!skipRedirect) {
        window.location.assign("/403");
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
