"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/lib/cartStore";
import toast from "react-hot-toast";

export default function CartPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ id: string; name: string } | null>(null);

  const { items, updateQuantity, removeItem, getTotalPrice, getTotalItems } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-[#f66315]" />
        <p className="mt-3 text-sm text-slate-500">Đang tải giỏ hàng...</p>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const shippingFee = subtotal >= 1000000 || items.length === 0 ? 0 : 30000;
  const total = subtotal + shippingFee;

  const handleDecrease = (productId: string, currentQty: number, productName: string) => {
    if (currentQty === 1) {
      setDeleteConfirmItem({ id: productId, name: productName });
    } else {
      updateQuantity(productId, currentQty - 1);
    }
  };

  const handleIncrease = (productId: string, currentQty: number, maxStock: number) => {
    if (currentQty < maxStock) {
      updateQuantity(productId, currentQty + 1);
    } else {
      toast.error(`Kho chỉ còn ${maxStock} sản phẩm`);
    }
  };

  const handleDirectQuantityChange = (productId: string, val: string, maxStock: number) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) return;
    if (num > maxStock) {
      toast.error(`Số lượng tối đa có thể mua là ${maxStock}`);
      updateQuantity(productId, maxStock);
    } else {
      updateQuantity(productId, num);
    }
  };

  const confirmDelete = () => {
    if (deleteConfirmItem) {
      removeItem(deleteConfirmItem.id);
      setDeleteConfirmItem(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Tieu de */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900 sm:text-3xl">
          Giỏ hàng của bạn
        </h1>
        <span className="text-sm font-semibold text-slate-500">
          ({getTotalItems()} sản phẩm)
        </span>
      </div>

      {items.length === 0 ? (
        /* Gio hang trong */
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white py-16 px-4 text-center shadow-xs">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 text-[#f66315]">
            <ShoppingBag className="h-10 w-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Giỏ hàng của bạn đang trống</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
            Hãy khám phá các dòng vợt Yonex, Lining, Victor và phụ kiện đỉnh cao tại FBShop để lấp đầy giỏ hàng của bạn!
          </p>
          <Link
            href="/san-pham"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#f66315] px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#d4520f]"
          >
            <ArrowLeft className="h-4 w-4" />
            Tiếp tục mua sắm
          </Link>
        </div>
      ) : (
        /* Gio hang co san pham */
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Danh sach san pham (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-6 shadow-sm divide-y divide-slate-100">
              {items.map((item) => {
                const itemTotal = item.price * item.quantity;
                return (
                  <div key={item.productId} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Anh + Thong tin */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-2">
                        <Image
                          src={item.imageUrl || "/images/placeholder.png"}
                          alt={item.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-800 text-sm hover:text-[#f66315] transition-colors">
                          <Link href={`/san-pham/${item.productId}`}>
                            {item.name}
                          </Link>
                        </h3>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                          {item.weight && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5">
                              {item.weight}
                            </span>
                          )}
                          <span className="text-slate-400">Kho: {item.maxStock}</span>
                        </div>
                        {item.note && (
                          <p className="text-xs italic text-orange-600">
                            Căng cước: {item.note}
                          </p>
                        )}
                        <p className="text-sm font-bold text-[#f66315] sm:hidden">
                          {formatCurrency(item.price)}
                        </p>
                      </div>
                    </div>

                    {/* Don gia (Desktop) */}
                    <div className="hidden sm:block text-right">
                      <p className="text-xs text-slate-400">Đơn giá</p>
                      <p className="text-sm font-bold text-slate-800">
                        {formatCurrency(item.price)}
                      </p>
                    </div>

                    {/* Bo chon so luong */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center rounded-xl border border-slate-200 bg-white">
                        <button
                          type="button"
                          onClick={() => handleDecrease(item.productId, item.quantity, item.name)}
                          className="flex h-8 w-8 items-center justify-center text-slate-600 hover:text-[#f66315]"
                          title="Giảm 1"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleDirectQuantityChange(item.productId, e.target.value, item.maxStock)
                          }
                          className="w-10 text-center text-xs font-bold text-slate-800 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleIncrease(item.productId, item.quantity, item.maxStock)}
                          disabled={item.quantity >= item.maxStock}
                          className="flex h-8 w-8 items-center justify-center text-slate-600 hover:text-[#f66315] disabled:opacity-30"
                          title="Tăng 1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Thanh tien */}
                      <div className="w-24 text-right">
                        <p className="text-xs text-slate-400 sm:hidden">Thành tiền</p>
                        <p className="text-sm font-bold text-[#f66315]">
                          {formatCurrency(itemTotal)}
                        </p>
                      </div>

                      {/* Nut Xoa */}
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmItem({ id: item.productId, name: item.name })}
                        className="p-2 text-slate-400 transition-colors hover:text-red-600"
                        title="Xóa khỏi giỏ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-2">
              <Link
                href="/san-pham"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#f66315]"
              >
                <ArrowLeft className="h-4 w-4" />
                Tiếp tục xem sản phẩm
              </Link>
            </div>
          </div>

          {/* Tom tat don hang (1/3) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Tóm tắt đơn hàng
              </h2>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Tạm tính</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Phí vận chuyển</span>
                  <span>
                    {shippingFee === 0 ? (
                      <span className="font-semibold text-green-600">Miễn phí</span>
                    ) : (
                      <span className="font-semibold text-slate-800">{formatCurrency(shippingFee)}</span>
                    )}
                  </span>
                </div>

                {subtotal < 1000000 && (
                  <p className="text-xs text-orange-600 bg-orange-50 rounded-lg p-2.5">
                    Mua thêm <strong>{formatCurrency(1000000 - subtotal)}</strong> để được <strong>Miễn phí vận chuyển</strong>!
                  </p>
                )}
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-base font-bold text-slate-900">Tổng thanh toán</span>
                  <span className="text-2xl font-bold text-[#f66315]">
                    {formatCurrency(total)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400 text-right">
                  (Đã bao gồm VAT nếu có)
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/dat-hang")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f66315] py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#d4520f]"
              >
                <span>Tiến hành đặt hàng</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Popup Xac Nhan Xoa */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Xóa khỏi giỏ hàng?</h3>
            <p className="mt-2 text-xs text-slate-500">
              Bạn có chắc chắn muốn xóa sản phẩm <strong>"{deleteConfirmItem.name}"</strong> khỏi giỏ hàng không?
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-red-700"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}