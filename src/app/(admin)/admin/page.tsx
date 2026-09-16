import Link from "next/link";
import prisma from "@/lib/db";
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

export default async function AdminDashboard() {
  // Lay so lieu thuc te tu CSDL
  const [
    productCount,
    orderCount,
    customerCount,
    orders,
    lowStockProducts,
    recentInvoices,
  ] = await Promise.all([
    prisma.sanPham.count(),
    prisma.donHang.count(),
    prisma.khachHang.count(),
    prisma.donHang.findMany({
      take: 6,
      orderBy: { NgayTao: "desc" },
      include: { KhachHang: true },
    }),
    prisma.sanPham.findMany({
      where: { SoLuong: { lte: 5 } },
      take: 5,
      include: { DanhMuc: true },
    }),
    prisma.hoaDonKho.findMany({
      take: 5,
      orderBy: { NgayLap: "desc" },
      include: { NhanVien: true, NhaCungCap: true },
    }),
  ]);

  // Tinh tong doanh thu
  const allOrders = await prisma.donHang.findMany({
    where: { TrangThai: { not: "Da huy" } },
    select: { TongTien: true },
  });
  const totalRevenue = allOrders.reduce((sum, o) => sum + Number(o.TongTien), 0);

  const STATS = [
    {
      label: "Tổng sản phẩm",
      value: productCount.toString(),
      sub: "Trong danh mục kinh doanh",
      icon: Package,
      color: "bg-blue-50 text-blue-600",
      href: "/admin/san-pham",
    },
    {
      label: "Đơn đặt hàng",
      value: orderCount.toString(),
      sub: "Tổng số đơn đã tiếp nhận",
      icon: ShoppingCart,
      color: "bg-orange-50 text-[#f66315]",
      href: "/admin/don-hang",
    },
    {
      label: "Khách hàng đăng ký",
      value: customerCount.toString(),
      sub: "Tài khoản khách hàng",
      icon: Users,
      color: "bg-green-50 text-green-600",
      href: "/admin/thong-ke",
    },
    {
      label: "Tổng doanh thu",
      value: `${(totalRevenue / 1000000).toFixed(1)}M đ`,
      sub: "Doanh thu tích lũy hệ thống",
      icon: TrendingUp,
      color: "bg-purple-50 text-purple-600",
      href: "/admin/thong-ke",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-3xl bg-gradient-to-r from-[#161922] to-[#242b3d] p-6 text-white shadow-xl">
        <div>
          <span className="rounded-md bg-[#f66315] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Bảng Điều Khiển Trung Tâm
          </span>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
            Hệ Thống Quản Trị & Kho Bãi FBShop
          </h2>
          <p className="mt-1 text-xs text-gray-300">
            Theo dõi tình trạng kho vận, tiến độ duyệt đơn hàng và số liệu vận hành theo thời gian thực
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/admin/hoa-don-kho"
            className="flex items-center gap-1.5 rounded-xl bg-[#f66315] px-4 py-2 text-xs font-bold text-white shadow-md shadow-orange-950/40 hover:bg-[#e55000] transition-all"
          >
            <Warehouse className="h-4 w-4" />
            Lập phiếu kho (BR-01)
          </Link>
          <Link
            href="/admin/don-hang"
            className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-all"
          >
            <ShoppingCart className="h-4 w-4" />
            Duyệt đơn hàng
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-orange-200"
          >
            <div className="flex items-center justify-between">
              <div className={"rounded-xl p-2.5 " + stat.color}>
                <stat.icon className="h-5 w-5" />
              </div>
              <span className="text-gray-400 group-hover:text-[#f66315] transition-colors">
                <ChevronRight className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-black text-gray-900 tracking-tight">{stat.value}</p>
              <p className="text-xs font-bold text-gray-700 mt-0.5">{stat.label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{stat.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Grid: Recent Orders & Stock Warnings */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Orders (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-[#f66315]" />
                ĐƠN ĐẶT HÀNG MỚI NHẤT
              </h3>
              <p className="text-xs text-gray-400">Danh sách đơn mua từ website</p>
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
              <thead className="border-b border-gray-100 bg-gray-50/70 font-bold text-gray-600">
                <tr>
                  <th className="px-5 py-3">Mã Đơn</th>
                  <th className="px-5 py-3">Khách Hàng</th>
                  <th className="px-5 py-3 text-right">Tổng Tiền</th>
                  <th className="px-5 py-3 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">
                      Chưa có đơn đặt hàng nào
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.MaDH} className="hover:bg-gray-50/60">
                      <td className="px-5 py-3 font-mono font-bold text-gray-900">
                        {o.MaDH.slice(0, 10)}...
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-bold text-gray-800">{o.TenNguoiNhan}</p>
                        <p className="text-[10px] text-gray-400">{o.SdtNguoiNhan}</p>
                      </td>
                      <td className="px-5 py-3 text-right font-black text-gray-900">
                        {Number(o.TongTien).toLocaleString("vi-VN")} đ
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="rounded-full bg-orange-50 border border-orange-200 px-2.5 py-0.5 text-[10px] font-bold text-orange-700">
                          {o.TrangThai}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock Alerts (1 Col) */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-xs p-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              CẢNH BÁO TỒN KHO
            </h3>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
              ≤ 5 CÂY
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
                    <p className="text-xs font-bold text-gray-900">{p.TenSP}</p>
                    <p className="text-[10px] text-gray-500">{p.DanhMuc?.TenDanhMuc}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-red-600">
                      Còn {p.SoLuong} cây
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
      </div>

      {/* Recent Warehouse Invoices */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-xs p-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
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
              className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-gray-900">
                  {inv.MaHDK}
                </span>
                <span
                  className={`rounded-md px-1.5 py-0.2 text-[9px] font-bold ${
                    inv.LoaiPhieu === "NHAP"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {inv.LoaiPhieu}
                </span>
              </div>
              <p className="text-xs font-bold text-gray-800">
                {Number(inv.TongTien).toLocaleString("vi-VN")} VNĐ
              </p>
              <p className="text-[10px] text-gray-500 truncate">
                Lập bởi {inv.NhanVien?.HoTen} • {new Date(inv.NgayLap).toLocaleDateString("vi-VN")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
