"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Package,
  UserCircle,
  LogOut,
  Calendar,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ShoppingBag,
  Clock,
  ArrowRight,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface OrderDetailItem {
  productId: string;
  productName: string;
  imageUrl: string;
  weight?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface OrderData {
  id: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  paymentMethod: string;
  note?: string;
  items: OrderDetailItem[];
}

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/don-hang")
      .then((res) => {
        if (res.status === 401) {
          toast.error("Vui lòng đăng nhập để xem đơn hàng");
          router.push("/dang-nhap?redirect=/tai-khoan/don-hang");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.orders) {
          setOrders(data.orders);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [router]);

  const toggleExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("cho xac nhan") || s.includes("chờ xác nhận") || s.includes("pending")) {
      return (
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
          Chờ xác nhận
        </span>
      );
    }
    if (s.includes("da xac nhan") || s.includes("đã xác nhận")) {
      return (
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
          Đã xác nhận
        </span>
      );
    }
    if (s.includes("dang xu ly") || s.includes("đang xử lý") || s.includes("processing")) {
      return (
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
          Đang xử lý
        </span>
      );
    }
    if (s.includes("dang giao") || s.includes("đang giao") || s.includes("shipping")) {
      return (
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
          Đang giao
        </span>
      );
    }
    if (s.includes("da giao") || s.includes("đã giao") || s.includes("delivered") || s.includes("completed")) {
      return (
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
          Đã giao
        </span>
      );
    }
    if (s.includes("da huy") || s.includes("đã hủy") || s.includes("cancelled")) {
      return (
        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
          Đã hủy
        </span>
      );
    }
    if (s.includes("cho thanh toan") || s.includes("chờ thanh toán")) {
      return (
        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
          Chờ thanh toán
        </span>
      );
    }
    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-t-[#f66315]" />
        <p className="mt-4 text-sm text-slate-500">Đang tải lịch sử đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Tieu de */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900 sm:text-3xl">
          Đơn hàng của tôi
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        {/* ================= SIDEBAR MENU TRAI ================= */}
        <aside className="md:col-span-1">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-1">
            <Link
              href="/tai-khoan"
              className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <UserCircle className="h-4 w-4" />
              Thông tin cá nhân
            </Link>

            <Link
              href="/tai-khoan/don-hang"
              className="flex items-center gap-2.5 rounded-xl bg-orange-50 px-3.5 py-2.5 text-sm font-bold text-[#f66315]"
            >
              <Package className="h-4 w-4" />
              Đơn hàng của tôi ({orders.length})
            </Link>

            <div className="border-t border-slate-100 pt-2">
              <Link
                href="/api/auth/logout"
                onClick={async (e) => {
                  e.preventDefault();
                  await fetch("/api/auth/logout", { method: "POST" });
                  router.push("/dang-nhap");
                  router.refresh();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </Link>
            </div>
          </div>
        </aside>

        {/* ================= CONTENT PHAI: DANH SACH DON HANG ================= */}
        <section className="md:col-span-3">
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#f66315]">
                <ShoppingBag className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Bạn chưa có đơn hàng nào</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                Khám phá ngay bộ sưu tập vợt cầu lông Yonex, Lining, Victor đỉnh cao tại FBShop nhé!
              </p>
              <Link
                href="/san-pham"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#f66315] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#d4520f]"
              >
                <span>Mua sắm ngay</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isExpanded = expandedOrders[order.id];
                return (
                  <div
                    key={order.id}
                    className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md"
                  >
                    {/* Header cua don hang */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 p-4 sm:px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-extrabold text-slate-900">
                            #{order.id}
                          </span>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatDate(order.createdAt)}</span>
                          <span>•</span>
                          <span>{order.paymentMethod === "COD" ? "Thanh toán COD" : "Chuyển khoản QR"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Tổng thanh toán</p>
                          <p className="text-base font-bold text-[#f66315]">
                            {formatCurrency(order.totalAmount)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleExpand(order.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-[#f66315] hover:text-[#f66315]"
                          title="Xem chi tiết"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Danh sach san pham nhanh */}
                    <div className="p-4 sm:p-6 divide-y divide-slate-100">
                      {order.items.map((item) => (
                        <div key={item.productId} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 shrink-0 rounded-lg border border-slate-100 bg-slate-50 p-1">
                              <Image
                                src={item.imageUrl || "/images/placeholder.png"}
                                alt={item.productName}
                                fill
                                className="object-contain"
                              />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{item.productName}</p>
                              <p className="text-xs text-slate-400">
                                Số lượng: <strong className="text-slate-600">{item.quantity}</strong>
                                {item.weight && <span> • Trọng lượng: {item.weight}</span>}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-slate-800">
                            {formatCurrency(item.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Chi tiet mo rong (Thong tin giao hang & ghi chu) */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-orange-50/20 p-4 sm:p-6 text-xs space-y-2">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <p className="text-slate-500">Người nhận:</p>
                            <p className="font-semibold text-slate-800">
                              {order.recipientName} ({order.recipientPhone})
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Địa chỉ giao hàng:</p>
                            <p className="font-semibold text-slate-800">{order.recipientAddress}</p>
                          </div>
                        </div>

                        {order.note && (
                          <div className="pt-1">
                            <p className="text-slate-500">Ghi chú đơn hàng:</p>
                            <p className="italic text-slate-700">{order.note}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}