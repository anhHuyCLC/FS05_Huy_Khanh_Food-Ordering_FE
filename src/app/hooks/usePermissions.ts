import { useCallback } from "react";
import { useAuthStore } from "../stores/authStore";
import {
  hasAllPermissions as checkAllPermissions,
  hasAnyPermission as checkAnyPermission,
  hasPermission as checkPermission,
  hasRole as checkRole,
} from "../lib/authorization";
import type { PermissionCode, RoleCode } from "../types/auth";

export function usePermissions() {
  const user = useAuthStore((state) => state.user);

  const hasPermission = useCallback(
    (permission: PermissionCode) => checkPermission(permission, user),
    [user],
  );

  const hasAnyPermission = useCallback(
    (permissions: PermissionCode[]) => checkAnyPermission(permissions, user),
    [user],
  );

  const hasAllPermissions = useCallback(
    (permissions: PermissionCode[]) => checkAllPermissions(permissions, user),
    [user],
  );

  const hasRole = useCallback(
    (role: RoleCode) => checkRole(role, user),
    [user],
  );

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
  };
}

export function useCan(permission: PermissionCode) {
  const user = useAuthStore((state) => state.user);
  return checkPermission(permission, user);
}
