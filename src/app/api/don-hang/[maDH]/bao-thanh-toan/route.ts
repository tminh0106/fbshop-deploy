import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentCustomer } from "@/lib/auth";
import { ORDER_STATUS } from "@/lib/orderStatus";
import { cancelExpiredUnpaidOrders } from "@/lib/orderExpiry";

// =======================================================
// KHACH BAO "TOI DA CHUYEN KHOAN" (Bang 3.48)
// He thong chua tich hop cong thanh toan -> khong tu xac nhan duoc giao dich.
// Chi ghi nhan thoi diem khach bao de nhan vien doi soat sao ke; don khong con bi tu huy khi qua han.
// =======================================================
export async function POST(_request: Request, { params }: { params: Promise<{ maDH: string }> }) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });

    const { maDH } = await params;
    await cancelExpiredUnpaidOrders(customer.MaKH);

    const order = await prisma.donHang.findFirst({ where: { MaDH: maDH, MaKH: customer.MaKH } });
    if (!order) return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
    if (order.TrangThai !== ORDER_STATUS.WAITING_PAYMENT) {
      return NextResponse.json(
        { error: order.TrangThai === ORDER_STATUS.CANCELLED ? "Thanh toán thất bại: đơn hàng đã bị hủy hoặc hết hạn thanh toán" : "Đơn hàng không ở trạng thái chờ thanh toán" },
        { status: 400 }
      );
    }

    if (!order.NgayBaoChuyenKhoan) {
      await prisma.donHang.updateMany({
        where: { MaDH: maDH, TrangThai: ORDER_STATUS.WAITING_PAYMENT, NgayBaoChuyenKhoan: null },
        data: { NgayBaoChuyenKhoan: new Date() },
      });
    }
    return NextResponse.json({
      success: true,
      message: "Đã ghi nhận. FBShop sẽ đối soát giao dịch và xác nhận đơn hàng trong thời gian sớm nhất",
    });
  } catch (error) {
    console.error("POST bao-thanh-toan error:", error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau" }, { status: 500 });
  }
}
