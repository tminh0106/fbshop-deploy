import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentCustomer } from "@/lib/auth";
import { ORDER_STATUS, canCustomerCancel } from "@/lib/orderStatus";
import { cancelExpiredUnpaidOrders, paymentDeadline } from "@/lib/orderExpiry";

// ==========================================
// GET /api/don-hang/[maDH]: thong tin 1 don cua chinh khach dang dang nhap
// Trang thanh toan QR lay so tien tu day (khong tin so tien tren URL)
// ==========================================
export async function GET(_request: Request, { params }: { params: Promise<{ maDH: string }> }) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });

    const { maDH } = await params;
    await cancelExpiredUnpaidOrders(customer.MaKH);

    const order = await prisma.donHang.findFirst({ where: { MaDH: maDH, MaKH: customer.MaKH } });
    if (!order) return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });

    return NextResponse.json({
      order: {
        maDH: order.MaDH,
        ngayTao: order.NgayTao,
        trangThai: order.TrangThai,
        tongTien: Number(order.TongTien),
        phuongThucThanhToan: order.PhuongThucThanhToan,
        trangThaiThanhToan: order.TrangThaiThanhToan,
        ngayThanhToan: order.NgayThanhToan,
        ngayBaoChuyenKhoan: order.NgayBaoChuyenKhoan,
        coTheHuy: canCustomerCancel(order),
        hanThanhToan: order.TrangThai === ORDER_STATUS.WAITING_PAYMENT ? paymentDeadline(order.NgayTao) : null,
      },
    });
  } catch (error) {
    console.error("GET /api/don-hang/[maDH] error:", error);
    return NextResponse.json({ error: "Lỗi tải đơn hàng" }, { status: 500 });
  }
}
