"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ShoppingCart, User, LogOut, Package, UserCircle, ChevronDown } from "lucide-react";
import QuickSearchBar from "@/components/QuickSearchBar";
import { BrandMark } from "@/components/layout/BrandLogo";
import { useCartStore } from "@/lib/cartStore";
import toast from "react-hot-toast";

interface CustomerInfo {
  maKH: string;
  hoTen: string;
  soDienThoai: string;
  email?: string;
  diaChi?: string;
}

// Danh muc trong menu tha xuong "San pham" (ma khop bang DanhMuc)
const PRODUCT_MENU = [
  { label: "Vợt cầu lông Yonex", category: "DM_YONEX" },
  { label: "Vợt cầu lông Lining", category: "DM_LINING" },
  { label: "Vợt cầu lông Victor", category: "DM_VICTOR" },
  { label: "Vợt cầu lông Mizuno", category: "DM_MIZUNO" },
  { label: "Giày cầu lông", category: "DM_GIAY" },
  { label: "Balo & Bao vợt", category: "DM_BALO" },
  { label: "Phụ kiện cầu lông", category: "DM_PHUKIEN" },
];

// Menu chinh (chu in hoa, can giua - theo bo cuc fbshop.vn)
const NAV_ITEMS = [
  { label: "Trang chủ", href: "/", match: "home" },
  { label: "Sản phẩm", href: "/san-pham", match: "all", dropdown: true },
  { label: "Vợt Yonex", href: "/san-pham?category=DM_YONEX", match: "DM_YONEX" },
  { label: "Vợt Lining", href: "/san-pham?category=DM_LINING", match: "DM_LINING" },
  { label: "Vợt Victor", href: "/san-pham?category=DM_VICTOR", match: "DM_VICTOR" },
  { label: "Giày cầu lông", href: "/san-pham?category=DM_GIAY", match: "DM_GIAY" },
  { label: "Liên hệ", href: "#lien-he", match: "contact" },
];

const circleBtn =
  "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#f66315]/60 text-[#f66315] transition-colors hover:bg-[#f66315] hover:text-white";

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

  const cartCount = mounted ? totalCartItems : 0;

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-[0_2px_12px_rgba(3,18,48,0.06)]">
      {/* Hang tren: logo - tim kiem - tai khoan/gio hang */}
      <div className="container flex h-[76px] items-center gap-4 lg:gap-16">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="FBShop - Trang chủ">
          <BrandMark className="h-11 w-11" />
          <span className="hidden font-display text-lg font-bold leading-none text-navy sm:block lg:hidden xl:block">
            FB<span className="text-[#f66315]">SHOP</span>
          </span>
        </Link>

        <div className="hidden flex-1 md:block">
          <QuickSearchBar />
        </div>

        <div className="ml-auto flex items-center gap-2.5 md:ml-0">
          {/* Tai khoan */}
          {customer ? (
            <div className="relative" onMouseLeave={() => setDropdownOpen(false)}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={circleBtn + " font-display text-sm font-bold"}
                title={customer.hoTen}
                aria-label="Tài khoản"
              >
                {customer.hoTen.charAt(0).toUpperCase()}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full z-50 pt-2">
                  <div className="w-60 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-lift">
                    <div className="bg-primary-soft px-4 py-3">
                      <p className="truncate text-sm font-semibold text-navy">{customer.hoTen}</p>
                      <p className="font-mono text-xs text-slate-500">{customer.soDienThoai}</p>
                    </div>
                    <div className="p-1.5">
                      <Link
                        href="/tai-khoan"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-navy transition-colors hover:bg-primary-soft hover:text-[#f66315]"
                      >
                        <UserCircle className="h-4 w-4" />
                        Tài khoản của tôi
                      </Link>
                      <Link
                        href="/tai-khoan/don-hang"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-navy transition-colors hover:bg-primary-soft hover:text-[#f66315]"
                      >
                        <Package className="h-4 w-4" />
                        Đơn hàng của tôi
                      </Link>
                      <div className="my-1 border-t border-slate-100" />
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/dang-nhap" className={circleBtn} title="Đăng nhập" aria-label="Đăng nhập">
              <User className="h-[18px] w-[18px]" strokeWidth={2.2} />
            </Link>
          )}

          {/* Gio hang */}
          <Link href="/gio-hang" className={circleBtn} title="Giỏ hàng" aria-label="Giỏ hàng">
            <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={2.2} />
            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {cartCount}
            </span>
          </Link>
        </div>
      </div>

      {/* Tim kiem tren mobile */}
      <div className="container block pb-3 md:hidden">
        <QuickSearchBar />
      </div>

      {/* Menu chinh */}
      <nav className="hidden border-t border-slate-100 md:block">
        <div className="container">
          <Suspense fallback={<NavList active={null} />}>
            <NavWithState />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}

function NavWithState() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  let active: string | null = null;
  if (pathname === "/") active = "home";
  else if (pathname === "/san-pham") active = searchParams.get("category") || "all";
  return <NavList active={active} />;
}

function NavList({ active }: { active: string | null }) {
  // Bam chon 1 muc trong menu tha xuong -> dong ngay (khong doi chuot roi di)
  const [menuClosed, setMenuClosed] = useState(false);
  return (
    <ul className="flex h-12 items-center justify-center gap-1 lg:gap-6">
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.match;
        const linkClass = `relative flex h-12 items-center gap-1.5 px-2.5 text-[13px] font-semibold uppercase tracking-wide transition-colors ${
          isActive ? "text-[#f66315]" : "text-navy hover:text-[#f66315]"
        }`;
        const underline = (
          <span
            className={`absolute inset-x-2.5 bottom-0 h-[2px] bg-[#f66315] transition-transform ${
              isActive ? "scale-x-100" : "scale-x-0"
            }`}
          />
        );

        if (item.dropdown) {
          return (
            <li key={item.href} className="group relative" onMouseLeave={() => setMenuClosed(false)}>
              <Link href={item.href} className={linkClass}>
                {item.label}
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
                {underline}
              </Link>
              <div
                className={`invisible absolute left-0 top-full z-50 w-60 translate-y-1 pt-1 opacity-0 transition-all ${
                  menuClosed ? "" : "group-hover:visible group-hover:translate-y-0 group-hover:opacity-100"
                }`}
              >
                <ul className="overflow-hidden rounded-lg border border-slate-100 bg-white py-1.5 shadow-lift">
                  {PRODUCT_MENU.map((m) => (
                    <li key={m.category}>
                      <Link
                        href={`/san-pham?category=${m.category}`}
                        onClick={() => setMenuClosed(true)}
                        className="block px-4 py-2.5 text-sm text-navy transition-colors hover:bg-primary-soft hover:text-[#f66315]"
                      >
                        {m.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        }

        return (
          <li key={item.href}>
            <Link href={item.href} className={linkClass}>
              {item.label}
              {underline}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
