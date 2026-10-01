"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ArrowRight, AlertCircle, Warehouse, BarChart3, ShoppingCart } from "lucide-react";
import { BrandMark } from "@/components/layout/BrandLogo";
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

  const QUICK_ACCOUNTS = [
    { user: "admin@gmail.com", label: "Admin", desc: "Toàn quyền" },
    { user: "kho@gmail.com", label: "Quản lý kho", desc: "Nhập/xuất kho" },
    { user: "banhang@gmail.com", label: "Nhân viên", desc: "Xử lý đơn" },
  ];

  const inputClass =
    "h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition-all focus:border-[#f66315] focus:ring-4 focus:ring-orange-100";

  return (
    <div className="fixed inset-0 z-50 grid overflow-y-auto bg-white lg:grid-cols-2">
      {/* Cot trai: gioi thieu he thong */}
      <div className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="bg-grid-dark absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_left,black_20%,transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#f66315]/25 blur-[120px]" />

        <div className="relative flex items-center gap-3">
          <BrandMark className="h-10 w-10" />
          <span className="font-display text-xl font-bold">
            FB<span className="text-[#f66315]">Shop</span>
            <span className="ml-2 text-sm font-medium text-slate-400">Management</span>
          </span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight">
            Vận hành cửa hàng
            <br />
            <span className="text-gradient-brand">gọn gàng, chính xác.</span>
          </h2>
          <ul className="mt-10 space-y-4">
            {[
              { icon: Warehouse, text: "Phiếu nhập/xuất kho cập nhật tồn tức thì" },
              { icon: ShoppingCart, text: "Theo dõi đơn hàng và thanh toán" },
              { icon: BarChart3, text: "Báo cáo doanh thu và top bán chạy" },
            ].map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                  <f.icon className="h-4 w-4 text-[#ff8a50]" />
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Cot phai: form dang nhap */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <BrandMark className="h-11 w-11" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-slate-900 lg:mt-0">Đăng nhập quản trị</h1>

          {error && (
            <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="mt-8 space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Tên đăng nhập
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="fbshop-admin-user"
                  autoComplete="off"
                  placeholder="vd: admin@gmail.com"
                  value={tenDangNhap}
                  onChange={(e) => {
                    setTenDangNhap(e.target.value);
                    setError("");
                  }}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  name="fbshop-admin-pass"
                  autoComplete="new-password"
                  placeholder="••••••"
                  value={matKhau}
                  onChange={(e) => {
                    setMatKhau(e.target.value);
                    setError("");
                  }}
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-ink text-sm font-semibold text-white transition-all hover:bg-[#f66315] hover:shadow-brand disabled:opacity-50"
            >
              {loading ? "Đang xác thực..." : "Đăng nhập"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>
          {/* Dien nhanh tai khoan demo */}
          <div className="mt-8">
            <div className="grid grid-cols-3 gap-2">
              {QUICK_ACCOUNTS.map((acc) => (
                <button
                  key={acc.user}
                  type="button"
                  onClick={() => quickFill(acc.user)}
                  className={`rounded-xl border px-2 py-2.5 text-center transition-all hover:border-[#f66315] hover:bg-orange-50 ${
                    tenDangNhap === acc.user ? "border-[#f66315] bg-orange-50" : "border-slate-200"
                  }`}
                >
                  <span className="block text-[13px] font-semibold text-slate-800">{acc.label}</span>
                  <span className="block text-[11px] text-slate-500">{acc.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
