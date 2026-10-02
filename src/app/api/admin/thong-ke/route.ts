import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireFeature } from "@/lib/auth";

// =======================================================
// BAO CAO THONG KE - Bang 3.34 -> 3.37 (FR-30 -> FR-34)
// - Doanh thu chi ghi nhan don "Da giao" (NFR-01: sau khi don ban le hoan tat)
// - Loi nhuan gop = Doanh thu - Gia von hang ban (FR-30)
//   Gia von 1 san pham = don gia nhap binh quan gia quyen tu cac phieu NHAP chua huy
// - Ton kho la so lieu thoi gian thuc, khong phu thuoc khoang ngay (Bang 3.35)
// - Ngay tinh theo gio Viet Nam (UTC+7)
// Tra du lieu chi tiet; trang bao cao loc theo danh muc / trang thai ton / top / phan hang.
// =======================================================

const ORDER_DONE = "Da giao";
const ORDER_CANCELLED = "Da huy";
const INVOICE_CANCELLED = "Da huy";
const STOPPED_TAG = "[NGỪNG KINH DOANH]";
// Ton kho (FR-31): sap het khi con <= 5; ton dong khi con hang ma khong ban duoc trong 60 ngay gan nhat
const LOW_STOCK_THRESHOLD = 5;
const SLOW_MOVING_DAYS = 60;
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
    const inRange = (d: Date) => (!from || d >= from) && (!to || d <= to);

    const [orders, allDone, importInvoicesInRange, importDetails, allProducts, categories] = await Promise.all([
      prisma.donHang.findMany({
        where: range ? { NgayTao: range } : {},
        include: { ChiTietDonHangs: true, KhachHang: true },
        orderBy: { NgayTao: "asc" },
      }),
      // Toan bo don da giao (khong gioi han ky): lan ban cuoi cua san pham, don dau tien cua khach
      prisma.donHang.findMany({
        where: { TrangThai: ORDER_DONE },
        select: { MaKH: true, NgayTao: true, ChiTietDonHangs: { select: { MaSP: true } } },
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
      prisma.sanPham.findMany({ include: { DanhMuc: true }, orderBy: { MaSP: "asc" } }),
      prisma.danhMuc.findMany({ orderBy: { TenDanhMuc: "asc" } }),
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

    // ---- Phan loai don hang trong ky ----
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
    const byPeriod = new Map<string, { soDon: number; doanhThu: number; giaVon: number }>();

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
      const p = byPeriod.get(k) || { soDon: 0, doanhThu: 0, giaVon: 0 };
      p.soDon += 1;
      p.doanhThu += revenue;
      p.giaVon += cogs;
      byPeriod.set(k, p);
    }

    // Dien du cac moc thoi gian (ke ca ngay/thang khong co don) de bieu do khong bi noi tat
    const revenueTimeline: { ngay: string; soDon: number; doanhThu: number; giaVon: number; loiNhuan: number }[] = [];
    const seen = new Set<string>();
    for (let t = Date.parse(startDay); t <= Date.parse(endDay); t += DAY_MS) {
      const k = keyOf(new Date(t).toISOString().slice(0, 10));
      if (seen.has(k)) continue;
      seen.add(k);
      const p = byPeriod.get(k) || { soDon: 0, doanhThu: 0, giaVon: 0 };
      revenueTimeline.push({
        ngay: k,
        soDon: p.soDon,
        doanhThu: p.doanhThu,
        giaVon: Math.round(p.giaVon),
        loiNhuan: Math.round(p.doanhThu - p.giaVon),
      });
    }

    const totalImportCost = importInvoicesInRange.reduce((s, inv) => s + Number(inv.TongTien), 0);
    const grossProfit = Math.round(totalRevenue - totalCOGS);

    // ---- 2. Ton kho & kho hang (Bang 3.35) - thoi gian thuc, bo qua san pham ngung kinh doanh ----
    const lastSold = new Map<string, Date>();
    for (const o of allDone) {
      for (const ct of o.ChiTietDonHangs) {
        const prev = lastSold.get(ct.MaSP);
        if (!prev || o.NgayTao > prev) lastSold.set(ct.MaSP, o.NgayTao);
      }
    }
    const now = Date.now();
    const activeProducts = allProducts.filter((p) => !p.MoTa?.includes(STOPPED_TAG));
    const inventory = activeProducts.map((p) => {
      const sold = lastSold.get(p.MaSP) || null;
      const daysIdle = sold ? Math.floor((now - sold.getTime()) / DAY_MS) : null;
      const trangThai =
        p.SoLuong === 0
          ? "Hết hàng"
          : p.SoLuong <= LOW_STOCK_THRESHOLD
          ? "Sắp hết hàng"
          : daysIdle === null || daysIdle > SLOW_MOVING_DAYS
          ? "Tồn đọng"
          : "Bình thường";
      const cost = unitCost(p.MaSP);
      return {
        maSP: p.MaSP,
        tenSP: p.TenSP,
        maDanhMuc: p.MaDanhMuc,
        danhMuc: p.DanhMuc?.TenDanhMuc || "Chưa phân loại",
        soLuong: p.SoLuong,
        giaBan: Number(p.GiaBan),
        // Gia tri ton theo gia von (chua co gia nhap thi tam tinh theo gia ban)
        giaTriTon: Math.round(p.SoLuong * (cost ?? Number(p.GiaBan))),
        lanBanCuoi: sold ? sold.toISOString() : null,
        soNgayChuaBan: daysIdle,
        trangThai,
      };
    });
    const lowStockProducts = inventory
      .filter((p) => p.soLuong <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.soLuong - b.soLuong);

    // ---- 3. Ban hang & hieu suat san pham (Bang 3.36) - tinh tren don da giao trong ky ----
    const sales = new Map<string, { soLuongBan: number; doanhThu: number }>();
    for (const o of completed) {
      for (const ct of o.ChiTietDonHangs) {
        const s = sales.get(ct.MaSP) || { soLuongBan: 0, doanhThu: 0 };
        s.soLuongBan += ct.SoLuong;
        s.doanhThu += Number(ct.ThanhTien);
        sales.set(ct.MaSP, s);
      }
    }
    const productById = new Map(allProducts.map((p) => [p.MaSP, p]));
    // Moi san pham dang kinh doanh + san pham da ngung nhung co ban trong ky
    const salesRows = allProducts
      .filter((p) => !p.MoTa?.includes(STOPPED_TAG) || sales.has(p.MaSP))
      .map((p) => ({
        maSP: p.MaSP,
        tenSP: p.TenSP,
        maDanhMuc: p.MaDanhMuc,
        danhMuc: p.DanhMuc?.TenDanhMuc || "Chưa phân loại",
        soLuongBan: sales.get(p.MaSP)?.soLuongBan || 0,
        doanhThu: sales.get(p.MaSP)?.doanhThu || 0,
        soLuongTon: p.SoLuong,
      }));
    for (const [maSP, s] of sales) {
      if (!productById.has(maSP)) {
        salesRows.push({ maSP, tenSP: maSP, maDanhMuc: "", danhMuc: "Chưa phân loại", ...s, soLuongTon: 0 });
      }
    }

    // ---- 4. Khach hang (Bang 3.37) - khach moi, tan suat mua va phan hang ----
    // Khach moi = khach co don da giao DAU TIEN nam trong ky bao cao
    const firstOrder = new Map<string, Date>();
    for (const o of allDone) {
      const prev = firstOrder.get(o.MaKH);
      if (!prev || o.NgayTao < prev) firstOrder.set(o.MaKH, o.NgayTao);
    }
    const customers = new Map<string, { maKH: string; hoTen: string; sdt: string; soDon: number; tongTien: number }>();
    for (const o of completed) {
      const kh = o.KhachHang;
      if (!kh) continue;
      const c = customers.get(kh.MaKH) || { maKH: kh.MaKH, hoTen: kh.HoTen, sdt: kh.SoDienThoai, soDon: 0, tongTien: 0 };
      c.soDon += 1;
      c.tongTien += Number(o.TongTien);
      customers.set(kh.MaKH, c);
    }
    const rank = (c: { soDon: number; tongTien: number }) =>
      c.tongTien >= VIP_SPENDING ? "VIP" : c.soDon >= LOYAL_MIN_ORDERS ? "Thân thiết" : "Thường";
    const customerRows = [...customers.values()]
      .map((c) => {
        const first = firstOrder.get(c.maKH);
        return {
          ...c,
          hang: rank(c),
          donDauTien: first ? first.toISOString() : null,
          khachMoi: !!first && inRange(first),
        };
      })
      .sort((a, b) => b.tongTien - a.tongTien);

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
          totalStock: inventory.reduce((s, p) => s + p.soLuong, 0),
          stockValue: inventory.reduce((s, p) => s + p.giaTriTon, 0),
          lowStockCount: lowStockProducts.length,
          slowMovingCount: inventory.filter((p) => p.trangThai === "Tồn đọng").length,
          soldQuantity: [...sales.values()].reduce((s, x) => s + x.soLuongBan, 0),
          buyingCustomers: customerRows.length,
          newCustomers: customerRows.filter((c) => c.khachMoi).length,
          returningCustomers: customerRows.filter((c) => c.soDon >= LOYAL_MIN_ORDERS).length,
          vipCustomers: customerRows.filter((c) => c.hang === "VIP").length,
        },
        thresholds: {
          lowStock: LOW_STOCK_THRESHOLD,
          slowMovingDays: SLOW_MOVING_DAYS,
          vipSpending: VIP_SPENDING,
          loyalMinOrders: LOYAL_MIN_ORDERS,
        },
        categories: categories.map((c) => ({ id: c.MaDanhMuc, name: c.TenDanhMuc })),
        timelineUnit: byMonth ? "month" : "day",
        revenueTimeline,
        inventory,
        lowStockProducts,
        sales: salesRows,
        customers: customerRows,
      },
    });
  } catch (error) {
    console.error("GET thong-ke error:", error);
    return NextResponse.json({ error: "Lỗi tính toán dữ liệu thống kê" }, { status: 500 });
  }
}
