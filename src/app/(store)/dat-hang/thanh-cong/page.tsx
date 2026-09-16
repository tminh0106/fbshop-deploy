"use client";

import { useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ShoppingBag, Package, ArrowRight, ShieldCheck } from "lucide-react";
import { useCartStore } from "@/lib/cartStore";

function SuccessContent() {
  const searchParams = useSearchParams();
  const maDH = searchParams.get("maDH") || "DH_FB" + Date.now();
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    // Xoa sach gio hang khi da dat hang thanh cong
    clearCart();
  }, [clearCart]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-lg rounded-3xl border border-gray-100 bg-white p-8 sm:p-12 shadow-xl text-center">
        {/* Success Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-green-50 text-green-500 shadow-sm animate-in zoom-in-50 duration-300">
          <CheckCircle2 className="h-12 w-12" />
        </div>

        <h1 className="text-2xl font-black text-gray-900 sm:text-3xl">
          Đặt hàng thành công!
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Cảm ơn bạn đã tin tưởng mua sắm tại <strong>FBShop</strong>. Đơn hàng của bạn đã được ghi nhận vào hệ thống.
        </p>

        {/* Order Details Card */}
        <div className="my-8 rounded-2xl border border-gray-100 bg-gray-50/80 p-5 text-left space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Mã đơn hàng:</span>
            <span className="font-mono font-bold text-gray-900">{maDH}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Thời gian tạo:</span>
            <span className="font-medium text-gray-700">
              {new Date().toLocaleString("vi-VN")}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Trạng thái:</span>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
              Đang xử lý xác nhận
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/san-pham"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#f66315] py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-orange-700"
          >
            <ShoppingBag className="h-4 w-4" />
            Tiếp tục mua sắm
          </Link>

          <Link
            href="/tai-khoan/don-hang"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 py-3.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Package className="h-4 w-4" />
            Xem đơn hàng của tôi
          </Link>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400">
          <ShieldCheck className="h-4 w-4 text-green-500" />
          <span>Hotline hỗ trợ đơn hàng: 0123.456.789</span>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-gray-400">Đang tải kết quả đơn hàng...</div>}>
      <SuccessContent />
    </Suspense>
  );
}