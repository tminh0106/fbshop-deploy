"use client";

import { useState, useEffect } from "react";
import {
  Warehouse,
  Search,
  Download,
  AlertTriangle,
  Edit2,
  Trash2,
  Plus,
  X,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import { exportToExcel } from "@/lib/exportExcel";

interface HangHoaKhoItem {
  MaHangHoa: string;
  ViTriKho: string | null;
  SoLuong: number;
  DonGiaNhap: number;
  NgayNhap: string;
  HanSuDung: string | null;
  GhiChu: string | null;
  MaHDK: string | null;
  MaSP: string;
  SanPham: {
    MaSP: string;
    TenSP: string;
    SoLuong: number;
    DanhMuc: { TenDanhMuc: string } | null;
  };
}

interface ProductOption {
  MaSP: string;
  TenSP: string;
}

interface LotForm {
  maSP: string;
  viTriKho: string;
  soLuong: string;
  donGiaNhap: string;
  hanSuDung: string;
  ghiChu: string;
}

const EMPTY_FORM: LotForm = { maSP: "", viTriKho: "KHO_CHINH", soLuong: "", donGiaNhap: "", hanSuDung: "", ghiChu: "" };
const SEARCH_FORBIDDEN = /[<>{}[\]\\;'"`=%$^*|~]/;
const LOW_STOCK = 5;

const toDateInput = (d: string | null) => (d ? new Date(d).toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }) : "");

export default function HangHoaKhoPage() {
  const [items, setItems] = useState<HangHoaKhoItem[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [searched, setSearched] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HangHoaKhoItem | null>(null);
  const [form, setForm] = useState<LotForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<HangHoaKhoItem | null>(null);

  const fetchItems = async (kw = keyword) => {
    const k = kw.trim();
    if (k && (k.length > 100 || SEARCH_FORBIDDEN.test(k))) {
      toast.error("Từ khóa tìm kiếm không hợp lệ");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (k) params.append("keyword", k);
      const res = await fetch(`/api/admin/hang-hoa-kho?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setItems(json.data || []);
        setSearched(!!k);
      } else {
        toast.error(json.error || "Không thể tải dữ liệu kho");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems("");
    fetch("/api/admin/san-pham")
      .then((r) => r.json())
      .then((j) => j.success && setProducts(j.data || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (item: HangHoaKhoItem) => {
    setEditing(item);
    setForm({
      maSP: item.MaSP,
      viTriKho: item.ViTriKho || "KHO_CHINH",
      soLuong: String(item.SoLuong),
      donGiaNhap: String(item.DonGiaNhap),
      hanSuDung: toDateInput(item.HanSuDung),
      ghiChu: item.GhiChu || "",
    });
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const locked = !!editing?.MaHDK;
    if (!form.maSP || !form.viTriKho.trim() || (!locked && (!form.soLuong || !form.donGiaNhap))) {
      toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc");
      return;
    }
    const qty = Number(form.soLuong);
    const price = Number(form.donGiaNhap);
    if (!locked && (!Number.isInteger(qty) || qty <= 0 || !Number.isInteger(price) || price <= 0)) {
      toast.error("Số lượng và đơn giá nhập phải là số nguyên lớn hơn 0");
      return;
    }

    const payload = {
      viTriKho: form.viTriKho,
      hanSuDung: form.hanSuDung || null,
      ghiChu: form.ghiChu,
      ...(!locked && { soLuong: qty, donGiaNhap: price }),
    };

    setSaving(true);
    try {
      const res = await fetch("/api/admin/hang-hoa-kho", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { maHangHoa: editing.MaHangHoa, ...payload } : { maSP: form.maSP, ...payload }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(json.message || "Lưu thành công");
        setFormOpen(false);
        fetchItems();
      } else {
        toast.error(json.error || "Lưu thất bại");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      const res = await fetch(`/api/admin/hang-hoa-kho?maHangHoa=${encodeURIComponent(deleting.MaHangHoa)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(json.message || "Xóa thành công");
        fetchItems();
      } else {
        toast.error(json.error || "Xóa thất bại");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setDeleting(null);
    }
  };

  const handleExportExcel = () => {
    if (items.length === 0) {
      toast.error("Không có dữ liệu để xuất file");
      return;
    }
    const dataToExport = items.map((item) => ({
      "Mã lô": item.MaHangHoa,
      "Mã SP": item.MaSP,
      "Tên sản phẩm": item.SanPham?.TenSP || "",
      "Danh mục": item.SanPham?.DanhMuc?.TenDanhMuc || "",
      "Vị trí kho": item.ViTriKho || "KHO_CHINH",
      "SL nhập của lô": item.SoLuong,
      "Tồn kho sản phẩm": item.SanPham?.SoLuong || 0,
      "Đơn giá nhập": Number(item.DonGiaNhap),
      "Ngày nhập": new Date(item.NgayNhap).toLocaleDateString("vi-VN"),
      "Hạn sử dụng": item.HanSuDung ? new Date(item.HanSuDung).toLocaleDateString("vi-VN") : "",
      "Nguồn": item.MaHDK ? `Phiếu nhập ${item.MaHDK}` : "Thêm thủ công",
      "Ghi chú": item.GhiChu || "",
    }));
    try {
      exportToExcel(dataToExport, "HangHoaTonKho_FBShop", "TonKho");
      toast.success("Đã xuất danh sách hàng hóa kho ra Excel!");
    } catch {
      toast.error("Đã xảy ra lỗi trong quá trình tạo file, vui lòng thử lại sau");
    }
  };

  const locked = !!editing?.MaHDK;
  const inputCls =
    "w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#f66315] disabled:bg-slate-100 disabled:text-slate-500";

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Warehouse className="h-6 w-6 text-[#f66315]" />
          QUẢN LÝ HÀNG HÓA TỒN KHO
        </h2>

        <div className="flex gap-2 self-start">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Xuất file Excel
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-xl bg-[#f66315] px-3 py-2 text-xs font-bold text-white hover:bg-[#e55000] transition-all"
          >
            <Plus className="h-4 w-4" />
            Thêm hàng hóa kho
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchItems();
          }}
          className="flex gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã lô, mã SP, tên sản phẩm, vị trí kho, ghi chú..."
              value={keyword}
              maxLength={100}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-[#f66315]"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-[#f66315] px-4 py-2 text-xs font-bold text-white hover:bg-[#e55000]"
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-700 uppercase">
              <tr>
                <th className="px-4 py-3">Mã lô</th>
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-4 py-3">Danh mục</th>
                <th className="px-4 py-3">Vị trí kho</th>
                <th className="px-4 py-3 text-center">SL nhập lô</th>
                <th className="px-4 py-3 text-center">Tồn kho SP</th>
                <th className="px-4 py-3 text-right">Đơn giá nhập</th>
                <th className="px-4 py-3">Ngày nhập</th>
                <th className="px-4 py-3">Nguồn</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                    Đang tải dữ liệu hàng hóa kho...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                    {searched ? "Không tìm thấy hàng hóa kho phù hợp" : "Chưa có lô hàng hóa nào trong kho"}
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isLow = (item.SanPham?.SoLuong || 0) <= LOW_STOCK;
                  return (
                    <tr key={item.MaHangHoa} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900" title={item.MaHangHoa}>
                        {item.MaHangHoa.slice(0, 10)}…
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">{item.SanPham?.TenSP}</p>
                        <span className="text-[10px] text-slate-400">{item.MaSP}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.SanPham?.DanhMuc?.TenDanhMuc || "Chưa gán"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
                          {item.ViTriKho || "KHO_CHINH"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-700">{item.SoLuong}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isLow ? "bg-red-50 text-red-600 border border-red-200" : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {isLow && <AlertTriangle className="h-3 w-3 text-red-500" />}
                          {item.SanPham?.SoLuong || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {Number(item.DonGiaNhap).toLocaleString("vi-VN")} đ
                      </td>
                      <td className="px-4 py-3 text-slate-500">{new Date(item.NgayNhap).toLocaleDateString("vi-VN")}</td>
                      <td className="px-4 py-3">
                        {item.MaHDK ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-700">
                            <Lock className="h-3 w-3" />
                            {item.MaHDK}
                          </span>
                        ) : (
                          <span className="rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-[#f66315]">
                            Thêm thủ công
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(item)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                            title="Sửa"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleting(item)}
                            className="rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
                            title="Xóa"
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
      </div>

      {/* Modal them / sua */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleSave} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editing ? "Sửa hàng hóa kho" : "Thêm hàng hóa kho"}
              </h3>
              <button type="button" onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            {locked && (
              <p className="rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-700">
                Lô thuộc phiếu nhập {editing?.MaHDK}: số lượng và đơn giá khóa theo chứng từ.
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 space-y-1">
                <span className="text-xs font-bold text-slate-700">Sản phẩm *</span>
                <select
                  value={form.maSP}
                  disabled={!!editing}
                  onChange={(e) => setForm({ ...form, maSP: e.target.value })}
                  className={inputCls}
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {editing && !products.some((p) => p.MaSP === editing.MaSP) && (
                    <option value={editing.MaSP}>{editing.SanPham?.TenSP}</option>
                  )}
                  {products.map((p) => (
                    <option key={p.MaSP} value={p.MaSP}>
                      {p.TenSP} ({p.MaSP})
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold text-slate-700">Vị trí kho *</span>
                <input
                  value={form.viTriKho}
                  maxLength={100}
                  onChange={(e) => setForm({ ...form, viTriKho: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold text-slate-700">Hạn sử dụng</span>
                <input
                  type="date"
                  value={form.hanSuDung}
                  onChange={(e) => setForm({ ...form, hanSuDung: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold text-slate-700">Số lượng *</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={form.soLuong}
                  disabled={locked}
                  onChange={(e) => setForm({ ...form, soLuong: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold text-slate-700">Đơn giá nhập (đ) *</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={form.donGiaNhap}
                  disabled={locked}
                  onChange={(e) => setForm({ ...form, donGiaNhap: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label className="col-span-2 space-y-1">
                <span className="text-xs font-bold text-slate-700">Ghi chú</span>
                <textarea
                  rows={2}
                  maxLength={450}
                  value={form.ghiChu}
                  onChange={(e) => setForm({ ...form, ghiChu: e.target.value })}
                  className={inputCls}
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#f66315] px-4 py-2 text-xs font-bold text-white hover:bg-[#e55000] disabled:opacity-60"
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Xac nhan xoa (Bang 3.14 - A1 huy thao tac) */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Xóa hàng hóa kho?</h3>
            <p className="text-xs text-slate-600">
              Lô <strong>{deleting.SanPham?.TenSP}</strong> ({deleting.SoLuong} sản phẩm tại{" "}
              {deleting.ViTriKho || "KHO_CHINH"}) sẽ bị xóa và số lượng tương ứng được trừ khỏi tồn kho.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleting(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
