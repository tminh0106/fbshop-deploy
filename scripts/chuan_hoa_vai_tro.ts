// =======================================================
// CHUAN HOA TEN VAI TRO TRONG BANG TaiKhoan THEO TAI LIEU DAC TA
// FR-03 / NFR-03 / Tu dien du lieu: PhanQuyen = Admin | NhanVienKho | BanHang
//   QuanLyKho -> NhanVienKho
//   NhanVien  -> BanHang
// Code van nhan ten cu (src/lib/permissions.ts) nen chay lai nhieu lan khong sao.
// Chay: npx tsx scripts/chuan_hoa_vai_tro.ts
// =======================================================
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DOI_TEN: [cu: string, moi: string][] = [
  ["QuanLyKho", "NhanVienKho"],
  ["NhanVien", "BanHang"],
];

async function main() {
  for (const [cu, moi] of DOI_TEN) {
    const r = await prisma.taiKhoan.updateMany({ where: { PhanQuyen: cu }, data: { PhanQuyen: moi } });
    console.log(`  ${cu.padEnd(10)} -> ${moi.padEnd(12)} ${r.count} tai khoan`);
  }
  const all = await prisma.taiKhoan.findMany({ select: { TenDangNhap: true, PhanQuyen: true } });
  console.log("Hien tai:");
  for (const t of all) console.log(`  ${t.TenDangNhap.padEnd(20)} ${t.PhanQuyen}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
