// ─── Restaurant Types ─────────────────────────────────────────────────────────

export interface RestaurantOwner {
    id: string;
    fullName: string;
    avatarUrl: string | null;
}

export interface RestaurantCategory {
    id: string;
    name: string;
    sortOrder?: number;
}

export interface OptionChoice {
    id: string;
    optionGroupId: string;
    name: string;
    extraPrice: number;
    additionalPrice?: string; // legacy
}

export interface OptionGroup {
    id: string;
    menuItemId: string;
    name: string;
    isRequired: boolean;
    maxChoices: number;
    choices: OptionChoice[];
}

export interface AppliedPromotion {
    id: string;
    code: string;
    discountPercentage?: number | null;
    fixedDiscount?: number | null;
    validTo: string;
}
export interface ComboSuggestion {
  id?: string;
  name: string;
  reason: string;
  totalPrice: number;
  items?: Array<{ id?: string; name: string; imageUrl?: string }>;
}

export interface MenuItem {
    id: string;
    restaurantId: string;
    categoryId?: string | null;
    name: string;
    description?: string | null;
    basePrice: string;
    imageUrl?: string | null;
    isAvailable: boolean;
    createdAt?: string;
    category?: RestaurantCategory | null;
    optionGroups?: OptionGroup[];
    appliedPromotions?: AppliedPromotion[];
}

export interface Restaurant {
    id: string;
    name: string;
    description?: string | null;
    address: string;
    imageUrl?: string | null;
    latitude?: string | number | null;
    longitude?: string | number | null;
    rating?: string | number | null;
    isActive?: boolean | null;
    approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
    commissionRate?: number;
    createdAt?: string;
    owner?: RestaurantOwner | null;
    categories?: RestaurantCategory[];
    menuItems?: MenuItem[];
    promotions?: Promotion[];
    _count?: { menuItems: number; orders: number };
}

export interface Promotion {
    id: string;
    restaurantId?: string | null;
    code: string;
    description?: string | null;
    discountPercentage?: number | null;
    fixedDiscount?: number | null;
    minOrderValue?: number | null;
    validFrom: string;
    validTo: string;
    isActive?: boolean | null;
    applicableItems?: { id: string; name: string }[];
}

// ─── Input Types ──────────────────────────────────────────────────────────────

export interface CreateMenuItemInput {
    name: string;
    description?: string;
    basePrice: string;
    categoryId?: string;
    imageUrl?: string;
    isAvailable?: boolean;
}

export type UpdateMenuItemInput = Partial<CreateMenuItemInput>;

export interface CreatePromotionInput {
    code: string;
    description?: string;
    discountPercentage?: number;
    fixedDiscount?: number;
    minOrderValue: number;
    validFrom: string;
    validTo: string;
    isActive: boolean;
    menuItemIds?: string[];
}

export type UpdatePromotionInput = Partial<CreatePromotionInput>;

export type ToggleAvailabilityInput = {
    isAvailable: boolean;
    reason?: string;
}