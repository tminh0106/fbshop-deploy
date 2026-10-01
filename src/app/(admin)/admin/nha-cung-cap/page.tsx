"use client";

import { useState, useEffect } from "react";
import {
  Truck,
  PlusCircle,
  Search,
  Download,
  Edit2,
  Trash2,
  CheckCircle2,
  Phone,
  Mail,
} from "lucide-react";
import toast from "react-hot-toast";
import { exportToExcel } from "@/lib/exportExcel";
import { EMAIL_ERROR, EMAIL_REGEX, PHONE_ERROR, PHONE_REGEX, TAX_CODE_ERROR, TAX_CODE_REGEX } from "@/lib/validation";

interface NCCItem {
  MaNCC: string;
  TenNCC: string;
  SoDienThoai: string;
  DiaChi: string | null;
  Email: string | null;
  MaSoThue: string | null;
  NguoiDaiDien: string | null;
  GhiChu: string | null;
  TrangThai: string;
  _count?: { HoaDonKhos: number };
  CongNo?: number;
}

export default function AdminNhaCungCapPage() {
  const [suppliers, setSuppliers] = useState<NCCItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [searchedKeyword, setSearchedKeyword] = useState("");
  const [nextMaNCC, setNextMaNCC] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingNCC, setEditingNCC] = useState<NCCItem | null>(null);
  const [formData, setFormData] = useState({
    maNCC: "",
    tenNCC: "",
    soDienThoai: "",
    diaChi: "",
    email: "",
    maSoThue: "",
    nguoiDaiDien: "",
    ghiChu: "",
    trangThai: "Active",
  });

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.append("keyword", keyword);

      const res = await fetch(`/api/admin/nha-cung-cap?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setSuppliers(json.data || []);
        if (json.nextMaNCC) setNextMaNCC(json.nextMaNCC);
        setSearchedKeyword(keyword.trim());
      } else {
        // Bang 3.25 A2: tu khoa khong hop le
        toast.error(json.error || "Lỗi khi tải nhà cung cấp");
      }
    } catch {
      toast.error("Lỗi khi tải nhà cung cấp");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenCreate = () => {
    setEditingNCC(null);
    setFormData({
      maNCC: nextMaNCC || "Tự động",
      tenNCC: "",
      soDienThoai: "",
      diaChi: "",
      email: "",
      maSoThue: "",
      nguoiDaiDien: "",
      ghiChu: "",
      trangThai: "Active",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (ncc: NCCItem) => {
    setEditingNCC(ncc);
    setFormData({
      maNCC: ncc.MaNCC,
      tenNCC: ncc.TenNCC,
      soDienThoai: ncc.SoDienThoai,
      diaChi: ncc.DiaChi || "",
      email: ncc.Email || "",
      maSoThue: ncc.MaSoThue || "",
      nguoiDaiDien: ncc.NguoiDaiDien || "",
      ghiChu: ncc.GhiChu || "",
      // Du lieu cu co the luu "Dang hop tac": moi gia tri khac "Ngung hop tac" deu la dang hop tac
      trangThai: ncc.TrangThai === "Ngung hop tac" ? "Ngung hop tac" : "Active",
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // Bang 3.22/3.23 - A1 bo trong, A2 sai dinh dang (server kiem tra lai)
    const clientError = !formData.tenNCC.trim()
      ? "Vui lòng nhập tên nhà cung cấp"
      : !formData.soDienThoai.trim()
      ? "Vui lòng nhập số điện thoại"
      : !PHONE_REGEX.test(formData.soDienThoai.trim())
      ? PHONE_ERROR
      : !formData.diaChi.trim()
      ? "Vui lòng nhập địa chỉ"
      : formData.email.trim() && !EMAIL_REGEX.test(formData.email.trim())
      ? EMAIL_ERROR
      : formData.maSoThue.trim() && !TAX_CODE_REGEX.test(formData.maSoThue.trim())
      ? TAX_CODE_ERROR
      : "";
    if (clientError) {
      toast.error(clientError);
      return;
    }

    try {
      const method = editingNCC ? "PUT" : "POST";
      const res = await fetch("/api/admin/nha-cung-cap", {
        method,
        headers: { "Content-Type": "application/json" },
        // Them moi: ma NCC do server cap
        body: JSON.stringify({ ...formData, maNCC: editingNCC ? formData.maNCC : undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể lưu nhà cung cấp");
      } else {
        toast.success(data.message || (editingNCC ? "Cập nhật nhà cung cấp thành công" : "Thêm nhà cung cấp thành công"));
        setShowModal(false);
        fetchSuppliers();
      }
    } catch {
      toast.error("Lỗi kết nối");
    }
  };

  const handleDelete = async (maNCC: string, tenNCC: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa nhà cung cấp "${tenNCC}"?`)) return;

    try {
      const res = await fetch(`/api/admin/nha-cung-cap?maNCC=${maNCC}`, {
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
        fetchSuppliers();
      }
    } catch {
      toast.error("Lỗi kết nối");
    }
  };

  const handleExportExcel = () => {
    const dataToExport = suppliers.map((s) => ({
      "Mã NCC": s.MaNCC,
      "Tên nhà cung cấp": s.TenNCC,
      "Số điện thoại": s.SoDienThoai,
      "Email": s.Email || "",
      "Địa chỉ": s.DiaChi || "",
      "Mã số thuế": s.MaSoThue || "",
      "Người đại diện": s.NguoiDaiDien || "",
      "Trạng thái": s.TrangThai === "Ngung hop tac" ? "Ngừng hợp tác" : "Đang hợp tác",
      "Hóa đơn kho liên kết": s._count?.HoaDonKhos || 0,
      "Công nợ (VNĐ)": s.CongNo || 0,
    }));

    exportToExcel(dataToExport, "DanhSachNhaCungCap_FBShop", "NhaCungCap");
    toast.success("Đã xuất danh sách nhà cung cấp ra Excel!");
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="h-6 w-6 text-[#f66315]" />
            QUẢN LÝ NHÀ CUNG CẤP & ĐỐI TÁC
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-xl bg-[#f66315] px-4 py-2 text-xs font-bold text-white shadow-md shadow-orange-900/20 hover:bg-[#e55000] transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            Thêm nhà cung cấp
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
            fetchSuppliers();
          }}
          className="flex gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên NCC, SĐT, mã..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-[#f66315]"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-black"
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
                <th className="px-4 py-3">Mã NCC</th>
                <th className="px-4 py-3">Tên Nhà Cung Cấp</th>
                <th className="px-4 py-3">Liên Hệ</th>
                <th className="px-4 py-3">Mã Số Thuế</th>
                <th className="px-4 py-3">Đại Diện</th>
                <th className="px-4 py-3 text-center">HĐ Kho</th>
                <th className="px-4 py-3 text-right">Công Nợ</th>
                <th className="px-4 py-3 text-center">Trạng Thái</th>
                <th className="px-4 py-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    Đang tải danh sách nhà cung cấp...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    {searchedKeyword ? "Không tìm thấy nhà cung cấp phù hợp" : "Chưa có nhà cung cấp nào"}
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => {
                  const isStopped = s.TrangThai === "Ngung hop tac";

                  return (
                    <tr key={s.MaNCC} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{s.MaNCC}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">{s.TenNCC}</p>
                        <p className="text-[10px] text-slate-400">{s.DiaChi || "Chưa có địa chỉ"}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="flex items-center gap-1 font-medium text-slate-800">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{s.SoDienThoai}</span>
                        </div>
                        {s.Email && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Mail className="h-3 w-3" />
                            <span>{s.Email}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">{s.MaSoThue || "—"}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {s.NguoiDaiDien || "—"}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-700">
                        {s._count?.HoaDonKhos || 0}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {s.CongNo ? (
                          <span className="font-bold text-red-600">{s.CongNo.toLocaleString("vi-VN")} đ</span>
                        ) : (
                          <span className="text-slate-400">0 đ</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isStopped
                              ? "bg-red-50 text-red-600 border border-red-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {isStopped ? "Ngừng hợp tác" : "Đang hợp tác"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                            title="Sửa thông tin"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.MaNCC, s.TenNCC)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Xóa / Ngừng hợp tác"
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

      {/* Modal Them / Sua NCC */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingNCC ? `SỬA NHÀ CUNG CẤP: ${editingNCC.MaNCC}` : "THÊM NHÀ CUNG CẤP MỚI"}
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
                  <label className="mb-1 block font-bold text-slate-700">
                    Mã NCC <span className="font-normal text-slate-400">(hệ thống tự cấp)</span>
                  </label>
                  {/* FR-21.4: ma NCC co dinh, khong cho sua */}
                  <input
                    type="text"
                    readOnly
                    value={formData.maNCC}
                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 p-2.5 font-mono font-bold text-slate-700 outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Trạng thái</label>
                  {editingNCC ? (
                    <select
                      value={formData.trangThai}
                      onChange={(e) => setFormData({ ...formData, trangThai: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#f66315]"
                    >
                      <option value="Active">Đang hợp tác</option>
                      <option value="Ngung hop tac">Ngừng hợp tác</option>
                    </select>
                  ) : (
                    <p className="flex h-[38px] items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 font-semibold text-emerald-700">
                      Đang hợp tác
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Tên nhà cung cấp *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Yonex Việt Nam Distribution"
                  value={formData.tenNCC}
                  onChange={(e) => setFormData({ ...formData, tenNCC: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#f66315]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Số điện thoại *</label>
                  <input
                    type="text"
                    required
                    placeholder="0281234567"
                    value={formData.soDienThoai}
                    onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#f66315]"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Email</label>
                  <input
                    type="email"
                    placeholder="contact@supplier.vn"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#f66315]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Mã số thuế</label>
                  <input
                    type="text"
                    placeholder="0101234567"
                    value={formData.maSoThue}
                    onChange={(e) => setFormData({ ...formData, maSoThue: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#f66315]"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Người đại diện</label>
                  <input
                    type="text"
                    placeholder="Nguyễn Văn Đại Diện"
                    value={formData.nguoiDaiDien}
                    onChange={(e) => setFormData({ ...formData, nguoiDaiDien: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#f66315]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Địa chỉ *</label>
                <input
                  type="text"
                  placeholder="Số nhà, đường, quận/huyện, tỉnh/thành"
                  value={formData.diaChi}
                  onChange={(e) => setFormData({ ...formData, diaChi: e.target.value })}
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
                  className="rounded-xl bg-[#f66315] px-5 py-2 font-bold text-white hover:bg-[#e55000]"
                >
                  Lưu thông tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
