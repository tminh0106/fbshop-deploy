import Link from "next/link";
import prisma from "@/lib/db";
import { createSlug } from "@/lib/utils";
import ProductCard from "@/components/ProductCard";
import StoreLayout from "@/app/(store)/layout";
import type { ProductItem } from "@/lib/types";
import { ChevronRight, Truck, Shield, Headphones, RotateCcw, ArrowRight } from "lucide-react";

export const revalidate = 0; // Luon lay du lieu moi nhat

const CATEGORIES = [
  { name: "Vợt Yonex", href: "/san-pham?category=DM_YONEX", icon: "🏸" },
  { name: "Vợt Lining", href: "/san-pham?category=DM_LINING", icon: "🏸" },
  { name: "Vợt Victor", href: "/san-pham?category=DM_VICTOR", icon: "🏸" },
  { name: "Vợt Mizuno", href: "/san-pham?category=DM_MIZUNO", icon: "🏸" },
  { name: "Giày cầu lông", href: "/san-pham?category=DM_GIAY", icon: "👟" },
  { name: "Balo & Bao vợt", href: "/san-pham?category=DM_BALO", icon: "🎒" },
  { name: "Phụ kiện", href: "/san-pham?category=DM_PHUKIEN", icon: "🔧" },
];

export default async function HomePage() {
  // Lay 8 san pham con hang tu CSDL SQL Server thuc te
  let featuredProducts: ProductItem[] = [];
  try {
    const dbProducts = await prisma.sanPham.findMany({
      where: { SoLuong: { gt: 0 } },
      take: 8,
      orderBy: { TenSP: "asc" },
    });

    featuredProducts = dbProducts.map((p) => {
      const priceNum = Number(p.GiaBan);
      return {
        id: p.MaSP,
        name: p.TenSP,
        slug: createSlug(p.TenSP),
        price: priceNum,
        imageUrl: p.HinhAnh || "/images/placeholder.png",
        weight: p.TrongLuong || undefined,
        description: p.MoTa || undefined,
        categoryId: p.MaDanhMuc,
        stock: p.SoLuong,
        isBestSeller: p.SoLuong > 12,
        discountPercent: p.SoLuong > 15 ? 8 : undefined,
        originalPrice: p.SoLuong > 15 ? Math.round(priceNum * 1.08) : undefined,
      };
    });
  } catch (error) {
    console.error("Loi truy van san pham trang chu:", error);
  }

  return (
    <StoreLayout>
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] py-16 lg:py-24 text-white">
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mb-4 inline-block rounded-full bg-[#f66315]/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#ff8a50] border border-[#f66315]/30">
              🏸 Số 1 Việt Nam về Dụng Cụ Cầu Lông
            </span>
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Nâng Tầm Đẳng Cấp <br />
              <span className="text-[#f66315]">Cú Đập Cầu Hoàn Hảo</span>
            </h1>
            <p className="mt-4 text-base text-gray-300 sm:text-lg">
              Phân phối chính hãng Yonex, Lining, Victor, Mizuno với bảo hành chính hãng 12 tháng. Căng cước chuẩn thi đấu quốc tế.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/san-pham"
                className="flex items-center gap-2 rounded-xl bg-[#f66315] px-7 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-orange-700 hover:scale-105"
              >
                <span>Khám phá ngay</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/san-pham?category=DM_YONEX"
                className="rounded-xl border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                Vợt Yonex mới nhất
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES BAR ===== */}
      <section className="border-b border-gray-100 bg-gray-50/70 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none sm:justify-center">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="flex shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition-all hover:border-[#f66315] hover:bg-orange-50 hover:text-[#f66315] shadow-2xs"
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED PRODUCTS ===== */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight sm:text-3xl">
              Sản phẩm nổi bật
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Những cây vợt chất lượng cao được tuyển chọn tại hệ thống FBShop
            </p>
          </div>
          <Link
            href="/san-pham"
            className="flex items-center gap-1 text-sm font-bold text-[#f66315] transition-colors hover:text-orange-700"
          >
            <span>Xem tất cả</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-500 text-sm">Chưa có sản phẩm nổi bật nào được kích hoạt.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} stock={product.stock} />
            ))}
          </div>
        )}
      </section>

      {/* ===== USP BAR ===== */}
      <section className="border-t border-b border-gray-100 bg-gray-50/60 py-10">
        <div className="container mx-auto grid grid-cols-2 gap-4 px-4 lg:grid-cols-4 sm:gap-6">
          {[
            { icon: Truck, title: "Miễn phí vận chuyển", desc: "Cho đơn hàng từ 1.000.000đ" },
            { icon: Shield, title: "Hàng chính hãng 100%", desc: "Bảo hành tiêu chuẩn 12 tháng" },
            { icon: RotateCcw, title: "Đổi trả 7 ngày", desc: "Đổi mới nếu phát sinh lỗi kỹ thuật" },
            { icon: Headphones, title: "Tư vấn chuyên sâu", desc: "Hỗ trợ chọn vợt hợp lối chơi" },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-3.5 rounded-2xl bg-white p-4 shadow-2xs border border-gray-100"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#f66315]">
                <item.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-900">{item.title}</p>
                <p className="text-[11px] text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </StoreLayout>
  );
}