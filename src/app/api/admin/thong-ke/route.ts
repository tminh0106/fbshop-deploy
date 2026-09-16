import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tuNgay = searchParams.get("tuNgay");
    const denNgay = searchParams.get("denNgay");

    const orderWhere: any = {
      TrangThai: { not: "Da huy" },
    };
    const importWhere: any = {
      LoaiPhieu: "NHAP",
      TrangThai: { not: "Da huy" },
    };

    if (tuNgay || denNgay) {
      orderWhere.NgayTao = {};
      importWhere.NgayLap = {};
      if (tuNgay) {
        orderWhere.NgayTao.gte = new Date(`${tuNgay}T00:00:00.000Z`);
        importWhere.NgayLap.gte = new Date(`${tuNgay}T00:00:00.000Z`);
      }
      if (denNgay) {
        orderWhere.NgayTao.lte = new Date(`${denNgay}T23:59:59.999Z`);
        importWhere.NgayLap.lte = new Date(`${denNgay}T23:59:59.999Z`);
      }
    }

    // 1. Doanh thu tu DonHang
    const orders = await prisma.donHang.findMany({
      where: orderWhere,
      include: {
        ChiTietDonHangs: true,
        KhachHang: true,
      },
      orderBy: { NgayTao: "asc" },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.TongTien), 0);

    // Group doanh thu theo ngay
    const revenueByDayMap = new Map<string, number>();
    orders.forEach((o) => {
      const day = new Date(o.NgayTao).toISOString().slice(0, 10);
      revenueByDayMap.set(day, (revenueByDayMap.get(day) || 0) + Number(o.TongTien));
    });

    // Neu khong co don hang hoac it hon 7 ngay, tao du lieu mac dinh tu 7 ngay gan nhat
    const revenueTimeline: { ngay: string; doanhThu: number; loiNhuan: number }[] = [];
    if (revenueByDayMap.size === 0) {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().slice(0, 10);
        revenueTimeline.push({
          ngay: dayStr,
          doanhThu: 0,
          loiNhuan: 0,
        });
      }
    } else {
      revenueByDayMap.forEach((val, key) => {
        revenueTimeline.push({
          ngay: key,
          doanhThu: val,
          loiNhuan: Math.round(val * 0.25), // Loi nhuan uoc tinh ~25%
        });
      });
    }

    // 2. Chi phi nhap hang tu HoaDonKho
    const importInvoices = await prisma.hoaDonKho.findMany({
      where: importWhere,
    });
    const totalImportCost = importInvoices.reduce((sum, inv) => sum + Number(inv.TongTien), 0);
    const estimatedProfit = totalRevenue - totalImportCost;

    // 3. Ton kho & Canh bao hang sap het (<= 5 cay)
    const allProducts = await prisma.sanPham.findMany({
      include: { DanhMuc: true },
    });

    const lowStockProducts = allProducts
      .filter((p) => p.SoLuong <= 5)
      .map((p) => ({
        maSP: p.MaSP,
        tenSP: p.TenSP,
        soLuong: p.SoLuong,
        giaBan: Number(p.GiaBan),
        danhMuc: p.DanhMuc?.TenDanhMuc || "Chưa phân loại",
        mucDoCanhBao: p.SoLuong === 0 ? "Hết hàng" : "Sắp hết hàng",
      }));

    // Co cau ton kho theo hang
    const stockByCategoryMap = new Map<string, number>();
    allProducts.forEach((p) => {
      const cat = p.DanhMuc?.TenDanhMuc || "Khác";
      stockByCategoryMap.set(cat, (stockByCategoryMap.get(cat) || 0) + p.SoLuong);
    });
    const stockPieData: { name: string; value: number }[] = [];
    stockByCategoryMap.forEach((val, key) => {
      stockPieData.push({ name: key, value: val });
    });

    // 4. Hieu suat ban hang (Top ban chay)
    const productSalesMap = new Map<string, { tenSP: string; soLuongBan: number; doanhThu: number }>();
    orders.forEach((o) => {
      o.ChiTietDonHangs.forEach((ct) => {
        const prev = productSalesMap.get(ct.MaSP) || {
          tenSP: ct.MaSP,
          soLuongBan: 0,
          doanhThu: 0,
        };
        prev.soLuongBan += ct.SoLuong;
        prev.doanhThu += Number(ct.ThanhTien);
        productSalesMap.set(ct.MaSP, prev);
      });
    });

    // Bo sung ten san pham
    allProducts.forEach((p) => {
      if (productSalesMap.has(p.MaSP)) {
        productSalesMap.get(p.MaSP)!.tenSP = p.TenSP;
      }
    });

    const sortedBestSellers = Array.from(productSalesMap.values()).sort(
      (a, b) => b.soLuongBan - a.soLuongBan
    );
    const topBestSellers = sortedBestSellers.slice(0, 5);

    // San pham ban cham / ton nhieu nhat
    const sortedSlowMoving = [...allProducts]
      .sort((a, b) => b.SoLuong - a.SoLuong)
      .slice(0, 5)
      .map((p) => ({
        maSP: p.MaSP,
        tenSP: p.TenSP,
        soLuongTon: p.SoLuong,
        soLuongBan: productSalesMap.get(p.MaSP)?.soLuongBan || 0,
      }));

    // 5. Thong ke khach hang VIP
    const customerMap = new Map<string, { hoTen: string; sdt: string; soDon: number; tongTien: number }>();
    orders.forEach((o) => {
      const kh = o.KhachHang;
      if (!kh) return;
      const prev = customerMap.get(kh.MaKH) || {
        hoTen: kh.HoTen,
        sdt: kh.SoDienThoai,
        soDon: 0,
        tongTien: 0,
      };
      prev.soDon += 1;
      prev.tongTien += Number(o.TongTien);
      customerMap.set(kh.MaKH, prev);
    });

    const topCustomers = Array.from(customerMap.values())
      .sort((a, b) => b.tongTien - a.tongTien)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalImportCost,
          estimatedProfit,
          totalOrders: orders.length,
          totalProducts: allProducts.length,
          lowStockCount: lowStockProducts.length,
        },
        revenueTimeline,
        stockPieData,
        lowStockProducts,
        topBestSellers,
        sortedSlowMoving,
        topCustomers,
      },
    });
  } catch (error: any) {
    console.error("GET thong-ke error:", error);
    return NextResponse.json({ error: "Lỗi tính toán dữ liệu thống kê" }, { status: 500 });
  }
}
