import { useCallback } from "react";
import * as authService from "../services/authService";
import { useAuthStore } from "../stores/authStore";
import type { LoginPayload, RegisterPayload } from "../types/auth";

export function useAuth() {
  return useAuthStore();
}

export function useAuthActions() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const auth = await authService.login(payload.email, payload.password);
      setAuth(auth);
      return auth;
    },
    [setAuth],
  );

  const register = useCallback(
    (payload: RegisterPayload) => authService.register(payload),
    [],
  );

  const loginWithGoogleIdToken = useCallback(
    async (idToken: string) => {
      const auth = await authService.verifyGoogleIdToken(idToken);
      setAuth(auth);
      return auth;
    },
    [setAuth],
  );

  const loginWithGoogleCode = useCallback(
    async (code: string) => {
      const auth = await authService.exchangeGoogleCode(code);
      setAuth(auth);
      return auth;
    },
    [setAuth],
  );

  const syncMe = useCallback(async () => {
    const user = await authService.getMe();
    setUser(user);
    return user;
  }, [setUser]);

  return {
    login,
    register,
    loginWithGoogleIdToken,
    loginWithGoogleCode,
    syncMe,
    clearAuth,
  };
}
