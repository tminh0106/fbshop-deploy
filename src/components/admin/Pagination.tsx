"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

// Danh sach so trang hien thi: 1 … 4 5 6 … 12
export function pageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("...");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push("...");
  pages.push(total);
  return pages;
}

interface PaginationProps {
  page: number; // trang hien tai (da gioi han trong [1, pageCount])
  pageSize: number;
  total: number; // tong so dong
  unit: string; // "phiếu", "sản phẩm"...
  onChange: (page: number) => void;
}

// Thanh phan trang cuoi bang: "Hien thi 1–10 trong 37 phieu" + nut trang
export default function Pagination({ page, pageSize, total, unit, onChange }: PaginationProps) {
  if (total === 0) return null;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-600 sm:flex-row">
      <p>
        Hiển thị <strong>{(page - 1) * pageSize + 1}</strong>–<strong>{Math.min(page * pageSize, total)}</strong> trong{" "}
        <strong>{total}</strong> {unit}
      </p>
      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChange(page - 1)}
            disabled={page === 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            title="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pageNumbers(page, pageCount).map((p, i) =>
            p === "..." ? (
              <span key={`gap-${i}`} className="px-1 text-slate-400">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onChange(p)}
                className={`h-8 min-w-8 rounded-lg px-2 font-semibold ${
                  p === page ? "bg-[#f66315] text-white" : "border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => onChange(page + 1)}
            disabled={page === pageCount}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            title="Trang sau"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
