import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { BrandMark } from "@/components/layout/BrandLogo";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-4 py-16 text-center">
      <span className="pointer-events-none absolute select-none font-display text-[38vw] font-bold leading-none text-slate-100 sm:text-[22rem]">
        404
      </span>

      <div className="relative">
        <BrandMark className="mx-auto h-14 w-14" />
        <h1 className="mt-8 text-3xl font-bold text-slate-900 md:text-4xl">Trang không tồn tại</h1>
        <p className="mx-auto mt-3 max-w-md text-slate-500">
          Đường dẫn có thể đã bị thay đổi hoặc tạm thời không khả dụng. Hãy quay về trang chủ để
          tiếp tục mua sắm dụng cụ cầu lông chính hãng.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white transition-all hover:bg-[#f66315] hover:shadow-brand"
          >
            <ArrowLeft className="h-4 w-4" />
            Về trang chủ
          </Link>
          <Link
            href="/san-pham"
            className="flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <ShoppingBag className="h-4 w-4 text-[#f66315]" />
            Xem sản phẩm
          </Link>
        </div>
      </div>
    </div>
  );
}
