"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User, ShieldCheck, AlertCircle, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";

interface AdminHeaderProps {
  user?: {
    tenDangNhap?: string;
    hoTen?: string;
    role?: string;
  } | null;
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter();
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

  const roleName = user?.role || "Admin";
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-rose-500/10 text-rose-600 border-rose-200";
      case "QuanLyKho":
        return "bg-blue-500/10 text-blue-600 border-blue-200";
      default:
        return "bg-amber-500/10 text-amber-600 border-amber-200";
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/95 backdrop-blur-md px-6 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h1 className="text-sm font-bold text-gray-800 tracking-tight">
            HỆ THỐNG QUẢN LÝ FBSHOP (SQL SERVER & NEXT.JS)
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Link to storefront */}
          <Link
            href="/"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-black transition-all"
          >
            <ShoppingBag className="h-3.5 w-3.5 text-[#f66315]" />
            Website bán hàng
          </Link>

          {/* User badge */}
          <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white p-1 pl-3 shadow-xs">
            <div className="text-right">
              <p className="text-xs font-bold text-gray-900 leading-tight">
                {user?.hoTen || user?.tenDangNhap || "Quản trị viên"}
              </p>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span
                  className={`rounded-md border px-1.5 py-0.2 text-[10px] font-bold uppercase ${getRoleBadge(
                    roleName
                  )}`}
                >
                  {roleName}
                </span>
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-[#f66315]">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-xs font-bold text-red-600 transition-all hover:bg-red-100 hover:text-red-700"
            title="Đăng xuất"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Confirmation Modal - Sequence 3.2.4.10.6 */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-center text-lg font-bold text-gray-900">
              Xác nhận đăng xuất?
            </h3>
            <p className="mt-1 text-center text-xs text-gray-500">
              Bạn có chắc chắn muốn kết thúc phiên làm việc quản trị hiện tại không?
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 rounded-xl border border-gray-300 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition-all shadow-md shadow-red-200 disabled:opacity-50"
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
