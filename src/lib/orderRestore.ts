import type { Prisma } from "@prisma/client";

// =======================================================
// HOAN TRA KHI HUY / XOA DON CHUA HUY
// Dung chung cho: nhan vien huy don, khach tu huy, tu huy don qua han, xoa don chua huy.
// - Cong tra so luong tung san pham ve kho
// - Tra lai 1 luot dung voucher (don da tru 1 luot luc dat hang)
// Goi ben trong transaction, SAU khi da khoa trang thai don (tranh hoan tra 2 lan).
// =======================================================

export async function restoreOrderResources(
  tx: Prisma.TransactionClient,
  order: { MaVoucher: string | null; ChiTietDonHangs: { MaSP: string; SoLuong: number }[] }
) {
  for (const item of order.ChiTietDonHangs) {
    await tx.sanPham.update({ where: { MaSP: item.MaSP }, data: { SoLuong: { increment: item.SoLuong } } });
  }
  if (order.MaVoucher) {
    await tx.voucher.update({ where: { MaVoucher: order.MaVoucher }, data: { TongSoLuong: { increment: 1 } } });
  }
}
