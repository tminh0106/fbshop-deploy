import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireFeature } from "@/lib/auth";
import { ORDER_STATUS, ORDER_UNDELETABLE } from "@/lib/orderStatus";

// =======================================================
// XOA DON HANG - Bang 3.9 / FR-13
// Chan xoa don dang giao / da giao (A2). Don chua huy -> hoan tra ton kho truoc khi xoa
// (don da huy thi ton kho da duoc hoan luc huy, khong cong lai lan nua).
// =======================================================

const LEGACY_UNDELETABLE = ["Shipping", "Completed"];

export async function DELETE(_request: Request, { params }: { params: Promise<{ maDH: string }> }) {
  try {
    const auth = await requireFeature("donHang");
    if (!auth.ok) return auth.response;

    const { maDH } = await params;
    const order = await prisma.donHang.findUnique({ where: { MaDH: maDH }, include: { ChiTietDonHangs: true } });
    if (!order) return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });

    if (ORDER_UNDELETABLE.includes(order.TrangThai) || LEGACY_UNDELETABLE.includes(order.TrangThai)) {
      return NextResponse.json(
        { error: "Không thể xóa đơn hàng đang trong quá trình vận chuyển hoặc đã hoàn thành" },
        { status: 400 }
      );
    }

    const restoreStock = order.TrangThai !== ORDER_STATUS.CANCELLED && order.TrangThai !== "Cancelled";

    await prisma.$transaction(async (tx) => {
      if (restoreStock) {
        for (const item of order.ChiTietDonHangs) {
          await tx.sanPham.update({ where: { MaSP: item.MaSP }, data: { SoLuong: { increment: item.SoLuong } } });
        }
      }
      await tx.chiTietDonHang.deleteMany({ where: { MaDH: maDH } });
      await tx.donHang.delete({ where: { MaDH: maDH } });
    });

    return NextResponse.json({
      success: true,
      message: restoreStock ? "Xóa đơn hàng thành công, đã hoàn trả tồn kho" : "Xóa đơn hàng thành công",
    });
  } catch (error) {
    console.error("DELETE order error:", error);
    return NextResponse.json({ error: "Lỗi khi xóa đơn hàng" }, { status: 500 });
  }
}
