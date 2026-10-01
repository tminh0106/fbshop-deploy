import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireFeature } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { ORDER_STATUS, ORDER_TRANSITIONS, PAYMENT_STATUS, orderStatusLabel } from "@/lib/orderStatus";
import { restoreOrderResources } from "@/lib/orderRestore";

// =======================================================
// CAP NHAT TRANG THAI DON HANG - Bang 3.8 / FR-11
// Cho xac nhan -> Dang xu ly -> Dang giao -> Da giao; huy duoc truoc khi giao.
// Huy don -> hoan tra ton kho va luot dung voucher (FR-13).
// Trang thai thanh toan di kem (Bang 3.48):
// - Cho thanh toan -> Cho xac nhan = nhan vien da doi soat, xac nhan NHAN DUOC TIEN chuyen khoan
// - Don COD giao thanh cong (Da giao) = da thu tien
// - Huy don da thanh toan -> Cho hoan tien
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

    const data: Prisma.DonHangUpdateManyMutationInput = { TrangThai: next };
    const paid = order.TrangThaiThanhToan === PAYMENT_STATUS.PAID;
    if (current === ORDER_STATUS.WAITING_PAYMENT && next === ORDER_STATUS.PENDING) {
      data.TrangThaiThanhToan = PAYMENT_STATUS.PAID;
      data.NgayThanhToan = new Date();
    } else if (next === ORDER_STATUS.DONE && !paid) {
      data.TrangThaiThanhToan = PAYMENT_STATUS.PAID;
      data.NgayThanhToan = new Date();
    } else if (next === ORDER_STATUS.CANCELLED && paid) {
      data.TrangThaiThanhToan = PAYMENT_STATUS.REFUND_PENDING;
    }

    await prisma.$transaction(async (tx) => {
      // Chi cap nhat neu trang thai van la trang thai vua doc (tranh 2 nguoi huy cung luc -> hoan kho 2 lan)
      const changed = await tx.donHang.updateMany({
        where: { MaDH: maDH, TrangThai: order.TrangThai },
        data,
      });
      if (changed.count === 0) throw new ConflictError();

      if (next === ORDER_STATUS.CANCELLED) await restoreOrderResources(tx, order);
    });

    return NextResponse.json({
      success: true,
      message:
        next === ORDER_STATUS.CANCELLED
          ? paid
            ? "Đã hủy đơn hàng, hoàn trả tồn kho. Đơn đã thanh toán nên chuyển sang Chờ hoàn tiền"
            : "Đã hủy đơn hàng và hoàn trả tồn kho"
          : current === ORDER_STATUS.WAITING_PAYMENT
          ? "Đã xác nhận nhận tiền chuyển khoản. Đơn chuyển sang Chờ xác nhận"
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
