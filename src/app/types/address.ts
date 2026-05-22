export interface SavedAddress {
  id: string;
  profileId: string;
  label: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressInput {
  label: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  isDefault?: boolean;
}

export interface UpdateAddressInput {
  label?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  isDefault?: boolean;
}
