"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { UserPlus, User, Phone, Mail, MapPin, Lock, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { EMAIL_ERROR, EMAIL_REGEX } from "@/lib/validation";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const [hoTen, setHoTen] = useState("");
  const [soDienThoai, setSoDienThoai] = useState("");
  const [email, setEmail] = useState("");
  const [diaChi, setDiaChi] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [xacNhanMatKhau, setXacNhanMatKhau] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!hoTen.trim()) errs.hoTen = "Họ và tên không được để trống";

    const phoneRegex = /^0\d{9}$/;
    if (!soDienThoai.trim()) {
      errs.soDienThoai = "Số điện thoại không được để trống";
    } else if (!phoneRegex.test(soDienThoai.trim())) {
      errs.soDienThoai = "Số điện thoại phải gồm đúng 10 số và bắt đầu bằng số 0";
    }

    if (!email.trim()) {
      errs.email = "Email không được để trống";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errs.email = EMAIL_ERROR;
    }

    if (!matKhau) {
      errs.matKhau = "Mật khẩu không được để trống";
    } else if (matKhau.length < 6) {
      errs.matKhau = "Mật khẩu tối thiểu phải từ 6 ký tự";
    }

    if (!xacNhanMatKhau) {
      errs.xacNhanMatKhau = "Vui lòng xác nhận lại mật khẩu";
    } else if (matKhau !== xacNhanMatKhau) {
      errs.xacNhanMatKhau = "Mật khẩu xác nhận không khớp";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hoTen: hoTen.trim(),
          soDienThoai: soDienThoai.trim(),
          email: email.trim(),
          diaChi: diaChi.trim() || undefined,
          matKhau,
          xacNhanMatKhau,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setGeneralError(data.error || "Đăng ký thất bại");
        toast.error(data.error || "Đăng ký thất bại");
      } else {
        toast.success(`Đăng ký thành công! Chào mừng ${data.customer.hoTen}`);
        router.push(redirectUrl);
        router.refresh();
      }
    } catch {
      setGeneralError("Không thể kết nối máy chủ. Vui lòng thử lại!");
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4 py-16">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200/70 bg-white p-8 shadow-lift sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#f66315] shadow-xs">
            <UserPlus className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Đăng ký tài khoản</h1>
        </div>

        {generalError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3.5 text-center text-sm font-medium text-red-600">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Ví dụ: Nguyễn Văn A"
                maxLength={100}
                value={hoTen}
                onChange={(e) => setHoTen(e.target.value)}
                className={`w-full rounded-xl border h-11 pl-10 pr-4 text-sm outline-none transition-all ${
                  errors.hoTen
                    ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    : "border-slate-200 focus:border-[#f66315] focus:ring-4 focus:ring-orange-100"
                }`}
              />
            </div>
            {errors.hoTen && <p className="mt-1 text-xs text-red-500">{errors.hoTen}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  placeholder="0912345678"
                  value={soDienThoai}
                  onChange={(e) => setSoDienThoai(e.target.value)}
                  className={`w-full rounded-xl border h-11 pl-10 pr-4 text-sm outline-none transition-all ${
                    errors.soDienThoai
                      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      : "border-slate-200 focus:border-[#f66315] focus:ring-4 focus:ring-orange-100"
                  }`}
                />
              </div>
              {errors.soDienThoai && (
                <p className="mt-1 text-xs text-red-500">{errors.soDienThoai}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="name@gmail.com"
                  maxLength={100}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full rounded-xl border h-11 pl-10 pr-4 text-sm outline-none transition-all ${
                    errors.email
                      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      : "border-slate-200 focus:border-[#f66315] focus:ring-4 focus:ring-orange-100"
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Địa chỉ nhận hàng (tùy chọn)
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <textarea
                rows={2}
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
                maxLength={255}
                value={diaChi}
                onChange={(e) => setDiaChi(e.target.value)}
                className="w-full rounded-xl border border-slate-200 h-11 pl-10 pr-4 text-sm outline-none transition-all focus:border-[#f66315] focus:ring-4 focus:ring-orange-100"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={matKhau}
                  onChange={(e) => setMatKhau(e.target.value)}
                  className={`w-full rounded-xl border h-11 pl-10 pr-4 text-sm outline-none transition-all ${
                    errors.matKhau
                      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      : "border-slate-200 focus:border-[#f66315] focus:ring-4 focus:ring-orange-100"
                  }`}
                />
              </div>
              {errors.matKhau && <p className="mt-1 text-xs text-red-500">{errors.matKhau}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Nhập lại mật khẩu"
                  value={xacNhanMatKhau}
                  onChange={(e) => setXacNhanMatKhau(e.target.value)}
                  className={`w-full rounded-xl border h-11 pl-10 pr-4 text-sm outline-none transition-all ${
                    errors.xacNhanMatKhau
                      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      : "border-slate-200 focus:border-[#f66315] focus:ring-4 focus:ring-orange-100"
                  }`}
                />
              </div>
              {errors.xacNhanMatKhau && (
                <p className="mt-1 text-xs text-red-500">{errors.xacNhanMatKhau}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f66315] py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#d4520f] disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Đăng ký tài khoản"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-6 text-center text-sm text-slate-600">
          Đã có tài khoản?{" "}
          <Link
            href={`/dang-nhap${redirectUrl !== "/" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
            className="font-bold text-[#f66315] transition-colors hover:text-[#d4520f]"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Đang tải form đăng ký...</div>}>
      <RegisterForm />
    </Suspense>
  );
}