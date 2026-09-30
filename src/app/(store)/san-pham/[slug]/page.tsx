"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Zap, ShieldCheck, Truck, RotateCcw, Minus, Plus, AlertCircle, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/lib/cartStore";
import toast from "react-hot-toast";

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  weight?: string;
  imageUrl: string;
  description?: string;
  category?: {
    id: string;
    name: string;
  };
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [stringNote, setStringNote] = useState("");

  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    fetch(`/api/san-pham/${resolvedParams.slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setProduct(data.product);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [resolvedParams.slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-t-[#f66315]" />
        <p className="mt-4 text-sm text-slate-500">Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy sản phẩm</h2>
        <p className="mt-2 text-sm text-slate-500">Sản phẩm có thể đã ngừng kinh doanh hoặc đường dẫn không đúng.</p>
        <Link
          href="/san-pham"
          className="mt-6 inline-block rounded-xl bg-[#f66315] px-6 py-2.5 text-sm font-semibold text-white"
        >
          Quay lại danh mục
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      maxStock: product.stock,
      imageUrl: product.imageUrl,
      weight: product.weight,
      note: stringNote.trim() || undefined,
    });
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      maxStock: product.stock,
      imageUrl: product.imageUrl,
      weight: product.weight,
      note: stringNote.trim() || undefined,
    });
    router.push("/dat-hang");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-[#f66315]">Trang chủ</Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <Link href="/san-pham" className="hover:text-[#f66315]">Sản phẩm</Link>
        {product.category && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <Link
              href={`/san-pham?category=${product.category.id}`}
              className="hover:text-[#f66315]"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <span className="truncate max-w-[200px] text-slate-800 font-medium">{product.name}</span>
      </nav>

      {/* Main Product Section */}
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Anh san pham (Ben trai) */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-xs">
          <Image
            src={product.imageUrl || "/images/placeholder.png"}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className={`object-contain p-8 ${isOutOfStock ? "grayscale-[40%] opacity-70" : ""}`}
          />
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
              <span className="rounded-xl bg-red-600 px-6 py-2.5 text-base font-bold uppercase tracking-wider text-white shadow-lg">
                Tạm hết hàng
              </span>
            </div>
          )}
        </div>

        {/* Thong tin san pham (Ben phai) */}
        <div className="flex flex-col justify-between">
          <div>
            {/* Badges */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {product.category && (
                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-[#f66315]">
                  {product.category.name}
                </span>
              )}
              {product.weight && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Trọng lượng: {product.weight}
                </span>
              )}
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                Mã SP: {product.id}
              </span>
            </div>

            {/* Ten san pham */}
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {product.name}
            </h1>

            {/* Gia ban */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-[#f66315]">
                {formatCurrency(product.price)}
              </span>
            </div>

            {/* Mo ta ngan */}
            <div className="mt-6 border-t border-b border-slate-100 py-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                Mô tả sản phẩm
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                {product.description || "Dụng cụ cầu lông chính hãng từ hệ thống FBShop. Cam kết hàng chuẩn 100% đầy đủ tem mác bảo hành."}
              </p>
            </div>

            {/* Trang thai ton kho */}
            <div className="mt-6">
              {isOutOfStock ? (
                <div className="flex items-center gap-2 text-sm font-bold text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span>Sản phẩm hiện đang tạm hết hàng tại kho</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                  <span>Còn {product.stock} sản phẩm trong kho</span>
                </div>
              )}
            </div>

            {/* Ghi chu cang cuoc */}
            {!isOutOfStock && (
              <div className="mt-6">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Yêu cầu căng cước bổ sung (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Căng cước Yonex BG65 Ti 11kg..."
                  value={stringNote}
                  onChange={(e) => setStringNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-[#f66315] focus:ring-2 focus:ring-orange-100"
                />
              </div>
            )}

            {/* Chon so luong */}
            {!isOutOfStock && (
              <div className="mt-6 flex items-center gap-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Số lượng:
                </span>
                <div className="flex items-center rounded-xl border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="flex h-10 w-10 items-center justify-center text-slate-600 hover:text-[#f66315] disabled:opacity-30"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-slate-800">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (quantity < product.stock) {
                        setQuantity((q) => q + 1);
                      } else {
                        toast.error(`Kho chỉ còn ${product.stock} sản phẩm`);
                      }
                    }}
                    disabled={quantity >= product.stock}
                    className="flex h-10 w-10 items-center justify-center text-slate-600 hover:text-[#f66315] disabled:opacity-30"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Nut hanh dong Mua hang */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold shadow-md transition-all ${
                  isOutOfStock
                    ? "cursor-not-allowed bg-slate-200 text-slate-400 shadow-none"
                    : "bg-[#f66315] text-white hover:bg-[#d4520f]"
                }`}
              >
                <ShoppingCart className="h-4 w-4" />
                {isOutOfStock ? "Tạm hết hàng" : "Thêm vào giỏ hàng"}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold shadow-md transition-all ${
                  isOutOfStock
                    ? "cursor-not-allowed bg-slate-200 text-slate-400 shadow-none"
                    : "bg-[#d8500c] text-white hover:bg-[#ba4308]"
                }`}
              >
                <Zap className="h-4 w-4" />
                {isOutOfStock ? "Hết hàng" : "Mua ngay"}
              </button>
            </div>
          </div>

          {/* Cam ket / Chinh sach FBShop */}
          <div className="mt-8 grid grid-cols-3 gap-3 rounded-2xl bg-orange-50/50 p-4 border border-orange-100">
            <div className="flex flex-col items-center text-center">
              <ShieldCheck className="h-5 w-5 text-[#f66315]" />
              <span className="mt-1 text-[11px] font-bold text-slate-800">Chính hãng 100%</span>
              <span className="text-[10px] text-slate-500">Bảo hành 12 tháng</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Truck className="h-5 w-5 text-[#f66315]" />
              <span className="mt-1 text-[11px] font-bold text-slate-800">Giao hàng hỏa tốc</span>
              <span className="text-[10px] text-slate-500">Freeship từ 1 triệu</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <RotateCcw className="h-5 w-5 text-[#f66315]" />
              <span className="mt-1 text-[11px] font-bold text-slate-800">Đổi trả 7 ngày</span>
              <span className="text-[10px] text-slate-500">Nếu lỗi kỹ thuật</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}