import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentCustomer } from "@/lib/auth";
import { VOUCHER_USED_ERROR, voucherLimitPerCustomer, voucherUsesByCustomer } from "@/lib/voucherUsage";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { maVoucher, tongTienHang } = body;

    if (!maVoucher || !maVoucher.trim()) {
      return NextResponse.json({ error: "Vui lòng nhập mã giảm giá" }, { status: 400 });
    }

    const voucher = await prisma.voucher.findUnique({
      where: { MaVoucher: maVoucher.trim() },
    });

    if (!voucher) {
      return NextResponse.json({ error: "Mã giảm giá không hợp lệ" }, { status: 400 });
    }

    // Kiem tra trang thai
    const statusNormalized = voucher.TrangThai.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (statusNormalized.includes("huy") || statusNormalized.includes("inactive") || statusNormalized.includes("khoa") || statusNormalized.includes("disabled")) {
      return NextResponse.json({ error: "Mã giảm giá đã hết hiệu lực" }, { status: 400 });
    }

    // Kiem tra han su dung
    const now = new Date();
    if (now < new Date(voucher.NgayBatDau)) {
      return NextResponse.json({ error: "Mã giảm giá chưa đến thời gian sử dụng" }, { status: 400 });
    }
    if (now > new Date(voucher.NgayKetThuc)) {
      return NextResponse.json({ error: "Mã giảm giá đã hết hạn sử dụng" }, { status: 400 });
    }

    // Kiem tra so luong
    if (voucher.TongSoLuong <= 0) {
      return NextResponse.json({ error: "Mã giảm giá đã hết lượt sử dụng" }, { status: 400 });
    }

    // Khach da dang nhap: bao som neu da dung ma nay (khi dat hang van kiem tra lai)
    const customer = await getCurrentCustomer();
    if (customer) {
      const uses = await voucherUsesByCustomer(prisma, customer.MaKH, voucher.MaVoucher);
      if (uses >= voucherLimitPerCustomer(voucher.GioiHanSuDung)) {
        return NextResponse.json({ error: VOUCHER_USED_ERROR }, { status: 400 });
      }
    }

    // Kiem tra don hang toi thieu
    const minOrder = Number(voucher.DonHangToiThieu);
    const subtotal = Number(tongTienHang) || 0;
    if (subtotal < minOrder) {
      return NextResponse.json(
        { error: `Đơn hàng tối thiểu ${minOrder.toLocaleString("vi-VN")}đ để áp dụng mã này` },
        { status: 400 }
      );
    }

    // Tinh tien giam
    let giamGia = 0;
    const giaTri = Number(voucher.GiaTriGiam);
    const mucGiamMax = Number(voucher.MucGiamToiDa);

    if (voucher.LoaiGiamGia.toUpperCase() === "TIEN") {
      giamGia = giaTri;
    } else if (voucher.LoaiGiamGia.toUpperCase() === "PHANTRAM") {
      giamGia = (subtotal * giaTri) / 100;
      if (mucGiamMax > 0 && giamGia > mucGiamMax) {
        giamGia = mucGiamMax;
      }
    }

    return NextResponse.json({
      success: true,
      voucher: {
        maVoucher: voucher.MaVoucher,
        loaiGiamGia: voucher.LoaiGiamGia,
        giaTriGiam: giaTri,
        mucGiamToiDa: mucGiamMax,
        donHangToiThieu: minOrder,
        giamGia,
      },
    });
  } catch (error: any) {
    console.error("Voucher check error:", error);
    return NextResponse.json({ error: "Lỗi kiểm tra mã giảm giá" }, { status: 500 });
  }
}