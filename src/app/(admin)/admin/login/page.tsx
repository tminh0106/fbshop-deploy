"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, User, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminLoginPage() {
  const router = useRouter();
  const [tenDangNhap, setTenDangNhap] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!tenDangNhap.trim()) {
      setError("Vui lòng nhập tên đăng nhập hoặc email");
      return;
    }
    if (!matKhau) {
      setError("Vui lòng nhập mật khẩu");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenDangNhap: tenDangNhap.trim(), matKhau }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Tên đăng nhập hoặc mật khẩu không đúng");
        toast.error(data.error || "Đăng nhập thất bại");
      } else {
        toast.success(`Xin chào, ${data.user.hoTen} (${data.user.role})!`);
        router.push("/admin");
        router.refresh();
      }
    } catch {
      setError("Không thể kết nối máy chủ quản trị. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (user: string, pass: string = "123456") => {
    setTenDangNhap(user);
    setMatKhau(pass);
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1117] px-4">
      <div className="w-full max-w-md">
        {/* Box Dang nhap */}
        <div className="rounded-3xl border border-white/10 bg-[#161b22] p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#e55000] to-[#f66315] text-white shadow-lg shadow-orange-950/40">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              FB<span className="text-[#f66315]">Shop</span> Management
            </h1>
            <p className="mt-1 text-xs text-gray-400">
              Cổng đăng nhập Quản trị viên & Nhân viên kho bãi
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs font-semibold text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Tài khoản đăng nhập
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="admin, quanlykho, hoặc nhanvien"
                  value={tenDangNhap}
                  onChange={(e) => {
                    setTenDangNhap(e.target.value);
                    setError("");
                  }}
                  className="w-full rounded-xl border border-white/10 bg-[#0d1117] py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-gray-600 outline-none transition-all focus:border-[#f66315] focus:ring-1 focus:ring-[#f66315]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  placeholder="Mật khẩu bảo mật"
                  value={matKhau}
                  onChange={(e) => {
                    setMatKhau(e.target.value);
                    setError("");
                  }}
                  className="w-full rounded-xl border border-white/10 bg-[#0d1117] py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-gray-600 outline-none transition-all focus:border-[#f66315] focus:ring-1 focus:ring-[#f66315]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e55000] to-[#f66315] py-3 text-xs font-bold text-white shadow-lg shadow-orange-950/40 transition-all hover:brightness-110 disabled:opacity-50"
            >
              <span>{loading ? "Đang xác thực..." : "Đăng nhập hệ thống"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick login helper tags */}
          <div className="mt-8 border-t border-white/10 pt-5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 mb-2.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Nhấn để điền tài khoản test nhanh (MK: 123456):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => quickFill("admin")}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-gray-300 hover:bg-white/15 hover:text-white transition-all"
              >
                👑 Admin (Toàn quyền)
              </button>
              <button
                type="button"
                onClick={() => quickFill("quanlykho")}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-gray-300 hover:bg-white/15 hover:text-white transition-all"
              >
                📦 Quản lý kho
              </button>
              <button
                type="button"
                onClick={() => quickFill("nhanvien")}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-gray-300 hover:bg-white/15 hover:text-white transition-all"
              >
                💼 Nhân viên
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-gray-400">
          Đồ án tốt nghiệp FBShop • Microsoft SQL Server & Next.js App Router
        </p>
      </div>
    </div>
  );
}
