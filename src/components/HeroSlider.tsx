"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ChevronLeft, ChevronRight, Gauge, MessagesSquare, Phone } from "lucide-react";

export interface HeroVoucher {
  code: string;
  label: string;
  isPercent: boolean;
  value: number; // so tien giam (VND) hoac % giam
  maxDiscount: number; // muc giam toi da cho ma %, 0 = khong gioi han
  minOrder: number;
  endDate: string; // ISO
  remaining: number; // so luot con lai
}

interface HeroSliderProps {
  voucher: HeroVoucher | null;
}

const AUTOPLAY_MS = 5000;

// Banner truot toan chieu ngang (bo cuc theo fbshop.vn), nut tron cam 2 ben
export default function HeroSlider({ voucher }: HeroSliderProps) {
  const slides = [
    <SlideBrands key="brands" />,
    <SlideService key="service" />,
    ...(voucher ? [<SlideVoucher key="voucher" voucher={voucher} />] : []),
  ];

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = useCallback(
    (step: number) => setIndex((i) => (i + step + slides.length) % slides.length),
    [slides.length]
  );

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setInterval(() => go(1), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [go, paused, slides.length]);

  return (
    <section
      className="relative overflow-hidden bg-navy"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <div
        className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div key={i} className="w-full shrink-0" aria-hidden={i !== index}>
            {slide}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Slide trước"
            className="absolute left-3 top-1/2 z-10 hidden h-9 w-9 sm:flex -translate-y-1/2 items-center justify-center rounded-full bg-[#f66315] text-white shadow-md transition-transform hover:scale-110 lg:left-6"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Slide tiếp"
            className="absolute right-3 top-1/2 z-10 hidden h-9 w-9 sm:flex -translate-y-1/2 items-center justify-center rounded-full bg-[#f66315] text-white shadow-md transition-transform hover:scale-110 lg:right-6"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-7 bg-[#f66315]" : "w-3 bg-slate-400/70 hover:bg-[#f66315]/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

const SLIDE_HEIGHT = "h-[340px] sm:h-[420px] lg:h-[520px]";
// Chua le cho 2 nut mui ten (hien tu man hinh sm) khi khung noi dung chiem gan het chieu ngang (< 1440px)
const SLIDE_PAD = "sm:px-16 min-[1440px]:px-6";

// Anh vot dai dien 4 thuong hieu (anh studio nen xam, da nen WebP trong public/banner)
const BRAND_RACKETS = [
  { brand: "LINING", src: "/banner/vot-lining.webp", href: "/san-pham?category=DM_LINING" },
  { brand: "YONEX", src: "/banner/vot-yonex.webp", href: "/san-pham?category=DM_YONEX" },
  { brand: "VICTOR", src: "/banner/vot-victor.webp", href: "/san-pham?category=DM_VICTOR" },
  { brand: "MIZUNO", src: "/banner/vot-mizuno.webp", href: "/san-pham?category=DM_MIZUNO" },
];

// Slide 1: "Vot cau long chinh hang" + chip thuong hieu + 4 the anh vot so le
// Nen chuyen tu navy (ben chu) sang xam than (ben anh) de hoa voi nen studio cua anh vot
function SlideBrands() {
  return (
    <div
      className={`relative ${SLIDE_HEIGHT} overflow-hidden bg-[linear-gradient(100deg,#06102a_0%,#0b1a33_38%,#1d2738_62%,#3a414c_100%)]`}
    >
      <div className="bg-grid-dark absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute -left-20 top-1/3 h-96 w-96 rounded-full bg-[#f66315]/30 blur-[120px]" />
      <div className="pointer-events-none absolute right-[18%] top-1/2 hidden h-[420px] w-[620px] -translate-y-1/2 rounded-full bg-white/[0.06] blur-[90px] lg:block" />

      <div className={`container relative grid h-full items-center ${SLIDE_PAD} lg:grid-cols-[0.8fr_1.2fr] xl:grid-cols-[1fr_1.25fr]`}>
        <div className="relative z-10">
          <h2 className="text-[42px] font-bold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-[56px] xl:text-[82px]">
            Vợt cầu lông
            <br />
            chính hãng
          </h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {BRAND_RACKETS.map((b) => (
              <Link
                key={b.brand}
                href={b.href}
                className="rounded bg-white px-3 py-1.5 text-xs font-bold italic tracking-wider text-navy shadow transition-colors hover:bg-[#f66315] hover:text-white sm:text-sm"
              >
                {b.brand}
              </Link>
            ))}
          </div>
          <Link
            href="/san-pham"
            className="mt-8 inline-flex h-11 items-center rounded-full bg-[#f66315] px-7 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#d4520f]"
          >
            Mua ngay
          </Link>
        </div>

        {/* 4 the anh vot, xep so le kieu poster */}
        <div className="relative hidden h-full items-center lg:flex">
          <div className="grid h-[86%] w-full grid-cols-4 gap-2 xl:gap-4">
            {BRAND_RACKETS.map((b, i) => (
              <Link
                key={b.brand}
                href={b.href}
                aria-label={`Xem vợt ${b.brand}`}
                className={`group relative overflow-hidden rounded-2xl bg-[#525861] shadow-[0_24px_48px_-16px_rgba(0,0,0,0.65)] ring-1 ring-white/10 transition-transform duration-500 hover:-translate-y-2 ${
                  i % 2 ? "mt-10 -mb-2" : "-mt-2 mb-10"
                }`}
              >
                <Image
                  src={b.src}
                  alt={`Vợt cầu lông ${b.brand}`}
                  fill
                  priority={i < 2}
                  sizes="(min-width: 1280px) 16vw, 20vw"
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                {/* Che logo goc anh, lam toi chan the de dat ten thuong hieu */}
                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#0b1424] via-[#0b1424]/70 to-transparent" />
                <div className="absolute inset-x-0 top-0 h-1/5 bg-gradient-to-b from-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-1">
                  <span className="text-[13px] font-bold italic tracking-[0.18em] text-white xl:text-sm">{b.brand}</span>
                  <span className="h-0.5 w-6 rounded-full bg-[#f66315] transition-all duration-300 group-hover:w-12" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Slide 2: dich vu cang cuoc - nen kem cam am + hoa tiet luoi dan nhu mat cuoc vot,
// ben trai ghep 3 anh thuc te tai cua hang, ben phai noi dung + 3 diem noi bat
const SERVICE_PHOTOS = {
  machine: "/banner/cang-may.webp", // may cang dien tu dang cang vot
  wall: "/banner/cang-cuoc.webp", // vot truoc tuong cuon cuoc
  fresh: "/banner/cang-vot-moi.webp", // vot vua cang xong
};

const SERVICE_FEATURES = [
  { icon: Gauge, title: "Máy căng điện tử", desc: "Lực căng chính xác đến từng kg, đều cả mặt lưới" },
  { icon: BadgeCheck, title: "Cước chính hãng", desc: "Yonex, Li-Ning, Victor – đủ độ nảy và độ bền" },
  { icon: MessagesSquare, title: "Tư vấn theo lối chơi", desc: "Chọn mức căng phù hợp tấn công, phòng thủ" },
];

function SlideService() {
  return (
    <div className={`relative ${SLIDE_HEIGHT} overflow-hidden bg-[linear-gradient(115deg,#fffaf6_0%,#fff1e7_45%,#ffe2cf_100%)]`}>
      {/* Hoa tiet luoi dan (gioi han ben phai, mo dan ve phia chu) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70 [mask-image:linear-gradient(90deg,transparent_0%,black_55%)]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(246,99,21,0.09) 0 1px, transparent 1px 22px), repeating-linear-gradient(-45deg, rgba(246,99,21,0.09) 0 1px, transparent 1px 22px)",
        }}
      />
      <div className="pointer-events-none absolute -left-24 top-1/2 h-[460px] w-[460px] -translate-y-1/2 rounded-full bg-[#f66315]/15 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full border-[40px] border-[#f66315]/10" />

      <div className={`container relative grid h-full items-center gap-10 ${SLIDE_PAD} lg:grid-cols-[1.1fr_1fr]`}>
        {/* Ghep anh thuc te */}
        <div className="relative hidden h-[84%] lg:grid lg:grid-cols-5 lg:grid-rows-6 lg:gap-3">
          <div className="relative col-span-3 row-span-4 overflow-hidden rounded-2xl shadow-[0_20px_40px_-18px_rgba(3,18,48,0.45)] ring-1 ring-black/5">
            <Image src={SERVICE_PHOTOS.machine} alt="Máy căng vợt điện tử tại FBShop" fill sizes="30vw" className="object-cover" />
            <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-navy shadow">
              Máy căng điện tử
            </span>
          </div>
          <div className="relative col-span-2 row-span-6 overflow-hidden rounded-2xl shadow-[0_20px_40px_-18px_rgba(3,18,48,0.45)] ring-1 ring-black/5">
            <Image src={SERVICE_PHOTOS.wall} alt="Vợt và cước tại cửa hàng FBShop" fill sizes="20vw" className="object-cover object-[center_30%]" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/85 to-transparent p-4 pt-12">
              <p className="text-sm font-bold text-white">Nhiều loại cước</p>
              <p className="text-[11px] text-white/80">Đủ màu, đủ thông số</p>
            </div>
          </div>
          <div className="relative col-span-3 row-span-2 overflow-hidden rounded-2xl shadow-[0_20px_40px_-18px_rgba(3,18,48,0.45)] ring-1 ring-black/5">
            <Image src={SERVICE_PHOTOS.fresh} alt="Vợt vừa căng cước xong" fill sizes="30vw" className="object-cover object-[center_22%]" />
          </div>
        </div>

        {/* Noi dung */}
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#f66315] shadow-sm ring-1 ring-[#f66315]/20">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f66315]" />
            Dịch vụ tại FBShop
          </span>
          <h2 className="mt-4 text-[38px] font-bold leading-[1.05] tracking-tight text-navy sm:text-5xl xl:text-6xl">
            Căng cước
            <br />
            <span className="bg-gradient-to-r from-[#f66315] to-[#f6af15] bg-clip-text text-transparent">chuẩn thi đấu</span>
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Mang vợt đến cửa hàng hoặc căng ngay khi mua vợt mới tại FBShop, kỹ thuật viên tư vấn tận tình.
          </p>
          <ul className="mt-5 hidden space-y-3 sm:block">
            {SERVICE_FEATURES.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#f66315] shadow-sm ring-1 ring-[#f66315]/15">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-bold text-navy">{title}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/san-pham"
              className="inline-flex h-11 items-center rounded-full bg-navy px-6 text-sm font-bold text-white transition-colors hover:bg-black"
            >
              Xem sản phẩm
            </Link>
            <a
              href="tel:0123456789"
              className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-[#f66315] px-5 text-sm font-bold text-[#f66315] transition-colors hover:bg-[#f66315] hover:text-white"
            >
              <Phone className="h-4 w-4" />
              Gọi tư vấn 0123.456.789
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Slide 3: ma khuyen mai dang chay (lay tu CSDL) - phong cach thiep voucher sang trong:
// nen xam than co vat lua, chu vang kim, dai ruy bang vang co no, ben duoi nen trang van song + the "The le ap dung"
const GOLD_TEXT = "bg-[linear-gradient(180deg,#f7e39a_0%,#e4c264_45%,#c49634_100%)] bg-clip-text text-transparent";
const GOLD_FILL = "bg-[linear-gradient(180deg,#f6df8e_0%,#dcb755_48%,#b98d2c_100%)]";

// 100000 -> "100K", 1500000 -> "1,5 TRIỆU"
function shortMoney(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} TRIỆU`;
  return `${Math.round(v / 1000).toLocaleString("vi-VN")}K`;
}

function SlideVoucher({ voucher }: { voucher: HeroVoucher }) {
  const bigText = voucher.isPercent ? `${voucher.value}%` : shortMoney(voucher.value);
  const endDate = new Date(voucher.endDate).toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const rules = [
    `Áp dụng cho đơn hàng từ ${voucher.minOrder.toLocaleString("vi-VN")}đ`,
    ...(voucher.isPercent && voucher.maxDiscount > 0
      ? [`Giảm ${voucher.value}%, tối đa ${voucher.maxDiscount.toLocaleString("vi-VN")}đ`]
      : []),
    "Mỗi đơn hàng áp dụng 1 mã giảm giá",
    "Voucher không có giá trị quy đổi thành tiền mặt",
    `Thời gian sử dụng đến ${endDate}`,
  ];

  return (
    <div className={`relative ${SLIDE_HEIGHT} overflow-hidden bg-white`}>
      {/* Phan tren: nen xam than + vat lua */}
      <div className="absolute inset-x-0 top-0 h-[74%] overflow-hidden bg-[radial-gradient(120%_110%_at_15%_0%,#5d615c_0%,#3d403c_45%,#272927_100%)]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 400" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="silkA" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.5" stopColor="#fff" stopOpacity="0.16" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="silkB" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#000" stopOpacity="0" />
              <stop offset="0.55" stopColor="#000" stopOpacity="0.28" />
              <stop offset="1" stopColor="#000" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M-100 420 C 150 260, 260 60, 520 -40 L 640 -40 C 380 80, 260 280, 40 420 Z" fill="url(#silkA)" />
          <path d="M-60 420 C 220 300, 360 120, 700 -40 L 760 -40 C 440 140, 300 320, 60 420 Z" fill="url(#silkB)" />
          <path d="M1050 -40 C 1250 120, 1420 160, 1700 120 L 1700 60 C 1450 110, 1290 60, 1130 -40 Z" fill="url(#silkA)" />
          <path d="M1200 420 C 1330 300, 1480 250, 1700 260 L 1700 330 C 1500 320, 1380 360, 1290 420 Z" fill="url(#silkB)" />
        </svg>
        <div className="pointer-events-none absolute left-1/3 top-1/2 h-72 w-[520px] -translate-y-1/2 rounded-full bg-[#e4c264]/10 blur-[90px]" />
      </div>

      {/* Phan duoi: nen trang van song */}
      <svg className="absolute inset-x-0 bottom-0 h-[30%] w-full text-slate-200" viewBox="0 0 1600 160" preserveAspectRatio="none" aria-hidden>
        {Array.from({ length: 9 }, (_, i) => (
          <path
            key={i}
            d={`M0 ${30 + i * 16} C 400 ${0 + i * 16}, 900 ${70 + i * 16}, 1600 ${20 + i * 16}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        ))}
      </svg>

      {/* Dai ruy bang vang */}
      <div className="absolute inset-x-[-2%] top-[71%] z-[1] -rotate-[0.8deg]">
        <div className={`flex h-8 items-center gap-8 overflow-hidden whitespace-nowrap shadow-[0_6px_14px_-4px_rgba(120,85,20,0.55)] ${GOLD_FILL}`}>
          {Array.from({ length: 30 }, (_, i) => (
            <span key={i} className="text-[11px] font-semibold tracking-[0.2em] text-[#9b7424]/45">
              VOUCHER
            </span>
          ))}
        </div>
      </div>

      <div className={`container relative z-[2] grid h-full ${SLIDE_PAD} lg:grid-cols-[1fr_auto] lg:gap-10`}>
        {/* Noi dung chinh (nam tren nen xam than) */}
        <div className="flex h-[74%] flex-col items-center justify-center text-center lg:items-start lg:text-left">
          <p className="text-3xl font-light tracking-[0.14em] text-white sm:text-5xl">VOUCHER</p>
          <p className={`mt-1 text-[84px] font-black leading-[0.9] tracking-tight sm:text-[120px] xl:text-[150px] ${GOLD_TEXT}`}>
            {bigText}
          </p>
          <p className="mt-3 text-sm font-bold uppercase tracking-[0.12em] text-[#e4c264] sm:text-lg">
            Áp dụng khi mua đơn hàng từ {shortMoney(voucher.minOrder)}
          </p>
          {/* Man hinh nho: hien ma ngay duoi tieu de (the le an) */}
          <div className="mt-5 flex items-center gap-3 lg:hidden">
            <span className="rounded-lg border-2 border-dashed border-[#e4c264] px-4 py-2 font-mono text-base font-bold tracking-widest text-[#f7e39a]">
              {voucher.code}
            </span>
            <Link href="/san-pham" className={`rounded-full px-5 py-2.5 text-sm font-bold uppercase text-[#3d2c08] ${GOLD_FILL}`}>
              Dùng ngay
            </Link>
          </div>
        </div>

        {/* No ruy bang + the "The le ap dung" */}
        <div className="relative hidden items-center lg:flex">
          <svg
            className="absolute -left-36 top-[74%] z-[3] h-[110px] w-[170px] -translate-y-1/2 drop-shadow-[0_8px_10px_rgba(90,60,10,0.45)]"
            viewBox="0 0 200 130"
            aria-hidden
          >
            <defs>
              <linearGradient id="bowGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#f8e49a" />
                <stop offset="0.5" stopColor="#dcb755" />
                <stop offset="1" stopColor="#a87d22" />
              </linearGradient>
              <linearGradient id="bowShade" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#8a6418" stopOpacity="0.55" />
                <stop offset="1" stopColor="#8a6418" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M94 66 L66 124 L80 117 L88 128 L104 72 Z" fill="url(#bowGold)" />
            <path d="M106 66 L134 122 L120 116 L113 127 L96 72 Z" fill="url(#bowGold)" />
            <path d="M100 60 C 70 14, 14 14, 18 50 C 22 84, 74 80, 100 64 Z" fill="url(#bowGold)" />
            <path d="M100 60 C 130 14, 186 14, 182 50 C 178 84, 126 80, 100 64 Z" fill="url(#bowGold)" />
            <path d="M100 62 C 76 36, 40 30, 34 50 C 54 44, 78 52, 100 64 Z" fill="url(#bowShade)" />
            <path d="M100 62 C 124 36, 160 30, 166 50 C 146 44, 122 52, 100 64 Z" fill="url(#bowShade)" />
            <rect x="89" y="50" width="22" height="26" rx="8" fill="url(#bowGold)" />
            <rect x="89" y="50" width="22" height="26" rx="8" fill="url(#bowShade)" />
          </svg>

          <div className="relative z-[2] w-[400px] rounded-2xl bg-white p-6 shadow-[0_24px_60px_-20px_rgba(20,20,20,0.55)] xl:w-[440px]">
            <div className="flex items-stretch">
              <span className={`w-3 ${GOLD_FILL}`} />
              <p className="flex-1 bg-[#363936] py-2.5 text-center text-base font-bold uppercase tracking-[0.12em] text-white">
                Thể lệ áp dụng
              </p>
              <span className={`w-3 ${GOLD_FILL}`} />
            </div>
            <ul className="mt-4 space-y-2 pl-5 text-sm text-slate-700 marker:text-[#c49634] [list-style-type:disc]">
              {rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <div className="mt-5 flex items-center gap-3 border-t border-dashed border-slate-200 pt-5">
              <div className="flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Mã giảm giá</p>
                <p className="font-mono text-xl font-bold tracking-widest text-[#363936]">{voucher.code}</p>
              </div>
              <Link
                href="/san-pham"
                className={`inline-flex h-11 items-center rounded-full px-6 text-sm font-bold uppercase tracking-wide text-[#3d2c08] shadow-md transition-transform hover:scale-105 ${GOLD_FILL}`}
              >
                Dùng ngay
              </Link>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">Số lượng có hạn – còn {voucher.remaining.toLocaleString("vi-VN")} lượt</p>
          </div>
        </div>
      </div>
    </div>
  );
}
