import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword")?.trim();
    const viTriKho = searchParams.get("viTriKho");

    const where: any = {};
    if (viTriKho && viTriKho !== "ALL") {
      where.ViTriKho = viTriKho;
    }
    if (keyword) {
      where.OR = [
        { MaHangHoa: { contains: keyword } },
        { MaSP: { contains: keyword } },
        { SanPham: { TenSP: { contains: keyword } } },
      ];
    }

    const items = await prisma.hangHoaKho.findMany({
      where,
      include: {
        SanPham: {
          include: { DanhMuc: true },
        },
      },
      orderBy: { NgayNhap: "desc" },
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    console.error("GET hang-hoa-kho error:", error);
    return NextResponse.json({ error: "Lỗi tải dữ liệu tồn kho" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { maHangHoa, viTriKho, soLuong, ghiChu } = body;

    if (!maHangHoa) {
      return NextResponse.json({ error: "Thiếu mã hàng hóa" }, { status: 400 });
    }

    const updated = await prisma.hangHoaKho.update({
      where: { MaHangHoa: maHangHoa },
      data: {
        ViTriKho: viTriKho || undefined,
        SoLuong: soLuong !== undefined ? Number(soLuong) : undefined,
        GhiChu: ghiChu || undefined,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT hang-hoa-kho error:", error);
    return NextResponse.json({ error: "Lỗi cập nhật hàng hóa kho" }, { status: 500 });
  }
}
