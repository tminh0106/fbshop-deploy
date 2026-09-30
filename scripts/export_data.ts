// =======================================================
// XUAT TOAN BO DU LIEU 12 BANG RA FILE JSON
// Dung de chuyen du lieu sang CSDL khac (vd: SQL Server -> MySQL)
// Chay: npx tsx scripts/export_data.ts
// =======================================================
import { writeFileSync, mkdirSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const OUT_FILE = "database/export/fbshop_data.json";

async function main() {
  // Thu tu bang theo khoa ngoai: bang cha truoc, bang con sau
  const data = {
    KhachHang: await prisma.khachHang.findMany(),
    NhanVien: await prisma.nhanVien.findMany(),
    TaiKhoan: await prisma.taiKhoan.findMany(),
    NhaCungCap: await prisma.nhaCungCap.findMany(),
    Voucher: await prisma.voucher.findMany(),
    DanhMuc: await prisma.danhMuc.findMany(),
    SanPham: await prisma.sanPham.findMany(),
    DonHang: await prisma.donHang.findMany(),
    ChiTietDonHang: await prisma.chiTietDonHang.findMany(),
    HangHoaKho: await prisma.hangHoaKho.findMany(),
    HoaDonKho: await prisma.hoaDonKho.findMany(),
    ChiTietHoaDonKho: await prisma.chiTietHoaDonKho.findMany(),
  };

  mkdirSync("database/export", { recursive: true });
  // Decimal -> chuoi, DateTime -> chuoi ISO (Prisma nhan lai duoc ca hai khi nhap)
  writeFileSync(OUT_FILE, JSON.stringify(data, null, 2), "utf8");

  console.log("Da xuat du lieu ra " + OUT_FILE);
  for (const [table, rows] of Object.entries(data)) {
    console.log(`  ${table.padEnd(18)} ${rows.length} dong`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
