import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireFeature } from "@/lib/auth";

// =======================================================
// BAO CAO THONG KE - Bang 3.34 -> 3.37 (FR-30 -> FR-34)
// - Doanh thu chi ghi nhan don "Da giao" (NFR-01: sau khi don ban le hoan tat)
// - Loi nhuan gop = Doanh thu - Gia von hang ban (FR-30)
//   Gia von 1 san pham = don gia nhap binh quan gia quyen tu cac phieu NHAP chua huy
// - Ngay tinh theo gio Viet Nam (UTC+7)
// =======================================================

const ORDER_DONE = "Da giao";
const ORDER_CANCELLED = "Da huy";
const INVOICE_CANCELLED = "Da huy";
const LOW_STOCK_THRESHOLD = 5;
const STOPPED_TAG = "[NGỪNG KINH DOANH]";
// Phan hang khach (FR-33): VIP theo tong chi tieu, than thiet theo so lan quay lai mua
const VIP_SPENDING = 10_000_000;
const LOYAL_MIN_ORDERS = 2;
// Khoang ngay dai hon muc nay thi gom bieu do theo thang
const MAX_DAILY_POINTS = 62;

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Ngay (YYYY-MM-DD) theo gio Viet Nam cua 1 thoi diem
const vnDay = (d: Date) => new Date(d.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
const isValidDate = (s: string) => DATE_RE.test(s) && !Number.isNaN(new Date(`${s}T00:00:00+07:00`).getTime());

export async function GET(request: Request) {
  try {
    const auth = await requireFeature("thongKe");
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const tuNgay = searchParams.get("tuNgay") || "";
    const denNgay = searchParams.get("denNgay") || "";

    // A2 - Sai logic thoi gian
    if ((tuNgay && !isValidDate(tuNgay)) || (denNgay && !isValidDate(denNgay))) {
      return NextResponse.json({ error: "Ngày không hợp lệ" }, { status: 400 });
    }
    if (tuNgay && denNgay && tuNgay > denNgay) {
      return NextResponse.json({ error: "Khoảng thời gian tìm kiếm không hợp lệ" }, { status: 400 });
    }

    // Bien khoang thoi gian theo gio Viet Nam
    const from = tuNgay ? new Date(`${tuNgay}T00:00:00.000+07:00`) : undefined;
    const to = denNgay ? new Date(`${denNgay}T23:59:59.999+07:00`) : undefined;
    const range = from || to ? { ...(from && { gte: from }), ...(to && { lte: to }) } : undefined;

    const [orders, importInvoicesInRange, importDetails, allProducts] = await Promise.all([
      prisma.donHang.findMany({
        where: range ? { NgayTao: range } : {},
        include: { ChiTietDonHangs: true, KhachHang: true },
        orderBy: { NgayTao: "asc" },
      }),
      prisma.hoaDonKho.findMany({
        where: { LoaiPhieu: "NHAP", TrangThai: { not: INVOICE_CANCELLED }, ...(range && { NgayLap: range }) },
        select: { TongTien: true },
      }),
      // Gia von: lay tu moi phieu nhap chua huy (khong gioi han theo ky bao cao)
      prisma.chiTietHoaDonKho.findMany({
        where: { HoaDonKho: { LoaiPhieu: "NHAP", TrangThai: { not: INVOICE_CANCELLED } } },
        select: { MaSP: true, SoLuong: true, ThanhTien: true },
      }),
      prisma.sanPham.findMany({ include: { DanhMuc: true } }),
    ]);

    // ---- Gia von binh quan gia quyen theo san pham ----
    const costAgg = new Map<string, { qty: number; amount: number }>();
    for (const d of importDetails) {
      const a = costAgg.get(d.MaSP) || { qty: 0, amount: 0 };
      a.qty += d.SoLuong;
      a.amount += Number(d.ThanhTien);
      costAgg.set(d.MaSP, a);
    }
    const unitCost = (maSP: string): number | null => {
      const a = costAgg.get(maSP);
      return a && a.qty > 0 ? a.amount / a.qty : null;
    };

    // ---- Phan loai don hang ----
    const completed = orders.filter((o) => o.TrangThai === ORDER_DONE);
    const pending = orders.filter((o) => o.TrangThai !== ORDER_DONE && o.TrangThai !== ORDER_CANCELLED);
    const cancelledCount = orders.filter((o) => o.TrangThai === ORDER_CANCELLED).length;

    // ---- 1. Doanh thu & loi nhuan gop (Bang 3.34) ----
    const productsWithoutCost = new Set<string>();
    const orderCogs = (o: (typeof completed)[number]) =>
      o.ChiTietDonHangs.reduce((sum, ct) => {
        const c = unitCost(ct.MaSP);
        if (c === null) {
          productsWithoutCost.add(ct.MaSP);
          return sum;
        }
        return sum + c * ct.SoLuong;
      }, 0);

    let totalRevenue = 0;
    let totalCOGS = 0;
    const byPeriod = new Map<string, { doanhThu: number; giaVon: number }>();

    // Chon do chia truc thoi gian: theo ngay, hoac theo thang neu khoang qua dai
    const endDay = denNgay || vnDay(new Date());
    // Khong chon "Tu ngay": bat dau tu don da giao dau tien, chua co don thi lay 7 ngay truoc moc ket thuc
    const startDay =
      tuNgay ||
      (completed[0]
        ? vnDay(completed[0].NgayTao)
        : new Date(Date.parse(endDay) - 6 * DAY_MS).toISOString().slice(0, 10));
    const spanDays = Math.round((Date.parse(endDay) - Date.parse(startDay)) / DAY_MS) + 1;
    const byMonth = spanDays > MAX_DAILY_POINTS;
    const keyOf = (day: string) => (byMonth ? day.slice(0, 7) : day);

    for (const o of completed) {
      const revenue = Number(o.TongTien);
      const cogs = orderCogs(o);
      totalRevenue += revenue;
      totalCOGS += cogs;
      const k = keyOf(vnDay(o.NgayTao));
      const p = byPeriod.get(k) || { doanhThu: 0, giaVon: 0 };
      p.doanhThu += revenue;
      p.giaVon += cogs;
      byPeriod.set(k, p);
    }

    // Dien du cac moc thoi gian (ke ca ngay/thang khong co don) de bieu do khong bi noi tat
    const revenueTimeline: { ngay: string; doanhThu: number; loiNhuan: number }[] = [];
    const seen = new Set<string>();
    for (let t = Date.parse(startDay); t <= Date.parse(endDay); t += DAY_MS) {
      const k = keyOf(new Date(t).toISOString().slice(0, 10));
      if (seen.has(k)) continue;
      seen.add(k);
      const p = byPeriod.get(k) || { doanhThu: 0, giaVon: 0 };
      revenueTimeline.push({ ngay: k, doanhThu: p.doanhThu, loiNhuan: Math.round(p.doanhThu - p.giaVon) });
    }

    const totalImportCost = importInvoicesInRange.reduce((s, inv) => s + Number(inv.TongTien), 0);
    const grossProfit = Math.round(totalRevenue - totalCOGS);

    // ---- 2. Ton kho (Bang 3.35) - bo qua san pham ngung kinh doanh ----
    const activeProducts = allProducts.filter((p) => !p.MoTa?.includes(STOPPED_TAG));
    const lowStockProducts = activeProducts
      .filter((p) => p.SoLuong <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.SoLuong - b.SoLuong)
      .map((p) => ({
        maSP: p.MaSP,
        tenSP: p.TenSP,
        soLuong: p.SoLuong,
        giaBan: Number(p.GiaBan),
        danhMuc: p.DanhMuc?.TenDanhMuc || "Chưa phân loại",
        mucDoCanhBao: p.SoLuong === 0 ? "Hết hàng" : "Sắp hết hàng",
      }));

    const stockByCategory = new Map<string, number>();
    for (const p of activeProducts) {
      const cat = p.DanhMuc?.TenDanhMuc || "Khác";
      stockByCategory.set(cat, (stockByCategory.get(cat) || 0) + p.SoLuong);
    }
    const stockPieData = [...stockByCategory]
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));

    // ---- 3. Hieu suat ban hang (Bang 3.36) - tinh tren don da giao ----
    const sales = new Map<string, { soLuongBan: number; doanhThu: number }>();
    for (const o of completed) {
      for (const ct of o.ChiTietDonHangs) {
        const s = sales.get(ct.MaSP) || { soLuongBan: 0, doanhThu: 0 };
        s.soLuongBan += ct.SoLuong;
        s.doanhThu += Number(ct.ThanhTien);
        sales.set(ct.MaSP, s);
      }
    }
    const nameOf = new Map(allProducts.map((p) => [p.MaSP, p.TenSP]));

    const topBestSellers = [...sales]
      .map(([maSP, s]) => ({ maSP, tenSP: nameOf.get(maSP) || maSP, ...s }))
      .sort((a, b) => b.soLuongBan - a.soLuongBan || b.doanhThu - a.doanhThu)
      .slice(0, 5);

    // Ban cham: ban it nhat trong ky, cung muc thi uu tien ton nhieu hon (dong von lau)
    const sortedSlowMoving = activeProducts
      .map((p) => ({
        maSP: p.MaSP,
        tenSP: p.TenSP,
        soLuongTon: p.SoLuong,
        soLuongBan: sales.get(p.MaSP)?.soLuongBan || 0,
      }))
      .sort((a, b) => a.soLuongBan - b.soLuongBan || b.soLuongTon - a.soLuongTon)
      .slice(0, 5);

    // ---- 4. Khach hang (Bang 3.37) - tan suat mua va phan hang ----
    const customers = new Map<string, { hoTen: string; sdt: string; soDon: number; tongTien: number }>();
    for (const o of completed) {
      const kh = o.KhachHang;
      if (!kh) continue;
      const c = customers.get(kh.MaKH) || { hoTen: kh.HoTen, sdt: kh.SoDienThoai, soDon: 0, tongTien: 0 };
      c.soDon += 1;
      c.tongTien += Number(o.TongTien);
      customers.set(kh.MaKH, c);
    }
    const rank = (c: { soDon: number; tongTien: number }) =>
      c.tongTien >= VIP_SPENDING ? "VIP" : c.soDon >= LOYAL_MIN_ORDERS ? "Thân thiết" : "Thường";

    const allCustomers = [...customers.values()];
    const topCustomers = allCustomers
      .sort((a, b) => b.tongTien - a.tongTien)
      .slice(0, 5)
      .map((c) => ({ ...c, hang: rank(c) }));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalCOGS: Math.round(totalCOGS),
          grossProfit,
          totalImportCost,
          totalOrders: completed.length,
          pendingOrders: pending.length,
          pendingValue: pending.reduce((s, o) => s + Number(o.TongTien), 0),
          cancelledOrders: cancelledCount,
          productsWithoutCost: productsWithoutCost.size,
          totalProducts: activeProducts.length,
          lowStockCount: lowStockProducts.length,
          buyingCustomers: allCustomers.length,
          returningCustomers: allCustomers.filter((c) => c.soDon >= LOYAL_MIN_ORDERS).length,
          vipCustomers: allCustomers.filter((c) => c.tongTien >= VIP_SPENDING).length,
        },
        timelineUnit: byMonth ? "month" : "day",
        revenueTimeline,
        stockPieData,
        lowStockProducts,
        topBestSellers,
        sortedSlowMoving,
        topCustomers,
      },
    });
  } catch (error) {
    console.error("GET thong-ke error:", error);
    return NextResponse.json({ error: "Lỗi tính toán dữ liệu thống kê" }, { status: 500 });
  }
}
