import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useAuthStore } from "./authStore";
import { cartService } from "../services/cartService";

export interface CartItem {
  id: string; // menuItemId
  cartItemId?: string; // DB cartItem id
  cartId?: string; // DB cart id
  name: string;
  price: number;
  image: string;
  desc: string;
  qty: number;
  restaurantId?: string;
  restaurantName?: string;
}

interface CartStoreState {
  userId: string | null;
  restaurantId: string | null;
  restaurantName: string | null;
  items: CartItem[];
  addItem: (
    item: Omit<CartItem, "qty" | "restaurantId" | "restaurantName" | "cartItemId" | "cartId">,
    restaurantId: string,
    restaurantName: string
  ) => Promise<void>;
  removeItem: (id: string, restaurantId?: string) => Promise<void>;
  updateQty: (id: string, delta: number, restaurantId?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
  fetchCarts: () => Promise<void>;
  /** Gọi khi user thay đổi: nếu userId khác, xóa giỏ hàng */
  syncUser: (newUserId: string | null) => Promise<void>;
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      userId: null,
      restaurantId: null,
      restaurantName: null,
      items: [],

      fetchCarts: async () => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) {
          set({ items: [], restaurantId: null, restaurantName: null });
          return;
        }

        try {
          const res = await cartService.getMyCarts();
          const items: CartItem[] = [];

          res.data.forEach((cart) => {
            cart.items.forEach((item) => {
              items.push({
                id: item.menuItem.id,
                cartItemId: item.id,
                cartId: cart.id,
                name: item.menuItem.name,
                price: Number(item.menuItem.basePrice),
                image: item.menuItem.imageUrl || "",
                desc: "", // MenuItem description
                qty: item.quantity,
                restaurantId: cart.restaurantId,
                restaurantName: cart.restaurant.name,
              });
            });
          });

          // Set the restaurantId and restaurantName based on the first item/cart
          const firstItem = items[0];
          set({
            items,
            restaurantId: firstItem ? (firstItem.restaurantId ?? null) : null,
            restaurantName: firstItem ? (firstItem.restaurantName ?? null) : null,
            userId: currentUser.id,
          });
        } catch (error) {
          console.error("Failed to fetch carts:", error);
        }
      },

      syncUser: async (newUserId) => {
        const { userId } = get();
        if (userId !== newUserId) {
          set({
            items: [],
            restaurantId: null,
            restaurantName: null,
            userId: newUserId,
          });
        }
        if (newUserId) {
          await get().fetchCarts();
        }
      },

      addItem: async (item, restaurantId, _restaurantName) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;

        try {
          // 1. Get or create the cart for this restaurant
          const cartRes = await cartService.getOrCreateCart(restaurantId);
          console.log("cartRes from API:", cartRes);
          
          // Safely extract cart supporting nested structure if backend changes
          const cart = cartRes?.data && (cartRes.data as any).cart 
            ? (cartRes.data as any).cart 
            : cartRes?.data;
            
          console.log("cart object:", cart);

          if (!cart || !cart.id) {
            console.error("Cart or Cart ID is missing in response", cartRes);
            return;
          }

          // 2. Add the item to this cart
          await cartService.addItemToCart(cart.id, item.id, 1);

          // 3. Fetch/sync updated carts
          await get().fetchCarts();
        } catch (error) {
          console.error("Failed to add item:", error);
        }
      },

      removeItem: async (id, restaurantId) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;

        try {
          const targetItem = get().items.find(
            (item) => restaurantId ? (item.id === id && item.restaurantId === restaurantId) : (item.id === id)
          );

          if (targetItem && targetItem.cartItemId && targetItem.cartId) {
            const newQty = targetItem.qty - 1;
            if (newQty > 0) {
              await cartService.updateCartItem(targetItem.cartId, targetItem.cartItemId, { quantity: newQty });
            } else {
              await cartService.removeCartItem(targetItem.cartId, targetItem.cartItemId);
            }
            await get().fetchCarts();
          }
        } catch (error) {
          console.error("Failed to remove item:", error);
        }
      },

      updateQty: async (id, delta, restaurantId) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;

        try {
          const targetItem = get().items.find(
            (item) => restaurantId ? (item.id === id && item.restaurantId === restaurantId) : (item.id === id)
          );

          if (targetItem && targetItem.cartItemId && targetItem.cartId) {
            const newQty = targetItem.qty + delta;
            if (newQty > 0) {
              await cartService.updateCartItem(targetItem.cartId, targetItem.cartItemId, { quantity: newQty });
            } else {
              await cartService.removeCartItem(targetItem.cartId, targetItem.cartItemId);
            }
            await get().fetchCarts();
          }
        } catch (error) {
          console.error("Failed to update quantity:", error);
        }
      },

      clearCart: async () => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;

        try {
          const uniqueCartIds = Array.from(new Set(get().items.map((item) => item.cartId).filter(Boolean))) as string[];
          
          for (const cartId of uniqueCartIds) {
            await cartService.deleteCart(cartId);
          }

          set({ items: [], restaurantId: null, restaurantName: null });
        } catch (error) {
          console.error("Failed to clear cart:", error);
        }
      },

      getTotal: () =>
        get().items.reduce((sum, item) => sum + item.price * item.qty, 0),

      getItemCount: () =>
        get().items.reduce((sum, item) => sum + item.qty, 0),
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
