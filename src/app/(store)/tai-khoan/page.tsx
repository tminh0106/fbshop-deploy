"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserCircle, Package, LogOut, Phone, Mail, MapPin, Save, User } from "lucide-react";
import toast from "react-hot-toast";

interface CustomerInfo {
  maKH: string;
  hoTen: string;
  soDienThoai: string;
  email?: string;
  diaChi?: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [hoTen, setHoTen] = useState("");
  const [email, setEmail] = useState("");
  const [diaChi, setDiaChi] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.customer) {
          toast.error("Vui lòng đăng nhập để xem thông tin tài khoản");
          router.push("/dang-nhap?redirect=/tai-khoan");
        } else {
          setCustomer(data.customer);
          setHoTen(data.customer.hoTen || "");
          setEmail(data.customer.email || "");
          diaChi ? null : setDiaChi(data.customer.diaChi || "");
          setLoading(false);
        }
      })
      .catch(() => {
        router.push("/dang-nhap?redirect=/tai-khoan");
      });
  }, [router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hoTen.trim()) {
      toast.error("Họ tên không được để trống");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hoTen: hoTen.trim(),
          email: email.trim() || undefined,
          diaChi: diaChi.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Cập nhật thất bại");
      } else {
        setCustomer(data.customer);
        toast.success("Cập nhật thông tin thành công!");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        toast.success("Đăng xuất thành công!");
        router.push("/dang-nhap");
        router.refresh();
      }
    } catch {
      toast.error("Lỗi khi đăng xuất");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-t-[#f66315]" />
        <p className="mt-4 text-sm text-gray-500">Đang tải thông tin tài khoản...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Tieu de */}
      <div className="mb-8">
        <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900 sm:text-3xl">
          Quản lý tài khoản
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Cập nhật thông tin cá nhân và quản lý lịch sử mua hàng
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        {/* ================= SIDEBAR MENU TRAI ================= */}
        <aside className="md:col-span-1">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-1">
            <div className="mb-4 flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 font-bold text-lg text-[#f66315]">
                {customer?.hoTen.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-gray-900 text-sm">{customer?.hoTen}</p>
                <p className="text-xs text-gray-500">{customer?.soDienThoai}</p>
              </div>
            </div>

            <Link
              href="/tai-khoan"
              className="flex items-center gap-2.5 rounded-xl bg-orange-50 px-3.5 py-2.5 text-sm font-bold text-[#f66315]"
            >
              <UserCircle className="h-4 w-4" />
              Thông tin cá nhân
            </Link>

            <Link
              href="/tai-khoan/don-hang"
              className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              <Package className="h-4 w-4" />
              Đơn hàng của tôi
            </Link>

            <div className="border-t border-gray-100 pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          </div>
        </aside>

        {/* ================= CONTENT PHAI: FORM THONG TIN ================= */}
        <section className="md:col-span-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6">
              Thông tin khách hàng
            </h2>

            <form onSubmit={handleUpdate} className="space-y-5 max-w-xl">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Họ và tên
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={hoTen}
                    onChange={(e) => setHoTen(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-[#f66315] focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Số điện thoại đăng ký (Cố định)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={customer?.soDienThoai || ""}
                    disabled
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm font-medium text-gray-500 cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  Số điện thoại được dùng làm tên đăng nhập tài khoản.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-[#f66315] focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Địa chỉ giao hàng mặc định
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    rows={3}
                    placeholder="Nhập địa chỉ nhận hàng của bạn..."
                    value={diaChi}
                    onChange={(e) => setDiaChi(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-[#f66315] focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-[#f66315] px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-orange-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Đang lưu thay đổi..." : "Cập nhật thông tin"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}