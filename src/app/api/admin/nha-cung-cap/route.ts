import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET: Danh sach nha cung cap
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword")?.trim();

    const where: any = {};
    if (keyword) {
      where.OR = [
        { MaNCC: { contains: keyword } },
        { TenNCC: { contains: keyword } },
        { SoDienThoai: { contains: keyword } },
      ];
    }

    const suppliers = await prisma.nhaCungCap.findMany({
      where,
      include: {
        _count: {
          select: { HoaDonKhos: true },
        },
      },
      orderBy: { MaNCC: "asc" },
    });

    return NextResponse.json({ success: true, data: suppliers });
  } catch (error: any) {
    console.error("GET nha-cung-cap error:", error);
    return NextResponse.json({ error: "Lỗi tải danh sách nhà cung cấp" }, { status: 500 });
  }
}

// POST: Them nha cung cap
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { maNCC, tenNCC, soDienThoai, diaChi, email, maSoThue, nguoiDaiDien, ghiChu } = body;

    if (!tenNCC || !soDienThoai) {
      return NextResponse.json(
        { error: "Vui lòng nhập tên nhà cung cấp và số điện thoại" },
        { status: 400 }
      );
    }

    let code = maNCC?.trim();
    if (!code) {
      const count = await prisma.nhaCungCap.count();
      code = `NCC${String(count + 1).padStart(3, "0")}`;
    }

    const newNCC = await prisma.nhaCungCap.create({
      data: {
        MaNCC: code,
        TenNCC: tenNCC.trim(),
        SoDienThoai: soDienThoai.trim(),
        DiaChi: diaChi?.trim() || null,
        Email: email?.trim() || null,
        MaSoThue: maSoThue?.trim() || null,
        NguoiDaiDien: nguoiDaiDien?.trim() || null,
        GhiChu: ghiChu?.trim() || null,
        TrangThai: "Active",
      },
    });

    return NextResponse.json({ success: true, data: newNCC });
  } catch (error: any) {
    console.error("POST nha-cung-cap error:", error);
    return NextResponse.json({ error: "Lỗi thêm nhà cung cấp mới" }, { status: 500 });
  }
}

// PUT: Cap nhat nha cung cap
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { maNCC, tenNCC, soDienThoai, diaChi, email, maSoThue, nguoiDaiDien, ghiChu, trangThai } = body;

    if (!maNCC) {
      return NextResponse.json({ error: "Thiếu mã nhà cung cấp" }, { status: 400 });
    }

    const updated = await prisma.nhaCungCap.update({
      where: { MaNCC: maNCC },
      data: {
        TenNCC: tenNCC?.trim(),
        SoDienThoai: soDienThoai?.trim(),
        DiaChi: diaChi?.trim() || null,
        Email: email?.trim() || null,
        MaSoThue: maSoThue?.trim() || null,
        NguoiDaiDien: nguoiDaiDien?.trim() || null,
        GhiChu: ghiChu?.trim() || null,
        TrangThai: trangThai || undefined,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT nha-cung-cap error:", error);
    return NextResponse.json({ error: "Lỗi cập nhật nhà cung cấp" }, { status: 500 });
  }
}

// DELETE: Xoa mem NCC
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const maNCC = searchParams.get("maNCC");

    if (!maNCC) {
      return NextResponse.json({ error: "Thiếu mã nhà cung cấp cần xóa" }, { status: 400 });
    }

    // Kiem tra rang buoc hoa don kho
    const invoiceCount = await prisma.hoaDonKho.count({
      where: { MaNCC: maNCC },
    });

    if (invoiceCount > 0) {
      // Chuyen trang thai sang Ngung hop tac (xoa mem)
      await prisma.nhaCungCap.update({
        where: { MaNCC: maNCC },
        data: { TrangThai: "Ngung hop tac" },
      });

      return NextResponse.json({
        success: true,
        softDeleted: true,
        message: "Nhà cung cấp đã có hóa đơn kho liên kết. Đã chuyển trạng thái sang 'Ngừng hợp tác'.",
      });
    }

    await prisma.nhaCungCap.delete({
      where: { MaNCC: maNCC },
    });

    return NextResponse.json({
      success: true,
      softDeleted: false,
      message: "Đã xóa nhà cung cấp thành công.",
    });
  } catch (error: any) {
    console.error("DELETE nha-cung-cap error:", error);
    return NextResponse.json({ error: "Lỗi khi xóa nhà cung cấp" }, { status: 500 });
  }
}
