import type { Prisma, PrismaClient } from "@prisma/client";
import { ORDER_STATUS } from "@/lib/orderStatus";

// =======================================================
// GIOI HAN DUNG VOUCHER THEO TUNG KHACH (Voucher.GioiHanSuDung, mac dinh 1 lan / khach)
// Don da huy khong tinh: luot dung da duoc hoan lai khi huy.
// =======================================================

export const VOUCHER_USED_ERROR = "Bạn đã sử dụng mã giảm giá này rồi";

type Db = PrismaClient | Prisma.TransactionClient;

export function voucherUsesByCustomer(db: Db, maKH: string, maVoucher: string) {
  return db.donHang.count({
    where: { MaKH: maKH, MaVoucher: maVoucher, TrangThai: { notIn: [ORDER_STATUS.CANCELLED, "Cancelled"] } },
  });
}

export const voucherLimitPerCustomer = (gioiHanSuDung: number) => Math.max(1, gioiHanSuDung || 1);
