"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Award,
  Users,
  Download,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Package,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import toast from "react-hot-toast";
import { exportSheetsToExcel } from "@/lib/exportExcel";

const COLORS = ["#f66315", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"];

export default function AdminThongKePage() {
  const [loading, setLoading] = useState(true);
  const [tuNgay, setTuNgay] = useState("");
  const [denNgay, setDenNgay] = useState("");

  const [reportData, setReportData] = useState<{
    summary: {
      totalRevenue: number;
      totalCOGS: number;
      grossProfit: number;
      totalImportCost: number;
      totalOrders: number;
      pendingOrders: number;
      pendingValue: number;
      cancelledOrders: number;
      productsWithoutCost: number;
      totalProducts: number;
      lowStockCount: number;
      buyingCustomers: number;
      returningCustomers: number;
      vipCustomers: number;
    };
    timelineUnit: "day" | "month";
    revenueTimeline: { ngay: string; doanhThu: number; loiNhuan: number }[];
    stockPieData: { name: string; value: number }[];
    lowStockProducts: {
      maSP: string;
      tenSP: string;
      soLuong: number;
      giaBan: number;
      danhMuc: string;
      mucDoCanhBao: string;
    }[];
    topBestSellers: { maSP: string; tenSP: string; soLuongBan: number; doanhThu: number }[];
    sortedSlowMoving: { maSP: string; tenSP: string; soLuongTon: number; soLuongBan: number }[];
    topCustomers: { hoTen: string; sdt: string; soDon: number; tongTien: number; hang: string }[];
  } | null>(null);
  const [salesView, setSalesView] = useState<"best" | "slow">("best");
  const [rangeError, setRangeError] = useState("");

  const fetchStats = async () => {
    // Bang 3.34 A2 - Sai logic thoi gian
    if (tuNgay && denNgay && tuNgay > denNgay) {
      setRangeError("Khoảng thời gian tìm kiếm không hợp lệ");
      toast.error("Khoảng thời gian tìm kiếm không hợp lệ");
      return;
    }
    setRangeError("");
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tuNgay) params.append("tuNgay", tuNgay);
      if (denNgay) params.append("denNgay", denNgay);

      const res = await fetch(`/api/admin/thong-ke?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setReportData(json.data);
      } else {
        setRangeError(json.error || "");
        toast.error(json.error || "Lỗi khi tải báo cáo thống kê. Vui lòng thử lại!");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleExportExcel = () => {
    if (!reportData) return;
    const s = reportData.summary;
    const ky = tuNgay || denNgay ? `${tuNgay || "đầu kỳ"} → ${denNgay || "nay"}` : "Toàn bộ thời gian";

    try {
      // Moi bao cao 1 sheet (Bang 3.34 -> 3.37)
      exportSheetsToExcel(
        [
          {
            name: "TongHop",
            data: [
              { "Chỉ số": "Kỳ báo cáo", "Giá trị": ky },
              { "Chỉ số": "Doanh thu (đơn đã giao)", "Giá trị": s.totalRevenue },
              { "Chỉ số": "Giá vốn hàng bán", "Giá trị": s.totalCOGS },
              { "Chỉ số": "Lợi nhuận gộp", "Giá trị": s.grossProfit },
              { "Chỉ số": "Chi phí nhập hàng trong kỳ", "Giá trị": s.totalImportCost },
              { "Chỉ số": "Số đơn đã giao", "Giá trị": s.totalOrders },
              { "Chỉ số": "Đơn đang xử lý (chưa ghi nhận doanh thu)", "Giá trị": s.pendingOrders },
              { "Chỉ số": "Đơn đã hủy", "Giá trị": s.cancelledOrders },
              { "Chỉ số": "Sản phẩm sắp hết / hết hàng", "Giá trị": s.lowStockCount },
              { "Chỉ số": "Khách hàng mua hàng", "Giá trị": s.buyingCustomers },
              { "Chỉ số": "Khách quay lại (≥ 2 đơn)", "Giá trị": s.returningCustomers },
            ],
          },
          {
            name: "DoanhThu_LoiNhuan",
            data: reportData.revenueTimeline.map((r) => ({
              [reportData.timelineUnit === "month" ? "Tháng" : "Ngày"]: r.ngay,
              "Doanh thu (VNĐ)": r.doanhThu,
              "Lợi nhuận gộp (VNĐ)": r.loiNhuan,
            })),
          },
          {
            name: "TonKho_CanhBao",
            data: reportData.lowStockProducts.map((p) => ({
              "Mã SP": p.maSP,
              "Sản phẩm": p.tenSP,
              "Danh mục": p.danhMuc,
              "Tồn kho": p.soLuong,
              "Mức cảnh báo": p.mucDoCanhBao,
            })),
          },
          {
            name: "BanChay",
            data: reportData.topBestSellers.map((p, i) => ({
              "Hạng": i + 1,
              "Sản phẩm": p.tenSP,
              "Số lượng bán": p.soLuongBan,
              "Doanh thu (VNĐ)": p.doanhThu,
            })),
          },
          {
            name: "BanCham",
            data: reportData.sortedSlowMoving.map((p) => ({
              "Mã SP": p.maSP,
              "Sản phẩm": p.tenSP,
              "Số lượng bán": p.soLuongBan,
              "Tồn kho": p.soLuongTon,
            })),
          },
          {
            name: "KhachHang",
            data: reportData.topCustomers.map((c, i) => ({
              "Hạng": i + 1,
              "Khách hàng": c.hoTen,
              "SĐT": c.sdt,
              "Số đơn": c.soDon,
              "Tổng chi tiêu (VNĐ)": c.tongTien,
              "Phân hạng": c.hang,
            })),
          },
        ],
        "BaoCaoThongKe_FBShop"
      );
      toast.success("Đã xuất file báo cáo ra Excel!");
    } catch {
      // Bang 3.34 A3 - Loi xuat file
      toast.error("Xuất file thất bại. Vui lòng thử lại!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-[#f66315]" />
            BÁO CÁO & THỐNG KÊ DOANH THU - TỒN KHO
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Xuất file Báo cáo (Excel)
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Calendar className="h-4 w-4 text-[#f66315]" />
            <span>Khoảng thời gian báo cáo:</span>
          </div>
          <input
            type="date"
            value={tuNgay}
            onChange={(e) => setTuNgay(e.target.value)}
            className="rounded-xl border border-slate-200 py-1.5 px-3 text-xs outline-none"
            title="Từ ngày"
          />
          <span className="text-xs text-slate-400">đến</span>
          <input
            type="date"
            value={denNgay}
            onChange={(e) => setDenNgay(e.target.value)}
            className="rounded-xl border border-slate-200 py-1.5 px-3 text-xs outline-none"
            title="Đến ngày"
          />
          <button
            onClick={fetchStats}
            className="rounded-xl bg-[#f66315] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#e55000]"
          >
            Xem số liệu
          </button>
          {(tuNgay || denNgay) && (
            <button
              onClick={() => {
                setTuNgay("");
                setDenNgay("");
                setRangeError("");
              }}
              className="text-xs font-semibold text-slate-500 hover:text-[#f66315]"
            >
              Bỏ lọc
            </button>
          )}
          {rangeError && <span className="text-xs font-semibold text-red-600">{rangeError}</span>}
        </div>
      </div>

      {/* Summary KPI Cards */}
      {reportData && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
              <span>Tổng Doanh Thu</span>
              <div className="rounded-lg bg-orange-50 p-2 text-[#f66315]">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {Number(reportData.summary.totalRevenue).toLocaleString("vi-VN")} đ
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-1">
              <ArrowUpRight className="h-3 w-3" />
              Từ {reportData.summary.totalOrders} đơn đã giao
            </p>
            {reportData.summary.pendingOrders > 0 && (
              <p className="text-[11px] text-amber-600 font-semibold mt-0.5">
                + {reportData.summary.pendingOrders} đơn đang xử lý (
                {Number(reportData.summary.pendingValue).toLocaleString("vi-VN")} đ) chưa ghi nhận
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
              <span>Chi Phí Nhập Kho</span>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {Number(reportData.summary.totalImportCost).toLocaleString("vi-VN")} đ
            </p>
            <p className="text-[11px] text-slate-500 font-semibold mt-1">
              Tiền nhập hàng từ NCC trong kỳ
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
              <span>Lợi Nhuận Gộp</span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <Award className="h-5 w-5" />
              </div>
            </div>
            <p
              className={`mt-2 text-2xl font-bold ${
                reportData.summary.grossProfit < 0 ? "text-red-600" : "text-emerald-600"
              }`}
            >
              {Number(reportData.summary.grossProfit).toLocaleString("vi-VN")} đ
            </p>
            <p className="text-[11px] text-slate-500 font-semibold mt-1">
              Doanh thu − giá vốn ({Number(reportData.summary.totalCOGS).toLocaleString("vi-VN")} đ)
            </p>
            {reportData.summary.productsWithoutCost > 0 && (
              <p className="text-[11px] text-amber-600 font-semibold mt-0.5">
                {reportData.summary.productsWithoutCost} sản phẩm chưa có giá nhập, chưa tính giá vốn
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
              <span>Cảnh Báo Tồn Kho</span>
              <div className="rounded-lg bg-red-50 p-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-red-600">
              {reportData.summary.lowStockCount} sản phẩm
            </p>
            <p className="text-[11px] text-red-500 font-semibold mt-1">
              Tồn kho ≤ 5 cây cần nhập bổ sung
            </p>
          </div>
        </div>
      )}

      {/* 1. Báo cáo Doanh thu & Lợi nhuận (Biểu đồ LineChart) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#f66315]" />
          1. BÁO CÁO DOANH THU & LỢI NHUẬN THEO THỜI GIAN
        </h3>
        <div className="relative h-72 w-full">
          {/* Bang 3.34 A1 - Du lieu rong */}
          {reportData && reportData.revenueTimeline.every((r) => r.doanhThu === 0) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <span className="rounded-lg bg-white/90 px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm">
                Không có dữ liệu
              </span>
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={reportData?.revenueTimeline || []}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="ngay" stroke="#94a3b8" fontSize={11} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                formatter={(val: any) => [
                  `${Number(val).toLocaleString("vi-VN")} đ`,
                  "",
                ]}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              <Line
                type="monotone"
                dataKey="doanhThu"
                name="Doanh thu bán hàng"
                stroke="#f66315"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="loiNhuan"
                name="Lợi nhuận gộp"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Báo cáo Tồn kho & Cảnh báo (Bảng 3.35) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Canh bao sap het hang */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            2. CẢNH BÁO TỒN KHO SẮP HẾT (≤ 5 CÂY)
          </h3>

          <div className="overflow-x-auto max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 font-bold text-slate-600">
                <tr>
                  <th className="p-2">Sản phẩm</th>
                  <th className="p-2">Danh mục</th>
                  <th className="p-2 text-center">Tồn</th>
                  <th className="p-2 text-center">Mức cảnh báo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData?.lowStockProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-emerald-600 font-bold">
                      Tất cả sản phẩm đều có tồn kho an toàn (&gt; 5 cây)
                    </td>
                  </tr>
                ) : (
                  reportData?.lowStockProducts.map((p) => (
                    <tr key={p.maSP}>
                      <td className="p-2 font-bold text-slate-800">{p.tenSP}</td>
                      <td className="p-2 text-slate-500">{p.danhMuc}</td>
                      <td className="p-2 text-center font-bold text-red-600">{p.soLuong}</td>
                      <td className="p-2 text-center">
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                          {p.mucDoCanhBao}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Co cau ton kho theo hang (PieChart) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-600" />
            CƠ CẤU TỒN KHO THEO DANH MỤC / HÃNG
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportData?.stockPieData || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }: any) =>
                    // "Vợt Cầu Lông Yonex" -> "Yonex"
                    `${String(name).replace(/^Vợt Cầu Lông\s*/i, "") || name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {reportData?.stockPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3 & 4. Hiệu suất Bán hàng & Khách hàng */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top 5 Ban Chay */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              3. HIỆU SUẤT BÁN HÀNG
            </h3>
            <div className="flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-bold">
              {[
                ["best", "Bán chạy"],
                ["slow", "Bán chậm"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSalesView(key as "best" | "slow")}
                  className={`rounded-md px-2.5 py-1 transition-colors ${
                    salesView === key ? "bg-white text-[#f66315] shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {salesView === "slow" ? (
              reportData?.sortedSlowMoving.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Không có dữ liệu</p>
              ) : (
                reportData?.sortedSlowMoving.map((item, idx) => (
                  <div
                    key={item.maSP}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-400 font-bold text-white text-[11px]">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{item.tenSP}</p>
                        <p className="text-[10px] text-slate-500">Đã bán {item.soLuongBan} cây trong kỳ</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-600">Tồn {item.soLuongTon}</span>
                  </div>
                ))
              )
            ) : reportData?.topBestSellers.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Không có dữ liệu</p>
            ) : (
              reportData?.topBestSellers.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f66315] font-bold text-white text-[11px]">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.tenSP}</p>
                      <p className="text-[10px] text-slate-500">Đã bán {item.soLuongBan} cây</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#f66315]">
                    {Number(item.doanhThu).toLocaleString("vi-VN")} đ
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 4. Thong ke Khach Hang (Bảng 3.37) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-600" />
            4. BÁO CÁO KHÁCH HÀNG
          </h3>
          {reportData && (
            <div className="mb-3 grid grid-cols-3 gap-2 text-center">
              {[
                ["Khách mua hàng", reportData.summary.buyingCustomers],
                ["Quay lại (≥ 2 đơn)", reportData.summary.returningCustomers],
                ["Khách VIP", reportData.summary.vipCustomers],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-xl border border-slate-100 bg-slate-50 py-2">
                  <p className="text-lg font-bold text-slate-900">{value}</p>
                  <p className="text-[10px] font-semibold text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-3">
            {reportData?.topCustomers.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Không có dữ liệu</p>
            ) : (
              reportData?.topCustomers.map((cust, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 font-bold text-white text-[11px]">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        {cust.hoTen}
                        <span
                          className={`rounded px-1.5 py-px text-[9px] font-bold ${
                            cust.hang === "VIP"
                              ? "bg-amber-100 text-amber-700"
                              : cust.hang === "Thân thiết"
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {cust.hang}
                        </span>
                      </p>
                      <p className="text-[10px] text-slate-500">{cust.sdt} • {cust.soDon} đơn hàng</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    {Number(cust.tongTien).toLocaleString("vi-VN")} đ
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
