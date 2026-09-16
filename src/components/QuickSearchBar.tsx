"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const CATEGORIES = [
  { label: "Tat ca danh muc", value: "" },
  { label: "Vot cau long Yonex", value: "vot-yonex" },
  { label: "Vot cau long Lining", value: "vot-lining" },
  { label: "Vot cau long Victor", value: "vot-victor" },
  { label: "Giay cau long", value: "giay-cau-long" },
  { label: "Balo & Bao vot", value: "balo-bao-vot" },
];

export default function QuickSearchBar() {
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

  return (
    <form
      onSubmit={handleSearch}
      className="mx-auto flex w-full max-w-2xl items-center overflow-hidden rounded-full border border-gray-200 bg-white p-1 shadow-sm focus-within:border-[#f66315] focus-within:ring-2 focus-within:ring-orange-100"
    >
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="hidden border-r border-gray-200 bg-transparent px-4 py-2 text-sm font-medium text-gray-600 outline-none sm:block"
      >
        {CATEGORIES.map((cat) => (
          <option key={cat.value} value={cat.value}>
            {cat.label}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Ban muon tim vot, giay hay phu kien gi?..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        className="w-full flex-1 bg-transparent px-4 py-2 text-sm text-gray-800 outline-none"
      />
      <button
        type="submit"
        className="flex items-center gap-2 rounded-full bg-[#f66315] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Tim kiem</span>
      </button>
    </form>
  );
}
