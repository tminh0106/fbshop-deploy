import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentCustomer } from "@/lib/auth";
import { ORDER_STATUS, PAYMENT_STATUS, canCustomerCancel } from "@/lib/orderStatus";
import { restoreOrderResources } from "@/lib/orderRestore";

// =======================================================
// KHACH HANG TU HUY DON (Bang 3.49 bo sung)
// Duoc huy khi: chua thanh toan VA (dang cho thanh toan & chua bao chuyen khoan, hoac dang cho xac nhan)
// Huy -> hoan tra ton kho va luot dung voucher. Don da thanh toan / shop da xu ly: lien he cua hang.
// =======================================================

const MAX_REASON = 300;

export async function POST(request: Request, { params }: { params: Promise<{ maDH: string }> }) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });

    const { maDH } = await params;
    const { lyDo } = await request.json().catch(() => ({ lyDo: "" }));
    const reason = typeof lyDo === "string" ? lyDo.trim() : "";
    if (!reason) return NextResponse.json({ error: "Vui lòng chọn lý do hủy đơn" }, { status: 400 });
    if (reason.length > MAX_REASON) {
      return NextResponse.json({ error: `Lý do hủy tối đa ${MAX_REASON} ký tự` }, { status: 400 });
    }

    const order = await prisma.donHang.findFirst({
      where: { MaDH: maDH, MaKH: customer.MaKH },
      include: { ChiTietDonHangs: true },
    });
    if (!order) return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
    if (!canCustomerCancel(order)) {
      return NextResponse.json(
        { error: "Đơn hàng đã được xử lý hoặc đã thanh toán, vui lòng liên hệ hotline 0123.456.789 để được hỗ trợ hủy" },
        { status: 400 }
      );
    }

    const cancelled = await prisma.$transaction(async (tx) => {
      // Khoa theo trang thai vua doc: neu shop vua xac nhan / xu ly thi khong huy
      const locked = await tx.donHang.updateMany({
        where: {
          MaDH: maDH,
          TrangThai: order.TrangThai,
          TrangThaiThanhToan: PAYMENT_STATUS.UNPAID,
          NgayBaoChuyenKhoan: order.NgayBaoChuyenKhoan,
        },
        data: {
          TrangThai: ORDER_STATUS.CANCELLED,
          GhiChu: `[Khách hủy: ${reason}] ${order.GhiChu || ""}`.trim().slice(0, 500),
        },
      });
      if (locked.count === 0) return false;
      await restoreOrderResources(tx, order);
      return true;
    });

    if (!cancelled) {
      return NextResponse.json({ error: "Đơn hàng vừa được cửa hàng cập nhật, vui lòng tải lại trang" }, { status: 409 });
    }
    return NextResponse.json({ success: true, message: "Đã hủy đơn hàng thành công" });
  } catch (error) {
    console.error("POST huy don error:", error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau" }, { status: 500 });
  }
}
