import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/db";
import { createSlug } from "@/lib/utils";
import ProductCard from "@/components/ProductCard";
import HeroSlider, { type HeroVoucher } from "@/components/HeroSlider";
import QuickSearchBar from "@/components/QuickSearchBar";
import StoreLayout from "@/app/(store)/layout";
import type { ProductItem } from "@/lib/types";
import { ArrowUpRight, ShieldCheck, Truck, RotateCcw } from "lucide-react";

export const revalidate = 0; // Luon lay du lieu moi nhat

// The danh muc (luoi 4x2): moi the 1 anh san pham nen trang dai dien + nen mau nhat rieng
const CATEGORY_TILES = [
  { name: "Vợt cầu lông Yonex", category: "DM_YONEX", image: "/products/sp-ax100zz.jpg", tint: "bg-[#fff1e8]", racket: true },
  { name: "Vợt cầu lông Lining", category: "DM_LINING", image: "/products/sp-tec9.png", tint: "bg-[#fdf5e3]", racket: true },
  { name: "Vợt cầu lông Victor", category: "DM_VICTOR", image: "/banner/danh-muc-victor.webp", tint: "bg-[#e9f4ff]", racket: true },
  { name: "Vợt cầu lông Mizuno", category: "DM_MIZUNO", image: "/products/sp-jpx8f.jpg", tint: "bg-[#ecf7ee]", racket: true },
  { name: "Giày cầu lông", category: "DM_GIAY", image: "/products/sp-p9200chp.webp", tint: "bg-[#f1eefe]", racket: false },
  { name: "Balo & Bao vợt", category: "DM_BALO", image: "/products/sp-bag926b.webp", tint: "bg-[#fdeef3]", racket: false },
  { name: "Phụ kiện cầu lông", category: "DM_PHUKIEN", image: "/products/sp-ac102ex.webp", tint: "bg-[#e9f8f4]", racket: false },
  { name: "Tất cả sản phẩm", category: "", image: "", tint: "", racket: false },
];
// Anh ghep cho the "Tat ca san pham": vot - giay - balo
const ALL_TILE_IMAGES = ["/products/sp-saga3pro.webp", "/banner/danh-muc-victor.webp", "/products/sp-ba22926t.webp"];

// Cac khu san pham tren trang chu: moi khu 1 the quang cao + luoi toi da 6 san pham
const SECTIONS = [
  { title: "Vợt cầu lông", categories: ["DM_YONEX", "DM_LINING", "DM_VICTOR", "DM_MIZUNO"], href: "/san-pham", promo: "Vợt cầu lông", promoSub: "Badminton rackets" },
  { title: "Vợt cầu lông Yonex", categories: ["DM_YONEX"], href: "/san-pham?category=DM_YONEX", promo: "Vợt Yonex", promoSub: "Yonex rackets" },
  { title: "Vợt cầu lông Lining", categories: ["DM_LINING"], href: "/san-pham?category=DM_LINING", promo: "Vợt Lining", promoSub: "Li-Ning rackets" },
  { title: "Vợt cầu lông Victor", categories: ["DM_VICTOR"], href: "/san-pham?category=DM_VICTOR", promo: "Vợt Victor", promoSub: "Victor rackets" },
  { title: "Giày cầu lông", categories: ["DM_GIAY"], href: "/san-pham?category=DM_GIAY", promo: "Giày cầu lông", promoSub: "Badminton shoes" },
  { title: "Balo cầu lông", categories: ["DM_BALO"], href: "/san-pham?category=DM_BALO", promo: "Balo cầu lông", promoSub: "Badminton bags" },
];
const MIN_SECTION_PRODUCTS = 3;

// Chi cac hang cua hang dang phan phoi (khop du lieu danh muc)
const PARTNER_BRANDS = ["YONEX", "LI-NING", "VICTOR", "MIZUNO"];

export default async function HomePage() {
  let products: ProductItem[] = [];
  let activeVoucher: HeroVoucher | null = null;

  try {
    const [dbProducts, voucher] = await Promise.all([
      prisma.sanPham.findMany({
        where: { SoLuong: { gt: 0 } },
        orderBy: { TenSP: "asc" },
      }),
      // Chi quang ba ma dang dung duoc: da den ngay bat dau, chua het han, con luot
      prisma.voucher.findFirst({
        where: {
          TrangThai: "Dang hoat dong",
          NgayBatDau: { lte: new Date() },
          NgayKetThuc: { gte: new Date() },
          TongSoLuong: { gt: 0 },
        },
        orderBy: { GiaTriGiam: "desc" },
      }),
    ]);

    products = dbProducts
      // An san pham ngung kinh doanh (xoa mem bang nhan trong MoTa)
      .filter((p) => !p.MoTa?.includes("[NGỪNG KINH DOANH]"))
      .map((p) => {
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

    if (voucher) {
      const value = Number(voucher.GiaTriGiam);
      activeVoucher = {
        code: voucher.MaVoucher,
        label:
          voucher.LoaiGiamGia === "PHANTRAM"
            ? `Giảm ${value}%`
            : `Giảm ${value.toLocaleString("vi-VN")}đ`,
        isPercent: voucher.LoaiGiamGia === "PHANTRAM",
        value,
        maxDiscount: Number(voucher.MucGiamToiDa),
        minOrder: Number(voucher.DonHangToiThieu),
        endDate: voucher.NgayKetThuc.toISOString(),
        remaining: voucher.TongSoLuong,
      };
    }
  } catch (error) {
    console.error("Loi truy van san pham trang chu:", error);
  }

  const sections = SECTIONS.map((s) => ({
    ...s,
    items: products.filter((p) => s.categories.includes(p.categoryId || "")).slice(0, 6),
  })).filter((s) => s.items.length >= MIN_SECTION_PRODUCTS);

  return (
    <StoreLayout>
      <HeroSlider voucher={activeVoucher} />

      <div className="relative bg-page">
        {/* Soc trang tri 2 ben */}
        <div className="fb-stripes pointer-events-none absolute left-0 top-6 hidden h-72 w-20 xl:block" />
        <div className="fb-stripes pointer-events-none absolute right-0 top-[420px] hidden h-80 w-20 xl:block" />

        {/* ===== BAN DANG TIM GI? ===== */}
        <section className="container flex flex-col gap-4 pt-8 lg:flex-row lg:items-center lg:gap-10">
          <h2 className="shrink-0 text-3xl font-bold text-navy lg:text-[40px]">Bạn đang tìm gì?</h2>
          <div className="flex-1">
            <QuickSearchBar variant="pill" />
          </div>
        </section>

        {/* ===== DANH MUC SAN PHAM ===== */}
        <section className="container pt-10 lg:pt-14">
          <div className="flex flex-col items-center text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#f66315]">Mua sắm theo nhu cầu</span>
            <h2 className="mt-2 text-3xl font-bold text-navy lg:text-[40px]">Danh mục sản phẩm</h2>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:gap-6">
            {CATEGORY_TILES.map((tile) => {
              const count = tile.category ? products.filter((p) => p.categoryId === tile.category).length : products.length;
              const href = tile.category ? `/san-pham?category=${tile.category}` : "/san-pham";

              // The "Tat ca san pham": nen navy + ghep 3 anh
              if (!tile.category) {
                return (
                  <Link
                    key={tile.name}
                    href={href}
                    className="group relative flex flex-col overflow-hidden rounded-2xl bg-navy shadow-sm ring-1 ring-navy transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-14px_rgba(3,18,48,0.55)]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <div className="bg-grid-dark absolute inset-0 opacity-60" />
                      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#f66315]/30 blur-2xl" />
                      <div className="absolute inset-0 flex items-center justify-center gap-2 px-4">
                        {ALL_TILE_IMAGES.map((src, i) => (
                          <div
                            key={src}
                            className={`relative aspect-square w-[30%] overflow-hidden rounded-xl bg-white shadow-lg ring-2 ring-white/20 transition-transform duration-500 ${
                              i === 1 ? "-translate-y-3 group-hover:-translate-y-5" : "translate-y-2 group-hover:translate-y-0"
                            }`}
                          >
                            <Image src={src} alt="" fill sizes="120px" className="object-contain p-1" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 px-4 py-3">
                      <div>
                        <p className="text-sm font-bold text-white sm:text-base">{tile.name}</p>
                        <p className="text-xs text-white/60">{count} sản phẩm</p>
                      </div>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f66315] text-white transition-transform group-hover:rotate-45">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                );
              }

              return (
                <Link
                  key={tile.name}
                  href={href}
                  className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-16px_rgba(3,18,48,0.25)] hover:ring-[#f66315]/40"
                >
                  <div className={`relative aspect-[4/3] overflow-hidden ${tile.tint}`}>
                    <div className="absolute left-1/2 top-1/2 h-[78%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />
                    <Image
                      src={tile.image}
                      alt={tile.name}
                      fill
                      sizes="(min-width: 768px) 25vw, 50vw"
                      className={`object-contain mix-blend-multiply transition-transform duration-500 ${
                        tile.racket
                          ? "-rotate-[32deg] scale-[1.1] group-hover:-rotate-[26deg] group-hover:scale-[1.16]"
                          : "scale-[1.08] p-3 group-hover:scale-[1.16]"
                      }`}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-navy transition-colors group-hover:text-[#f66315] sm:text-base">
                        {tile.name}
                      </p>
                      <p className="text-xs text-slate-500">{count} sản phẩm</p>
                    </div>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[#f66315] transition-all group-hover:rotate-45 group-hover:bg-[#f66315] group-hover:text-white">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ===== GIOI THIEU ===== */}
        <section className="container grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <h2 className="text-3xl font-bold leading-tight text-navy lg:text-[40px]">
              Đam mê cầu lông
              <br />
              cùng FBShop
            </h2>
            <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-slate-600">
              <p>
                FBShop là hệ thống cửa hàng dụng cụ cầu lông chính hãng, phân phối vợt, giày, balo và
                phụ kiện từ các thương hiệu hàng đầu thế giới như Yonex, Lining, Victor, Mizuno.
              </p>
              <p>
                Đội ngũ tư vấn giúp bạn chọn cây vợt phù hợp với lối chơi, căng cước chuẩn thi đấu và
                bảo hành chính hãng 12 tháng cho mọi sản phẩm.
              </p>
              <p className="font-semibold italic text-navy">FBShop – đồng hành cùng đam mê của bạn!</p>
            </div>
            <Link
              href="#lien-he"
              className="mt-7 inline-flex h-10 items-center rounded-full bg-[#f66315] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#d4520f]"
            >
              Liên hệ tư vấn
            </Link>
          </div>

          {/* Khung noi bat (thay cho video) */}
          <div className="relative overflow-hidden rounded-sm border-b-4 border-[#f66315] bg-navy p-8 text-white shadow-xl lg:p-10">
            <div className="bg-grid-dark absolute inset-0" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#f66315] px-3 py-1 text-xs font-bold uppercase tracking-wide">
                FBShop
              </span>
              <p className="mt-5 text-4xl font-bold uppercase leading-none tracking-tight lg:text-5xl">
                Chính hãng
                <br />
                <span className="text-[#f6af15]">100%</span>
              </p>
              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/15 pt-6">
                {[
                  { icon: ShieldCheck, text: "Bảo hành 12 tháng" },
                  { icon: Truck, text: "Miễn phí ship từ 1 triệu" },
                  { icon: RotateCcw, text: "Đổi trả trong 7 ngày" },
                ].map((f) => (
                  <div key={f.text}>
                    <f.icon className="h-6 w-6 text-[#f6af15]" strokeWidth={1.8} />
                    <p className="mt-2 text-sm leading-snug text-white/85">{f.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== CAC KHU SAN PHAM ===== */}
        {sections.map((s, i) => (
          <ProductSection
            key={s.title}
            title={s.title}
            href={s.href}
            promo={s.promo}
            promoSub={s.promoSub}
            promoImage={s.items[0].imageUrl}
            items={s.items}
            reverse={i % 2 === 1}
          />
        ))}

        {/* ===== DOI TAC THUONG HIEU ===== */}
        <section className="container pb-20 pt-6 text-center">
          <p className="mx-auto max-w-md text-[15px] text-slate-600">
            Chúng tôi hân hạnh là đối tác phân phối của các nhãn hàng uy tín trên toàn thế giới
          </p>
          <div className="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {PARTNER_BRANDS.map((b) => (
              <div
                key={b}
                className="flex h-16 items-center justify-center rounded-lg bg-white text-sm font-bold italic tracking-widest text-navy/70 shadow-[0_4px_16px_rgba(246,99,21,0.10)]"
              >
                {b}
              </div>
            ))}
          </div>
        </section>
      </div>
    </StoreLayout>
  );
}

// Khu san pham: tieu de + "Xem tat ca" + the quang cao vien cam + luoi 3x2 (dao ben xen ke)
function ProductSection({
  title,
  href,
  promo,
  promoSub,
  promoImage,
  items,
  reverse,
}: {
  title: string;
  href: string;
  promo: string;
  promoSub: string;
  promoImage: string;
  items: ProductItem[];
  reverse: boolean;
}) {
  return (
    <section className="container pb-14 lg:pb-20">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-navy lg:text-[32px]">{title}</h2>
        <Link
          href={href}
          className="inline-flex h-8 items-center rounded-full bg-[#f66315] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#d4520f]"
        >
          Xem tất cả
        </Link>
      </div>

      <div className={`flex flex-col gap-4 lg:flex-row ${reverse ? "lg:flex-row-reverse" : ""}`}>
        {/* The quang cao vien cam */}
        <Link
          href={href}
          className="group relative flex min-h-[380px] flex-col items-center overflow-hidden rounded-xl border-[3px] border-[#f66315] bg-white px-6 pb-7 pt-5 lg:w-[27%] lg:shrink-0"
        >
          <span className="rounded-full bg-[#f66315] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            FBShop
          </span>
          <div className="relative my-4 w-full flex-1">
            <Image
              src={promoImage}
              alt={promo}
              fill
              sizes="(max-width: 1024px) 90vw, 25vw"
              className="rounded-lg object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <p className="text-center text-3xl font-bold uppercase leading-none tracking-tight text-[#f66315] lg:text-[34px]">
            {promo}
          </p>
          <p className="mt-1 text-sm font-semibold text-navy">{promoSub}</p>
          <span className="mt-4 rounded-full bg-navy px-5 py-1.5 text-sm font-bold uppercase text-white transition-colors group-hover:bg-[#f66315]">
            Xem ngay
          </span>
        </Link>

        {/* Luoi san pham 3 cot */}
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} stock={p.stock} />
          ))}
        </div>
      </div>
    </section>
  );
}
