import type { ReactNode } from "react";
import { usePermissions } from "../../hooks/usePermissions";
import type { PermissionCode } from "../../types/auth";

interface CanProps {
  permission?: PermissionCode;
  anyPermissions?: PermissionCode[];
  allPermissions?: PermissionCode[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({
  permission,
  anyPermissions,
  allPermissions,
  children,
  fallback = null,
}: CanProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  const allowed =
    (!permission || hasPermission(permission)) &&
    (!anyPermissions || hasAnyPermission(anyPermissions)) &&
    (!allPermissions || hasAllPermissions(allPermissions));

  return allowed ? <>{children}</> : <>{fallback}</>;
}
