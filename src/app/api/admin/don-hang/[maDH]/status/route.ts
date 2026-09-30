import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireFeature } from "@/lib/auth";
import { ORDER_STATUS, ORDER_TRANSITIONS, orderStatusLabel } from "@/lib/orderStatus";

// =======================================================
// CAP NHAT TRANG THAI DON HANG - Bang 3.8 / FR-11
// Cho xac nhan -> Dang xu ly -> Dang giao -> Da giao; huy duoc truoc khi giao.
// Huy don -> hoan tra ton kho (FR-13).
// =======================================================

// Ten trang thai tieng Anh cu -> ma chuan
const LEGACY: Record<string, string> = {
  Pending: ORDER_STATUS.PENDING,
  Processing: ORDER_STATUS.PROCESSING,
  Shipping: ORDER_STATUS.SHIPPING,
  Completed: ORDER_STATUS.DONE,
  Cancelled: ORDER_STATUS.CANCELLED,
};
const normalize = (s: string) => LEGACY[s] || s;

class ConflictError extends Error {}

export async function PUT(request: Request, { params }: { params: Promise<{ maDH: string }> }) {
  try {
    const auth = await requireFeature("donHang");
    if (!auth.ok) return auth.response;

    const { maDH } = await params;
    const { trangThai } = await request.json();
    if (!trangThai) return NextResponse.json({ error: "Vui lòng chọn trạng thái mới" }, { status: 400 });

    const order = await prisma.donHang.findUnique({ where: { MaDH: maDH }, include: { ChiTietDonHangs: true } });
    if (!order) return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });

    const current = normalize(order.TrangThai);
    const next = normalize(trangThai);

    // A1 - Chuyen sai quy trinh (nhay coc, sua don da giao / da huy...)
    if (!(ORDER_TRANSITIONS[current] || []).includes(next as never)) {
      return NextResponse.json(
        {
          error: `Luồng chuyển trạng thái không hợp lệ: không thể chuyển từ "${orderStatusLabel(current)}" sang "${orderStatusLabel(next)}".`,
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Chi cap nhat neu trang thai van la trang thai vua doc (tranh 2 nguoi huy cung luc -> hoan kho 2 lan)
      const changed = await tx.donHang.updateMany({
        where: { MaDH: maDH, TrangThai: order.TrangThai },
        data: { TrangThai: next },
      });
      if (changed.count === 0) throw new ConflictError();

      if (next === ORDER_STATUS.CANCELLED) {
        for (const item of order.ChiTietDonHangs) {
          await tx.sanPham.update({ where: { MaSP: item.MaSP }, data: { SoLuong: { increment: item.SoLuong } } });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message:
        next === ORDER_STATUS.CANCELLED
          ? "Đã hủy đơn hàng và hoàn trả tồn kho"
          : `Cập nhật trạng thái đơn hàng thành công: ${orderStatusLabel(next)}`,
    });
  } catch (error) {
    if (error instanceof ConflictError) {
      return NextResponse.json(
        { error: "Đơn hàng vừa được người khác cập nhật. Vui lòng tải lại danh sách." },
        { status: 409 }
      );
    }
    console.error("PUT order status error:", error);
    return NextResponse.json({ error: "Lỗi cập nhật trạng thái đơn hàng" }, { status: 500 });
  }
}
