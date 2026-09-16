import Link from "next/link";
import { AlertCircle, Home, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="relative mb-6">
        <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-orange-50 text-[#f66315] shadow-xl shadow-orange-100/50">
          <span className="text-5xl font-black">404</span>
        </div>
        <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f66315] text-white shadow-md">
          <span className="text-xl">🏸</span>
        </div>
      </div>

      <h1 className="text-2xl font-black text-gray-900 md:text-3xl">
        Rất tiếc! Trang bạn đang tìm kiếm không tồn tại
      </h1>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        Đường dẫn có thể đã bị thay đổi, xóa hoặc tạm thời không khả dụng. Hãy quay về trang chủ để tiếp tục mua sắm dụng cụ cầu lông chính hãng.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl bg-[#f66315] px-6 py-3 text-xs font-bold text-white shadow-lg shadow-orange-950/20 transition-all hover:bg-[#e55000] hover:scale-105"
        >
          <Home className="h-4 w-4" />
          Quay lại trang chủ
        </Link>
        <Link
          href="/san-pham"
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all"
        >
          <ShoppingBag className="h-4 w-4 text-[#f66315]" />
          Xem tất cả sản phẩm
        </Link>
      </div>
    </div>
  );
}
