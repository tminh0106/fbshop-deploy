import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET: Danh sach don hang
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword")?.trim();
    const trangThai = searchParams.get("trangThai");
    const tuNgay = searchParams.get("tuNgay");
    const denNgay = searchParams.get("denNgay");

    const where: any = {};

    if (trangThai && trangThai !== "ALL") {
      where.TrangThai = trangThai;
    }

    if (tuNgay || denNgay) {
      where.NgayTao = {};
      if (tuNgay) where.NgayTao.gte = new Date(`${tuNgay}T00:00:00.000Z`);
      if (denNgay) where.NgayTao.lte = new Date(`${denNgay}T23:59:59.999Z`);
    }

    if (keyword) {
      where.OR = [
        { MaDH: { contains: keyword } },
        { TenNguoiNhan: { contains: keyword } },
        { SdtNguoiNhan: { contains: keyword } },
      ];
    }

    const orders = await prisma.donHang.findMany({
      where,
      include: {
        KhachHang: {
          select: { MaKH: true, HoTen: true, SoDienThoai: true, Email: true },
        },
        Voucher: true,
        ChiTietDonHangs: {
          include: {
            SanPham: {
              select: { MaSP: true, TenSP: true, HinhAnh: true, GiaBan: true },
            },
          },
        },
      },
      orderBy: { NgayTao: "desc" },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    console.error("GET don-hang error:", error);
    return NextResponse.json({ error: "Lỗi tải danh sách đơn hàng" }, { status: 500 });
  }
}
