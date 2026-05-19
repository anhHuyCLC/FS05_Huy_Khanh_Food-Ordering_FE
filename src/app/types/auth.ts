export type UserStatus = "ACTIVE" | "INACTIVE" | "PENDING";

export interface UserRole {
  code: string;
  name: string;
}

export interface UserPermission {
  code: string;
  name: string;
  feature?: string | null;
}

export interface UserProfile {
  rewardPoints?: number;
  badgeLevel?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  fullName: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  gender?: string | null;
  status: UserStatus;
  profile?: UserProfile | null;
  roles: UserRole[];
  permissions: UserPermission[];
  createdAt: string;
  updatedAt?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
  user?: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  confirmpassword: string;
  firstname: string;
  middlename: string;
  lastname: string;
  phonenumber: string;
  address: string;
  role: string;
}

export type PermissionCode = string;
export type RoleCode = string;
