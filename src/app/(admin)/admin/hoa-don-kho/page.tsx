"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  PlusCircle,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Package,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { exportToExcel } from "@/lib/exportExcel";

interface HoaDonKhoItem {
  MaHDK: string;
  NgayLap: string;
  LoaiPhieu: string;
  LyDo: string | null;
  TongTien: number;
  TrangThai: string;
  NhanVien: { MaNV: string; HoTen: string };
  NhaCungCap: { MaNCC: string; TenNCC: string } | null;
  ChiTietHoaDonKhos: {
    MaSP: string;
    SoLuong: number;
    DonGia: number;
    ThanhTien: number;
    SanPham: { MaSP: string; TenSP: string; SoLuong: number; GiaBan: number };
  }[];
}

interface SanPhamOption {
  MaSP: string;
  TenSP: string;
  SoLuong: number;
  GiaBan: number;
}

interface NCCOption {
  MaNCC: string;
  TenNCC: string;
  TrangThai?: string;
}

export default function HoaDonKhoPage() {
  const [invoices, setInvoices] = useState<HoaDonKhoItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [keyword, setKeyword] = useState("");
  const [loaiPhieu, setLoaiPhieu] = useState("ALL");
  const [tuNgay, setTuNgay] = useState("");
  const [denNgay, setDenNgay] = useState("");

  // Options for creation
  const [products, setProducts] = useState<SanPhamOption[]>([]);
  const [suppliers, setSuppliers] = useState<NCCOption[]>([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<"NHAP" | "XUAT">("NHAP");
  const [selectedNCC, setSelectedNCC] = useState("");
  const [createLyDo, setCreateLyDo] = useState("");
  const [createItems, setCreateItems] = useState<
    { maSP: string; soLuong: number; donGia: number }[]
  >([]);

  // Detail Modal
  const [viewingInvoice, setViewingInvoice] = useState<HoaDonKhoItem | null>(null);

  // Cancel Modal (BR-01)
  const [cancellingInvoice, setCancellingInvoice] = useState<HoaDonKhoItem | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Load danh sach hoa don
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.append("keyword", keyword);
      if (loaiPhieu !== "ALL") params.append("loaiPhieu", loaiPhieu);
      if (tuNgay) params.append("tuNgay", tuNgay);
      if (denNgay) params.append("denNgay", denNgay);

      const res = await fetch(`/api/admin/hoa-don-kho?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setInvoices(json.data || []);
      } else {
        toast.error(json.error || "Không thể tải danh sách");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  // Load san pham & NCC cho modal
  const fetchOptions = async () => {
    try {
      const [resSP, resNCC] = await Promise.all([
        fetch("/api/admin/san-pham"),
        fetch("/api/admin/nha-cung-cap"),
      ]);
      const jsonSP = await resSP.json();
      const jsonNCC = await resNCC.json();
      if (jsonSP.success) setProducts(jsonSP.data || []);
      if (jsonNCC.success) setSuppliers(jsonNCC.data || []);
    } catch {
      // Silently continue
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchOptions();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  // Mo modal lap phieu
  const handleOpenCreate = (type: "NHAP" | "XUAT") => {
    setCreateType(type);
    setSelectedNCC(suppliers[0]?.MaNCC || "");
    setCreateLyDo(type === "NHAP" ? "Nhập kho đợt hàng mới" : "Xuất kho bảo hành / điều phối");
    setCreateItems(
      products[0]
        ? [{ maSP: products[0].MaSP, soLuong: 5, donGia: products[0].GiaBan }]
        : []
    );
    setShowCreateModal(true);
  };

  // Them dong san pham vao phieu
  const handleAddItemRow = () => {
    if (!products[0]) return;
    setCreateItems([
      ...createItems,
      { maSP: products[0].MaSP, soLuong: 1, donGia: products[0].GiaBan },
    ]);
  };

  const handleRemoveItemRow = (idx: number) => {
    setCreateItems(createItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: string, value: any) => {
    const updated = [...createItems];
    if (field === "maSP") {
      const sp = products.find((p) => p.MaSP === value);
      updated[idx] = {
        ...updated[idx],
        maSP: value,
        donGia: sp ? sp.GiaBan : updated[idx].donGia,
      };
    } else {
      updated[idx] = { ...updated[idx], [field]: Number(value) || 0 };
    }
    setCreateItems(updated);
  };

  // Submit tao phieu
  const handleCreateInvoice = async () => {
    if (createItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 sản phẩm");
      return;
    }
    if (createType === "NHAP" && !selectedNCC) {
      toast.error("Vui lòng chọn nhà cung cấp");
      return;
    }
    if (createType === "XUAT" && !createLyDo.trim()) {
      toast.error("Vui lòng chọn/nhập lý do xuất kho");
      return;
    }
    const invalidRow = createItems.some((it) => {
      const qty = Number(it.soLuong);
      const price = Number(it.donGia);
      return (
        !it.maSP ||
        !Number.isInteger(qty) ||
        qty <= 0 ||
        !Number.isInteger(price) ||
        price < 0 ||
        (createType === "NHAP" && price <= 0)
      );
    });
    if (invalidRow) {
      toast.error("Dữ liệu không hợp lệ: số lượng phải là số nguyên > 0, đơn giá nhập phải > 0");
      return;
    }

    try {
      const res = await fetch("/api/admin/hoa-don-kho", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loaiPhieu: createType,
          maNCC: createType === "NHAP" ? selectedNCC : null,
          lyDo: createLyDo,
          items: createItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể tạo hóa đơn kho");
      } else {
        toast.success(data.message || "Tạo hóa đơn thành công!");
        setShowCreateModal(false);
        fetchInvoices();
        fetchOptions(); // Refresh lai ton kho
      }
    } catch {
      toast.error("Lỗi khi kết nối máy chủ");
    }
  };

  // Submit huy phieu kho BR-01
  const handleCancelInvoice = async () => {
    if (!cancellingInvoice) return;
    setCancelError("");

    if (!cancelReason.trim()) {
      setCancelError("Vui lòng nhập lý do hủy hóa đơn");
      return;
    }

    setSubmittingCancel(true);
    try {
      const res = await fetch(
        `/api/admin/hoa-don-kho/${cancellingInvoice.MaHDK}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lyDoHuy: cancelReason.trim() }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setCancelError(data.error || "Không thể hủy hóa đơn");
        toast.error(data.error || "Hủy hóa đơn thất bại");
      } else {
        toast.success(data.message || "Hủy hóa đơn kho và hoàn nguyên thành công!");
        setCancellingInvoice(null);
        setCancelReason("");
        fetchInvoices();
        fetchOptions();
      }
    } catch {
      setCancelError("Lỗi kết nối máy chủ khi hủy hóa đơn");
    } finally {
      setSubmittingCancel(false);
    }
  };

  // Xuat Excel (Bảng 3.21)
  const handleExportExcel = () => {
    if (invoices.length === 0) {
      toast.error("Không có dữ liệu để xuất file");
      return;
    }
    const dataToExport = invoices.map((inv) => ({
      "Mã HĐ": inv.MaHDK,
      "Ngày lập": new Date(inv.NgayLap).toLocaleString("vi-VN"),
      "Loại phiếu": inv.LoaiPhieu === "NHAP" ? "Nhập kho" : "Xuất kho",
      "Người lập": inv.NhanVien?.HoTen || "N/A",
      "Nhà cung cấp": inv.NhaCungCap?.TenNCC || "Xuất nội bộ",
      "Tổng tiền (VNĐ)": inv.TongTien,
      "Trạng thái": inv.TrangThai === "Da huy" ? "Đã hủy" : "Hoàn thành",
      "Lý do": inv.LyDo || "",
    }));

    try {
      exportToExcel(dataToExport, "HoaDonKho_FBShop", "HoaDonKho");
      toast.success("Đã xuất danh sách hóa đơn kho ra Excel!");
    } catch {
      toast.error("Đã xảy ra lỗi trong quá trình tạo file, vui lòng thử lại sau");
    }
  };

  const totalTongTienCreate = createItems.reduce(
    (sum, item) => sum + (item.soLuong || 0) * (item.donGia || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-[#f66315]" />
            QUẢN LÝ HÓA ĐƠN KHO (NHẬP / XUẤT KHO)
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenCreate("NHAP")}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-700/20 hover:bg-emerald-700 transition-all"
          >
            <ArrowDownRight className="h-4 w-4" />
            Lập phiếu Nhập kho
          </button>
          <button
            onClick={() => handleOpenCreate("XUAT")}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-700/20 hover:bg-blue-700 transition-all"
          >
            <ArrowUpRight className="h-4 w-4" />
            Lập phiếu Xuất kho
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

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã HĐ, lý do, người lập..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-[#f66315]"
            />
          </div>

          <div>
            <select
              value={loaiPhieu}
              onChange={(e) => setLoaiPhieu(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-[#f66315]"
            >
              <option value="ALL">-- Tất cả loại phiếu --</option>
              <option value="NHAP">Phiếu Nhập (NHAP)</option>
              <option value="XUAT">Phiếu Xuất (XUAT)</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={tuNgay}
              onChange={(e) => setTuNgay(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-[#f66315]"
              title="Từ ngày"
            />
          </div>

          <div>
            <input
              type="date"
              value={denNgay}
              onChange={(e) => setDenNgay(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-[#f66315]"
              title="Đến ngày"
            />
          </div>
        </form>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-700 uppercase">
              <tr>
                <th className="px-4 py-3">Mã Hóa Đơn</th>
                <th className="px-4 py-3">Ngày Lập</th>
                <th className="px-4 py-3">Loại Phiếu</th>
                <th className="px-4 py-3">Người Lập</th>
                <th className="px-4 py-3">Đối Tác / Lý Do</th>
                <th className="px-4 py-3 text-right">Tổng Tiền</th>
                <th className="px-4 py-3 text-center">Trạng Thái</th>
                <th className="px-4 py-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    Đang tải danh sách hóa đơn kho...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    Không tìm thấy hóa đơn kho nào phù hợp
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const isNhap = inv.LoaiPhieu === "NHAP";
                  const isHuy = inv.TrangThai === "Da huy" || inv.TrangThai === "Cancelled";

                  return (
                    <tr key={inv.MaHDK} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {inv.MaHDK}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(inv.NgayLap).toLocaleString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                            isNhap
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {isNhap ? (
                            <ArrowDownRight className="h-3 w-3" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3" />
                          )}
                          {isNhap ? "NHẬP KHO" : "XUẤT KHO"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {inv.NhanVien?.HoTen || "Hệ thống"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate" title={inv.LyDo || ""}>
                        {isNhap
                          ? inv.NhaCungCap?.TenNCC || inv.LyDo || "Nhà cung cấp"
                          : inv.LyDo || "Xuất điều phối"}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {Number(inv.TongTien).toLocaleString("vi-VN")} đ
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isHuy
                              ? "bg-red-50 text-red-600 border border-red-200"
                              : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          }`}
                        >
                          {isHuy ? (
                            <XCircle className="h-3 w-3" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {isHuy ? "ĐÃ HỦY" : "HOÀN THÀNH"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingInvoice(inv)}
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 hover:text-black transition-all"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {!isHuy && (
                            <button
                              onClick={() => {
                                setCancellingInvoice(inv);
                                setCancelReason("");
                                setCancelError("");
                              }}
                              className="rounded-lg border border-red-200 bg-red-50/80 p-1.5 text-red-600 hover:bg-red-100 transition-all"
                              title="Hủy hóa đơn"
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                            </button>
                          )}
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

      {/* Modal Lap Phieu Nhap / Xuat Kho */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {createType === "NHAP" ? "LẬP PHIẾU NHẬP KHO" : "LẬP PHIẾU XUẤT KHO"}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {createType === "NHAP" && (
                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Nhà cung cấp đối tác <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedNCC}
                    onChange={(e) => setSelectedNCC(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#f66315]"
                  >
                    {suppliers
                      .filter((ncc) => ncc.TrangThai !== "Ngung hop tac")
                      .map((ncc) => (
                      <option key={ncc.MaNCC} value={ncc.MaNCC}>
                        {ncc.TenNCC} ({ncc.MaNCC})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Lý do lập phiếu / Ghi chú
                </label>
                <input
                  type="text"
                  value={createLyDo}
                  onChange={(e) => setCreateLyDo(e.target.value)}
                  placeholder="Ví dụ: Nhập hàng đợt 1 tháng 9 hoặc Xuất trả bảo hành"
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#f66315]"
                />
              </div>

              {/* Danh sach mat hang */}
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Danh sách sản phẩm trong phiếu
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center gap-1 rounded-lg bg-orange-500/10 px-2.5 py-1 font-bold text-[#f66315] hover:bg-orange-500/20"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    Thêm sản phẩm
                  </button>
                </div>

                {createItems.map((item, idx) => {
                  const spInfo = products.find((p) => p.MaSP === item.maSP);
                  const isStockWarning =
                    createType === "XUAT" && spInfo && spInfo.SoLuong < item.soLuong;

                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-white p-3 rounded-xl border border-slate-200 shadow-2xs"
                    >
                      <div className="col-span-5">
                        <label className="block text-[10px] text-slate-400 mb-0.5">Sản phẩm</label>
                        <select
                          value={item.maSP}
                          onChange={(e) => handleItemChange(idx, "maSP", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 p-1.5 text-xs outline-none"
                        >
                          {products.map((p) => (
                            <option key={p.MaSP} value={p.MaSP}>
                              {p.TenSP} (Tồn: {p.SoLuong})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <label className="block text-[10px] text-slate-400 mb-0.5">
                          Số lượng {createType === "XUAT" && spInfo && `(Tồn: ${spInfo.SoLuong})`}
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={item.soLuong}
                          onChange={(e) => handleItemChange(idx, "soLuong", e.target.value)}
                          className={`w-full rounded-lg border p-1.5 text-xs outline-none ${
                            isStockWarning ? "border-red-500 bg-red-50 text-red-600" : "border-slate-200"
                          }`}
                        />
                      </div>

                      <div className="col-span-3">
                        <label className="block text-[10px] text-slate-400 mb-0.5">
                          Đơn giá ({createType === "NHAP" ? "Giá nhập" : "Giá xuất"})
                        </label>
                        <input
                          type="number"
                          value={item.donGia}
                          onChange={(e) => handleItemChange(idx, "donGia", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 p-1.5 text-xs outline-none"
                        />
                      </div>

                      <div className="col-span-1 text-right pt-4">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {isStockWarning && (
                        <div className="col-span-12 text-[11px] font-bold text-red-600 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Cảnh báo: Tồn kho hiện tại ({spInfo?.SoLuong}) nhỏ hơn số lượng xuất ({item.soLuong})!</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="flex justify-between items-center pt-2 font-bold text-slate-800 text-xs">
                  <span>Tổng giá trị phiếu:</span>
                  <span className="text-sm font-bold text-[#f66315]">
                    {totalTongTienCreate.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleCreateInvoice}
                className="rounded-xl bg-[#f66315] px-5 py-2 text-xs font-bold text-white hover:bg-[#e55000] shadow-md shadow-orange-900/20"
              >
                Xác nhận tạo phiếu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem Chi Tiet Hoa Don */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  CHI TIẾT HÓA ĐƠN KHO: {viewingInvoice.MaHDK}
                </h3>
                <p className="text-xs text-slate-500">
                  {viewingInvoice.LoaiPhieu === "NHAP" ? "Phiếu Nhập kho" : "Phiếu Xuất kho"} •{" "}
                  {new Date(viewingInvoice.NgayLap).toLocaleString("vi-VN")}
                </p>
              </div>
              <button
                onClick={() => setViewingInvoice(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400">Người lập phiếu:</span>
                  <p className="font-bold text-slate-800">{viewingInvoice.NhanVien?.HoTen}</p>
                </div>
                <div>
                  <span className="text-slate-400">Đối tác / NCC:</span>
                  <p className="font-bold text-slate-800">
                    {viewingInvoice.NhaCungCap?.TenNCC || "Nội bộ FBShop"}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400">Lý do / Diễn giải:</span>
                  <p className="font-medium text-slate-800">{viewingInvoice.LyDo || "Không có ghi chú"}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 mb-2">Danh mục hàng hóa chi tiết:</h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 font-bold text-slate-600">
                      <tr>
                        <th className="p-2.5">Sản phẩm</th>
                        <th className="p-2.5 text-center">Số lượng</th>
                        <th className="p-2.5 text-right">Đơn giá</th>
                        <th className="p-2.5 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingInvoice.ChiTietHoaDonKhos?.map((ct, i) => (
                        <tr key={i}>
                          <td className="p-2.5 font-medium">{ct.SanPham?.TenSP || ct.MaSP}</td>
                          <td className="p-2.5 text-center font-bold">{ct.SoLuong}</td>
                          <td className="p-2.5 text-right">
                            {Number(ct.DonGia).toLocaleString("vi-VN")} đ
                          </td>
                          <td className="p-2.5 text-right font-bold text-[#f66315]">
                            {Number(ct.ThanhTien).toLocaleString("vi-VN")} đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                <span className="font-bold text-slate-600">Tổng cộng:</span>
                <span className="text-base font-bold text-slate-900">
                  {Number(viewingInvoice.TongTien).toLocaleString("vi-VN")} VNĐ
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Huy Hoa Don BR-01 */}
      {cancellingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h3 className="text-center text-base font-bold text-slate-900">
              HỦY HÓA ĐƠN KHO {cancellingInvoice.MaHDK}
            </h3>
            <p className="mt-1 text-center text-xs text-slate-500">
              Quy tắc BR-01: Hệ thống sẽ tự động hoàn nguyên số lượng tồn kho theo đúng lịch sử nhập/xuất.
            </p>

            {cancelError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
                {cancelError}
              </div>
            )}

            <div className="mt-4">
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Lý do hủy hóa đơn <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Bắt buộc nhập lý do hủy (ví dụ: Nhập nhầm số lượng, sản phẩm lỗi trả lại...)"
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  setCancelError("");
                }}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-red-500"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setCancellingInvoice(null)}
                className="flex-1 rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={submittingCancel}
                onClick={handleCancelInvoice}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 shadow-md shadow-red-200 disabled:opacity-50"
              >
                {submittingCancel ? "Đang xử lý..." : "Xác nhận hủy & Hoàn nguyên"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
