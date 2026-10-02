import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireFeature } from "@/lib/auth";
import { PAYMENT_STATUS } from "@/lib/orderStatus";

// =======================================================
// XAC NHAN DA HOAN TIEN - don da thanh toan bi huy (Cho hoan tien -> Da hoan tien)
// =======================================================
export async function POST(_request: Request, { params }: { params: Promise<{ maDH: string }> }) {
  try {
    const auth = await requireFeature("donHang");
    if (!auth.ok) return auth.response;

    const { maDH } = await params;
    const done = await prisma.donHang.updateMany({
      where: { MaDH: maDH, TrangThaiThanhToan: PAYMENT_STATUS.REFUND_PENDING },
      data: { TrangThaiThanhToan: PAYMENT_STATUS.REFUNDED },
    });
    if (done.count === 0) {
      const exists = await prisma.donHang.findUnique({ where: { MaDH: maDH }, select: { MaDH: true } });
      if (!exists) return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
      return NextResponse.json({ error: "Đơn hàng không ở trạng thái Chờ hoàn tiền" }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: "Đã xác nhận hoàn tiền cho khách hàng" });
  } catch (error) {
    console.error("POST hoan-tien error:", error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau" }, { status: 500 });
  }
}
