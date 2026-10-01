import Link from "next/link";
import { ArrowUpRight, Banknote, Truck } from "lucide-react";
import { BrandMark } from "@/components/layout/BrandLogo";

// Chan trang kieu fbshop.vn: nen hong dao, hang lien he chu cam, cot ho tro / danh muc / thanh toan
// Thong tin lien he la cua du an (khong dung thong tin that cua fbshop.vn)

const CONTACTS = [
  { label: "Tư vấn và CSKH", value: "0123.456.789", href: "tel:0123456789" },
  { label: "Email liên hệ", value: "contact@fbshop.vn", href: "mailto:contact@fbshop.vn" },
  { label: "Giờ mở cửa", value: "8:00 – 21:30", href: undefined },
  { label: "Xem cửa hàng", value: "Thanh Xuân, Hà Nội", href: undefined },
];

const CATEGORY_LINKS = [
  { label: "Vợt cầu lông Yonex", href: "/san-pham?category=DM_YONEX" },
  { label: "Vợt cầu lông Lining", href: "/san-pham?category=DM_LINING" },
  { label: "Vợt cầu lông Victor", href: "/san-pham?category=DM_VICTOR" },
  { label: "Giày cầu lông", href: "/san-pham?category=DM_GIAY" },
  { label: "Balo & Bao vợt", href: "/san-pham?category=DM_BALO" },
];

const SUPPORT_LINKS = [
  { label: "Tất cả sản phẩm", href: "/san-pham" },
  { label: "Giỏ hàng", href: "/gio-hang" },
  { label: "Tài khoản của tôi", href: "/tai-khoan" },
  { label: "Tra cứu đơn hàng", href: "/tai-khoan/don-hang" },
];

export default function StoreFooter() {
  return (
    <footer id="lien-he" className="scroll-mt-32 bg-gradient-to-br from-[#fdeee7] via-[#fdf3ee] to-[#fdf8f5] text-navy">
      <div className="container grid gap-10 py-12 lg:grid-cols-[280px_1fr] lg:gap-0">
        {/* Cot trai: thong tin cua hang */}
        <div className="lg:border-r lg:border-[#f66315]/15 lg:pr-10">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark className="h-12 w-12" />
            <span className="font-display text-xl font-bold">
              FB<span className="text-[#f66315]">SHOP</span>
            </span>
          </Link>
          <p className="mt-5 text-sm font-semibold">Hệ thống cửa hàng cầu lông FBShop</p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
            <li>
              <span className="font-semibold text-navy">Địa chỉ</span> 277 Đ. Nguyễn Trãi, Thanh Xuân, Hà Nội
            </li>
            <li>
              <span className="font-semibold text-navy">Hotline</span> 0123.456.789
            </li>
            <li>
              <span className="font-semibold text-navy">Email</span> contact@fbshop.vn
            </li>
          </ul>
        </div>

        <div className="lg:pl-10">
          {/* Hang lien he chu cam */}
          <div className="grid grid-cols-2 gap-6 border-b border-[#f66315]/15 pb-8 lg:grid-cols-4">
            {CONTACTS.map((c) => (
              <div key={c.label}>
                <p className="text-sm text-slate-600">{c.label}</p>
                {c.href ? (
                  <a href={c.href} className="mt-1 block text-lg font-bold text-[#f66315] hover:underline">
                    {c.value}
                  </a>
                ) : (
                  <p className="mt-1 text-lg font-bold text-[#f66315]">{c.value}</p>
                )}
              </div>
            ))}
          </div>

          {/* Cot ho tro / danh muc / thanh toan */}
          <div className="grid gap-8 pt-8 sm:grid-cols-3">
            <div>
              <h3 className="text-base font-semibold">Hỗ trợ khách hàng</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                {SUPPORT_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="transition-colors hover:text-[#f66315]">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-base font-semibold">Danh mục sản phẩm</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                {CATEGORY_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="transition-colors hover:text-[#f66315]">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-base font-semibold">Hình thức thanh toán</h3>
              <div className="mt-4 flex flex-col items-start gap-2">
                <span className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
                  <Truck className="h-4 w-4 text-[#f66315]" />
                  Thanh toán khi nhận hàng (COD)
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
                  <Banknote className="h-4 w-4 text-[#f66315]" />
                  Chuyển khoản / ví điện tử (VietQR)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#f66315]/15">
        <div className="container flex flex-col items-center justify-between gap-2 py-4 text-xs text-slate-500 sm:flex-row">
          <p>© 2026 FBShop. Bảo lưu mọi quyền.</p>
          <Link href="/admin" className="flex items-center gap-1 font-medium hover:text-[#f66315]">
            Trang quản trị
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
