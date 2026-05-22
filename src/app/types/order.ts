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
  note?: string;
  tableNumber?: string;
  reservationTime?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
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
  note?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
  orderItems?: OrderItem[];
  orderStatusHistories?: OrderStatusHistory[];
  restaurant?: {
    id: string;
    name: string;
    logo?: string;
  };
  customer?: {
    id: string;
    name: string;
    avatar?: string;
    fullName?: string;
  };
  driver?: {
    id: string;
    profile?: {
      fullName?: string;
      phone?: string;
    };
  };
}

export interface UpdateOrderStatusInput {
  status: string;
  note?: string;
}

export interface CancelOrderInput {
  reason?: string;
}
