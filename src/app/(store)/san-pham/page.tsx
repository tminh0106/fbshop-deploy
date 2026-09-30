"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import type { ProductItem, Category } from "@/lib/types";
import { Filter, RotateCcw, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";

function ProductCatalog() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter states
  const initialCat = searchParams.get("category") || "";
  const initialSearch = searchParams.get("search") || "";
  const initialMinPrice = searchParams.get("minPrice") || "";
  const initialMaxPrice = searchParams.get("maxPrice") || "";
  const initialWeight = searchParams.get("weight") || "";
  const initialSort = searchParams.get("sort") || "newest";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [selectedWeight, setSelectedWeight] = useState(initialWeight);
  const [sortBy, setSortBy] = useState(initialSort);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (initialSearch) params.set("search", initialSearch);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (selectedWeight) params.set("weight", selectedWeight);
      if (sortBy) params.set("sort", sortBy);
      params.set("page", currentPage.toString());
      params.set("limit", "12");

      const res = await fetch(`/api/san-pham?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        if (data.categories) setCategories(data.categories);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedWeight, sortBy, currentPage, initialSearch]);

  const handleApplyFilter = () => {
    setCurrentPage(1);
    fetchProducts();
  };

  const handleResetFilter = () => {
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedWeight("");
    setSortBy("newest");
    setCurrentPage(1);
    router.push("/san-pham");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb & Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900 sm:text-3xl">
          Danh mục sản phẩm FBShop
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* ================= COT TRAI: BO LOC ================= */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Filter className="h-4 w-4 text-[#f66315]" />
                <span>Bộ lọc tìm kiếm</span>
              </div>
              <button
                type="button"
                onClick={handleResetFilter}
                className="flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-[#f66315]"
                title="Xóa bộ lọc"
              >
                <RotateCcw className="h-3 w-3" />
                Xóa lọc
              </button>
            </div>

            {/* Loc theo Danh Muc */}
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                Thương hiệu / Danh mục
              </h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer hover:text-[#f66315]">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === ""}
                    onChange={() => {
                      setSelectedCategory("");
                      setCurrentPage(1);
                    }}
                    className="accent-[#f66315]"
                  />
                  <span>Tất cả danh mục</span>
                </label>
                {categories.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer hover:text-[#f66315]"
                  >
                    <input
                      type="radio"
                      name="category"
                      value={cat.id}
                      checked={selectedCategory === cat.id}
                      onChange={() => {
                        setSelectedCategory(cat.id);
                        setCurrentPage(1);
                      }}
                      className="accent-[#f66315]"
                    />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Loc theo Khoang gia */}
            <div className="border-t border-slate-100 pt-5">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                Khoảng giá (VNĐ)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Từ..."
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-[#f66315]"
                />
                <input
                  type="number"
                  placeholder="Đến..."
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-[#f66315]"
                />
              </div>
            </div>

            {/* Loc theo Trong luong */}
            <div className="border-t border-slate-100 pt-5">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                Trọng lượng vợt
              </h3>
              <div className="flex flex-wrap gap-2">
                {["", "3U", "4U", "5U"].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => {
                      setSelectedWeight(w);
                      setCurrentPage(1);
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                      selectedWeight === w
                        ? "border-[#f66315] bg-[#f66315] text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {w ? w : "Tất cả"}
                  </button>
                ))}
              </div>
            </div>

            {/* Nut hanh dong bo loc */}
            <button
              type="button"
              onClick={handleApplyFilter}
              className="w-full rounded-xl bg-[#f66315] py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#d4520f]"
            >
              Áp dụng bộ lọc
            </button>
          </div>
        </aside>

        {/* ================= COT PHAI: LUOI SAN PHAM ================= */}
        <section className="lg:col-span-3">
          {/* Thanh sap xep & tong ket qua */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
            <p className="text-sm font-medium text-slate-600">
              Tìm thấy <span className="font-bold text-[#f66315]">{total}</span> sản phẩm
              {initialSearch && <span> cho từ khóa "{initialSearch}"</span>}
            </p>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-[#f66315]"
              >
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
              </select>
            </div>
          </div>

          {/* Danh sach Card */}
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border border-slate-100 bg-white p-4 h-72" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-2xl text-[#f66315]">
                🏸
              </div>
              <h3 className="text-base font-bold text-slate-800">Không tìm thấy sản phẩm phù hợp</h3>
              <p className="mt-1 text-xs text-slate-500">
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm khác xem sao nhé!
              </p>
              <button
                type="button"
                onClick={handleResetFilter}
                className="mt-4 inline-block rounded-xl bg-[#f66315] px-4 py-2 text-xs font-semibold text-white"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} stock={product.stock} />
              ))}
            </div>
          )}

          {/* Phan trang */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-[#f66315] hover:text-[#f66315] disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {[...Array(totalPages)].map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                      currentPage === pageNum
                        ? "bg-[#f66315] text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-[#f66315] hover:text-[#f66315] disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// Bo loc khoi tao tu URL (?category=, ?search=...). Khi bam menu/danh muc khac ma van o trang nay,
// Next.js giu nguyen component nen state cu khong doi -> dung key theo URL de dung lai tu dau.
function CatalogForCurrentUrl() {
  const searchParams = useSearchParams();
  return <ProductCatalog key={searchParams.toString()} />;
}

export default function ProductListPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Đang tải danh sách sản phẩm...</div>}>
      <CatalogForCurrentUrl />
    </Suspense>
  );
}