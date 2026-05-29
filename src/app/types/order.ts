export interface OrderItemInput {
  menuItemId: string;
  quantity: number;
  selectedOptions?: Record<string, unknown>;
  note?: string;
}

export interface CreateOrderInput {
  restaurantId: string;
  orderType?: 'standard_delivery' | 'dine_in' | 'group_order' | 'blind_box';
  items: OrderItemInput[];
  deliveryAddress?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  customerPhone?: string;
  promotionCode?: string;
  paymentMethod?: "cash" | "e_wallet" | "bank_transfer";
  note?: string;
  tableNumber?: string;
  reservationTime?: string;
  paymentProvider?: 'momo' | 'vnpay';
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  price?: number;
  selectedOptions?: Record<string, unknown>;
  note?: string;
  menuItem?: {
    id: string;
    name: string;
    imageUrl?: string;
    basePrice: number;
  };
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: string;
  note?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  customerId: string;
  restaurantId: string;
  driverId?: string;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivering' | 'completed' | 'cancelled';
  orderType: string;
  totalAmount: number;
  deliveryFee: number;
  discountAmount: number;
  finalAmount: number;
  deliveryAddress?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  note?: string;
  cancelReason?: string;
  customerPhone?: string | null;
  createdAt: string;
  updatedAt: string;
  assignmentExpiresAt?: string;
  currentDriverId?: string | null;
  paymentUrl?: string | null;
  orderItems?: OrderItem[];
  orderStatusHistories?: OrderStatusHistory[];
  restaurant?: {
    id: string;
    name: string;
    logo?: string;
    latitude?: number;
    longitude?: number;
  };
  customer?: {
    id: string;
    name: string;
    avatar?: string;
    fullName?: string;
    phone?: string | null;
    phoneNumber?: string | null;
  };
  driver?: {
    id: string;
    profile?: {
      fullName?: string;
      phone?: string;
    };
  };
  promotion?: {
    code?: string;
    discountPercentage?: number | null;
    fixedDiscount?: number | null;
  };
  payment?: {
    status?: string;
    method?: string;
    amount?: number;
  };
}

export interface UpdateOrderStatusInput {
  status: string;
  note?: string;
}
export interface OrderMeta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
}
export interface CancelOrderInput {
  reason?: string;
}

export interface Promotion {
  id: string;
  restaurantId: string | null;
  code: string;
  description: string | null;
  discountPercentage: number | null;
  fixedDiscount: number | null;
  minOrderValue: number | null;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  promotionType: 'food' | 'shipping';
}
export interface OrderMetaCreateOrderInput extends CreateOrderInput {
  paymentMethod?: "cash" | "e_wallet" | "bank_transfer";
}
