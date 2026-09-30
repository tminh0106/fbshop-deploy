"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown } from "lucide-react";

// Ma danh muc khop voi bang DanhMuc trong CSDL
const CATEGORIES = [
  { label: "Tất cả danh mục", value: "" },
  { label: "Vợt Yonex", value: "DM_YONEX" },
  { label: "Vợt Lining", value: "DM_LINING" },
  { label: "Vợt Victor", value: "DM_VICTOR" },
  { label: "Vợt Mizuno", value: "DM_MIZUNO" },
  { label: "Giày cầu lông", value: "DM_GIAY" },
  { label: "Balo & Bao vợt", value: "DM_BALO" },
  { label: "Phụ kiện", value: "DM_PHUKIEN" },
];

interface QuickSearchBarProps {
  // header: o tim kiem nen xam tren thanh dau trang
  // pill: o tim kiem bo tron co chon danh muc ("Ban dang tim gi?")
  variant?: "header" | "pill";
}

export default function QuickSearchBar({ variant = "header" }: QuickSearchBarProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.set("search", keyword);
    if (category) params.set("category", category);
    router.push("/san-pham?" + params.toString());
  };

  if (variant === "pill") {
    return (
      <form
        onSubmit={handleSearch}
        className="flex h-12 w-full items-center rounded-full border border-slate-300 bg-white pl-2 transition-colors focus-within:border-[#f66315]"
      >
        <div className="relative hidden shrink-0 sm:block">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Danh mục"
            className="h-9 cursor-pointer appearance-none bg-transparent pl-5 pr-8 text-sm text-navy outline-none"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        </div>
        <span className="hidden h-6 w-px bg-slate-300 sm:block" />
        <input
          type="text"
          placeholder="Nhập từ khóa"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent px-5 text-sm text-navy outline-none"
        />
        <button
          type="submit"
          className="flex h-full shrink-0 items-center gap-2 rounded-full bg-[#f66315] px-6 text-[15px] font-semibold text-white transition-colors hover:bg-[#d4520f]"
        >
          <Search className="h-4 w-4" strokeWidth={2.5} />
          Tìm kiếm
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSearch}
      className="flex h-12 w-full items-center rounded-lg bg-[#f3f3f3] pl-4 pr-1.5 ring-[#f66315] transition-shadow focus-within:ring-1"
    >
      <Search className="h-5 w-5 shrink-0 text-slate-400" />
      <input
        type="text"
        placeholder="Tìm kiếm sản phẩm..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm text-navy outline-none"
      />
      <button
        type="submit"
        className="h-9 shrink-0 rounded bg-[#f66315] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#d4520f] sm:h-10 sm:px-7"
      >
        Tìm kiếm
      </button>
    </form>
  );
}
