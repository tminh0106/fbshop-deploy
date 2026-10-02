"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Download,
  Package,
  LayoutGrid,
  ChevronRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
import Pagination from "@/components/admin/Pagination";
import { exportSheetsToExcel } from "@/lib/exportExcel";
import { printReport } from "@/lib/printReport";

// =======================================================
// BAO CAO THONG KE - Bang 3.34 -> 3.37
// Giao dien tong quan -> chon 1 trong 4 bao cao -> chon bo loc -> xem (bang + bieu do) -> xuat Excel/PDF
// =======================================================

const COLORS = ["#f66315", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#14b8a6", "#64748b"];
const PAGE_SIZE = 10;
const money = (n: number) => `${Math.round(n).toLocaleString("vi-VN")} đ`;
const dateVN = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "Chưa bán");
// Moc thoi gian "2026-10-01" -> "01/10/2026", "2026-10" -> "10/2026"
const periodVN = (k: string) => k.split("-").reverse().join("/");

type Report = "overview" | "revenue" | "inventory" | "sales" | "customers";

type StatsData = {
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
    totalStock: number;
    stockValue: number;
    lowStockCount: number;
    slowMovingCount: number;
    soldQuantity: number;
    buyingCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    vipCustomers: number;
  };
  thresholds: { lowStock: number; slowMovingDays: number; vipSpending: number; loyalMinOrders: number };
  categories: { id: string; name: string }[];
  timelineUnit: "day" | "month";
  revenueTimeline: { ngay: string; soDon: number; doanhThu: number; giaVon: number; loiNhuan: number }[];
  inventory: {
    maSP: string;
    tenSP: string;
    maDanhMuc: string;
    danhMuc: string;
    soLuong: number;
    giaBan: number;
    giaTriTon: number;
    lanBanCuoi: string | null;
    soNgayChuaBan: number | null;
    trangThai: string;
  }[];
  sales: {
    maSP: string;
    tenSP: string;
    maDanhMuc: string;
    danhMuc: string;
    soLuongBan: number;
    doanhThu: number;
    soLuongTon: number;
  }[];
  customers: {
    maKH: string;
    hoTen: string;
    sdt: string;
    soDon: number;
    tongTien: number;
    hang: string;
    donDauTien: string | null;
    khachMoi: boolean;
  }[];
};

const REPORTS: { key: Exclude<Report, "overview">; title: string; desc: string; icon: typeof TrendingUp }[] = [
  { key: "revenue", title: "Báo cáo lợi nhuận và doanh thu", desc: "Doanh thu, giá vốn, lợi nhuận gộp theo thời gian", icon: TrendingUp },
  { key: "inventory", title: "Báo cáo tồn kho và kho hàng", desc: "Tồn kho thời gian thực, hàng sắp hết, hàng tồn đọng", icon: Package },
  { key: "sales", title: "Báo cáo bán hàng và hiệu suất sản phẩm", desc: "Xếp hạng sản phẩm bán chạy / bán chậm theo dòng sản phẩm", icon: Award },
  { key: "customers", title: "Báo cáo khách hàng", desc: "Khách mới, tần suất mua hàng, khách thân thiết và VIP", icon: Users },
];

const STOCK_BADGE: Record<string, string> = {
  "Hết hàng": "bg-red-100 text-red-700",
  "Sắp hết hàng": "bg-amber-100 text-amber-700",
  "Tồn đọng": "bg-violet-100 text-violet-700",
  "Bình thường": "bg-emerald-100 text-emerald-700",
};
const RANK_BADGE: Record<string, string> = {
  VIP: "bg-amber-100 text-amber-700",
  "Thân thiết": "bg-indigo-100 text-indigo-700",
  Thường: "bg-slate-200 text-slate-600",
};

// ---------- thanh phan dung chung ----------
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-xs ${className}`}>{children}</div>;
}

function Kpi({ label, value, note, tone = "text-slate-900" }: { label: string; value: string | number; note?: string; tone?: string }) {
  return (
    <Card>
      <p className="text-[11px] font-bold uppercase text-slate-500">{label}</p>
      <p className={`mt-1.5 text-xl font-bold ${tone}`}>{value}</p>
      {note && <p className="mt-1 text-[11px] font-semibold text-slate-500">{note}</p>}
    </Card>
  );
}

function Empty({ text = "Không có dữ liệu" }: { text?: string }) {
  return <p className="py-10 text-center text-sm font-semibold text-slate-400">{text}</p>;
}

function SectionTitle({ icon: Icon, children }: { icon: typeof TrendingUp; children: React.ReactNode }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900">
      <Icon className="h-4 w-4 text-[#f66315]" />
      {children}
    </h3>
  );
}

const inputCls = "rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#f66315]";
const labelCls = "text-[11px] font-bold uppercase text-slate-500";

export default function AdminThongKePage() {
  const [report, setReport] = useState<Report>("overview");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StatsData | null>(null);

  // Khoang ngay: dang nhap (draft) va dang ap dung (applied) - chi ap dung khi bam "Xem bao cao"
  const [tuNgay, setTuNgay] = useState("");
  const [denNgay, setDenNgay] = useState("");
  const [applied, setApplied] = useState({ tuNgay: "", denNgay: "" });
  const [rangeError, setRangeError] = useState("");

  // Bo loc rieng tung bao cao (draft -> applied khi bam nut)
  const [invDraft, setInvDraft] = useState({ danhMuc: "ALL", trangThai: "ALL" });
  const [invFilter, setInvFilter] = useState(invDraft);
  const [salesDraft, setSalesDraft] = useState({ view: "best", top: "10", danhMuc: "ALL" });
  const [salesFilter, setSalesFilter] = useState(salesDraft);
  const [custDraft, setCustDraft] = useState({ hang: "ALL" });
  const [custFilter, setCustFilter] = useState(custDraft);

  const [exportFormat, setExportFormat] = useState<"excel" | "pdf">("excel");
  const [page, setPage] = useState(1);

  const fetchStats = async (range = { tuNgay, denNgay }) => {
    // Bang 3.34 A2 - Sai logic thoi gian
    if (range.tuNgay && range.denNgay && range.tuNgay > range.denNgay) {
      setRangeError("Khoảng thời gian tìm kiếm không hợp lệ");
      toast.error("Khoảng thời gian tìm kiếm không hợp lệ");
      return false;
    }
    setRangeError("");
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (range.tuNgay) params.append("tuNgay", range.tuNgay);
      if (range.denNgay) params.append("denNgay", range.denNgay);
      const res = await fetch(`/api/admin/thong-ke?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        setRangeError(json.error || "");
        toast.error(json.error || "Lỗi khi tải báo cáo thống kê. Vui lòng thử lại!");
        return false;
      }
      setData(json.data);
      setApplied(range);
      return true;
    } catch {
      // A2/A3 - Loi ket noi
      toast.error("Lỗi kết nối máy chủ. Vui lòng thử lại!");
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats({ tuNgay: "", denNgay: "" });
  }, []);

  useEffect(() => setPage(1), [report, invFilter, salesFilter, custFilter, applied]);

  // Nut "Xem bao cao" / "Thong ke": ap dung bo loc cua bao cao dang mo
  const applyFilters = async () => {
    const rangeChanged = tuNgay !== applied.tuNgay || denNgay !== applied.denNgay;
    if (rangeChanged && !(await fetchStats())) return;
    if (report === "inventory") setInvFilter(invDraft);
    if (report === "sales") setSalesFilter(salesDraft);
    if (report === "customers") setCustFilter(custDraft);
  };

  const periodText = applied.tuNgay || applied.denNgay
    ? `${applied.tuNgay ? new Date(applied.tuNgay).toLocaleDateString("vi-VN") : "Đầu kỳ"} – ${
        applied.denNgay ? new Date(applied.denNgay).toLocaleDateString("vi-VN") : "Hôm nay"
      }`
    : "Toàn bộ thời gian";

  // ---------- du lieu da loc cho tung bao cao ----------
  const inventoryRows = useMemo(
    () =>
      (data?.inventory || []).filter(
        (p) =>
          (invFilter.danhMuc === "ALL" || p.maDanhMuc === invFilter.danhMuc) &&
          (invFilter.trangThai === "ALL" ||
            (invFilter.trangThai === "CANH_BAO" ? p.trangThai === "Hết hàng" || p.trangThai === "Sắp hết hàng" : p.trangThai === invFilter.trangThai))
      ),
    [data, invFilter]
  );

  const salesRows = useMemo(() => {
    let rows = (data?.sales || []).filter((p) => salesFilter.danhMuc === "ALL" || p.maDanhMuc === salesFilter.danhMuc);
    rows =
      salesFilter.view === "best"
        ? rows.filter((p) => p.soLuongBan > 0).sort((a, b) => b.soLuongBan - a.soLuongBan || b.doanhThu - a.doanhThu)
        : [...rows].sort((a, b) => a.soLuongBan - b.soLuongBan || b.soLuongTon - a.soLuongTon);
    return salesFilter.top === "ALL" ? rows : rows.slice(0, Number(salesFilter.top));
  }, [data, salesFilter]);

  // Doanh thu theo dong san pham (vot, giay, phu kien...) trong ky
  const salesByCategory = useMemo(() => {
    const m = new Map<string, { danhMuc: string; soLuongBan: number; doanhThu: number }>();
    for (const p of data?.sales || []) {
      if (!p.soLuongBan) continue;
      const c = m.get(p.danhMuc) || { danhMuc: p.danhMuc, soLuongBan: 0, doanhThu: 0 };
      c.soLuongBan += p.soLuongBan;
      c.doanhThu += p.doanhThu;
      m.set(p.danhMuc, c);
    }
    return [...m.values()].sort((a, b) => b.doanhThu - a.doanhThu);
  }, [data]);

  const customerRows = useMemo(
    () =>
      (data?.customers || []).filter((c) =>
        custFilter.hang === "ALL" ? true : custFilter.hang === "NEW" ? c.khachMoi : c.hang === custFilter.hang
      ),
    [data, custFilter]
  );

  const stockPie = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of inventoryRows) m.set(p.danhMuc, (m.get(p.danhMuc) || 0) + p.soLuong);
    return [...m].filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [inventoryRows]);

  const rankPie = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of customerRows) m.set(c.hang, (m.get(c.hang) || 0) + 1);
    return [...m].map(([name, value]) => ({ name, value }));
  }, [customerRows]);

  const timelineHasData = !!data?.revenueTimeline.some((r) => r.soDon > 0);
  const unitLabel = data?.timelineUnit === "month" ? "Tháng" : "Ngày";
  const categoryName = (id: string) => data?.categories.find((c) => c.id === id)?.name || "Tất cả";

  // ---------- xuat bao cao (FR-34) ----------
  const handleExport = () => {
    if (!data || report === "overview") return;
    const s = data.summary;
    let title = "";
    let summary: [string, string | number][] = [];
    let columns: string[] = [];
    let rows: (string | number)[][] = [];
    let heading = "";

    if (report === "revenue") {
      title = "Báo cáo lợi nhuận và doanh thu";
      summary = [
        ["Doanh thu (đơn đã giao)", s.totalRevenue],
        ["Giá vốn hàng bán", s.totalCOGS],
        ["Lợi nhuận gộp", s.grossProfit],
        ["Chi phí nhập hàng trong kỳ", s.totalImportCost],
        ["Số đơn đã giao", s.totalOrders],
        ["Đơn đang xử lý (chưa ghi nhận doanh thu)", s.pendingOrders],
        ["Đơn đã hủy", s.cancelledOrders],
      ];
      heading = `Chi tiết theo ${unitLabel.toLowerCase()}`;
      columns = [unitLabel, "Số đơn", "Doanh thu (đ)", "Giá vốn (đ)", "Lợi nhuận gộp (đ)"];
      rows = data.revenueTimeline.filter((r) => r.soDon > 0).map((r) => [periodVN(r.ngay), r.soDon, r.doanhThu, r.giaVon, r.loiNhuan]);
    } else if (report === "inventory") {
      title = "Báo cáo tồn kho và kho hàng";
      summary = [
        ["Danh mục", invFilter.danhMuc === "ALL" ? "Tất cả" : categoryName(invFilter.danhMuc)],
        ["Trạng thái tồn", invFilter.trangThai === "ALL" ? "Tất cả" : invFilter.trangThai === "CANH_BAO" ? "Cần nhập thêm" : invFilter.trangThai],
        ["Số mặt hàng", inventoryRows.length],
        ["Tổng số lượng tồn", inventoryRows.reduce((t, p) => t + p.soLuong, 0)],
        ["Giá trị tồn kho (đ)", inventoryRows.reduce((t, p) => t + p.giaTriTon, 0)],
      ];
      heading = "Danh sách tồn kho";
      columns = ["Mã SP", "Sản phẩm", "Danh mục", "Tồn kho", "Giá trị tồn (đ)", "Lần bán cuối", "Trạng thái"];
      rows = inventoryRows.map((p) => [p.maSP, p.tenSP, p.danhMuc, p.soLuong, p.giaTriTon, dateVN(p.lanBanCuoi), p.trangThai]);
    } else if (report === "sales") {
      title = "Báo cáo bán hàng và hiệu suất sản phẩm";
      summary = [
        ["Tiêu chí", salesFilter.view === "best" ? "Top bán chạy" : "Top bán chậm"],
        ["Dòng sản phẩm", salesFilter.danhMuc === "ALL" ? "Tất cả" : categoryName(salesFilter.danhMuc)],
        ["Tổng số lượng bán", s.soldQuantity],
        ["Doanh thu bán hàng (đ)", s.totalRevenue],
      ];
      heading = salesFilter.view === "best" ? "Xếp hạng sản phẩm bán chạy" : "Xếp hạng sản phẩm bán chậm";
      columns = ["Hạng", "Mã SP", "Sản phẩm", "Dòng sản phẩm", "Số lượng bán", "Doanh thu (đ)", "Tồn kho"];
      rows = salesRows.map((p, i) => [i + 1, p.maSP, p.tenSP, p.danhMuc, p.soLuongBan, p.doanhThu, p.soLuongTon]);
    } else {
      title = "Báo cáo khách hàng";
      summary = [
        ["Phân loại", custFilter.hang === "ALL" ? "Tất cả" : custFilter.hang === "NEW" ? "Khách mới" : custFilter.hang],
        ["Khách hàng mua hàng", s.buyingCustomers],
        ["Khách hàng mới", s.newCustomers],
        [`Khách quay lại (≥ ${data.thresholds.loyalMinOrders} đơn)`, s.returningCustomers],
        ["Khách VIP", s.vipCustomers],
      ];
      heading = "Danh sách khách hàng";
      columns = ["Hạng", "Khách hàng", "SĐT", "Số đơn", "Tổng chi tiêu (đ)", "Phân hạng", "Mua lần đầu", "Khách mới"];
      rows = customerRows.map((c, i) => [i + 1, c.hoTen, c.sdt, c.soDon, c.tongTien, c.hang, dateVN(c.donDauTien), c.khachMoi ? "Có" : ""]);
    }

    try {
      if (exportFormat === "pdf") {
        if (!printReport({ title, period: periodText, summary, tables: [{ heading, columns, rows }] })) {
          toast.error("Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép cửa sổ bật lên và thử lại!");
          return;
        }
        toast.success("Đã mở bản in. Chọn \"Lưu dưới dạng PDF\" để lưu file");
      } else {
        exportSheetsToExcel(
          [
            { name: "TongHop", data: [{ "Chỉ số": "Kỳ báo cáo", "Giá trị": periodText }, ...summary.map(([k, v]) => ({ "Chỉ số": k, "Giá trị": v }))] },
            { name: "ChiTiet", data: rows.map((r) => Object.fromEntries(columns.map((c, i) => [c, r[i]]))) },
          ],
          `BaoCao_${report}_FBShop`
        );
        toast.success("Đã xuất báo cáo ra Excel!");
      }
    } catch {
      // Bang 3.34 A3 - Loi xuat file
      toast.error("Xuất báo cáo thất bại. Vui lòng thử lại!");
    }
  };

  // ---------- giao dien ----------
  const DateRange = (
    <div className="flex flex-col gap-1">
      <span className={labelCls}>Từ ngày – Đến ngày</span>
      <div className="flex items-center gap-1.5">
        <input type="date" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} className={inputCls} title="Từ ngày" />
        <span className="text-xs text-slate-400">–</span>
        <input type="date" value={denNgay} onChange={(e) => setDenNgay(e.target.value)} className={inputCls} title="Đến ngày" />
      </div>
    </div>
  );

  const ApplyButton = ({ label = "Xem báo cáo" }: { label?: string }) => (
    <button onClick={applyFilters} className="self-end rounded-xl bg-[#f66315] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#e55000]">
      {label}
    </button>
  );

  const ExportBar = (
    <div className="ml-auto flex items-end gap-2">
      <div className="flex flex-col gap-1">
        <span className={labelCls}>Định dạng</span>
        <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as "excel" | "pdf")} className={inputCls}>
          <option value="excel">Excel (.xlsx)</option>
          <option value="pdf">PDF</option>
        </select>
      </div>
      <button
        onClick={handleExport}
        disabled={!data}
        className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        <Download className="h-4 w-4 text-slate-500" />
        Xuất báo cáo
      </button>
    </div>
  );

  const s = data?.summary;
  const current = REPORTS.find((r) => r.key === report);

  return (
    <div className="space-y-5">
      {/* Tieu de + chon bao cao */}
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
          <BarChart3 className="h-6 w-6 text-[#f66315]" />
          BÁO CÁO THỐNG KÊ
        </h2>
        <div className="mt-3 flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs">
          {[{ key: "overview" as Report, title: "Tổng quan", icon: LayoutGrid }, ...REPORTS].map((r) => (
            <button
              key={r.key}
              onClick={() => setReport(r.key)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                report === r.key ? "bg-[#f66315] text-white shadow-sm" : "text-slate-600 hover:bg-orange-50 hover:text-[#f66315]"
              }`}
            >
              <r.icon className="h-4 w-4" />
              {r.key === "overview" ? r.title : r.title.replace("Báo cáo ", "").replace(/^./, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Bo loc cua bao cao dang mo */}
      <Card className="!p-4">
        <div className="flex flex-wrap items-end gap-3">
          {report !== "inventory" && DateRange}

          {report === "inventory" && (
            <>
              <div className="flex flex-col gap-1">
                <span className={labelCls}>Danh mục sản phẩm</span>
                <select value={invDraft.danhMuc} onChange={(e) => setInvDraft({ ...invDraft, danhMuc: e.target.value })} className={inputCls}>
                  <option value="ALL">Tất cả danh mục</option>
                  {data?.categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className={labelCls}>Trạng thái tồn</span>
                <select value={invDraft.trangThai} onChange={(e) => setInvDraft({ ...invDraft, trangThai: e.target.value })} className={inputCls}>
                  <option value="ALL">Tất cả</option>
                  <option value="CANH_BAO">Cần nhập thêm (hết + sắp hết)</option>
                  <option value="Hết hàng">Hết hàng</option>
                  <option value="Sắp hết hàng">Sắp hết hàng (≤ {data?.thresholds.lowStock ?? 5})</option>
                  <option value="Tồn đọng">Tồn đọng (không bán được trên {data?.thresholds.slowMovingDays ?? 60} ngày)</option>
                  <option value="Bình thường">Bình thường</option>
                </select>
              </div>
            </>
          )}

          {report === "sales" && (
            <>
              <div className="flex flex-col gap-1">
                <span className={labelCls}>Tiêu chí</span>
                <select value={salesDraft.view} onChange={(e) => setSalesDraft({ ...salesDraft, view: e.target.value })} className={inputCls}>
                  <option value="best">Top bán chạy</option>
                  <option value="slow">Top bán chậm</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className={labelCls}>Số sản phẩm</span>
                <select value={salesDraft.top} onChange={(e) => setSalesDraft({ ...salesDraft, top: e.target.value })} className={inputCls}>
                  <option value="5">Top 5</option>
                  <option value="10">Top 10</option>
                  <option value="20">Top 20</option>
                  <option value="ALL">Tất cả</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className={labelCls}>Dòng sản phẩm</span>
                <select value={salesDraft.danhMuc} onChange={(e) => setSalesDraft({ ...salesDraft, danhMuc: e.target.value })} className={inputCls}>
                  <option value="ALL">Tất cả</option>
                  {data?.categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {report === "customers" && (
            <div className="flex flex-col gap-1">
              <span className={labelCls}>Phân loại khách hàng</span>
              <select value={custDraft.hang} onChange={(e) => setCustDraft({ hang: e.target.value })} className={inputCls}>
                <option value="ALL">Tất cả khách mua hàng</option>
                <option value="NEW">Khách hàng mới</option>
                <option value="VIP">VIP (chi tiêu ≥ {(data?.thresholds.vipSpending ?? 10_000_000).toLocaleString("vi-VN")} đ)</option>
                <option value="Thân thiết">Thân thiết (≥ {data?.thresholds.loyalMinOrders ?? 2} đơn)</option>
                <option value="Thường">Thường</option>
              </select>
            </div>
          )}

          <ApplyButton label={report === "inventory" ? "Thống kê" : "Xem báo cáo"} />
          {(tuNgay || denNgay) && report !== "inventory" && (
            <button
              onClick={() => {
                setTuNgay("");
                setDenNgay("");
                setRangeError("");
              }}
              className="self-end pb-1.5 text-xs font-semibold text-slate-500 hover:text-[#f66315]"
            >
              Bỏ lọc ngày
            </button>
          )}
          {report !== "overview" && ExportBar}
        </div>
        {rangeError && <p className="mt-2 text-xs font-semibold text-red-600">{rangeError}</p>}
        <p className="mt-2 text-[11px] text-slate-500">
          {report === "inventory"
            ? "Số liệu tồn kho theo thời gian thực (không phụ thuộc khoảng ngày)."
            : <>Kỳ báo cáo: <b>{periodText}</b>. Doanh thu chỉ tính đơn đã giao.</>}
        </p>
      </Card>

      {loading && !data && <Empty text="Đang tải báo cáo..." />}

      {/* ===== TONG QUAN ===== */}
      {data && s && report === "overview" && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label="Doanh thu" value={money(s.totalRevenue)} note={`Từ ${s.totalOrders} đơn đã giao`} tone="text-[#f66315]" />
            <Kpi label="Lợi nhuận gộp" value={money(s.grossProfit)} note={`Giá vốn ${money(s.totalCOGS)}`} tone={s.grossProfit < 0 ? "text-red-600" : "text-emerald-600"} />
            <Kpi label="Cần nhập thêm" value={`${s.lowStockCount} sản phẩm`} note={`${s.slowMovingCount} sản phẩm tồn đọng`} tone="text-red-600" />
            <Kpi label="Khách mua hàng" value={s.buyingCustomers} note={`${s.newCustomers} khách mới, ${s.vipCustomers} VIP`} />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {REPORTS.map((r) => (
              <button
                key={r.key}
                onClick={() => setReport(r.key)}
                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xs transition-all hover:border-[#f66315] hover:shadow-md"
              >
                <span className="rounded-xl bg-orange-50 p-3 text-[#f66315]">
                  <r.icon className="h-6 w-6" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold text-slate-900">{r.title}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{r.desc}</span>
                </span>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-[#f66315]" />
              </button>
            ))}
          </div>
        </>
      )}

      {/* ===== BANG 3.34 - LOI NHUAN & DOANH THU ===== */}
      {data && s && report === "revenue" && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label="Doanh thu" value={money(s.totalRevenue)} note={`Từ ${s.totalOrders} đơn đã giao`} tone="text-[#f66315]" />
            <Kpi label="Giá vốn hàng bán" value={money(s.totalCOGS)} note={s.productsWithoutCost ? `${s.productsWithoutCost} sản phẩm chưa có giá nhập` : "Theo giá nhập bình quân"} />
            <Kpi label="Lợi nhuận gộp" value={money(s.grossProfit)} note="Doanh thu − giá vốn" tone={s.grossProfit < 0 ? "text-red-600" : "text-emerald-600"} />
            <Kpi label="Chi phí nhập kho" value={money(s.totalImportCost)} note={`${s.pendingOrders} đơn đang xử lý, ${s.cancelledOrders} đơn hủy`} />
          </div>
          <Card>
            <SectionTitle icon={TrendingUp}>Doanh thu và lợi nhuận gộp theo {unitLabel.toLowerCase()}</SectionTitle>
            {!timelineHasData ? (
              <Empty />
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.revenueTimeline} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="ngay" stroke="#94a3b8" fontSize={11} tickFormatter={periodVN} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                    <Tooltip formatter={(v: any) => money(Number(v))} labelFormatter={(l: any) => periodVN(String(l))} />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                    <Line type="monotone" dataKey="doanhThu" name="Doanh thu" stroke="#f66315" strokeWidth={3} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="loiNhuan" name="Lợi nhuận gộp" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
          <Card className="!p-0 overflow-hidden">
            <div className="p-5 pb-0">
              <SectionTitle icon={BarChart3}>Bảng số liệu theo {unitLabel.toLowerCase()}</SectionTitle>
            </div>
            {(() => {
              const rows = data.revenueTimeline.filter((r) => r.soDon > 0);
              if (!rows.length) return <Empty />;
              return (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-y border-slate-100 bg-slate-50 font-bold text-slate-600">
                        <tr>
                          <th className="px-4 py-2">{unitLabel}</th>
                          <th className="px-4 py-2 text-right">Số đơn</th>
                          <th className="px-4 py-2 text-right">Doanh thu</th>
                          <th className="px-4 py-2 text-right">Giá vốn</th>
                          <th className="px-4 py-2 text-right">Lợi nhuận gộp</th>
                          <th className="px-4 py-2 text-right">Tỷ suất LN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((r) => (
                          <tr key={r.ngay}>
                            <td className="px-4 py-2 font-semibold">{periodVN(r.ngay)}</td>
                            <td className="px-4 py-2 text-right">{r.soDon}</td>
                            <td className="whitespace-nowrap px-4 py-2 text-right font-bold text-[#f66315]">{money(r.doanhThu)}</td>
                            <td className="whitespace-nowrap px-4 py-2 text-right">{money(r.giaVon)}</td>
                            <td className={`whitespace-nowrap px-4 py-2 text-right font-bold ${r.loiNhuan < 0 ? "text-red-600" : "text-emerald-600"}`}>{money(r.loiNhuan)}</td>
                            <td className="px-4 py-2 text-right">{r.doanhThu ? `${((r.loiNhuan / r.doanhThu) * 100).toFixed(1)}%` : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination page={page} pageSize={PAGE_SIZE} total={rows.length} unit={unitLabel.toLowerCase()} onChange={setPage} />
                </>
              );
            })()}
          </Card>
        </>
      )}

      {/* ===== BANG 3.35 - TON KHO & KHO HANG ===== */}
      {data && s && report === "inventory" && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label="Mặt hàng" value={inventoryRows.length} note={`Trên tổng ${s.totalProducts} sản phẩm đang bán`} />
            <Kpi label="Tổng tồn kho" value={inventoryRows.reduce((t, p) => t + p.soLuong, 0).toLocaleString("vi-VN")} note="Sản phẩm" />
            <Kpi label="Giá trị tồn kho" value={money(inventoryRows.reduce((t, p) => t + p.giaTriTon, 0))} note="Theo giá nhập bình quân" />
            <Kpi
              label="Cảnh báo"
              value={`${inventoryRows.filter((p) => p.trangThai === "Hết hàng" || p.trangThai === "Sắp hết hàng").length} cần nhập`}
              note={`${inventoryRows.filter((p) => p.trangThai === "Tồn đọng").length} sản phẩm tồn đọng`}
              tone="text-red-600"
            />
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Card className="!p-0 overflow-hidden lg:col-span-2">
              <div className="p-5 pb-0">
                <SectionTitle icon={Package}>Danh sách tồn kho</SectionTitle>
              </div>
              {!inventoryRows.length ? (
                <Empty />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-y border-slate-100 bg-slate-50 font-bold text-slate-600">
                        <tr>
                          <th className="px-4 py-2">Sản phẩm</th>
                          <th className="px-4 py-2">Danh mục</th>
                          <th className="px-4 py-2 text-right">Tồn</th>
                          <th className="px-4 py-2 text-right">Giá trị tồn</th>
                          <th className="px-4 py-2">Lần bán cuối</th>
                          <th className="px-4 py-2 text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {inventoryRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((p) => (
                          <tr key={p.maSP}>
                            <td className="px-4 py-2">
                              <p className="font-bold text-slate-800">{p.tenSP}</p>
                              <p className="font-mono text-[10px] text-slate-400">{p.maSP}</p>
                            </td>
                            <td className="px-4 py-2 text-slate-500">{p.danhMuc}</td>
                            <td className="px-4 py-2 text-right font-bold">{p.soLuong}</td>
                            <td className="whitespace-nowrap px-4 py-2 text-right">{money(p.giaTriTon)}</td>
                            <td className="px-4 py-2 text-slate-500">{dateVN(p.lanBanCuoi)}</td>
                            <td className="px-4 py-2 text-center">
                              <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold ${STOCK_BADGE[p.trangThai]}`}>{p.trangThai}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination page={page} pageSize={PAGE_SIZE} total={inventoryRows.length} unit="sản phẩm" onChange={setPage} />
                </>
              )}
            </Card>
            <Card>
              <SectionTitle icon={LayoutGrid}>Cơ cấu tồn kho theo danh mục</SectionTitle>
              {!stockPie.length ? (
                <Empty />
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stockPie} cx="50%" cy="45%" outerRadius={80} dataKey="value" nameKey="name" isAnimationActive={false}>
                        {stockPie.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => `${v} sản phẩm`} />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {/* ===== BANG 3.36 - BAN HANG & HIEU SUAT ===== */}
      {data && s && report === "sales" && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label="Số lượng bán" value={s.soldQuantity.toLocaleString("vi-VN")} note="Sản phẩm trong đơn đã giao" />
            <Kpi label="Doanh thu bán hàng" value={money(s.totalRevenue)} tone="text-[#f66315]" />
            <Kpi label="Mặt hàng có bán" value={data.sales.filter((p) => p.soLuongBan > 0).length} note={`Trên ${data.sales.length} sản phẩm`} />
            <Kpi label="Dòng bán tốt nhất" value={salesByCategory[0]?.danhMuc || "—"} note={salesByCategory[0] ? money(salesByCategory[0].doanhThu) : "Chưa có doanh số"} />
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            <Card className="!p-0 overflow-hidden lg:col-span-3">
              <div className="p-5 pb-0">
                <SectionTitle icon={Award}>{salesFilter.view === "best" ? "Xếp hạng sản phẩm bán chạy" : "Xếp hạng sản phẩm bán chậm"}</SectionTitle>
              </div>
              {!salesRows.length ? (
                <Empty />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-y border-slate-100 bg-slate-50 font-bold text-slate-600">
                        <tr>
                          <th className="px-4 py-2 text-center">Hạng</th>
                          <th className="px-4 py-2">Sản phẩm</th>
                          <th className="px-4 py-2">Dòng sản phẩm</th>
                          <th className="px-4 py-2 text-right">Đã bán</th>
                          <th className="px-4 py-2 text-right">Doanh thu</th>
                          <th className="px-4 py-2 text-right">Tồn</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {salesRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((p, i) => (
                          <tr key={p.maSP}>
                            <td className="px-4 py-2 text-center">
                              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white ${salesFilter.view === "best" ? "bg-[#f66315]" : "bg-slate-400"}`}>
                                {(page - 1) * PAGE_SIZE + i + 1}
                              </span>
                            </td>
                            <td className="px-4 py-2 font-bold text-slate-800">{p.tenSP}</td>
                            <td className="px-4 py-2 text-slate-500">{p.danhMuc}</td>
                            <td className="px-4 py-2 text-right font-bold">{p.soLuongBan}</td>
                            <td className="whitespace-nowrap px-4 py-2 text-right">{money(p.doanhThu)}</td>
                            <td className="px-4 py-2 text-right text-slate-500">{p.soLuongTon}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination page={page} pageSize={PAGE_SIZE} total={salesRows.length} unit="sản phẩm" onChange={setPage} />
                </>
              )}
            </Card>
            <Card className="lg:col-span-2">
              <SectionTitle icon={BarChart3}>Doanh thu theo dòng sản phẩm</SectionTitle>
              {!salesByCategory.length ? (
                <Empty />
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesByCategory} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                      <YAxis type="category" dataKey="danhMuc" stroke="#94a3b8" fontSize={10} width={110} />
                      <Tooltip formatter={(v: any) => money(Number(v))} />
                      <Bar dataKey="doanhThu" name="Doanh thu" fill="#f66315" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {/* ===== BANG 3.37 - KHACH HANG ===== */}
      {data && s && report === "customers" && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label="Khách mua hàng" value={s.buyingCustomers} note="Có đơn đã giao trong kỳ" />
            <Kpi label="Khách hàng mới" value={s.newCustomers} note="Mua lần đầu trong kỳ" tone="text-[#f66315]" />
            <Kpi label="Khách quay lại" value={s.returningCustomers} note={`Từ ${data.thresholds.loyalMinOrders} đơn trở lên`} />
            <Kpi label="Khách VIP" value={s.vipCustomers} note={`Chi tiêu ≥ ${money(data.thresholds.vipSpending)}`} tone="text-amber-600" />
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Card className="!p-0 overflow-hidden lg:col-span-2">
              <div className="p-5 pb-0">
                <SectionTitle icon={Users}>Danh sách khách hàng</SectionTitle>
              </div>
              {!customerRows.length ? (
                <Empty />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-y border-slate-100 bg-slate-50 font-bold text-slate-600">
                        <tr>
                          <th className="px-4 py-2">Khách hàng</th>
                          <th className="px-4 py-2 text-right">Số đơn</th>
                          <th className="px-4 py-2 text-right">Tổng chi tiêu</th>
                          <th className="px-4 py-2">Mua lần đầu</th>
                          <th className="px-4 py-2 text-center">Phân hạng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customerRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((c) => (
                          <tr key={c.maKH}>
                            <td className="px-4 py-2">
                              <p className="flex items-center gap-1.5 font-bold text-slate-800">
                                {c.hoTen}
                                {c.khachMoi && <span className="rounded bg-orange-100 px-1.5 py-px text-[9px] font-bold text-[#f66315]">Mới</span>}
                              </p>
                              <p className="text-[10px] text-slate-400">{c.sdt}</p>
                            </td>
                            <td className="px-4 py-2 text-right font-bold">{c.soDon}</td>
                            <td className="whitespace-nowrap px-4 py-2 text-right">{money(c.tongTien)}</td>
                            <td className="px-4 py-2 text-slate-500">{dateVN(c.donDauTien)}</td>
                            <td className="px-4 py-2 text-center">
                              <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${RANK_BADGE[c.hang]}`}>{c.hang}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination page={page} pageSize={PAGE_SIZE} total={customerRows.length} unit="khách hàng" onChange={setPage} />
                </>
              )}
            </Card>
            <Card>
              <SectionTitle icon={Users}>Cơ cấu theo phân hạng</SectionTitle>
              {!rankPie.length ? (
                <Empty />
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={rankPie} cx="50%" cy="45%" outerRadius={80} dataKey="value" nameKey="name" isAnimationActive={false}>
                        {rankPie.map((r, i) => (
                          <Cell key={r.name} fill={r.name === "VIP" ? "#f59e0b" : r.name === "Thân thiết" ? "#6366f1" : COLORS[(i + 6) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => `${v} khách`} />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {report !== "overview" && current && (
        <p className="text-center text-[11px] text-slate-400">
          {current.title} – {report === "inventory" ? "số liệu thời gian thực" : `kỳ ${periodText}`}
        </p>
      )}
    </div>
  );
}
