import { useAuthStore } from "../stores/authStore";
import type { PermissionCode, RoleCode, User } from "../types/auth";

const getCurrentUser = () => useAuthStore.getState().user;

export function hasPermission(permission: PermissionCode, user: User | null = getCurrentUser()) {
  return Boolean(user?.permissions?.some((item) => item.code === permission));
}

export function hasAnyPermission(permissions: PermissionCode[], user: User | null = getCurrentUser()) {
  if (permissions.length === 0) return true;
  return permissions.some((permission) => hasPermission(permission, user));
}

export function hasAllPermissions(permissions: PermissionCode[], user: User | null = getCurrentUser()) {
  if (permissions.length === 0) return true;
  return permissions.every((permission) => hasPermission(permission, user));
}

export function hasRole(role: RoleCode, user: User | null = getCurrentUser()) {
  return Boolean(user?.roles?.some((item) => item.code === role));
}
