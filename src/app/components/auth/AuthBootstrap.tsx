import { useEffect, useState, type ReactNode } from "react";
import { useAuthActions } from "../../hooks/useAuth";
import { useAuthStore } from "../../stores/authStore";
import { useCartStore } from "../../stores/cartStore";
import { useFavoriteStore } from "../../stores/favoriteStore";

interface AuthBootstrapProps {
  children: ReactNode;
}

export function AuthBootstrap({ children }: AuthBootstrapProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const syncUser = useCartStore((state) => state.syncUser);
  const { syncMe } = useAuthActions();
  const [ready, setReady] = useState(!accessToken);

  // Đồng bộ giỏ hàng mỗi khi user thay đổi (đăng nhập / logout / đổi tài khoản)
  useEffect(() => {
    const sync = async () => {
      await syncUser(userId);
    };
    sync();
  }, [userId, syncUser]);

  // Đồng bộ danh sách yêu thích mỗi khi user thay đổi (đăng nhập / logout / đổi tài khoản)
  useEffect(() => {
    if (userId) {
      useFavoriteStore.getState().fetchFavorites();
    } else {
      useFavoriteStore.getState().clearFavorites();
    }
  }, [userId]);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      if (!accessToken) {
        setReady(true);
        return;
      }

      setReady(false);

      try {
        await syncMe();
      } catch {
        clearAuth();
      } finally {
        if (active) {
          setReady(true);
        }
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, [accessToken, clearAuth, syncMe]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">
        Loading session...
      </div>
    );
  }

  return <>{children}</>;
}
