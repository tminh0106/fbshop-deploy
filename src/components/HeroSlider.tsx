"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface HeroVoucher {
  code: string;
  label: string;
  minOrder: number;
}

interface HeroSliderProps {
  images: string[]; // anh vot tu CSDL de ghep banner
  voucher: HeroVoucher | null;
}

const BRAND_CHIPS = ["LINING", "YONEX", "VICTOR", "MIZUNO"];
const AUTOPLAY_MS = 5000;

// Banner truot toan chieu ngang (bo cuc theo fbshop.vn), nut tron cam 2 ben
export default function HeroSlider({ images, voucher }: HeroSliderProps) {
  const pick = (i: number) => images[i % Math.max(images.length, 1)] || "/images/placeholder.png";

  const slides = [
    <SlideBrands key="brands" images={[pick(0), pick(1), pick(2), pick(3)]} />,
    <SlideService key="service" images={[pick(4), pick(5), pick(6)]} />,
    ...(voucher ? [<SlideVoucher key="voucher" voucher={voucher} image={pick(7)} />] : []),
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
                  i === index ? "w-7 bg-[#f66315]" : "w-3 bg-white/50 hover:bg-white"
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

// Slide 1: "Vot cau long chinh hang" + chip thuong hieu + ghep anh vot
function SlideBrands({ images }: { images: string[] }) {
  return (
    <div className={`relative ${SLIDE_HEIGHT} overflow-hidden bg-gradient-to-br from-[#0b1a33] via-[#031230] to-[#1a0f0a]`}>
      <div className="bg-grid-dark absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -left-20 top-1/3 h-96 w-96 rounded-full bg-[#f66315]/30 blur-[120px]" />
      <div className="container relative grid h-full items-center lg:grid-cols-2">
        <div className="relative z-10">
          <h2 className="text-[42px] font-bold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-[82px]">
            Vợt cầu lông
            <br />
            chính hãng
          </h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {BRAND_CHIPS.map((b) => (
              <span
                key={b}
                className="rounded bg-white px-3 py-1.5 text-xs font-bold italic tracking-wider text-navy shadow sm:text-sm"
              >
                {b}
              </span>
            ))}
          </div>
          <Link
            href="/san-pham"
            className="mt-8 inline-flex h-11 items-center rounded-full bg-[#f66315] px-7 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#d4520f]"
          >
            Mua ngay
          </Link>
        </div>

        {/* Ghep anh vot kieu poster */}
        <div className="absolute inset-y-0 right-0 hidden w-[55%] grid-cols-4 gap-2 py-0 lg:grid">
          {images.map((src, i) => (
            <div
              key={i}
              className={`relative overflow-hidden ${i % 2 ? "bg-[#12203d]" : "bg-[#1b2b4d]"} ${
                i % 2 ? "translate-y-8" : "-translate-y-6"
              }`}
            >
              <Image src={src} alt="" fill sizes="20vw" className="object-cover opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#031230]/70 via-transparent to-transparent" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Slide 2: dich vu - nen sang, tieu de cam giua, 3 anh + nut den
function SlideService({ images }: { images: string[] }) {
  return (
    <div className={`relative ${SLIDE_HEIGHT} overflow-hidden bg-[#ececec]`}>
      <div className="container flex h-full flex-col items-center justify-center text-center">
        <h2 className="text-3xl font-bold uppercase tracking-tight text-[#f66315] drop-shadow-sm sm:text-5xl lg:text-6xl">
          Căng cước chuẩn thi đấu
        </h2>
        <p className="mt-3 flex flex-wrap items-center justify-center gap-2 text-base font-semibold text-navy sm:text-2xl">
          <span className="rounded-full bg-gradient-to-r from-[#f6af15] to-[#f66315] px-3 py-0.5 text-[11px] font-bold uppercase text-white">
            FBShop
          </span>
          Tư vấn chọn vợt theo lối chơi, căng cước chuẩn thi đấu
        </p>
        <div className="mt-6 hidden w-full max-w-4xl grid-cols-3 gap-4 sm:grid">
          {images.map((src, i) => (
            <div key={i} className="relative aspect-[16/9] overflow-hidden rounded-xl bg-white shadow">
              <Image src={src} alt="" fill sizes="30vw" className="object-cover" />
            </div>
          ))}
        </div>
        <Link
          href="/san-pham"
          className="mt-6 inline-flex h-11 items-center rounded-full bg-navy px-7 text-base font-bold text-white transition-colors hover:bg-black"
        >
          Xem sản phẩm
        </Link>
      </div>
    </div>
  );
}

// Slide 3: ma khuyen mai dang chay (lay tu CSDL)
function SlideVoucher({ voucher, image }: { voucher: HeroVoucher; image: string }) {
  return (
    <div className={`relative ${SLIDE_HEIGHT} overflow-hidden bg-gradient-to-r from-[#f66315] to-[#f6af15]`}>
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full border-[56px] border-white/10" />
      <div className="container relative grid h-full items-center gap-8 lg:grid-cols-2">
        <div className="text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/80">Ưu đãi đang diễn ra</p>
          <h2 className="mt-3 text-4xl font-bold leading-tight sm:text-6xl">{voucher.label}</h2>
          <p className="mt-3 text-lg text-white/90">
            Cho đơn hàng từ {voucher.minOrder.toLocaleString("vi-VN")}đ – nhập mã khi thanh toán
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-lg border-2 border-dashed border-white bg-white/10 px-5 py-2.5 font-mono text-xl font-bold tracking-widest">
              {voucher.code}
            </span>
            <Link
              href="/san-pham"
              className="inline-flex h-12 items-center rounded-full bg-navy px-7 text-sm font-bold uppercase text-white transition-colors hover:bg-black"
            >
              Dùng ngay
            </Link>
          </div>
        </div>
        <div className="relative hidden h-[80%] lg:block">
          <Image src={image} alt="" fill sizes="40vw" className="rounded-2xl object-cover shadow-2xl" />
        </div>
      </div>
    </div>
  );
}
