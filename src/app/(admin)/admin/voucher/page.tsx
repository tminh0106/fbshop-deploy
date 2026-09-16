"use client";

import { useState, useEffect } from "react";
import {
  Tag,
  PlusCircle,
  Search,
  Download,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import { exportToExcel } from "@/lib/exportExcel";

interface VoucherItem {
  MaVoucher: string;
  LoaiGiamGia: string;
  GiaTriGiam: number;
  DonHangToiThieu: number;
  MucGiamToiDa: number;
  TongSoLuong: number;
  GioiHanSuDung: number;
  NgayBatDau: string;
  NgayKetThuc: string;
  TrangThai: string;
  _count?: { DonHangs: number };
}

function formatForDateTimeInput(date: Date | string) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDisplayDateTime(date: Date | string) {
  if (!date) return "--";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "--";
  const pad = (n: number) => n.toString().padStart(2, "0");
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

export default function AdminVoucherPage() {
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherItem | null>(null);
  const [isLockedPrice, setIsLockedPrice] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!formData.maVoucher?.trim()) {
      errs.maVoucher = "Vui lòng nhập mã voucher";
    }

    if (formData.giaTriGiam === "" || Number(formData.giaTriGiam) <= 0) {
      errs.giaTriGiam = "Vui lòng nhập mức giảm (> 0)";
    }

    if (formData.donHangToiThieu === "" || Number(formData.donHangToiThieu) < 0) {
      errs.donHangToiThieu = "Vui lòng nhập đơn tối thiểu";
    }

    if (formData.mucGiamToiDa === "" || Number(formData.mucGiamToiDa) < 0) {
      errs.mucGiamToiDa = "Vui lòng nhập mức giảm tối đa";
    }

    if (formData.tongSoLuong === "" || Number(formData.tongSoLuong) <= 0) {
      errs.tongSoLuong = "Vui lòng nhập tổng số lượng phát hành (> 0)";
    }

    if (!formData.ngayBatDau) {
      errs.ngayBatDau = "Vui lòng chọn thời gian bắt đầu";
    }

    if (!formData.ngayKetThuc) {
      errs.ngayKetThuc = "Vui lòng chọn thời gian kết thúc";
    } else if (formData.ngayBatDau && new Date(formData.ngayKetThuc) <= new Date(formData.ngayBatDau)) {
      errs.ngayKetThuc = "Thời gian kết thúc phải sau thời gian bắt đầu";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const [formData, setFormData] = useState<{
    maVoucher: string;
    loaiGiamGia: string;
    giaTriGiam: number | string;
    donHangToiThieu: number | string;
    mucGiamToiDa: number | string;
    tongSoLuong: number | string;
    gioiHanSuDung: number;
    ngayBatDau: string;
    ngayKetThuc: string;
    trangThai: string;
  }>({
    maVoucher: "",
    loaiGiamGia: "TIEN",
    giaTriGiam: 50000,
    donHangToiThieu: 1000000,
    mucGiamToiDa: 50000,
    tongSoLuong: 100,
    gioiHanSuDung: 1,
    ngayBatDau: formatForDateTimeInput(new Date()),
    ngayKetThuc: formatForDateTimeInput(new Date(Date.now() + 30 * 24 * 3600 * 1000)),
    trangThai: "Active",
  });

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.append("keyword", keyword);

      const res = await fetch(`/api/admin/voucher?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setVouchers(json.data || []);
      }
    } catch {
      toast.error("Lỗi khi tải voucher");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleOpenCreate = () => {
    setEditingVoucher(null);
    setIsLockedPrice(false);
    setErrors({});
    const now = new Date();
    const future = new Date(Date.now() + 30 * 24 * 3600 * 1000);
    setFormData({
      maVoucher: `FBSHOP_${Date.now().toString().slice(-4)}`,
      loaiGiamGia: "TIEN",
      giaTriGiam: 50000,
      donHangToiThieu: 1000000,
      mucGiamToiDa: 50000,
      tongSoLuong: 100,
      gioiHanSuDung: 1,
      ngayBatDau: formatForDateTimeInput(now),
      ngayKetThuc: formatForDateTimeInput(future),
      trangThai: "Active",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (v: VoucherItem) => {
    setEditingVoucher(v);
    const used = (v._count?.DonHangs || 0) > 0;
    setIsLockedPrice(used);
    setErrors({});

    setFormData({
      maVoucher: v.MaVoucher,
      loaiGiamGia: v.LoaiGiamGia,
      giaTriGiam: Number(v.GiaTriGiam),
      donHangToiThieu: Number(v.DonHangToiThieu),
      mucGiamToiDa: Number(v.MucGiamToiDa),
      tongSoLuong: v.TongSoLuong,
      gioiHanSuDung: v.GioiHanSuDung,
      ngayBatDau: formatForDateTimeInput(v.NgayBatDau),
      ngayKetThuc: formatForDateTimeInput(v.NgayKetThuc),
      trangThai: v.TrangThai,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Vui lòng điền đầy đủ và kiểm tra các trường báo đỏ!");
      return;
    }

    try {
      const method = editingVoucher ? "PUT" : "POST";
      const res = await fetch("/api/admin/voucher", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể lưu voucher");
      } else {
        const message = editingVoucher
          ? (data.message || "Cập nhật voucher thành công")
          : (data.message || "Tạo voucher thành công");
        toast.success(message);
        setShowModal(false);
        fetchVouchers();
      }
    } catch {
      toast.error("Lỗi kết nối");
    }
  };

  const handleToggleDisable = async (v: VoucherItem) => {
    const newStatus = v.TrangThai === "Active" ? "Disabled" : "Active";
    try {
      const res = await fetch("/api/admin/voucher", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maVoucher: v.MaVoucher,
          trangThai: newStatus,
        }),
      });
      if (res.ok) {
        toast.success(
          newStatus === "Disabled" ? "Đã vô hiệu hóa voucher" : "Đã kích hoạt lại voucher"
        );
        fetchVouchers();
      }
    } catch {
      toast.error("Lỗi kết nối");
    }
  };

  const handleDelete = async (maVoucher: string) => {
    if (!confirm(`Bạn có chắc muốn xóa voucher ${maVoucher}?`)) return;
    try {
      const res = await fetch(`/api/admin/voucher?maVoucher=${maVoucher}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        if (data.softDeleted) {
          toast(data.message, { icon: "⚠️" });
        } else {
          toast.success(data.message);
        }
        fetchVouchers();
      } else {
        toast.error(data.error || "Lỗi khi xóa voucher");
      }
    } catch {
      toast.error("Lỗi kết nối");
    }
  };

  const handleExportExcel = () => {
    const dataToExport = vouchers.map((v) => ({
      "Mã Voucher": v.MaVoucher,
      "Loại giảm": v.LoaiGiamGia === "PHANTRAM" ? "Phần trăm (%)" : "Tiền mặt (VNĐ)",
      "Mức giảm": Number(v.GiaTriGiam),
      "Đơn tối thiểu": Number(v.DonHangToiThieu),
      "Giảm tối đa": Number(v.MucGiamToiDa),
      "Tổng số lượng": v.TongSoLuong,
      "Lượt đã dùng": v._count?.DonHangs || 0,
      "Bắt đầu": formatDisplayDateTime(v.NgayBatDau),
      "Kết thúc": formatDisplayDateTime(v.NgayKetThuc),
      "Trạng thái": v.TrangThai,
    }));

    exportToExcel(dataToExport, "DanhSachVoucher_FBShop", "Voucher");
    toast.success("Đã xuất danh sách Voucher ra Excel!");
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Tag className="h-6 w-6 text-[#f66315]" />
            QUẢN LÝ MÃ KHUYẾN MẠI (VOUCHER)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Bảo toàn kế toán: Tự động khóa sửa định giá khi voucher đã có lượt đặt hàng
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-xl bg-[#f66315] px-4 py-2 text-xs font-bold text-white shadow-md shadow-orange-900/20 hover:bg-[#e55000] transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            Tạo voucher mới
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all"
          >
            <Download className="h-4 w-4 text-gray-500" />
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50/80 font-bold text-gray-700 uppercase">
              <tr>
                <th className="px-4 py-3">Mã Voucher</th>
                <th className="px-4 py-3">Loại Giảm</th>
                <th className="px-4 py-3 text-right">Mức Giảm</th>
                <th className="px-4 py-3 text-right">Đơn Tối Thiểu</th>
                <th className="px-4 py-3 text-center">Đã Dùng / Tổng</th>
                <th className="px-4 py-3 text-center">Thời Gian Áp Dụng</th>
                <th className="px-4 py-3 text-center">Trạng Thái</th>
                <th className="px-4 py-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 font-medium">
                    Đang tải danh sách voucher...
                  </td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 font-medium">
                    Chưa có mã khuyến mại nào
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => {
                  const isUsed = (v._count?.DonHangs || 0) > 0;
                  const isDisabled = v.TrangThai === "Disabled";
                  
                  let statusLabel = "Hoạt động";
                  let statusColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  
                  if (isDisabled) {
                    statusLabel = "Vô hiệu hóa";
                    statusColor = "bg-red-50 text-red-600 border-red-200";
                  } else {
                    const now = new Date();
                    const start = new Date(v.NgayBatDau);
                    const end = new Date(v.NgayKetThuc);
                    
                    if (now < start) {
                      statusLabel = "Sắp diễn ra";
                      statusColor = "bg-blue-50 text-blue-600 border-blue-200";
                    } else if (now > end) {
                      statusLabel = "Đã kết thúc";
                      statusColor = "bg-gray-50 text-gray-600 border-gray-200";
                    } else {
                      statusLabel = "Đang hoạt động";
                    }
                  }

                  return (
                    <tr key={v.MaVoucher} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center gap-1.5 font-mono font-bold text-gray-900"
                          title={isUsed ? "Đã có lượt dùng (Khóa định giá)" : "Chưa có lượt dùng"}
                        >
                          {isUsed ? (
                            <Lock className="h-3 w-3 text-amber-500" />
                          ) : (
                            <Unlock className="h-3 w-3 text-gray-400" />
                          )}
                          <span>{v.MaVoucher}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            v.LoaiGiamGia === "PHANTRAM"
                              ? "bg-purple-50 text-purple-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {v.LoaiGiamGia === "PHANTRAM" ? "GIẢM %" : "GIẢM TIỀN"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-[#f66315]">
                        {v.LoaiGiamGia === "PHANTRAM"
                          ? `${v.GiaTriGiam}% (Tối đa ${Number(v.MucGiamToiDa).toLocaleString()}đ)`
                          : `${Number(v.GiaTriGiam).toLocaleString("vi-VN")} đ`}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {Number(v.DonHangToiThieu).toLocaleString("vi-VN")} đ
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-gray-800">
                        <span className="text-[#f66315]">{v._count?.DonHangs || 0}</span> / {v.TongSoLuong}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        <div className="flex flex-col items-center gap-0.5 text-[11px] leading-tight">
                          <span className="text-gray-600">
                            <span className="font-semibold text-gray-400">Từ:</span> {formatDisplayDateTime(v.NgayBatDau)}
                          </span>
                          <span className="text-gray-600">
                            <span className="font-semibold text-gray-400">Đến:</span> {formatDisplayDateTime(v.NgayKetThuc)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${statusColor}`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleDisable(v)}
                            className={`rounded-lg border p-1.5 transition-all ${
                              isDisabled
                                ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                : "border-amber-200 text-amber-600 hover:bg-amber-50"
                            }`}
                            title={isDisabled ? "Kích hoạt lại" : "Vô hiệu hóa tức thì"}
                          >
                            {isDisabled ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(v)}
                            className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(v.MaVoucher)}
                            className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            title="Xóa voucher"
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

      {/* Modal Them / Sua Voucher */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-black text-gray-900">
                  {editingVoucher ? `CHỈNH SỬA VOUCHER: ${editingVoucher.MaVoucher}` : "TẠO VOUCHER MỚI"}
                </h3>
                {isLockedPrice && (
                  <p className="text-[11px] font-bold text-amber-600 flex items-center gap-1 mt-0.5">
                    <Lock className="h-3 w-3" />
                    Đã có khách đặt mua! Định giá được khóa bảo toàn kế toán.
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="mb-1 block font-bold text-gray-700">
                  Mã Voucher <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={!!editingVoucher}
                  placeholder="Ví dụ: FBSHOP50K"
                  value={formData.maVoucher}
                  onBlur={() => {
                    if (!formData.maVoucher?.trim()) {
                      setErrors((prev) => ({ ...prev, maVoucher: "Vui lòng nhập mã voucher" }));
                    }
                  }}
                  onChange={(e) => {
                    setFormData({ ...formData, maVoucher: e.target.value.toUpperCase() });
                    clearError("maVoucher");
                  }}
                  className={`w-full rounded-xl border p-2.5 font-mono uppercase outline-none transition-all disabled:bg-gray-100 ${
                    errors.maVoucher
                      ? "border-red-500 bg-red-50/50 text-red-600 focus:ring-1 focus:ring-red-500"
                      : "border-gray-200 focus:border-[#f66315]"
                  }`}
                />
                {errors.maVoucher && (
                  <p className="mt-1 text-[11px] font-semibold text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.maVoucher}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-gray-700">Loại giảm giá</label>
                  <select
                    disabled={isLockedPrice}
                    value={formData.loaiGiamGia}
                    onChange={(e) => setFormData({ ...formData, loaiGiamGia: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 outline-none disabled:bg-gray-100"
                  >
                    <option value="TIEN">Giảm tiền mặt (VNĐ)</option>
                    <option value="PHANTRAM">Giảm phần trăm (%)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-bold text-gray-700">
                    {formData.loaiGiamGia === "PHANTRAM" ? "Phần trăm giảm (%)" : "Số tiền giảm (VNĐ)"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    disabled={isLockedPrice}
                    value={formData.giaTriGiam}
                    onBlur={() => {
                      if (formData.giaTriGiam === "" || Number(formData.giaTriGiam) <= 0) {
                        setErrors((prev) => ({ ...prev, giaTriGiam: "Vui lòng nhập mức giảm (> 0)" }));
                      }
                    }}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        giaTriGiam: e.target.value === "" ? "" : Number(e.target.value),
                      });
                      clearError("giaTriGiam");
                    }}
                    className={`w-full rounded-xl border p-2.5 outline-none transition-all disabled:bg-gray-100 ${
                      errors.giaTriGiam
                        ? "border-red-500 bg-red-50/50 text-red-600 focus:ring-1 focus:ring-red-500"
                        : "border-gray-200 focus:border-[#f66315]"
                    }`}
                  />
                  {errors.giaTriGiam && (
                    <p className="mt-1 text-[11px] font-semibold text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {errors.giaTriGiam}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-gray-700">
                    Đơn tối thiểu (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    disabled={isLockedPrice}
                    value={formData.donHangToiThieu}
                    onBlur={() => {
                      if (formData.donHangToiThieu === "" || Number(formData.donHangToiThieu) < 0) {
                        setErrors((prev) => ({ ...prev, donHangToiThieu: "Vui lòng nhập đơn tối thiểu" }));
                      }
                    }}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        donHangToiThieu: e.target.value === "" ? "" : Number(e.target.value),
                      });
                      clearError("donHangToiThieu");
                    }}
                    className={`w-full rounded-xl border p-2.5 outline-none transition-all disabled:bg-gray-100 ${
                      errors.donHangToiThieu
                        ? "border-red-500 bg-red-50/50 text-red-600 focus:ring-1 focus:ring-red-500"
                        : "border-gray-200 focus:border-[#f66315]"
                    }`}
                  />
                  {errors.donHangToiThieu && (
                    <p className="mt-1 text-[11px] font-semibold text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {errors.donHangToiThieu}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block font-bold text-gray-700">
                    Giảm tối đa (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    disabled={isLockedPrice}
                    value={formData.mucGiamToiDa}
                    onBlur={() => {
                      if (formData.mucGiamToiDa === "" || Number(formData.mucGiamToiDa) < 0) {
                        setErrors((prev) => ({ ...prev, mucGiamToiDa: "Vui lòng nhập mức giảm tối đa" }));
                      }
                    }}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        mucGiamToiDa: e.target.value === "" ? "" : Number(e.target.value),
                      });
                      clearError("mucGiamToiDa");
                    }}
                    className={`w-full rounded-xl border p-2.5 outline-none transition-all disabled:bg-gray-100 ${
                      errors.mucGiamToiDa
                        ? "border-red-500 bg-red-50/50 text-red-600 focus:ring-1 focus:ring-red-500"
                        : "border-gray-200 focus:border-[#f66315]"
                    }`}
                  />
                  {errors.mucGiamToiDa && (
                    <p className="mt-1 text-[11px] font-semibold text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {errors.mucGiamToiDa}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-gray-700">
                  Tổng số lượng phát hành <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.tongSoLuong}
                  onBlur={() => {
                    if (formData.tongSoLuong === "" || Number(formData.tongSoLuong) <= 0) {
                      setErrors((prev) => ({ ...prev, tongSoLuong: "Vui lòng nhập tổng số lượng (> 0)" }));
                    }
                  }}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      tongSoLuong: e.target.value === "" ? "" : Number(e.target.value),
                    });
                    clearError("tongSoLuong");
                  }}
                  className={`w-full rounded-xl border p-2.5 outline-none transition-all ${
                    errors.tongSoLuong
                      ? "border-red-500 bg-red-50/50 text-red-600 focus:ring-1 focus:ring-red-500"
                      : "border-gray-200 focus:border-[#f66315]"
                  }`}
                />
                {errors.tongSoLuong && (
                  <p className="mt-1 text-[11px] font-semibold text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.tongSoLuong}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-gray-700 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-[#f66315]" />
                    Bắt đầu (Ngày & Giờ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    disabled={isLockedPrice}
                    value={formData.ngayBatDau}
                    onBlur={() => {
                      if (!formData.ngayBatDau) {
                        setErrors((prev) => ({ ...prev, ngayBatDau: "Vui lòng chọn thời gian bắt đầu" }));
                      }
                    }}
                    onChange={(e) => {
                      setFormData({ ...formData, ngayBatDau: e.target.value });
                      clearError("ngayBatDau");
                    }}
                    className={`w-full rounded-xl border p-2.5 outline-none transition-all disabled:bg-gray-100 text-xs ${
                      errors.ngayBatDau
                        ? "border-red-500 bg-red-50/50 text-red-600 focus:ring-1 focus:ring-red-500"
                        : "border-gray-200 focus:border-[#f66315]"
                    }`}
                  />
                  {errors.ngayBatDau && (
                    <p className="mt-1 text-[11px] font-semibold text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {errors.ngayBatDau}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block font-bold text-gray-700 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    Kết thúc (Ngày & Giờ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.ngayKetThuc}
                    onBlur={() => {
                      if (!formData.ngayKetThuc) {
                        setErrors((prev) => ({ ...prev, ngayKetThuc: "Vui lòng chọn thời gian kết thúc" }));
                      } else if (formData.ngayBatDau && new Date(formData.ngayKetThuc) <= new Date(formData.ngayBatDau)) {
                        setErrors((prev) => ({ ...prev, ngayKetThuc: "Thời gian kết thúc phải sau bắt đầu" }));
                      }
                    }}
                    onChange={(e) => {
                      setFormData({ ...formData, ngayKetThuc: e.target.value });
                      clearError("ngayKetThuc");
                    }}
                    className={`w-full rounded-xl border p-2.5 outline-none transition-all text-xs ${
                      errors.ngayKetThuc
                        ? "border-red-500 bg-red-50/50 text-red-600 focus:ring-1 focus:ring-red-500"
                        : "border-gray-200 focus:border-[#f66315]"
                    }`}
                  />
                  {errors.ngayKetThuc && (
                    <p className="mt-1 text-[11px] font-semibold text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {errors.ngayKetThuc}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 font-bold text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#f66315] px-5 py-2 font-bold text-white hover:bg-[#e55000]"
                >
                  Lưu Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
