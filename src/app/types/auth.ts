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

export interface UserMission {
  profileId: string;
  missionId: string;
  currentProgress: number;
  isCompleted: boolean;
  completedAt?: string | null;
  mission: {
    id: string;
    title: string;
    description?: string | null;
    pointsReward: number;
    type: string;
    targetCount: number;
    isActive: boolean;
  };
}

export interface UserBadge {
  profileId: string;
  badgeId: string;
  awardedAt: string;
  badge: {
    id: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    pointsRequired: number;
  };
}

export interface UserProfile {
  rewardPoints?: number;
  badgeLevel?: string;
  achievedBadges?: UserBadge[];
  missionProgresses?: UserMission[];
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

  // Driver fields
  vehicleType?: string;
  vehicleInfo?: string;
  licensePlate?: string;
  driverLicenseNumber?: string;
  nationalIdNumber?: string;

  // Restaurant specific
  restaurantName?: string;
  restaurantAddress?: string;
  cuisineType?: string;
  openTime?: string;
  closeTime?: string;
  restaurantDescription?: string;
}

export type PermissionCode = string;
export type RoleCode = string;
