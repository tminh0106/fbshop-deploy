"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Lock, Phone, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const [soDienThoai, setSoDienThoai] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");
    setPasswordError("");
    setGeneralError("");

    let hasError = false;
    if (!soDienThoai.trim()) {
      setPhoneError("Vui lòng nhập số điện thoại");
      hasError = true;
    }
    if (!matKhau) {
      setPasswordError("Vui lòng nhập mật khẩu");
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soDienThoai: soDienThoai.trim(), matKhau }),
      });

      const data = await res.json();
      if (!res.ok) {
        setGeneralError(data.error || "Đăng nhập không thành công");
        toast.error(data.error || "Đăng nhập thất bại");
      } else {
        toast.success(`Chào mừng trở lại, ${data.customer.hoTen}!`);
        router.push(redirectUrl);
        router.refresh();
      }
    } catch {
      setGeneralError("Không thể kết nối máy chủ. Vui lòng thử lại!");
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#f66315] shadow-xs">
            <LogIn className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Đăng nhập tài khoản</h1>
          <p className="mt-1 text-sm text-gray-500">
            Trải nghiệm mua sắm vợt & phụ kiện cầu lông tại FBShop
          </p>
        </div>

        {generalError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3.5 text-center text-sm font-medium text-red-600">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700">
              Số điện thoại
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                placeholder="Ví dụ: 0912345678"
                value={soDienThoai}
                onChange={(e) => {
                  setSoDienThoai(e.target.value);
                  setPhoneError("");
                  setGeneralError("");
                }}
                className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all ${
                  phoneError
                    ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    : "border-gray-200 focus:border-[#f66315] focus:ring-2 focus:ring-orange-100"
                }`}
              />
            </div>
            {phoneError && <p className="mt-1.5 text-xs text-red-500">{phoneError}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                placeholder="Nhập mật khẩu..."
                value={matKhau}
                onChange={(e) => {
                  setMatKhau(e.target.value);
                  setPasswordError("");
                  setGeneralError("");
                }}
                className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all ${
                  passwordError
                    ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    : "border-gray-200 focus:border-[#f66315] focus:ring-2 focus:ring-orange-100"
                }`}
              />
            </div>
            {passwordError && <p className="mt-1.5 text-xs text-red-500">{passwordError}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f66315] py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? "Đang kiểm tra..." : "Đăng nhập"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="mt-6 border-t border-gray-100 pt-6 text-center text-sm text-gray-600 space-y-2.5">
          <div>
            Chưa có tài khoản?{" "}
            <Link
              href={`/dang-ky${redirectUrl !== "/" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
              className="font-bold text-[#f66315] transition-colors hover:text-orange-700"
            >
              Đăng ký ngay
            </Link>
          </div>
          <div className="text-xs text-gray-500 pt-2 border-t border-dashed border-gray-100">
            Dành cho Nhân viên & Quản trị:{" "}
            <Link href="/admin/login" className="font-semibold text-gray-800 hover:text-[#f66315] underline">
              Đăng nhập Cổng Quản Trị
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-400">Đang tải form đăng nhập...</div>}>
      <LoginForm />
    </Suspense>
  );
}