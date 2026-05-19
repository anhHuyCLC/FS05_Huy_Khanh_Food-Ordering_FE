import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { usePermissions } from "../../hooks/usePermissions";
import { useAuthStore } from "../../stores/authStore";
import type { PermissionCode } from "../../types/auth";

interface ProtectedRouteProps {
  children?: ReactNode;
  permission?: PermissionCode;
  requiredPermission?: PermissionCode;
  anyPermissions?: PermissionCode[];
  allPermissions?: PermissionCode[];
}

export function ProtectedRoute({
  children,
  permission,
  requiredPermission,
  anyPermissions,
  allPermissions,
}: ProtectedRouteProps) {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  if (!accessToken || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const required = requiredPermission ?? permission;
  const allowed =
    (!required || hasPermission(required)) &&
    (!anyPermissions || hasAnyPermission(anyPermissions)) &&
    (!allPermissions || hasAllPermissions(allPermissions));

  if (!allowed) {
    return <Navigate to="/403" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
