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
import { exportToExcel } from "@/lib/exportExcel";

const COLORS = ["#f66315", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"];

export default function AdminThongKePage() {
  const [loading, setLoading] = useState(true);
  const [tuNgay, setTuNgay] = useState("");
  const [denNgay, setDenNgay] = useState("");

  const [reportData, setReportData] = useState<{
    summary: {
      totalRevenue: number;
      totalImportCost: number;
      estimatedProfit: number;
      totalOrders: number;
      totalProducts: number;
      lowStockCount: number;
    };
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
    topBestSellers: { tenSP: string; soLuongBan: number; doanhThu: number }[];
    sortedSlowMoving: { maSP: string; tenSP: string; soLuongTon: number; soLuongBan: number }[];
    topCustomers: { hoTen: string; sdt: string; soDon: number; tongTien: number }[];
  } | null>(null);

  const fetchStats = async () => {
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
        toast.error("Lỗi khi tải báo cáo thống kê");
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

    // Xuat sheet tong hop
    const summarySheet = [
      {
        "Chỉ số": "Tổng doanh thu bán hàng",
        "Giá trị": `${Number(reportData.summary.totalRevenue).toLocaleString()} VNĐ`,
      },
      {
        "Chỉ số": "Tổng chi phí nhập hàng",
        "Giá trị": `${Number(reportData.summary.totalImportCost).toLocaleString()} VNĐ`,
      },
      {
        "Chỉ số": "Lợi nhuận ước tính",
        "Giá trị": `${Number(reportData.summary.estimatedProfit).toLocaleString()} VNĐ`,
      },
      { "Chỉ số": "Tổng số đơn hàng", "Giá trị": reportData.summary.totalOrders },
      { "Chỉ số": "Số mặt hàng sắp hết tồn", "Giá trị": reportData.summary.lowStockCount },
    ];

    exportToExcel(summarySheet, "BaoCaoDoanhThuTonKho_FBShop", "ThongKeTongHop");
    toast.success("Đã xuất file báo cáo tổng hợp ra Excel!");
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-[#f66315]" />
            BÁO CÁO & THỐNG KÊ DOANH THU - TỒN KHO
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Bám sát 4 báo cáo chuẩn Mục 3.2.3.9 Báo cáo Đồ án FBShop
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-2xs"
          >
            <Download className="h-4 w-4 text-gray-500" />
            Xuất file Báo cáo (Excel)
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
            <Calendar className="h-4 w-4 text-[#f66315]" />
            <span>Khoảng thời gian báo cáo:</span>
          </div>
          <input
            type="date"
            value={tuNgay}
            onChange={(e) => setTuNgay(e.target.value)}
            className="rounded-xl border border-gray-200 py-1.5 px-3 text-xs outline-none"
            title="Từ ngày"
          />
          <span className="text-xs text-gray-400">đến</span>
          <input
            type="date"
            value={denNgay}
            onChange={(e) => setDenNgay(e.target.value)}
            className="rounded-xl border border-gray-200 py-1.5 px-3 text-xs outline-none"
            title="Đến ngày"
          />
          <button
            onClick={fetchStats}
            className="rounded-xl bg-[#f66315] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#e55000]"
          >
            Xem số liệu
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {reportData && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-gray-500 font-bold uppercase">
              <span>Tổng Doanh Thu</span>
              <div className="rounded-lg bg-orange-50 p-2 text-[#f66315]">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-gray-900">
              {Number(reportData.summary.totalRevenue).toLocaleString("vi-VN")} đ
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-1">
              <ArrowUpRight className="h-3 w-3" />
              Từ {reportData.summary.totalOrders} đơn đặt hàng
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-gray-500 font-bold uppercase">
              <span>Chi Phí Nhập Kho</span>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-gray-900">
              {Number(reportData.summary.totalImportCost).toLocaleString("vi-VN")} đ
            </p>
            <p className="text-[11px] text-gray-500 font-semibold mt-1">
              Từ các hóa đơn nhập NCC
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-gray-500 font-bold uppercase">
              <span>Lợi Nhuận Ước Tính</span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <Award className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-emerald-600">
              {Number(reportData.summary.estimatedProfit).toLocaleString("vi-VN")} đ
            </p>
            <p className="text-[11px] text-gray-400 font-semibold mt-1">
              (Doanh thu trừ Chi phí nhập)
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-gray-500 font-bold uppercase">
              <span>Cảnh Báo Tồn Kho</span>
              <div className="rounded-lg bg-red-50 p-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-red-600">
              {reportData.summary.lowStockCount} sản phẩm
            </p>
            <p className="text-[11px] text-red-500 font-semibold mt-1">
              Tồn kho ≤ 5 cây cần nhập bổ sung
            </p>
          </div>
        </div>
      )}

      {/* 1. Báo cáo Doanh thu & Lợi nhuận (Biểu đồ LineChart) */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#f66315]" />
          1. BÁO CÁO DOANH THU & LỢI NHUẬN THEO THỜI GIAN (BẢNG 3.34)
        </h3>
        <div className="h-72 w-full">
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
                name="Lợi nhuận ước tính"
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
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            2. CẢNH BÁO TỒN KHO SẮP HẾT (≤ 5 CÂY)
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Danh sách mặt hàng chạm ngưỡng tối thiểu cần lập phiếu nhập kho khẩn
          </p>

          <div className="overflow-x-auto max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-100 bg-gray-50 font-bold text-gray-600">
                <tr>
                  <th className="p-2">Sản phẩm</th>
                  <th className="p-2">Danh mục</th>
                  <th className="p-2 text-center">Tồn</th>
                  <th className="p-2 text-center">Mức cảnh báo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportData?.lowStockProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-emerald-600 font-bold">
                      Tất cả sản phẩm đều có tồn kho an toàn (&gt; 5 cây)
                    </td>
                  </tr>
                ) : (
                  reportData?.lowStockProducts.map((p) => (
                    <tr key={p.maSP}>
                      <td className="p-2 font-bold text-gray-800">{p.tenSP}</td>
                      <td className="p-2 text-gray-500">{p.danhMuc}</td>
                      <td className="p-2 text-center font-black text-red-600">{p.soLuong}</td>
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
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
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
                    `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`
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
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            3. TOP SẢN PHẨM BÁN CHẠY NHẤT (BẢNG 3.36)
          </h3>
          <div className="space-y-3">
            {reportData?.topBestSellers.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Chưa có dữ liệu bán hàng</p>
            ) : (
              reportData?.topBestSellers.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f66315] font-black text-white text-[11px]">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{item.tenSP}</p>
                      <p className="text-[10px] text-gray-500">Đã bán {item.soLuongBan} cây</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-[#f66315]">
                    {Number(item.doanhThu).toLocaleString("vi-VN")} đ
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 4. Thong ke Khach Hang (Bảng 3.37) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-600" />
            4. TOP KHÁCH HÀNG THÂN THIẾT (BẢNG 3.37)
          </h3>
          <div className="space-y-3">
            {reportData?.topCustomers.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Chưa có khách hàng đặt mua</p>
            ) : (
              reportData?.topCustomers.map((cust, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 font-black text-white text-[11px]">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{cust.hoTen}</p>
                      <p className="text-[10px] text-gray-500">{cust.sdt} • {cust.soDon} đơn hàng</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-gray-900">
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
