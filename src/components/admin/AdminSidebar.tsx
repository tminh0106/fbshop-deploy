"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Warehouse,
  ShoppingCart,
  Package,
  Truck,
  Tag,
  Users,
  UserCog,
  BarChart3,
  ExternalLink,
} from "lucide-react";

interface AdminSidebarProps {
  userRole?: string;
}

export default function AdminSidebar({ userRole = "Admin" }: AdminSidebarProps) {
  const pathname = usePathname();

  const isAdmin = userRole === "Admin";
  const isKho = userRole === "QuanLyKho";

  // Danh muc dieu huong
  const navSections = [
    {
      title: "TỔNG QUAN",
      items: [{ label: "Bảng điều khiển", href: "/admin", icon: LayoutDashboard }],
    },
    {
      title: "QUẢN LÝ KHO",
      items: [
        { label: "Hóa đơn nhập/xuất kho", href: "/admin/hoa-don-kho", icon: FileText },
        { label: "Hàng hóa tồn kho", href: "/admin/hang-hoa-kho", icon: Warehouse },
      ],
    },
    {
      title: "BÁN HÀNG & KHÁCH HÀNG",
      items: [
        { label: "Quản lý đơn hàng", href: "/admin/don-hang", icon: ShoppingCart },
        { label: "Quản lý khách hàng", href: "/admin/khach-hang", icon: Users },
        { label: "Sản phẩm & Danh mục", href: "/admin/san-pham", icon: Package },
        { label: "Nhà cung cấp", href: "/admin/nha-cung-cap", icon: Truck },
        { label: "Mã khuyến mại (Voucher)", href: "/admin/voucher", icon: Tag },
      ],
    },
    // Chi hien thi voi Admin
    ...(isAdmin
      ? [
          {
            title: "HỆ THỐNG & NHÂN SỰ",
            items: [
              { label: "Quản lý nhân viên", href: "/admin/nhan-vien", icon: Users },
              { label: "Phân quyền tài khoản", href: "/admin/tai-khoan", icon: UserCog },
            ],
          },
        ]
      : []),
    {
      title: "BÁO CÁO & PHÂN TÍCH",
      items: [{ label: "Báo cáo thống kê", href: "/admin/thong-ke", icon: BarChart3 }],
    },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-[#161922] text-white shadow-xl">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#e55000] to-[#f66315] font-black text-white shadow-md">
            FB
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-white">
              FB<span className="text-[#f66315]">Shop</span>
            </span>
            <span className="ml-1.5 rounded-sm bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-bold text-orange-400">
              PRO
            </span>
            <p className="text-[10px] text-gray-400">Hệ thống quản trị nội bộ</p>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="px-3 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              {section.title}
            </h3>
            <div className="space-y-0.5 pt-1">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname?.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-[#f66315] text-white shadow-md shadow-orange-950/20"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? "text-white" : "text-gray-400 group-hover:text-[#f66315]"
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Quick Link to Storefront */}
      <div className="border-t border-white/10 p-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 transition-all hover:bg-white/10 hover:text-white"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="h-3.5 w-3.5 text-[#f66315]" />
            Xem website bán hàng
          </span>
          <span className="text-[10px] text-gray-400">Client ↗</span>
        </Link>
      </div>
    </aside>
  );
}
