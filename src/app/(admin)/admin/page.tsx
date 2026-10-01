import Link from "next/link";
import prisma from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { hasFeature } from "@/lib/permissions";
import { orderStatusLabel } from "@/lib/orderStatus";
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Warehouse,
  AlertTriangle,
  ChevronRight,
  Clock,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

// Nhan + mau trang thai don hang (ma luu khong dau trong CSDL)
const ORDER_BADGE: Record<string, string> = {
  "Cho thanh toan": "bg-purple-50 border-purple-200 text-purple-700",
  "Cho xac nhan": "bg-amber-50 border-amber-200 text-amber-700",
  "Dang xu ly": "bg-blue-50 border-blue-200 text-blue-700",
  "Dang giao": "bg-orange-50 border-orange-200 text-orange-700",
  "Da giao": "bg-emerald-50 border-emerald-200 text-emerald-700",
  "Da huy": "bg-red-50 border-red-200 text-red-600",
};

// Don vi tinh theo danh muc: vot -> cay, giay -> doi, con lai -> chiec
const stockUnit = (maDanhMuc: string | null | undefined) =>
  maDanhMuc === "DM_GIAY" ? "đôi" : maDanhMuc === "DM_BALO" || maDanhMuc === "DM_PHUKIEN" || !maDanhMuc ? "chiếc" : "cây";

const STAT_GRID_COLS = ["", "lg:grid-cols-1", "lg:grid-cols-2", "lg:grid-cols-3", "lg:grid-cols-4"];

export default async function AdminDashboard() {
  // Layout (admin) da dam bao dang nhap; bang dieu khien hien theo quyen cua vai tro
  const admin = await getCurrentAdmin();
  const role = admin?.role;
  const canOrders = hasFeature(role, "donHang");
  const canCustomers = hasFeature(role, "khachHang");
  const canProducts = hasFeature(role, "sanPham");
  const canKho = hasFeature(role, "kho");
  const canRevenue = hasFeature(role, "thongKe");

  // Chi truy van du lieu vai tro duoc xem
  const [
    productCount,
    orderCount,
    customerCount,
    orders,
    lowStockProducts,
    recentInvoices,
    revenueOrders,
  ] = await Promise.all([
    canProducts ? prisma.sanPham.count() : 0,
    canOrders ? prisma.donHang.count() : 0,
    canCustomers ? prisma.khachHang.count() : 0,
    canOrders
      ? prisma.donHang.findMany({
          take: 6,
          orderBy: { NgayTao: "desc" },
          include: { KhachHang: true },
        })
      : [],
    canKho
      ? prisma.sanPham.findMany({
          where: { SoLuong: { lte: 5 } },
          take: 5,
          include: { DanhMuc: true },
        })
      : [],
    canKho
      ? prisma.hoaDonKho.findMany({
          take: 5,
          orderBy: { NgayLap: "desc" },
          include: { NhanVien: true, NhaCungCap: true },
        })
      : [],
    canRevenue
      ? prisma.donHang.findMany({
          // Doanh thu chi tinh don da giao (khop voi trang Thong ke, NFR-01)
          where: { TrangThai: "Da giao" },
          select: { TongTien: true },
        })
      : [],
  ]);

  const totalRevenue = revenueOrders.reduce((sum, o) => sum + Number(o.TongTien), 0);

  const STATS = [
    canProducts && {
      label: "Tổng sản phẩm",
      value: productCount.toString(),
      sub: "Trong danh mục kinh doanh",
      icon: Package,
      color: "bg-blue-50 text-blue-600",
      href: "/admin/san-pham",
    },
    canOrders && {
      label: "Đơn đặt hàng",
      value: orderCount.toString(),
      sub: "Tổng số đơn đã tiếp nhận",
      icon: ShoppingCart,
      color: "bg-orange-50 text-[#f66315]",
      href: "/admin/don-hang",
    },
    canCustomers && {
      label: "Khách hàng đăng ký",
      value: customerCount.toString(),
      sub: "Tài khoản khách hàng",
      icon: Users,
      color: "bg-green-50 text-green-600",
      href: "/admin/khach-hang",
    },
    canRevenue && {
      label: "Tổng doanh thu",
      value: `${(totalRevenue / 1000000).toFixed(1)}M đ`,
      sub: "Từ các đơn đã giao",
      icon: TrendingUp,
      color: "bg-purple-50 text-purple-600",
      href: "/admin/thong-ke",
    },
  ].filter((s) => !!s);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-3xl bg-gradient-to-r from-ink to-[#1e293b] p-6 text-white shadow-xl">
        <div>
          <span className="rounded-md bg-[#f66315] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Bảng Điều Khiển Trung Tâm
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
            Hệ Thống Quản Trị & Kho Bãi FBShop
          </h2>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {canKho && (
            <Link
              href="/admin/hoa-don-kho"
              className="flex items-center gap-1.5 rounded-xl bg-[#f66315] px-4 py-2 text-xs font-bold text-white shadow-md shadow-orange-950/40 hover:bg-[#e55000] transition-all"
            >
              <Warehouse className="h-4 w-4" />
              Lập phiếu kho
            </Link>
          )}
          {canOrders && (
            <Link
              href="/admin/don-hang"
              className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-all"
            >
              <ShoppingCart className="h-4 w-4" />
              Duyệt đơn hàng
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${STAT_GRID_COLS[STATS.length]}`}>
        {STATS.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-orange-200"
          >
            <div className="flex items-center justify-between">
              <div className={"rounded-xl p-2.5 " + stat.color}>
                <stat.icon className="h-5 w-5" />
              </div>
              <span className="text-slate-400 group-hover:text-[#f66315] transition-colors">
                <ChevronRight className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
              <p className="text-xs font-bold text-slate-700 mt-0.5">{stat.label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{stat.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Grid: Recent Orders & Stock Warnings */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Orders (2 Cols) - vai tro ban hang */}
        {canOrders && (
        <div className={`${canKho ? "lg:col-span-2" : "lg:col-span-3"} rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-[#f66315]" />
                ĐƠN ĐẶT HÀNG MỚI NHẤT
              </h3>
            </div>
            <Link
              href="/admin/don-hang"
              className="text-xs font-bold text-[#f66315] hover:underline"
            >
              Xem tất cả →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/70 font-bold text-slate-600">
                <tr>
                  <th className="px-5 py-3">Mã Đơn</th>
                  <th className="px-5 py-3">Khách Hàng</th>
                  <th className="px-5 py-3 text-right">Tổng Tiền</th>
                  <th className="px-5 py-3 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      Chưa có đơn đặt hàng nào
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.MaDH} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-mono font-bold text-slate-900">
                        {o.MaDH.slice(0, 10)}...
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-bold text-slate-800">{o.TenNguoiNhan}</p>
                        <p className="text-[10px] text-slate-400">{o.SdtNguoiNhan}</p>
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-slate-900">
                        {Number(o.TongTien).toLocaleString("vi-VN")} đ
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                            ORDER_BADGE[o.TrangThai] || "bg-slate-50 border-slate-200 text-slate-600"
                          }`}
                        >
                          {orderStatusLabel(o.TrangThai)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Stock Alerts (1 Col) - vai tro kho */}
        {canKho && (
        <div className={`${canOrders ? "" : "lg:col-span-3"} rounded-2xl border border-slate-200 bg-white shadow-xs p-5`}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              CẢNH BÁO TỒN KHO
            </h3>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
              Tồn ≤ 5
            </span>
          </div>

          <div className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <p className="py-8 text-center text-xs text-emerald-600 font-bold">
                Tồn kho ổn định, không có mặt hàng thiếu
              </p>
            ) : (
              lowStockProducts.map((p) => (
                <div
                  key={p.MaSP}
                  className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 border border-red-100"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">{p.TenSP}</p>
                    <p className="text-[10px] text-slate-500">{p.DanhMuc?.TenDanhMuc}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-red-600">
                      Còn {p.SoLuong} {stockUnit(p.MaDanhMuc)}
                    </span>
                    <Link
                      href="/admin/hoa-don-kho"
                      className="block text-[10px] font-bold text-[#f66315] hover:underline"
                    >
                      Nhập thêm →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        )}
      </div>

      {/* Recent Warehouse Invoices - vai tro kho */}
      {canKho && (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs p-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Warehouse className="h-4 w-4 text-blue-600" />
            HÓA ĐƠN KHO MỚI LẬP (NHẬP / XUẤT)
          </h3>
          <Link
            href="/admin/hoa-don-kho"
            className="text-xs font-bold text-[#f66315] hover:underline"
          >
            Quản lý kho →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recentInvoices.map((inv) => (
            <div
              key={inv.MaHDK}
              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-slate-900">
                  {inv.MaHDK}
                </span>
                <span
                  className={`rounded-md px-1.5 py-0.2 text-[9px] font-bold ${
                    inv.LoaiPhieu === "NHAP"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {inv.LoaiPhieu === "NHAP" ? "Nhập kho" : "Xuất kho"}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-800">
                {Number(inv.TongTien).toLocaleString("vi-VN")} VNĐ
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                Lập bởi {inv.NhanVien?.HoTen} • {new Date(inv.NgayLap).toLocaleDateString("vi-VN")}
              </p>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
