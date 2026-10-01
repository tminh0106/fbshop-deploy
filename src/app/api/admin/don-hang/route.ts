import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { requireFeature } from "@/lib/auth";
import { checkKeyword } from "@/lib/validation";
import { cancelExpiredUnpaidOrders } from "@/lib/orderExpiry";

// GET: Danh sach don hang
export async function GET(request: Request) {
  try {
    const auth = await requireFeature("donHang");
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword")?.trim();
    const trangThai = searchParams.get("trangThai");
    const tuNgay = searchParams.get("tuNgay");
    const denNgay = searchParams.get("denNgay");

    // Bang 3.10 A2 - tu khoa khong hop le
    const keywordError = checkKeyword(keyword);
    if (keywordError) return NextResponse.json({ error: keywordError }, { status: 400 });
    if (tuNgay && denNgay && tuNgay > denNgay) {
      return NextResponse.json({ error: "Khoảng thời gian tìm kiếm không hợp lệ" }, { status: 400 });
    }

    // Don chuyen khoan qua han thanh toan -> tu huy, tra hang ve kho
    await cancelExpiredUnpaidOrders();

    const where: Prisma.DonHangWhereInput = {};

    if (trangThai && trangThai !== "ALL") {
      where.TrangThai = trangThai;
    }

    // Loc theo ngay gio Viet Nam (UTC+7)
    if (tuNgay || denNgay) {
      where.NgayTao = {
        ...(tuNgay && { gte: new Date(`${tuNgay}T00:00:00.000+07:00`) }),
        ...(denNgay && { lte: new Date(`${denNgay}T23:59:59.999+07:00`) }),
      };
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
  } catch (error) {
    console.error("GET don-hang error:", error);
    return NextResponse.json({ error: "Lỗi tải danh sách đơn hàng" }, { status: 500 });
  }
}
