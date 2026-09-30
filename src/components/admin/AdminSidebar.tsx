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
  ArrowUpRight,
  Contact,
} from "lucide-react";
import { BrandMark } from "@/components/layout/BrandLogo";
import { canAccessPath } from "@/lib/permissions";

interface AdminSidebarProps {
  userRole?: string;
}

const NAV_SECTIONS = [
  {
    title: "Tổng quan",
    items: [{ label: "Bảng điều khiển", href: "/admin", icon: LayoutDashboard }],
  },
  {
    title: "Bán hàng",
    items: [
      { label: "Đơn hàng", href: "/admin/don-hang", icon: ShoppingCart },
      { label: "Khách hàng", href: "/admin/khach-hang", icon: Contact },
      { label: "Mã khuyến mại", href: "/admin/voucher", icon: Tag },
    ],
  },
  {
    title: "Hàng hóa",
    items: [{ label: "Sản phẩm & Danh mục", href: "/admin/san-pham", icon: Package }],
  },
  {
    title: "Kho hàng",
    items: [
      { label: "Nhà cung cấp", href: "/admin/nha-cung-cap", icon: Truck },
      { label: "Hóa đơn nhập/xuất kho", href: "/admin/hoa-don-kho", icon: FileText },
      { label: "Hàng hóa tồn kho", href: "/admin/hang-hoa-kho", icon: Warehouse },
    ],
  },
  {
    title: "Hệ thống & Nhân sự",
    items: [
      { label: "Nhân viên", href: "/admin/nhan-vien", icon: Users },
      { label: "Quản lý tài khoản", href: "/admin/tai-khoan", icon: UserCog },
    ],
  },
  {
    title: "Báo cáo",
    items: [{ label: "Thống kê & Phân tích", href: "/admin/thong-ke", icon: BarChart3 }],
  },
];

export default function AdminSidebar({ userRole }: AdminSidebarProps) {
  const pathname = usePathname();

  // Chi hien muc vai tro duoc phep (cung ma tran voi proxy va API)
  const navSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => canAccessPath(userRole, item.href)),
  })).filter((section) => section.items.length > 0);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-ink text-white">
      {/* Thuong hieu */}
      <div className="flex h-16 items-center gap-3 px-5">
        <Link href="/admin" className="flex items-center gap-3">
          <BrandMark className="h-9 w-9" />
          <div className="leading-none">
            <span className="flex items-center gap-1.5 font-display text-[17px] font-bold tracking-tight">
              FB<span className="-ml-1.5 text-[#f66315]">Shop</span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-slate-300">
                ADMIN
              </span>
            </span>
            <span className="mt-1 block text-[11px] text-slate-500">Hệ thống quản trị nội bộ</span>
          </div>
        </Link>
      </div>

      {/* Dieu huong */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5 [scrollbar-color:#334155_transparent]">
        {navSections.map((section) => (
          <div key={section.title}>
            <h3 className="mb-1.5 px-3 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {section.title}
            </h3>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname?.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                      isActive
                        ? "bg-white/[0.08] text-white"
                        : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[#f66315]" />
                    )}
                    <Icon
                      className={`h-[18px] w-[18px] shrink-0 ${
                        isActive ? "text-[#f66315]" : "text-slate-500 group-hover:text-slate-300"
                      }`}
                      strokeWidth={1.8}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Link sang website ban hang */}
      <div className="border-t border-white/[0.06] p-3">
        <Link
          href="/"
          target="_blank"
          className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-400 transition-all hover:bg-white/[0.04] hover:text-white"
        >
          Xem website bán hàng
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </aside>
  );
}
