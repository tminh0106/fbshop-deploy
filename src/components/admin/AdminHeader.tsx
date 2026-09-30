"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, AlertCircle, ExternalLink, ChevronRight, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import ChangePasswordModal from "@/components/admin/ChangePasswordModal";
import { normalizeRole, ROLE_LABELS, ROLES } from "@/lib/permissions";

interface AdminHeaderProps {
  user?: {
    tenDangNhap?: string;
    hoTen?: string;
    role?: string;
  } | null;
}

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Bảng điều khiển",
  "/admin/hoa-don-kho": "Hóa đơn nhập/xuất kho",
  "/admin/hang-hoa-kho": "Hàng hóa tồn kho",
  "/admin/don-hang": "Đơn hàng",
  "/admin/khach-hang": "Khách hàng",
  "/admin/san-pham": "Sản phẩm & Danh mục",
  "/admin/nha-cung-cap": "Nhà cung cấp",
  "/admin/voucher": "Mã khuyến mại",
  "/admin/nhan-vien": "Nhân viên",
  "/admin/tai-khoan": "Quản lý tài khoản",
  "/admin/thong-ke": "Thống kê & Phân tích",
};

const ROLE_BADGE: Record<string, string> = {
  [ROLES.ADMIN]: "bg-rose-50 text-rose-700 ring-rose-200",
  [ROLES.KHO]: "bg-sky-50 text-sky-700 ring-sky-200",
  [ROLES.BAN_HANG]: "bg-amber-50 text-amber-700 ring-amber-200",
};

export default function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      toast.success("Đã đăng xuất tài khoản quản trị");
      router.push("/admin/login");
      router.refresh();
    } catch {
      toast.error("Lỗi khi đăng xuất");
    } finally {
      setLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const roleName = normalizeRole(user?.role) || "";
  const role = {
    label: ROLE_LABELS[roleName] || roleName,
    className: ROLE_BADGE[roleName] || "bg-slate-100 text-slate-700 ring-slate-200",
  };
  const displayName = user?.hoTen || user?.tenDangNhap || "Quản trị viên";
  const pageTitle =
    PAGE_TITLES[pathname || ""] ||
    Object.entries(PAGE_TITLES).find(([k]) => k !== "/admin" && pathname?.startsWith(k))?.[1] ||
    "Quản trị";

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/85 px-6 backdrop-blur-xl md:px-8">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">FBShop</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <h1 className="font-display text-[15px] font-semibold text-slate-900">{pageTitle}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="hidden h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:flex"
          >
            <ExternalLink className="h-4 w-4" />
            Website
          </Link>

          <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

          {/* Thong tin nguoi dung */}
          <div className="flex items-center gap-3 pl-1">
            <div className="hidden text-right leading-tight md:block">
              <p className="text-[13px] font-semibold text-slate-900">{displayName}</p>
              <span
                className={`mt-0.5 inline-block rounded px-1.5 py-px text-[10px] font-semibold ring-1 ring-inset ${role.className}`}
              >
                {role.label}
              </span>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#ff8a50] to-[#d4520f] font-display text-sm font-semibold text-white">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>

          <button
            onClick={() => setShowPasswordModal(true)}
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-orange-50 hover:text-[#f66315]"
            title="Đổi mật khẩu"
            aria-label="Đổi mật khẩu"
          >
            <KeyRound className="h-[18px] w-[18px]" />
          </button>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
            title="Đăng xuất"
            aria-label="Đăng xuất"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}

      {/* Hop thoai xac nhan dang xuat - Sequence 3.2.4.10.6 */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Xác nhận đăng xuất?</h3>
            <p className="mt-1 text-sm text-slate-500">
              Bạn có chắc chắn muốn kết thúc phiên làm việc quản trị hiện tại không?
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="h-10 flex-1 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="h-10 flex-1 rounded-lg bg-red-600 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {loggingOut ? "Đang xử lý..." : "Đăng xuất"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
