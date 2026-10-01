"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FileText,
  PlusCircle,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  Printer,
  Wallet,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { exportToExcel } from "@/lib/exportExcel";
import {
  NGHIEP_VU_XUAT,
  WAREHOUSES,
  XUAT_TRA_NCC,
  isInvoiceCancelled,
  numberToVietnameseWords,
  warehouseLabel,
} from "@/lib/warehouse";

interface HoaDonKhoItem {
  MaHDK: string;
  NgayLap: string;
  LoaiPhieu: "NHAP" | "XUAT";
  NghiepVu: string | null;
  LyDo: string | null;
  SoChungTu: string | null;
  NguoiGiaoNhan: string | null;
  KhoHang: string | null;
  TongTien: number;
  DaThanhToan: number;
  CongNo: number;
  TrangThai: string;
  NhanVien: { MaNV: string; HoTen: string } | null;
  NhaCungCap: { MaNCC: string; TenNCC: string } | null;
  ChiTietHoaDonKhos: {
    MaSP: string;
    SoLuong: number;
    DonGia: number;
    ThanhTien: number;
    SanPham: { MaSP: string; TenSP: string; SoLuong: number } | null;
  }[];
}

interface SanPhamOption {
  MaSP: string;
  TenSP: string;
  SoLuong: number;
}

interface NCCOption {
  MaNCC: string;
  TenNCC: string;
  TrangThai?: string;
}

interface LineItem {
  maSP: string;
  soLuong: string;
  donGia: string;
}

type PayMode = "FULL" | "DEBT" | "PART";

const SEARCH_FORBIDDEN = /[<>{}[\]\\;'"`=%$^*|~]/;
const money = (n: number | string) => `${Number(n || 0).toLocaleString("vi-VN")} đ`;
const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function HoaDonKhoPage() {
  const [invoices, setInvoices] = useState<HoaDonKhoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);

  // Bo loc
  const [keyword, setKeyword] = useState("");
  const [loaiPhieu, setLoaiPhieu] = useState("ALL");
  const [filterNCC, setFilterNCC] = useState("ALL");
  const [tuNgay, setTuNgay] = useState("");
  const [denNgay, setDenNgay] = useState("");

  // Du lieu cho form lap phieu
  const [products, setProducts] = useState<SanPhamOption[]>([]);
  const [suppliers, setSuppliers] = useState<NCCOption[]>([]);
  const [giaVon, setGiaVon] = useState<Record<string, number>>({});

  // Form lap phieu
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState<"NHAP" | "XUAT">("NHAP");
  const [nghiepVu, setNghiepVu] = useState<string>(NGHIEP_VU_XUAT[0]);
  const [maNCC, setMaNCC] = useState("");
  const [soChungTu, setSoChungTu] = useState("");
  const [nguoiGiaoNhan, setNguoiGiaoNhan] = useState("");
  const [khoHang, setKhoHang] = useState<string>(WAREHOUSES[0].value);
  const [dienGiai, setDienGiai] = useState("");
  const [lines, setLines] = useState<LineItem[]>([]);
  const [payMode, setPayMode] = useState<PayMode>("FULL");
  const [paidPart, setPaidPart] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Xem chi tiet / thanh toan / huy
  const [viewing, setViewing] = useState<HoaDonKhoItem | null>(null);
  const [paying, setPaying] = useState<HoaDonKhoItem | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [cancelling, setCancelling] = useState<HoaDonKhoItem | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchInvoices = async () => {
    const k = keyword.trim();
    if (k && (k.length > 100 || SEARCH_FORBIDDEN.test(k))) {
      toast.error("Từ khóa tìm kiếm không hợp lệ");
      return;
    }
    if (tuNgay && denNgay && tuNgay > denNgay) {
      toast.error("Khoảng thời gian tìm kiếm không hợp lệ");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ giaVon: "1" });
      if (k) params.append("keyword", k);
      if (loaiPhieu !== "ALL") params.append("loaiPhieu", loaiPhieu);
      if (filterNCC !== "ALL") params.append("maNCC", filterNCC);
      if (tuNgay) params.append("tuNgay", tuNgay);
      if (denNgay) params.append("denNgay", denNgay);

      const res = await fetch(`/api/admin/hoa-don-kho?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setInvoices(json.data || []);
        setGiaVon(json.giaVon || {});
        setSearched(!!(k || loaiPhieu !== "ALL" || filterNCC !== "ALL" || tuNgay || denNgay));
      } else {
        toast.error(json.error || "Không thể tải danh sách");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [resSP, resNCC] = await Promise.all([fetch("/api/admin/san-pham"), fetch("/api/admin/nha-cung-cap")]);
      const jsonSP = await resSP.json();
      const jsonNCC = await resNCC.json();
      if (jsonSP.success) setProducts(jsonSP.data || []);
      if (jsonNCC.success) setSuppliers(jsonNCC.data || []);
    } catch {
      // Form se bao thieu du lieu khi mo
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeSuppliers = suppliers.filter((s) => s.TrangThai !== "Ngung hop tac");
  const productOf = (maSP: string) => products.find((p) => p.MaSP === maSP);
  const needNCC = createType === "NHAP" || nghiepVu === XUAT_TRA_NCC;

  // ---------- Lap phieu ----------
  const defaultPrice = (maSP: string) => (giaVon[maSP] ? String(giaVon[maSP]) : "");

  const openCreate = (type: "NHAP" | "XUAT") => {
    setCreateType(type);
    setNghiepVu(NGHIEP_VU_XUAT[0]);
    setMaNCC("");
    setSoChungTu("");
    setNguoiGiaoNhan("");
    setKhoHang(WAREHOUSES[0].value);
    setDienGiai("");
    setLines([{ maSP: "", soLuong: "1", donGia: "" }]);
    setPayMode("FULL");
    setPaidPart("");
    setShowCreate(true);
  };

  const updateLine = (idx: number, patch: Partial<LineItem>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const lineTotal = (l: LineItem) => (Number(l.soLuong) || 0) * (Number(l.donGia) || 0);
  const tongTien = useMemo(() => lines.reduce((s, l) => s + lineTotal(l), 0), [lines]);
  const daThanhToan = payMode === "FULL" ? tongTien : payMode === "DEBT" ? 0 : Number(paidPart) || 0;

  const handleCreate = async () => {
    // A1 - Bo trong thong tin bat buoc
    if (needNCC && !maNCC) return toast.error("Vui lòng chọn nhà cung cấp");
    if (createType === "XUAT" && !nguoiGiaoNhan.trim()) return toast.error("Vui lòng nhập họ tên người nhận hàng");
    if (createType === "XUAT" && nghiepVu === "Xuất khác" && !dienGiai.trim())
      return toast.error("Vui lòng chọn/nhập lý do xuất kho");
    if (lines.length === 0) return toast.error("Vui lòng chọn ít nhất 1 sản phẩm");

    // A2 - So luong / don gia khong hop le; A3 - xuat vuot ton
    for (const [i, l] of lines.entries()) {
      const qty = Number(l.soLuong);
      const price = Number(l.donGia);
      if (!l.maSP) return toast.error(`Dòng ${i + 1}: vui lòng chọn sản phẩm`);
      if (!Number.isInteger(qty) || qty <= 0) return toast.error(`Dòng ${i + 1}: số lượng phải là số nguyên lớn hơn 0`);
      if (l.donGia === "" || !Number.isInteger(price) || price < 0 || (createType === "NHAP" && price <= 0))
        return toast.error(`Dòng ${i + 1}: đơn giá ${createType === "NHAP" ? "nhập phải lớn hơn 0" : "không hợp lệ"}`);
      const sp = productOf(l.maSP);
      if (createType === "XUAT" && sp) {
        const totalQty = lines.filter((x) => x.maSP === l.maSP).reduce((s, x) => s + (Number(x.soLuong) || 0), 0);
        if (totalQty > sp.SoLuong)
          return toast.error(`Số lượng xuất không được lớn hơn tồn kho (Tồn hiện tại: ${sp.SoLuong} - ${sp.TenSP})`);
      }
    }
    if (createType === "NHAP" && payMode === "PART") {
      const p = Number(paidPart);
      if (!Number.isInteger(p) || p <= 0 || p >= tongTien)
        return toast.error("Số tiền trả trước phải lớn hơn 0 và nhỏ hơn tổng tiền phiếu");
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/hoa-don-kho", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loaiPhieu: createType,
          nghiepVu: createType === "XUAT" ? nghiepVu : undefined,
          maNCC: needNCC ? maNCC : null,
          soChungTu,
          nguoiGiaoNhan,
          khoHang,
          lyDo: dienGiai,
          daThanhToan: createType === "NHAP" ? daThanhToan : undefined,
          items: lines.map((l) => ({ maSP: l.maSP, soLuong: Number(l.soLuong), donGia: Number(l.donGia) })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể lập phiếu");
      } else {
        toast.success(data.message || "Lập phiếu thành công");
        setShowCreate(false);
        fetchInvoices();
        fetchOptions();
        if (data.data?.MaHDK && confirm(`Đã lập phiếu ${data.data.MaHDK}. Mở bản in phiếu?`)) {
          window.open(`/admin/hoa-don-kho/in/${encodeURIComponent(data.data.MaHDK)}`, "_blank");
        }
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Thanh toan cong no NCC ----------
  const handlePay = async () => {
    if (!paying) return;
    const amount = Number(payAmount);
    if (!Number.isInteger(amount) || amount <= 0 || amount > paying.CongNo) {
      return toast.error(`Số tiền phải là số nguyên từ 1 đến ${paying.CongNo.toLocaleString("vi-VN")}`);
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/hoa-don-kho/${encodeURIComponent(paying.MaHDK)}/thanh-toan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soTien: amount }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setPaying(null);
        setViewing(null);
        fetchInvoices();
      } else {
        toast.error(data.error || "Thanh toán thất bại");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setBusy(false);
    }
  };

  // ---------- Huy phieu (BR-01) ----------
  const handleCancel = async () => {
    if (!cancelling) return;
    setCancelError("");
    if (!cancelReason.trim()) return setCancelError("Vui lòng nhập lý do hủy hóa đơn");
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/hoa-don-kho/${encodeURIComponent(cancelling.MaHDK)}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lyDoHuy: cancelReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCancelError(data.error || "Không thể hủy hóa đơn");
      } else {
        toast.success(data.message || "Hủy phiếu thành công");
        setCancelling(null);
        setCancelReason("");
        fetchInvoices();
        fetchOptions();
      }
    } catch {
      setCancelError("Lỗi kết nối máy chủ khi hủy hóa đơn");
    } finally {
      setBusy(false);
    }
  };

  // ---------- Xuat Excel (Bang 3.21) ----------
  const handleExportExcel = () => {
    if (invoices.length === 0) return toast.error("Không có dữ liệu để xuất file");
    const rows = invoices.map((inv) => ({
      "Số phiếu": inv.MaHDK,
      "Ngày lập": new Date(inv.NgayLap).toLocaleString("vi-VN"),
      "Loại phiếu": inv.LoaiPhieu === "NHAP" ? "Phiếu nhập kho" : "Phiếu xuất kho",
      "Nghiệp vụ": inv.NghiepVu || "",
      "Kho": warehouseLabel(inv.KhoHang),
      "Nhà cung cấp": inv.NhaCungCap?.TenNCC || "",
      "Người giao / nhận": inv.NguoiGiaoNhan || "",
      "Chứng từ gốc": inv.SoChungTu || "",
      "Người lập": inv.NhanVien?.HoTen || "",
      "Tổng tiền (VNĐ)": Number(inv.TongTien),
      "Đã thanh toán (VNĐ)": inv.LoaiPhieu === "NHAP" ? Number(inv.DaThanhToan) : "",
      "Còn nợ NCC (VNĐ)": inv.LoaiPhieu === "NHAP" ? inv.CongNo : "",
      "Trạng thái": isInvoiceCancelled(inv.TrangThai) ? "Đã hủy" : "Hoàn thành",
      "Diễn giải": inv.LyDo || "",
    }));
    try {
      exportToExcel(rows, "PhieuKho_FBShop", "PhieuKho");
      toast.success("Đã xuất danh sách phiếu kho ra Excel!");
    } catch {
      toast.error("Đã xảy ra lỗi trong quá trình tạo file, vui lòng thử lại sau");
    }
  };

  // ---------- Tong hop ----------
  const summary = useMemo(() => {
    const active = invoices.filter((i) => !isInvoiceCancelled(i.TrangThai));
    return {
      nhap: active.filter((i) => i.LoaiPhieu === "NHAP").reduce((s, i) => s + Number(i.TongTien), 0),
      xuat: active.filter((i) => i.LoaiPhieu === "XUAT").reduce((s, i) => s + Number(i.TongTien), 0),
      // Cong no tung NCC = no phieu nhap - gia tri hang xuat tra NCC (toi thieu 0), roi cong lai
      congNo: Object.values(
        active.reduce<Record<string, number>>((m, i) => {
          if (!i.NhaCungCap) return m;
          const k = i.NhaCungCap.MaNCC;
          const d = i.LoaiPhieu === "NHAP" ? i.CongNo || 0 : i.NghiepVu === XUAT_TRA_NCC ? -Number(i.TongTien) : 0;
          m[k] = (m[k] || 0) + d;
          return m;
        }, {})
      ).reduce((s, v) => s + Math.max(0, v), 0),
      soPhieu: invoices.length,
    };
  }, [invoices]);

  const inputCls = "w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#f66315]";
  const labelCls = "mb-1 block text-[11px] font-bold text-slate-700";

  return (
    <div className="space-y-6">
      {/* Tieu de & thao tac */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6 text-[#f66315]" />
          QUẢN LÝ PHIẾU NHẬP / XUẤT KHO
        </h2>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => openCreate("NHAP")}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-700/20 hover:bg-emerald-700"
          >
            <ArrowDownRight className="h-4 w-4" />
            Lập phiếu nhập kho
          </button>
          <button
            onClick={() => openCreate("XUAT")}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-700/20 hover:bg-blue-700"
          >
            <ArrowUpRight className="h-4 w-4" />
            Lập phiếu xuất kho
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Xuất Excel
          </button>
        </div>
      </div>

      {/* The tong hop theo bo loc hien tai */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Số phiếu", value: String(summary.soPhieu), cls: "text-slate-900" },
          { label: "Giá trị nhập", value: money(summary.nhap), cls: "text-emerald-700" },
          { label: "Giá trị xuất", value: money(summary.xuat), cls: "text-blue-700" },
          { label: "Công nợ NCC còn lại", value: money(summary.congNo), cls: summary.congNo ? "text-red-600" : "text-slate-900" },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{c.label}</p>
            <p className={`mt-1 text-lg font-bold ${c.cls}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Bo loc */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchInvoices();
          }}
          className="grid grid-cols-1 gap-3 md:grid-cols-12"
        >
          <div className="relative md:col-span-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              maxLength={100}
              placeholder="Số phiếu, chứng từ gốc, người giao/nhận, NCC..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-[#f66315]"
            />
          </div>
          <select value={loaiPhieu} onChange={(e) => setLoaiPhieu(e.target.value)} className={`${inputCls} md:col-span-2`}>
            <option value="ALL">Tất cả loại phiếu</option>
            <option value="NHAP">Phiếu nhập kho</option>
            <option value="XUAT">Phiếu xuất kho</option>
          </select>
          <select value={filterNCC} onChange={(e) => setFilterNCC(e.target.value)} className={`${inputCls} md:col-span-2`}>
            <option value="ALL">Tất cả nhà cung cấp</option>
            {suppliers.map((s) => (
              <option key={s.MaNCC} value={s.MaNCC}>
                {s.TenNCC}
              </option>
            ))}
          </select>
          <input type="date" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} className={`${inputCls} md:col-span-1`} title="Từ ngày" />
          <input type="date" value={denNgay} onChange={(e) => setDenNgay(e.target.value)} className={`${inputCls} md:col-span-1`} title="Đến ngày" />
          <button type="submit" className="rounded-xl bg-[#f66315] px-4 py-2 text-xs font-bold text-white hover:bg-[#e55000] md:col-span-2">
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* Danh sach phieu */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-700 uppercase">
              <tr>
                <th className="px-4 py-3">Số phiếu</th>
                <th className="px-4 py-3">Ngày lập</th>
                <th className="px-4 py-3">Nghiệp vụ</th>
                <th className="px-4 py-3">Đối tượng</th>
                <th className="px-4 py-3">Chứng từ gốc</th>
                <th className="px-4 py-3 text-right">Tổng tiền</th>
                <th className="px-4 py-3 text-center">Thanh toán NCC</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">Đang tải danh sách phiếu kho...</td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    {searched ? "Không tìm thấy hóa đơn kho nào phù hợp" : "Chưa có phiếu kho nào"}
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const isNhap = inv.LoaiPhieu === "NHAP";
                  const isHuy = isInvoiceCancelled(inv.TrangThai);
                  return (
                    <tr key={inv.MaHDK} className={`transition-colors hover:bg-slate-50/60 ${isHuy ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{inv.MaHDK}</td>
                      <td className="px-4 py-3 text-slate-600">{fmtDateTime(inv.NgayLap)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${
                            isNhap ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-blue-200 bg-blue-50 text-blue-700"
                          }`}
                        >
                          {isNhap ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                          {isNhap ? "Nhập kho" : "Xuất kho"}
                        </span>
                        <p className="mt-1 text-[11px] text-slate-500">{inv.NghiepVu || (isNhap ? "Nhập mua hàng" : "Xuất khác")}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{inv.NhaCungCap?.TenNCC || inv.NguoiGiaoNhan || "—"}</p>
                        {inv.NhaCungCap && inv.NguoiGiaoNhan && (
                          <p className="text-[11px] text-slate-500">
                            {isNhap ? "Người giao" : "Người nhận"}: {inv.NguoiGiaoNhan}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">{inv.SoChungTu || "—"}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">{money(inv.TongTien)}</td>
                      <td className="px-4 py-3 text-center">
                        {!isNhap || isHuy ? (
                          <span className="text-slate-400">—</span>
                        ) : inv.CongNo > 0 ? (
                          <span className="inline-block rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-600">
                            Còn nợ {money(inv.CongNo)}
                          </span>
                        ) : (
                          <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                            Đã thanh toán
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                            isHuy ? "border-red-200 bg-red-50 text-red-600" : "border-emerald-200 bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {isHuy ? <XCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                          {isHuy ? "Đã hủy" : "Hoàn thành"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setViewing(inv)} className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100" title="Xem chi tiết">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <a
                            href={`/admin/hoa-don-kho/in/${encodeURIComponent(inv.MaHDK)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100"
                            title="In phiếu"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </a>
                          {isNhap && !isHuy && inv.CongNo > 0 && (
                            <button
                              onClick={() => {
                                setPaying(inv);
                                setPayAmount(String(inv.CongNo));
                              }}
                              className="rounded-lg border border-amber-200 bg-amber-50 p-1.5 text-amber-700 hover:bg-amber-100"
                              title="Thanh toán công nợ"
                            >
                              <Wallet className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {!isHuy && (
                            <button
                              onClick={() => {
                                setCancelling(inv);
                                setCancelReason("");
                                setCancelError("");
                              }}
                              className="rounded-lg border border-red-200 bg-red-50/80 p-1.5 text-red-600 hover:bg-red-100"
                              title="Hủy phiếu"
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

      {/* ================= MODAL LAP PHIEU ================= */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col rounded-3xl border border-slate-100 bg-white shadow-2xl">
            <div className={`flex items-center justify-between rounded-t-3xl border-b px-6 py-4 ${createType === "NHAP" ? "bg-emerald-50/60" : "bg-blue-50/60"}`}>
              <div>
                <h3 className="text-base font-bold uppercase text-slate-900">
                  {createType === "NHAP" ? "Phiếu nhập kho" : "Phiếu xuất kho"}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Mẫu số {createType === "NHAP" ? "01-VT" : "02-VT"} • Ngày lập: {new Date().toLocaleDateString("vi-VN")} • Số phiếu được cấp tự động khi lưu
                </p>
              </div>
              <button onClick={() => setShowCreate(false)} className="rounded-xl p-2 text-slate-400 hover:bg-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5 text-xs">
              {/* Thong tin chung */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {createType === "XUAT" && (
                  <div>
                    <label className={labelCls}>
                      Nghiệp vụ xuất <span className="text-red-500">*</span>
                    </label>
                    <select value={nghiepVu} onChange={(e) => setNghiepVu(e.target.value)} className={inputCls}>
                      {NGHIEP_VU_XUAT.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {needNCC && (
                  <div className={createType === "NHAP" ? "md:col-span-2" : ""}>
                    <label className={labelCls}>
                      Nhà cung cấp <span className="text-red-500">*</span>
                    </label>
                    <select value={maNCC} onChange={(e) => setMaNCC(e.target.value)} className={inputCls}>
                      <option value="">-- Chọn nhà cung cấp --</option>
                      {activeSuppliers.map((s) => (
                        <option key={s.MaNCC} value={s.MaNCC}>
                          {s.TenNCC} ({s.MaNCC})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className={labelCls}>
                    {createType === "NHAP" ? "Họ tên người giao hàng" : "Họ tên người nhận hàng"}
                    {createType === "XUAT" && <span className="text-red-500"> *</span>}
                  </label>
                  <input value={nguoiGiaoNhan} maxLength={100} onChange={(e) => setNguoiGiaoNhan(e.target.value)} className={inputCls} placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className={labelCls}>{createType === "NHAP" ? "Số hóa đơn / chứng từ gốc của NCC" : "Chứng từ kèm theo"}</label>
                  <input value={soChungTu} maxLength={50} onChange={(e) => setSoChungTu(e.target.value)} className={inputCls} placeholder={createType === "NHAP" ? "VD: HĐ GTGT 0001234" : "VD: Biên bản kiểm kê số 05"} />
                </div>
                <div>
                  <label className={labelCls}>{createType === "NHAP" ? "Nhập tại kho" : "Xuất tại kho"}</label>
                  <select value={khoHang} onChange={(e) => setKhoHang(e.target.value)} className={inputCls}>
                    {WAREHOUSES.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={createType === "NHAP" ? "md:col-span-1" : "md:col-span-3"}>
                  <label className={labelCls}>
                    Diễn giải / lý do {createType === "XUAT" && nghiepVu === "Xuất khác" && <span className="text-red-500">*</span>}
                  </label>
                  <input value={dienGiai} maxLength={500} onChange={(e) => setDienGiai(e.target.value)} className={inputCls} placeholder={createType === "NHAP" ? "VD: Nhập hàng đợt 1 tháng 10" : "VD: Vợt gãy khung do lỗi sản xuất"} />
                </div>
              </div>

              {/* Bang hang hoa */}
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
                    <tr>
                      <th className="w-10 px-3 py-2 text-center">STT</th>
                      <th className="px-3 py-2 text-left">Tên hàng hóa</th>
                      <th className="w-24 px-3 py-2 text-left">Mã số</th>
                      <th className="w-12 px-3 py-2 text-center">ĐVT</th>
                      <th className="w-16 px-3 py-2 text-center">Tồn</th>
                      <th className="w-24 px-3 py-2 text-center">Số lượng</th>
                      <th className="w-32 px-3 py-2 text-right">{createType === "NHAP" ? "Đơn giá nhập" : "Đơn giá vốn"}</th>
                      <th className="w-32 px-3 py-2 text-right">Thành tiền</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lines.map((l, idx) => {
                      const sp = productOf(l.maSP);
                      const over = createType === "XUAT" && sp && Number(l.soLuong) > sp.SoLuong;
                      return (
                        <tr key={idx}>
                          <td className="px-3 py-2 text-center text-slate-500">{idx + 1}</td>
                          <td className="px-3 py-2">
                            <select
                              value={l.maSP}
                              onChange={(e) => updateLine(idx, { maSP: e.target.value, donGia: defaultPrice(e.target.value) })}
                              className="w-full rounded-lg border border-slate-200 p-1.5 outline-none focus:border-[#f66315]"
                            >
                              <option value="">-- Chọn sản phẩm --</option>
                              {products.map((p) => (
                                <option key={p.MaSP} value={p.MaSP}>
                                  {p.TenSP}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-500">{l.maSP || "—"}</td>
                          <td className="px-3 py-2 text-center text-slate-500">Cái</td>
                          <td className={`px-3 py-2 text-center font-semibold ${over ? "text-red-600" : "text-slate-600"}`}>{sp ? sp.SoLuong : "—"}</td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={l.soLuong}
                              onChange={(e) => updateLine(idx, { soLuong: e.target.value })}
                              className={`w-full rounded-lg border p-1.5 text-center outline-none ${over ? "border-red-400 bg-red-50 text-red-600" : "border-slate-200 focus:border-[#f66315]"}`}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={0}
                              step={1000}
                              value={l.donGia}
                              placeholder={createType === "NHAP" ? "Giá mua" : "Giá vốn"}
                              onChange={(e) => updateLine(idx, { donGia: e.target.value })}
                              className="w-full rounded-lg border border-slate-200 p-1.5 text-right outline-none focus:border-[#f66315]"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-800">{money(lineTotal(l))}</td>
                          <td className="px-2 py-2 text-center">
                            <button type="button" onClick={() => setLines(lines.filter((_, i) => i !== idx))} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold text-slate-800">
                    <tr>
                      <td colSpan={5} className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => setLines([...lines, { maSP: "", soLuong: "1", donGia: "" }])}
                          className="flex items-center gap-1 rounded-lg bg-orange-500/10 px-2.5 py-1 text-[11px] font-bold text-[#f66315] hover:bg-orange-500/20"
                        >
                          <PlusCircle className="h-3.5 w-3.5" />
                          Thêm dòng hàng
                        </button>
                      </td>
                      <td className="px-3 py-2 text-center">{lines.reduce((s, l) => s + (Number(l.soLuong) || 0), 0)}</td>
                      <td className="px-3 py-2 text-right">Cộng:</td>
                      <td className="px-3 py-2 text-right text-[#f66315]">{money(tongTien)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
              <p className="italic text-slate-600">
                Số tiền viết bằng chữ: <strong>{numberToVietnameseWords(tongTien)}</strong>
              </p>
              {createType === "XUAT" && (
                <p className="text-[11px] text-slate-500">Đơn giá xuất kho mặc định là giá vốn bình quân của các phiếu nhập.</p>
              )}

              {/* Thanh toan cho NCC (phieu nhap) */}
              {createType === "NHAP" && (
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-700">Thanh toán cho nhà cung cấp</p>
                  <div className="flex flex-wrap items-center gap-4">
                    {(
                      [
                        ["FULL", "Thanh toán đủ"],
                        ["PART", "Trả trước một phần"],
                        ["DEBT", "Ghi nợ toàn bộ"],
                      ] as [PayMode, string][]
                    ).map(([v, label]) => (
                      <label key={v} className="flex cursor-pointer items-center gap-1.5 font-semibold text-slate-700">
                        <input type="radio" checked={payMode === v} onChange={() => setPayMode(v)} className="accent-[#f66315]" />
                        {label}
                      </label>
                    ))}
                    {payMode === "PART" && (
                      <input type="number" min={1} step={1000} value={paidPart} onChange={(e) => setPaidPart(e.target.value)} placeholder="Số tiền trả trước" className="w-44 rounded-xl border border-slate-200 px-3 py-1.5 outline-none focus:border-[#f66315]" />
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-6 text-slate-600">
                    <span>
                      Đã thanh toán: <strong className="text-slate-900">{money(Math.min(daThanhToan, tongTien))}</strong>
                    </span>
                    <span>
                      Công nợ phát sinh: <strong className="text-red-600">{money(Math.max(0, tongTien - daThanhToan))}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button type="button" onClick={() => setShowCreate(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleCreate}
                className="rounded-xl bg-[#f66315] px-5 py-2 text-xs font-bold text-white shadow-md shadow-orange-900/20 hover:bg-[#e55000] disabled:opacity-50"
              >
                {submitting ? "Đang lưu..." : createType === "NHAP" ? "Lưu phiếu nhập" : "Lưu phiếu xuất"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL XEM CHI TIET (Bang 3.19) ================= */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold uppercase text-slate-900">
                  {viewing.LoaiPhieu === "NHAP" ? "Phiếu nhập kho" : "Phiếu xuất kho"} {viewing.MaHDK}
                </h3>
                <p className="text-xs text-slate-500">
                  {fmtDateTime(viewing.NgayLap)} • Người lập: {viewing.NhanVien?.HoTen || "—"}
                  {isInvoiceCancelled(viewing.TrangThai) && <span className="ml-2 font-bold text-red-600">• ĐÃ HỦY</span>}
                </p>
              </div>
              <button onClick={() => setViewing(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-xl bg-slate-50 p-4 text-xs">
              {[
                ["Nghiệp vụ", viewing.NghiepVu || "—"],
                ["Kho", warehouseLabel(viewing.KhoHang)],
                ["Nhà cung cấp", viewing.NhaCungCap?.TenNCC || "—"],
                [viewing.LoaiPhieu === "NHAP" ? "Người giao hàng" : "Người nhận hàng", viewing.NguoiGiaoNhan || "—"],
                ["Chứng từ gốc", viewing.SoChungTu || "—"],
                ["Diễn giải", viewing.LyDo || "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <span className="text-slate-400">{k}:</span> <span className="font-semibold text-slate-800">{v}</span>
                </div>
              ))}
            </div>

            <table className="mt-4 w-full overflow-hidden rounded-xl text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-600">
                <tr>
                  <th className="p-2.5">STT</th>
                  <th className="p-2.5">Hàng hóa</th>
                  <th className="p-2.5 text-center">Số lượng</th>
                  <th className="p-2.5 text-right">Đơn giá</th>
                  <th className="p-2.5 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {viewing.ChiTietHoaDonKhos.map((ct, i) => (
                  <tr key={ct.MaSP}>
                    <td className="p-2.5 text-slate-500">{i + 1}</td>
                    <td className="p-2.5">
                      <p className="font-medium">{ct.SanPham?.TenSP || ct.MaSP}</p>
                      <p className="font-mono text-[10px] text-slate-400">{ct.MaSP}</p>
                    </td>
                    <td className="p-2.5 text-center font-bold">{ct.SoLuong}</td>
                    <td className="p-2.5 text-right">{money(ct.DonGia)}</td>
                    <td className="p-2.5 text-right font-bold">{money(ct.ThanhTien)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs">
              <div className="flex justify-between">
                <span className="font-bold text-slate-600">Tổng cộng</span>
                <span className="text-base font-bold text-slate-900">{money(viewing.TongTien)}</span>
              </div>
              <p className="text-right italic text-slate-500">{numberToVietnameseWords(Number(viewing.TongTien))}</p>
              {viewing.LoaiPhieu === "NHAP" && (
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    Đã thanh toán: <strong>{money(viewing.DaThanhToan)}</strong>
                  </span>
                  <span className={viewing.CongNo > 0 ? "font-bold text-red-600" : "font-bold text-emerald-700"}>
                    {viewing.CongNo > 0 ? `Còn nợ NCC: ${money(viewing.CongNo)}` : "Đã thanh toán đủ"}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              {viewing.LoaiPhieu === "NHAP" && viewing.CongNo > 0 && !isInvoiceCancelled(viewing.TrangThai) && (
                <button
                  onClick={() => {
                    setPaying(viewing);
                    setPayAmount(String(viewing.CongNo));
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100"
                >
                  <Wallet className="h-4 w-4" />
                  Thanh toán công nợ
                </button>
              )}
              <a
                href={`/admin/hoa-don-kho/in/${encodeURIComponent(viewing.MaHDK)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                <Printer className="h-4 w-4" />
                In phiếu
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL THANH TOAN CONG NO ================= */}
      {paying && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Thanh toán công nợ phiếu {paying.MaHDK}</h3>
            <div className="space-y-1 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              <p>
                Nhà cung cấp: <strong className="text-slate-900">{paying.NhaCungCap?.TenNCC}</strong>
              </p>
              <p>
                Tổng tiền phiếu: <strong>{money(paying.TongTien)}</strong> • Đã trả: <strong>{money(paying.DaThanhToan)}</strong>
              </p>
              <p>
                Còn nợ: <strong className="text-red-600">{money(paying.CongNo)}</strong>
              </p>
            </div>
            <div>
              <label className={labelCls}>Số tiền thanh toán lần này (VNĐ)</label>
              <input type="number" min={1} max={paying.CongNo} step={1000} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className={inputCls} />
              <p className="mt-1 text-[11px] italic text-slate-500">{numberToVietnameseWords(Number(payAmount) || 0)}</p>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setPaying(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                Đóng
              </button>
              <button disabled={busy} onClick={handlePay} className="rounded-xl bg-[#f66315] px-5 py-2 text-xs font-bold text-white hover:bg-[#e55000] disabled:opacity-50">
                {busy ? "Đang xử lý..." : "Xác nhận thanh toán"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL HUY PHIEU (Bang 3.18, BR-01) ================= */}
      {cancelling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-center text-base font-bold text-slate-900">Hủy phiếu {cancelling.MaHDK}</h3>
            <p className="mt-1 text-center text-xs text-slate-500">
              {cancelling.LoaiPhieu === "NHAP"
                ? "Số lượng đã nhập sẽ được trừ khỏi tồn kho (chỉ khi tồn kho còn đủ)."
                : "Số lượng đã xuất sẽ được cộng trả lại tồn kho."}
            </p>
            {cancelling.LoaiPhieu === "NHAP" && Number(cancelling.DaThanhToan) > 0 && (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Phiếu này đã thanh toán {money(cancelling.DaThanhToan)} cho nhà cung cấp. Sau khi hủy, cần làm thủ tục thu hồi khoản tiền này với nhà cung cấp.
              </p>
            )}
            {cancelError && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">{cancelError}</div>}
            <div className="mt-4">
              <label className={labelCls}>
                Lý do hủy phiếu <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                maxLength={300}
                placeholder="VD: Nhập nhầm số lượng, nhà cung cấp giao thiếu hàng..."
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  setCancelError("");
                }}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-red-500"
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setCancelling(null)} className="flex-1 rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                Đóng
              </button>
              <button type="button" disabled={busy} onClick={handleCancel} className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50">
                {busy ? "Đang xử lý..." : "Xác nhận hủy phiếu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
