"use client";

import { useState, useEffect } from "react";
import {
  Package,
  PlusCircle,
  Search,
  Download,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";
import { exportToExcel } from "@/lib/exportExcel";
import ProductImageInput from "@/components/admin/ProductImageInput";
import Pagination from "@/components/admin/Pagination";

const PAGE_SIZE = 10;
// Thu tu nhom: vot cac hang -> balo -> phu kien -> giay
const CATEGORY_ORDER = ["DM_YONEX", "DM_LINING", "DM_VICTOR", "DM_MIZUNO", "DM_BALO", "DM_PHUKIEN", "DM_GIAY"];
// Thu tu hang trong cung nhom (doc tu ten san pham)
const BRAND_ORDER = ["yonex", "lining", "victor", "mizuno"];

const categoryRank = (maDanhMuc: string) => {
  const i = CATEGORY_ORDER.indexOf(maDanhMuc);
  return i < 0 ? CATEGORY_ORDER.length : i;
};
const brandRank = (tenSP: string) => {
  const name = tenSP.toLowerCase().replace("li-ning", "lining");
  const i = BRAND_ORDER.findIndex((b) => name.includes(b));
  return i < 0 ? BRAND_ORDER.length : i;
};
const sortProducts = <T extends { MaDanhMuc: string; TenSP: string }>(list: T[]) =>
  [...list].sort(
    (a, b) =>
      categoryRank(a.MaDanhMuc) - categoryRank(b.MaDanhMuc) ||
      brandRank(a.TenSP) - brandRank(b.TenSP) ||
      a.TenSP.localeCompare(b.TenSP, "vi")
  );

interface ProductItem {
  MaSP: string;
  TenSP: string;
  GiaBan: number;
  SoLuong: number;
  TrongLuong: string | null;
  HinhAnh: string | null;
  MoTa: string | null;
  MaDanhMuc: string;
  DanhMuc: { TenDanhMuc: string };
  _count?: {
    ChiTietDonHangs: number;
    ChiTietHoaDonKhos: number;
  };
}

interface CategoryItem {
  MaDanhMuc: string;
  TenDanhMuc: string;
}

export default function AdminSanPhamPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [selectedCat, setSelectedCat] = useState("ALL");
  const [page, setPage] = useState(1);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [formData, setFormData] = useState({
    maSP: "",
    tenSP: "",
    giaBan: 3500000,
    soLuong: 10,
    trongLuong: "4U",
    hinhAnh: "",
    moTa: "",
    maDanhMuc: "DM_YONEX",
  });

  // Phan trang: sau khi sua/xoa van giu trang hien tai, tu lui ve trang cuoi neu het dong
  const pageCount = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedProducts = products.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.append("keyword", keyword);
      if (selectedCat !== "ALL") params.append("maDanhMuc", selectedCat);

      const res = await fetch(`/api/admin/san-pham?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setProducts(sortProducts(json.data || []));
      }
    } catch {
      toast.error("Lỗi khi tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // API storefront tra kem danh sach danh muc: { id, name }
      const res = await fetch("/api/san-pham?limit=1");
      const json = await res.json();
      if (!res.ok || !Array.isArray(json.categories)) throw new Error("Không tải được danh mục");
      setCategories(
        json.categories.map((c: { id: string; name: string }) => ({
          MaDanhMuc: c.id,
          TenDanhMuc: c.name,
        }))
      );
    } catch {
      // fallback categories
      setCategories([
        { MaDanhMuc: "DM_YONEX", TenDanhMuc: "Vợt Yonex" },
        { MaDanhMuc: "DM_LINING", TenDanhMuc: "Vợt Lining" },
        { MaDanhMuc: "DM_VICTOR", TenDanhMuc: "Vợt Victor" },
        { MaDanhMuc: "DM_MIZUNO", TenDanhMuc: "Vợt Mizuno" },
        { MaDanhMuc: "DM_GIAY", TenDanhMuc: "Giày Cầu Lông" },
        { MaDanhMuc: "DM_BALO", TenDanhMuc: "Balo & Bao Vợt" },
        { MaDanhMuc: "DM_PHUKIEN", TenDanhMuc: "Phụ Kiện" },
      ]);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      maSP: `SP_${Date.now().toString().slice(-5)}`,
      tenSP: "",
      giaBan: 3000000,
      soLuong: 10,
      trongLuong: "4U",
      hinhAnh: "",
      moTa: "",
      maDanhMuc: categories[0]?.MaDanhMuc || "DM_YONEX",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (p: ProductItem) => {
    setEditingProduct(p);
    setFormData({
      maSP: p.MaSP,
      tenSP: p.TenSP,
      giaBan: Number(p.GiaBan),
      soLuong: p.SoLuong,
      trongLuong: p.TrongLuong || "",
      hinhAnh: p.HinhAnh || "",
      moTa: p.MoTa || "",
      maDanhMuc: p.MaDanhMuc,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tenSP.trim()) {
      toast.error("Vui lòng nhập tên sản phẩm");
      return;
    }
    if (!Number.isInteger(formData.giaBan) || formData.giaBan <= 0) {
      toast.error("Giá bán phải là số nguyên lớn hơn 0");
      return;
    }
    if (!Number.isInteger(formData.soLuong) || formData.soLuong < 0) {
      toast.error("Số lượng tồn phải là số nguyên không âm");
      return;
    }

    try {
      const method = editingProduct ? "PUT" : "POST";
      const res = await fetch("/api/admin/san-pham", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể lưu sản phẩm");
      } else {
        toast.success(editingProduct ? "Đã cập nhật sản phẩm" : "Đã thêm sản phẩm mới");
        setShowModal(false);
        fetchProducts();
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    }
  };

  const handleDelete = async (maSP: string, tenSP: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${tenSP}"?`)) return;

    try {
      const res = await fetch(`/api/admin/san-pham?maSP=${maSP}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể xóa");
      } else {
        if (data.softDeleted) {
          toast(data.message, { icon: "⚠️", duration: 5000 });
        } else {
          toast.success(data.message);
        }
        fetchProducts();
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    }
  };

  const handleExportExcel = () => {
    const dataToExport = products.map((p) => ({
      "Mã SP": p.MaSP,
      "Tên sản phẩm": p.TenSP,
      "Danh mục": p.DanhMuc?.TenDanhMuc || "",
      "Giá bán (VNĐ)": Number(p.GiaBan),
      "Tồn kho": p.SoLuong,
      "Trọng lượng": p.TrongLuong || "",
      "Số đơn có hàng": p._count?.ChiTietDonHangs || 0,
      "Số hóa đơn kho": p._count?.ChiTietHoaDonKhos || 0,
      "Trạng thái": p.MoTa?.includes("[NGỪNG KINH DOANH]")
        ? "Ngừng kinh doanh"
        : "Đang bán",
      "Mô tả": p.MoTa || "",
    }));

    exportToExcel(dataToExport, "DanhSachSanPham_FBShop", "SanPham");
    toast.success("Đã xuất danh sách sản phẩm ra Excel!");
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="h-6 w-6 text-[#f66315]" />
            QUẢN LÝ SẢN PHẨM & DANH MỤC
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-xl bg-[#f66315] px-4 py-2 text-xs font-bold text-white shadow-md shadow-orange-900/20 hover:bg-[#e55000] transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            Thêm sản phẩm mới
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchProducts();
          }}
          className="grid grid-cols-1 gap-3 md:grid-cols-4"
        >
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã sản phẩm hoặc tên vợt..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-[#f66315]"
            />
          </div>

          <div>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-[#f66315]"
            >
              <option value="ALL">-- Tất cả danh mục --</option>
              {categories.map((c) => (
                <option key={c.MaDanhMuc} value={c.MaDanhMuc}>
                  {c.TenDanhMuc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 py-2 text-xs font-bold text-white hover:bg-black"
            >
              Lọc kết quả
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-700 uppercase">
              <tr>
                <th className="px-4 py-3">Mã SP</th>
                <th className="px-4 py-3">Tên Sản Phẩm</th>
                <th className="px-4 py-3">Danh Mục</th>
                <th className="px-4 py-3 text-right">Giá Bán</th>
                <th className="px-4 py-3 text-center">Tồn Kho</th>
                <th className="px-4 py-3 text-center">Trọng Lượng</th>
                <th className="px-4 py-3 text-center">Trạng Thái</th>
                <th className="px-4 py-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    Đang tải danh sách sản phẩm...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    Không tìm thấy sản phẩm nào
                  </td>
                </tr>
              ) : (
                pagedProducts.map((p) => {
                  const isStopped = p.MoTa?.includes("[NGỪNG KINH DOANH]");
                  const hasHistory =
                    (p._count?.ChiTietDonHangs || 0) > 0 ||
                    (p._count?.ChiTietHoaDonKhos || 0) > 0;

                  return (
                    <tr key={p.MaSP} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{p.MaSP}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={p.HinhAnh || "/images/placeholder.png"}
                              alt=""
                              loading="lazy"
                              className="h-full w-full object-contain"
                            />
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800">{p.TenSP}</p>
                            {p.MoTa && (
                              <p className="text-[11px] text-slate-400 truncate max-w-[280px]">
                                {p.MoTa}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {p.DanhMuc?.TenDanhMuc || p.MaDanhMuc}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-slate-900">
                        {Number(p.GiaBan).toLocaleString("vi-VN")} đ
                      </td>
                      <td className="px-4 py-3 text-center font-bold">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] ${
                            p.SoLuong <= 5
                              ? "bg-red-50 text-red-600 border border-red-200"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {p.SoLuong}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-600">
                        {p.TrongLuong || "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isStopped
                              ? "bg-slate-100 text-slate-600 border border-slate-300"
                              : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          }`}
                        >
                          {isStopped ? "Ngừng kinh doanh" : "Đang kinh doanh"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.MaSP, p.TenSP)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title={
                              hasHistory
                                ? "Chuyển ngừng kinh doanh (do có giao dịch)"
                                : "Xóa sản phẩm"
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && (
          <Pagination page={currentPage} pageSize={PAGE_SIZE} total={products.length} unit="sản phẩm" onChange={setPage} />
        )}
      </div>

      {/* Modal Them / Sua San Pham */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? `CHỈNH SỬA SẢN PHẨM: ${editingProduct.MaSP}` : "THÊM SẢN PHẨM MỚI"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Mã sản phẩm</label>
                  <input
                    type="text"
                    disabled={!!editingProduct}
                    value={formData.maSP}
                    maxLength={50}
                    onChange={(e) => setFormData({ ...formData, maSP: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Danh mục</label>
                  <select
                    value={formData.maDanhMuc}
                    onChange={(e) => setFormData({ ...formData, maDanhMuc: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#f66315]"
                  >
                    {categories.map((c) => (
                      <option key={c.MaDanhMuc} value={c.MaDanhMuc}>
                        {c.TenDanhMuc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Tên sản phẩm *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Vợt Cầu Lông Yonex Astrox 88D Pro"
                  value={formData.tenSP}
                  maxLength={200}
                  onChange={(e) => setFormData({ ...formData, tenSP: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#f66315]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Giá bán (VNĐ)</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={formData.giaBan}
                    onChange={(e) =>
                      setFormData({ ...formData, giaBan: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#f66315]"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Số lượng tồn</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={formData.soLuong}
                    onChange={(e) =>
                      setFormData({ ...formData, soLuong: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#f66315]"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Trọng lượng (vợt)</label>
                  <input
                    type="text"
                    placeholder="3U, 4U... (bỏ trống với giày, balo)"
                    value={formData.trongLuong}
                    maxLength={10}
                    onChange={(e) =>
                      setFormData({ ...formData, trongLuong: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#f66315]"
                  />
                </div>
              </div>

              <ProductImageInput
                value={formData.hinhAnh}
                onChange={(hinhAnh) => setFormData((prev) => ({ ...prev, hinhAnh }))}
              />

              <div>
                <label className="mb-1 block font-bold text-slate-700">Mô tả thông số</label>
                <textarea
                  rows={3}
                  placeholder="Thông số độ dẻo, điểm cân bằng, sức căng tối đa..."
                  value={formData.moTa}
                  onChange={(e) => setFormData({ ...formData, moTa: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#f66315]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#f66315] px-5 py-2 font-bold text-white hover:bg-[#e55000] shadow-md shadow-orange-900/20"
                >
                  Lưu sản phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
