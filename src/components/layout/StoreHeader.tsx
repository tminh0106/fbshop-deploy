"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, User, LogOut, Package, UserCircle, ChevronDown } from "lucide-react";
import QuickSearchBar from "@/components/QuickSearchBar";
import { useCartStore } from "@/lib/cartStore";
import toast from "react-hot-toast";

interface CustomerInfo {
  maKH: string;
  hoTen: string;
  soDienThoai: string;
  email?: string;
  diaChi?: string;
}

export default function StoreHeader() {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const totalCartItems = useCartStore((state) => state.getTotalItems());

  useEffect(() => {
    setMounted(true);
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.customer) {
          setCustomer(data.customer);
        } else {
          setCustomer(null);
        }
      })
      .catch(() => setCustomer(null));
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setCustomer(null);
        setDropdownOpen(false);
        toast.success("Đăng xuất thành công!");
        router.push("/");
        router.refresh();
      }
    } catch {
      toast.error("Có lỗi xảy ra khi đăng xuất");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md shadow-xs">
      {/* Top bar mau cam */}
      <div className="fbshop-gradient py-1.5 text-center text-xs font-medium text-white">
        Miễn phí vận chuyển cho đơn hàng từ 1.000.000đ | Hotline: 0123.456.789
      </div>

      {/* Main header */}
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f66315] font-bold text-white text-lg shadow-sm">
            FB
          </div>
          <div>
            <span className="text-xl font-extrabold text-gray-900">
              FB<span className="text-[#f66315]">Shop</span>
            </span>
            <p className="text-[10px] text-gray-400 -mt-1">Chuyên gia cầu lông</p>
          </div>
        </Link>

        {/* Quick Search Bar */}
        <div className="hidden md:block flex-1 mx-8 max-w-2xl">
          <QuickSearchBar />
        </div>

        {/* Actions (Cart & Auth) */}
        <div className="flex items-center gap-3">
          {/* Cart Icon */}
          <Link
            href="/gio-hang"
            className="relative p-2 text-gray-700 transition-colors hover:text-[#f66315]"
            title="Giỏ hàng"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f66315] px-1 text-[10px] font-bold text-white shadow-xs">
              {mounted ? totalCartItems : 0}
            </span>
          </Link>

          {/* User Auth Dropdown */}
          {customer ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 transition-all hover:border-[#f66315] hover:text-[#f66315]"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-[#f66315] text-xs font-bold">
                  {customer.hoTen.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate text-xs font-semibold sm:text-sm">
                  {customer.hoTen}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-100 bg-white py-2 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <div className="border-b border-gray-100 px-4 py-2">
                    <p className="text-xs font-medium text-gray-400">Đã đăng nhập với SĐT</p>
                    <p className="text-xs font-bold text-gray-800">{customer.soDienThoai}</p>
                  </div>

                  <Link
                    href="/tai-khoan"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-orange-50 hover:text-[#f66315]"
                  >
                    <UserCircle className="h-4 w-4 text-gray-500" />
                    Tài khoản của tôi
                  </Link>

                  <Link
                    href="/tai-khoan/don-hang"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-orange-50 hover:text-[#f66315]"
                  >
                    <Package className="h-4 w-4 text-gray-500" />
                    Đơn hàng của tôi
                  </Link>

                  <div className="my-1 border-t border-gray-100" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/dang-nhap"
              className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3.5 py-1.5 text-sm font-medium text-gray-700 transition-all hover:border-[#f66315] hover:text-[#f66315]"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="block md:hidden px-4 pb-3">
        <QuickSearchBar />
      </div>
    </header>
  );
}