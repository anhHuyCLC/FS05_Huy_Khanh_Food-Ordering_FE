import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthResponse, User } from "../types/auth";

interface AuthStoreState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setAuth: (auth: Partial<AuthResponse> & { accessToken: string }) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
  clearAuth: () => void;
}

const AUTH_STORAGE_KEY = "auth";

const readLegacyUser = (): User | null => {
  if (typeof window === "undefined") return null;

  try {
    const storedUser = window.localStorage.getItem("user");
    return storedUser && storedUser !== "undefined" ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

const getLegacyAuth = () => {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null, user: null };
  }

  return {
    accessToken: window.localStorage.getItem("token"),
    refreshToken: window.localStorage.getItem("refreshToken"),
    user: readLegacyUser(),
  };
};

const persistLegacyAuth = (state: Pick<AuthStoreState, "accessToken" | "refreshToken" | "user">) => {
  if (typeof window === "undefined") return;

  if (state.accessToken) {
    window.localStorage.setItem("token", state.accessToken);
  } else {
    window.localStorage.removeItem("token");
  }

  if (state.refreshToken) {
    window.localStorage.setItem("refreshToken", state.refreshToken);
  } else {
    window.localStorage.removeItem("refreshToken");
  }

  if (state.user) {
    window.localStorage.setItem("user", JSON.stringify(state.user));
  } else {
    window.localStorage.removeItem("user");
  }
};

const clearLegacyAuth = () => {
  persistLegacyAuth({ accessToken: null, refreshToken: null, user: null });
};

const legacyAuth = getLegacyAuth();

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set, get) => ({
      accessToken: legacyAuth.accessToken,
      refreshToken: legacyAuth.refreshToken,
      user: legacyAuth.user,
      setAuth: (auth) => {
        const nextState = {
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken ?? get().refreshToken,
          user: auth.user ?? get().user,
        };

        persistLegacyAuth(nextState);
        set(nextState);
      },
      setUser: (user) => {
        const nextState = { ...get(), user };
        persistLegacyAuth(nextState);
        set({ user });
      },
      logout: () => {
        clearLegacyAuth();
        set({ accessToken: null, refreshToken: null, user: null });
      },
      clearAuth: () => {
        clearLegacyAuth();
        set({ accessToken: null, refreshToken: null, user: null });
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
);
