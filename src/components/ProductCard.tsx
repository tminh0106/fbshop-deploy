"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProductItem } from "@/lib/types";

interface ProductCardProps {
  product: ProductItem;
  stock?: number;
}

export default function ProductCard({ product, stock }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const currentStock = stock !== undefined ? stock : product.stock;
  const isOutOfStock = currentStock !== undefined && currentStock <= 0;

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-orange-200">
      {/* Vung hien thi anh & Badge */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gradient-to-b from-gray-50 to-gray-100/50">
        {imgError || !product.imageUrl ? (
          <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
            <span className="text-5xl drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
              🏸
            </span>
            <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              FBShop Official
            </span>
          </div>
        ) : (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            onError={() => setImgError(true)}
            className={`object-contain p-3 transition-transform duration-500 ${
              isOutOfStock ? "opacity-50 grayscale-[50%]" : "group-hover:scale-105"
            }`}
          />
        )}

        {/* Badges goc tren */}
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5 z-10">
          {product.isBestSeller && !isOutOfStock && (
            <span className="rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
              ★ Bán chạy
            </span>
          )}
          {product.discountPercent && product.discountPercent > 0 && !isOutOfStock && (
            <span className="rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
              -{product.discountPercent}%
            </span>
          )}
        </div>

        {/* Overlay Tam het hang neu SoLuong === 0 */}
        {isOutOfStock ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
            <span className="rounded-lg bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md">
              Tạm hết hàng
            </span>
          </div>
        ) : (
          /* Nut hanh dong nhanh khi hover */
          <div className="absolute inset-x-3 bottom-3 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 z-10">
            <Link
              href={"/san-pham/" + product.slug}
              className="block w-full rounded-xl bg-[#f66315] py-2.5 text-center text-xs font-bold text-white shadow-md transition-colors hover:bg-orange-700"
            >
              Xem chi tiết
            </Link>
          </div>
        )}
      </div>

      {/* Thong tin san pham */}
      <div className="mt-3 flex flex-1 flex-col justify-between">
        <Link
          href={"/san-pham/" + product.slug}
          className="line-clamp-2 text-sm font-bold text-gray-800 transition-colors hover:text-[#f66315]"
          title={product.name}
        >
          {product.name}
        </Link>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
          {product.weight && (
            <span className="rounded-md bg-gray-100 px-2 py-0.5 font-semibold text-gray-600">
              {product.weight}
            </span>
          )}
          {isOutOfStock && (
            <span className="text-[11px] font-bold text-red-500">Hết hàng</span>
          )}
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-base font-extrabold text-[#f66315]">
            {product.price.toLocaleString("vi-VN")}đ
          </span>
          {product.originalPrice && (
            <span className="text-xs text-gray-400 line-through">
              {product.originalPrice.toLocaleString("vi-VN")}đ
            </span>
          )}
        </div>
      </div>
    </div>
  );
}