"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProductItem } from "@/lib/types";

interface ProductCardProps {
  product: ProductItem;
  stock?: number;
}

// The san pham kieu fbshop.vn: anh nen xam, nhan goc phai, ten 2 dong, gia cam + gia goc gach ngang
export default function ProductCard({ product, stock }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const currentStock = stock !== undefined ? stock : product.stock;
  const isOutOfStock = currentStock !== undefined && currentStock <= 0;
  const href = "/san-pham/" + product.slug;

  return (
    <Link
      href={href}
      title={product.name}
      className="group flex flex-col rounded-lg bg-white p-2.5 transition-shadow duration-300 hover:shadow-[0_8px_28px_rgba(3,18,48,0.12)]"
    >
      {/* Anh san pham */}
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-[#efefef]">
        {imgError || !product.imageUrl ? (
          <div className="flex h-full w-full items-center justify-center text-5xl">🏸</div>
        ) : (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            onError={() => setImgError(true)}
            className={`object-cover transition-transform duration-500 ${
              isOutOfStock ? "opacity-50 grayscale" : "group-hover:scale-105"
            }`}
          />
        )}

        {/* Nhan goc phai tren */}
        <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-1">
          {product.isBestSeller && !isOutOfStock && (
            <span className="rounded-sm bg-amber-brand px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none text-white">
              Bán chạy
            </span>
          )}
          {product.discountPercent && product.discountPercent > 0 && !isOutOfStock && (
            <span className="rounded-sm bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
              -{product.discountPercent}%
            </span>
          )}
        </div>

        {isOutOfStock && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50">
            <span className="rounded bg-navy px-3 py-1 text-xs font-semibold text-white">Tạm hết hàng</span>
          </div>
        )}
      </div>

      {/* Thong tin */}
      <h3 className="mt-3 line-clamp-2 min-h-[2.6rem] font-sans text-[14px] font-medium leading-snug tracking-normal text-navy transition-colors group-hover:text-[#f66315]">
        {product.name}
        {product.weight ? ` | ${product.weight}` : ""}
      </h3>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
        <span className="text-[15px] font-bold text-[#f66315]">
          {product.price.toLocaleString("vi-VN")}đ
        </span>
        {product.originalPrice && (
          <span className="text-[13px] text-slate-400 line-through">
            {product.originalPrice.toLocaleString("vi-VN")}đ
          </span>
        )}
      </div>
    </Link>
  );
}
