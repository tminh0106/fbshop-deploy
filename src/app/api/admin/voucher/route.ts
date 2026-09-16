import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET: Danh sach voucher
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword")?.trim();

    const where: any = {};
    if (keyword) {
      where.OR = [
        { MaVoucher: { contains: keyword } },
        { LoaiGiamGia: { contains: keyword } },
      ];
    }

    const vouchers = await prisma.voucher.findMany({
      where,
      include: {
        _count: {
          select: { DonHangs: true },
        },
      },
      orderBy: { NgayBatDau: "desc" },
    });

    return NextResponse.json({ success: true, data: vouchers });
  } catch (error: any) {
    console.error("GET voucher error:", error);
    return NextResponse.json({ error: "Lỗi tải danh sách voucher" }, { status: 500 });
  }
}

// POST: Them voucher moi
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      maVoucher,
      loaiGiamGia,
      giaTriGiam,
      donHangToiThieu,
      mucGiamToiDa,
      tongSoLuong,
      gioiHanSuDung,
      ngayBatDau,
      ngayKetThuc,
    } = body;

    if (!maVoucher || !loaiGiamGia || !giaTriGiam || !ngayBatDau || !ngayKetThuc) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ thông tin bắt buộc của Voucher" },
        { status: 400 }
      );
    }

    const existing = await prisma.voucher.findUnique({
      where: { MaVoucher: maVoucher.trim().toUpperCase() },
    });
    if (existing) {
      return NextResponse.json({ error: "Mã voucher này đã tồn tại" }, { status: 409 });
    }

    const newVoucher = await prisma.voucher.create({
      data: {
        MaVoucher: maVoucher.trim().toUpperCase(),
        LoaiGiamGia: loaiGiamGia,
        GiaTriGiam: Number(giaTriGiam),
        DonHangToiThieu: Number(donHangToiThieu) || 0,
        MucGiamToiDa: Number(mucGiamToiDa) || 0,
        TongSoLuong: Number(tongSoLuong) || 100,
        GioiHanSuDung: Number(gioiHanSuDung) || 1,
        NgayBatDau: new Date(ngayBatDau),
        NgayKetThuc: new Date(ngayKetThuc),
        TrangThai: "Active",
      },
    });

    return NextResponse.json({ success: true, data: newVoucher });
  } catch (error: any) {
    console.error("POST voucher error:", error);
    return NextResponse.json({ error: "Lỗi tạo voucher mới" }, { status: 500 });
  }
}

// PUT: Cap nhat voucher (Bao toan ke toan)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      maVoucher,
      loaiGiamGia,
      giaTriGiam,
      donHangToiThieu,
      mucGiamToiDa,
      tongSoLuong,
      ngayBatDau,
      ngayKetThuc,
      trangThai,
    } = body;

    if (!maVoucher) {
      return NextResponse.json({ error: "Thiếu mã voucher" }, { status: 400 });
    }

    // Kiem tra so luot da su dung trong DonHang
    const usedCount = await prisma.donHang.count({
      where: { MaVoucher: maVoucher },
    });

    let updateData: any = {};

    if (usedCount > 0) {
      // DA CO DON HANG DUNG -> Khoa dinh gia, chi cho sua ngay ket thuc, tong so luong bo sung va trang thai
      if (ngayKetThuc) updateData.NgayKetThuc = new Date(ngayKetThuc);
      if (tongSoLuong !== undefined) updateData.TongSoLuong = Number(tongSoLuong);
      if (trangThai) updateData.TrangThai = trangThai;
    } else {
      // CHUA CO DON HANG DUNG -> Cho sua toan dien
      if (loaiGiamGia) updateData.LoaiGiamGia = loaiGiamGia;
      if (giaTriGiam !== undefined) updateData.GiaTriGiam = Number(giaTriGiam);
      if (donHangToiThieu !== undefined) updateData.DonHangToiThieu = Number(donHangToiThieu);
      if (mucGiamToiDa !== undefined) updateData.MucGiamToiDa = Number(mucGiamToiDa);
      if (tongSoLuong !== undefined) updateData.TongSoLuong = Number(tongSoLuong);
      if (ngayBatDau) updateData.NgayBatDau = new Date(ngayBatDau);
      if (ngayKetThuc) updateData.NgayKetThuc = new Date(ngayKetThuc);
      if (trangThai) updateData.TrangThai = trangThai;
    }

    const updated = await prisma.voucher.update({
      where: { MaVoucher: maVoucher },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      usedCount,
      lockedPrice: usedCount > 0,
      data: updated,
      message:
        usedCount > 0
          ? "Voucher đã có lượt sử dụng. Định giá được khóa bảo toàn kế toán, chỉ cập nhật thời hạn/số lượng."
          : "Cập nhật voucher thành công.",
    });
  } catch (error: any) {
    console.error("PUT voucher error:", error);
    return NextResponse.json({ error: "Lỗi cập nhật voucher" }, { status: 500 });
  }
}

// DELETE: Vo hieu hoa hoac xoa voucher
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const maVoucher = searchParams.get("maVoucher");

    if (!maVoucher) {
      return NextResponse.json({ error: "Thiếu mã voucher cần xóa" }, { status: 400 });
    }

    const usedCount = await prisma.donHang.count({
      where: { MaVoucher: maVoucher },
    });

    if (usedCount > 0) {
      // Vo hieu hoa thay vi xoa
      await prisma.voucher.update({
        where: { MaVoucher: maVoucher },
        data: { TrangThai: "Disabled" },
      });

      return NextResponse.json({
        success: true,
        softDeleted: true,
        message: "Voucher đã có lịch sử đơn hàng. Đã chuyển trạng thái sang 'Vô hiệu hóa'.",
      });
    }

    await prisma.voucher.delete({
      where: { MaVoucher: maVoucher },
    });

    return NextResponse.json({
      success: true,
      softDeleted: false,
      message: "Đã xóa voucher thành công.",
    });
  } catch (error: any) {
    console.error("DELETE voucher error:", error);
    return NextResponse.json({ error: "Lỗi khi xóa voucher" }, { status: 500 });
  }
}
