import Link from "next/link";

export default function StoreFooter() {
  return (
    <footer className="bg-[#1a1a2e] py-12 text-gray-400">
      <div className="container mx-auto grid gap-8 px-4 md:grid-cols-4">
        {/* Cot 1: Gioi thieu */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f66315] font-bold text-white text-sm">
              FB
            </div>
            <span className="text-lg font-extrabold text-white">
              FB<span className="text-[#f66315]">Shop</span>
            </span>
          </div>
          <p className="text-sm leading-relaxed text-gray-400">
            Hệ thống cửa hàng cầu lông uy tín hàng đầu Việt Nam. Cung cấp dụng cụ cầu lông chính hãng từ các thương hiệu hàng đầu thế giới.
          </p>
        </div>

        {/* Cot 2: Thuong hieu */}
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Thương hiệu</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/san-pham?category=DM_YONEX" className="hover:text-[#f66315] transition-colors">
                Yonex
              </Link>
            </li>
            <li>
              <Link href="/san-pham?category=DM_LINING" className="hover:text-[#f66315] transition-colors">
                Lining
              </Link>
            </li>
            <li>
              <Link href="/san-pham?category=DM_VICTOR" className="hover:text-[#f66315] transition-colors">
                Victor
              </Link>
            </li>
            <li>
              <Link href="/san-pham?category=DM_MIZUNO" className="hover:text-[#f66315] transition-colors">
                Mizuno
              </Link>
            </li>
          </ul>
        </div>

        {/* Cot 3: Chinh sach */}
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Chính sách</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="#" className="hover:text-[#f66315] transition-colors">
                Chính sách đổi trả
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-[#f66315] transition-colors">
                Chính sách bảo hành
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-[#f66315] transition-colors">
                Chính sách vận chuyển
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-[#f66315] transition-colors">
                Chính sách bảo mật
              </Link>
            </li>
          </ul>
        </div>

        {/* Cot 4: Lien he */}
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Liên hệ</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>277 Đ. Nguyễn Trãi, Thanh Xuân, Hà Nội</li>
            <li>Hotline: 0123.456.789</li>
            <li>Email: contact@fbshop.vn</li>
          </ul>
        </div>
      </div>

      <div className="container mx-auto mt-8 border-t border-gray-800 px-4 pt-6 text-center text-xs text-gray-500">
        &copy; 2026 FBShop. All rights reserved. | Đồ án môn học - Hệ thống thông tin | <Link href="/admin" className="text-gray-400 hover:text-[#f66315] font-semibold underline underline-offset-2 ml-1">Trang Quản trị Admin</Link>
      </div>
    </footer>
  );
}