"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ShoppingBag, Package, ArrowRight, ShieldCheck } from "lucide-react";
import { useCartStore } from "@/lib/cartStore";
import { orderStatusLabel } from "@/lib/orderStatus";
import { formatCurrency } from "@/lib/utils";

interface OrderInfo {
  maDH: string;
  ngayTao: string;
  trangThai: string;
  tongTien: number;
  phuongThucThanhToan: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const maDH = searchParams.get("maDH") || "";
  const clearCart = useCartStore((state) => state.clearCart);
  const [order, setOrder] = useState<OrderInfo | null>(null);

  useEffect(() => {
    // Xoa sach gio hang khi da dat hang thanh cong
    clearCart();
  }, [clearCart]);

  // Thong tin that cua don (thoi gian tao, trang thai, so tien) lay tu may chu
  useEffect(() => {
    if (!maDH) return;
    fetch(`/api/don-hang/${encodeURIComponent(maDH)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.order && setOrder(data.order))
      .catch(() => {});
  }, [maDH]);

  const waitingPayment = order?.trangThai === "Cho thanh toan";

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-100 bg-white p-8 sm:p-12 shadow-xl text-center">
        {/* Success Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-green-50 text-green-500 shadow-sm animate-in zoom-in-50 duration-300">
          <CheckCircle2 className="h-12 w-12" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Đặt hàng thành công!
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Cảm ơn bạn đã tin tưởng mua sắm tại <strong>FBShop</strong>. Đơn hàng của bạn đã được ghi nhận vào hệ thống.
        </p>

        {/* Order Details Card */}
        <div className="my-8 rounded-2xl border border-slate-100 bg-slate-50/80 p-5 text-left space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Mã đơn hàng:</span>
            <span className="font-mono font-bold text-slate-900">{maDH || "—"}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Thời gian tạo:</span>
            <span className="font-medium text-slate-700">
              {order ? new Date(order.ngayTao).toLocaleString("vi-VN") : "—"}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Trạng thái:</span>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
              {order ? orderStatusLabel(order.trangThai) : "Chờ xác nhận"}
            </span>
          </div>

          {order && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">
                {order.phuongThucThanhToan === "COD" ? "Thanh toán khi nhận hàng:" : "Số tiền chuyển khoản:"}
              </span>
              <span className="font-bold text-[#f66315]">{formatCurrency(order.tongTien)}</span>
            </div>
          )}

          {waitingPayment && (
            <p className="rounded-xl bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800">
              FBShop sẽ kiểm tra giao dịch và xác nhận đơn ngay khi nhận được tiền. Bạn có thể xem lại mã QR trong
              mục <strong>Đơn hàng của tôi</strong>.
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/san-pham"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#f66315] py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#d4520f]"
          >
            <ShoppingBag className="h-4 w-4" />
            Tiếp tục mua sắm
          </Link>

          <Link
            href="/tai-khoan/don-hang"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Package className="h-4 w-4" />
            Xem đơn hàng của tôi
          </Link>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-green-500" />
          <span>Hotline hỗ trợ đơn hàng: 0123.456.789</span>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-slate-400">Đang tải kết quả đơn hàng...</div>}>
      <SuccessContent />
    </Suspense>
  );
}