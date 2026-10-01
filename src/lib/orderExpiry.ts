import prisma from "@/lib/db";
import { ORDER_STATUS } from "@/lib/orderStatus";
import { restoreOrderResources } from "@/lib/orderRestore";

// =======================================================
// DON CHUYEN KHOAN QUA HAN THANH TOAN
// Don "Cho thanh toan" giu hang trong kho; qua PAYMENT_TIMEOUT_HOURS ma khach chua thanh toan
// thi tu dong huy va hoan tra ton kho (tranh giu hang vo thoi han).
// Don khach da bam "Toi da chuyen khoan" KHONG tu huy: nhan vien doi soat sao ke roi xac nhan / huy.
// =======================================================

export const PAYMENT_TIMEOUT_HOURS = 24;

export const paymentDeadline = (createdAt: Date) =>
  new Date(createdAt.getTime() + PAYMENT_TIMEOUT_HOURS * 3600_000);

export async function cancelExpiredUnpaidOrders(maKH?: string) {
  const cutoff = new Date(Date.now() - PAYMENT_TIMEOUT_HOURS * 3600_000);
  const expired = await prisma.donHang.findMany({
    where: {
      TrangThai: ORDER_STATUS.WAITING_PAYMENT,
      NgayBaoChuyenKhoan: null,
      NgayTao: { lt: cutoff },
      ...(maKH && { MaKH: maKH }),
    },
    include: { ChiTietDonHangs: true },
  });

  for (const order of expired) {
    await prisma.$transaction(async (tx) => {
      // Khoa trang thai: neu admin vua xac nhan nhan tien thi bo qua don nay
      const locked = await tx.donHang.updateMany({
        where: { MaDH: order.MaDH, TrangThai: ORDER_STATUS.WAITING_PAYMENT, NgayBaoChuyenKhoan: null },
        data: {
          TrangThai: ORDER_STATUS.CANCELLED,
          GhiChu: `[Tự động hủy: quá hạn thanh toán ${PAYMENT_TIMEOUT_HOURS}h] ${order.GhiChu || ""}`.trim().slice(0, 500),
        },
      });
      if (locked.count === 0) return;
      await restoreOrderResources(tx, order);
    });
  }
  return expired.length;
}
