import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/db";
import { createSlug } from "@/lib/utils";
import ProductCard from "@/components/ProductCard";
import HeroSlider, { type HeroVoucher } from "@/components/HeroSlider";
import QuickSearchBar from "@/components/QuickSearchBar";
import StoreLayout from "@/app/(store)/layout";
import type { ProductItem } from "@/lib/types";
import { Footprints, Backpack, Wrench, LayoutGrid, ShieldCheck, Truck, RotateCcw } from "lucide-react";

export const revalidate = 0; // Luon lay du lieu moi nhat

// The danh muc (luoi 4x2, nen pastel - theo bo cuc fbshop.vn)
const CATEGORY_TILES = [
  { name: "Vợt cầu lông Yonex", category: "DM_YONEX" },
  { name: "Vợt cầu lông Lining", category: "DM_LINING" },
  { name: "Vợt cầu lông Victor", category: "DM_VICTOR" },
  { name: "Vợt cầu lông Mizuno", category: "DM_MIZUNO" },
  { name: "Giày cầu lông", category: "DM_GIAY", icon: Footprints },
  { name: "Balo & Bao vợt", category: "DM_BALO", icon: Backpack },
  { name: "Phụ kiện cầu lông", category: "DM_PHUKIEN", icon: Wrench },
  { name: "Tất cả sản phẩm", category: "", icon: LayoutGrid },
];
const PASTELS = ["bg-[#fdeee8]", "bg-[#fdf8e4]", "bg-[#e9f9ea]", "bg-[#fbf6e9]"];

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
      prisma.voucher.findFirst({
        where: { TrangThai: "Dang hoat dong", NgayKetThuc: { gte: new Date() } },
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
        minOrder: Number(voucher.DonHangToiThieu),
      };
    }
  } catch (error) {
    console.error("Loi truy van san pham trang chu:", error);
  }

  const firstImageOf = (category: string) =>
    products.find((p) => (category ? p.categoryId === category : true))?.imageUrl;

  const sections = SECTIONS.map((s) => ({
    ...s,
    items: products.filter((p) => s.categories.includes(p.categoryId || "")).slice(0, 6),
  })).filter((s) => s.items.length >= MIN_SECTION_PRODUCTS);

  return (
    <StoreLayout>
      <HeroSlider images={products.map((p) => p.imageUrl)} voucher={activeVoucher} />

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
          <h2 className="text-center text-3xl font-bold text-navy lg:text-[40px]">Danh mục sản phẩm</h2>
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:gap-x-6">
            {CATEGORY_TILES.map((tile, i) => {
              const img = firstImageOf(tile.category);
              const Icon = tile.icon;
              return (
                <Link
                  key={tile.name}
                  href={tile.category ? `/san-pham?category=${tile.category}` : "/san-pham"}
                  className="group relative block pt-16"
                >
                  <div className={`${PASTELS[i % PASTELS.length]} rounded-lg px-3 pb-5 pt-16 text-center transition-shadow group-hover:shadow-[0_10px_30px_rgba(3,18,48,0.10)]`}>
                    <p className="text-base font-semibold text-navy transition-colors group-hover:text-[#f66315] lg:text-[22px]">
                      {tile.name}
                    </p>
                  </div>
                  {/* Anh vuong noi len tren the */}
                  <div className="absolute left-1/2 top-0 h-28 w-28 -translate-x-1/2 overflow-hidden bg-white shadow-sm transition-transform group-hover:-translate-y-1 lg:h-32 lg:w-32">
                    {img && !Icon ? (
                      <Image src={img} alt={tile.name} fill sizes="128px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#fff4ed] to-white">
                        {Icon ? (
                          <Icon className="h-12 w-12 text-[#f66315]" strokeWidth={1.4} />
                        ) : (
                          <span className="text-4xl">🏸</span>
                        )}
                      </div>
                    )}
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
