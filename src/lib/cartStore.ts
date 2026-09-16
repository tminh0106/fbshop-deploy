import { create } from "zustand";
import { persist } from "zustand/middleware";
import toast from "react-hot-toast";
import type { CartItem } from "@/lib/types";

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const currentItems = get().items;
        const existingIndex = currentItems.findIndex(
          (i) => i.productId === newItem.productId
        );

        if (existingIndex > -1) {
          const currentItem = currentItems[existingIndex];
          const newQty = currentItem.quantity + newItem.quantity;

          if (newQty > newItem.maxStock) {
            toast.error(`Kho chỉ còn ${newItem.maxStock} sản phẩm`);
            const updatedItems = [...currentItems];
            updatedItems[existingIndex] = {
              ...currentItem,
              quantity: newItem.maxStock,
              note: newItem.note || currentItem.note,
            };
            set({ items: updatedItems });
          } else {
            const updatedItems = [...currentItems];
            updatedItems[existingIndex] = {
              ...currentItem,
              quantity: newQty,
              note: newItem.note || currentItem.note,
            };
            set({ items: updatedItems });
            toast.success(`Đã cập nhật số lượng "${newItem.name}" trong giỏ!`);
          }
        } else {
          if (newItem.quantity > newItem.maxStock) {
            toast.error(`Kho chỉ còn ${newItem.maxStock} sản phẩm`);
            set({ items: [...currentItems, { ...newItem, quantity: newItem.maxStock }] });
          } else {
            set({ items: [...currentItems, newItem] });
            toast.success(`Đã thêm "${newItem.name}" vào giỏ hàng!`);
          }
        }
      },

      removeItem: (productId) => {
        const currentItems = get().items;
        const target = currentItems.find((i) => i.productId === productId);
        set({ items: currentItems.filter((i) => i.productId !== productId) });
        if (target) {
          toast.success(`Đã xóa "${target.name}" khỏi giỏ hàng!`);
        }
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        const currentItems = get().items;
        const target = currentItems.find((i) => i.productId === productId);
        if (!target) return;

        if (quantity > target.maxStock) {
          toast.error(`Số lượng tối đa có thể mua là ${target.maxStock}`);
          set({
            items: currentItems.map((item) =>
              item.productId === productId ? { ...item, quantity: target.maxStock } : item
            ),
          });
          return;
        }

        set({
          items: currentItems.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },
    }),
    {
      name: "fbshop_cart",
    }
  )
);