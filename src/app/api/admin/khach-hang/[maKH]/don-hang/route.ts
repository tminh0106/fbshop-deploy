import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireFeature } from "@/lib/auth";

// =======================================================
// LICH SU MUA HANG CUA 1 KHACH (Bang 3.3 - xem chi tiet khach hang)
// Toan bo don hang kem san pham da mua; chi tai khi mo hop thoai lich su
// =======================================================
export async function GET(_request: Request, { params }: { params: Promise<{ maKH: string }> }) {
  try {
    const auth = await requireFeature("khachHang");
    if (!auth.ok) return auth.response;

    const { maKH } = await params;
    const customer = await prisma.khachHang.findUnique({ where: { MaKH: maKH }, select: { MaKH: true } });
    if (!customer) return NextResponse.json({ error: "Khách hàng không tồn tại" }, { status: 404 });

    const orders = await prisma.donHang.findMany({
      where: { MaKH: maKH },
      orderBy: { NgayTao: "desc" },
      include: {
        ChiTietDonHangs: {
          include: { SanPham: { select: { MaSP: true, TenSP: true, HinhAnh: true } } },
        },
      },
    });

    return NextResponse.json({
      success: true,
      orders: orders.map((o) => ({
        maDH: o.MaDH,
        ngayTao: o.NgayTao,
        trangThai: o.TrangThai,
        trangThaiThanhToan: o.TrangThaiThanhToan,
        phuongThucThanhToan: o.PhuongThucThanhToan,
        tongTien: Number(o.TongTien),
        maVoucher: o.MaVoucher,
        diaChiNhan: o.DiaChiNhan,
        sanPham: o.ChiTietDonHangs.map((ct) => ({
          maSP: ct.MaSP,
          tenSP: ct.SanPham?.TenSP || ct.MaSP,
          hinhAnh: ct.SanPham?.HinhAnh || "/images/placeholder.png",
          soLuong: ct.SoLuong,
          donGia: Number(ct.DonGia),
          thanhTien: Number(ct.ThanhTien),
        })),
      })),
    });
  } catch (error) {
    console.error("GET khach-hang don-hang error:", error);
    return NextResponse.json({ error: "Lỗi tải lịch sử mua hàng" }, { status: 500 });
  }
}
