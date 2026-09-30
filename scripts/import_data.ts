// =======================================================
// NHAP DU LIEU TU FILE JSON VAO CSDL DANG CAU HINH (DATABASE_URL)
// File nguon tao boi scripts/export_data.ts
// Chay: npx tsx scripts/import_data.ts
// CANH BAO: xoa sach du lieu hien co trong 12 bang cua CSDL dich truoc khi nhap
// =======================================================
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const IN_FILE = "database/export/fbshop_data.json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Rows = any[];

async function main() {
  const data: Record<string, Rows> = JSON.parse(readFileSync(IN_FILE, "utf8"));

  // Xoa theo thu tu nguoc (bang con truoc) de khong vi pham khoa ngoai
  await prisma.$transaction([
    prisma.chiTietHoaDonKho.deleteMany(),
    prisma.hoaDonKho.deleteMany(),
    prisma.hangHoaKho.deleteMany(),
    prisma.chiTietDonHang.deleteMany(),
    prisma.donHang.deleteMany(),
    prisma.sanPham.deleteMany(),
    prisma.danhMuc.deleteMany(),
    prisma.voucher.deleteMany(),
    prisma.nhaCungCap.deleteMany(),
    prisma.taiKhoan.deleteMany(),
    prisma.nhanVien.deleteMany(),
    prisma.khachHang.deleteMany(),
  ]);

  // Nhap theo thu tu bang cha truoc
  const steps: [string, (rows: Rows) => Promise<{ count: number }>][] = [
    ["KhachHang", (rows) => prisma.khachHang.createMany({ data: rows })],
    ["NhanVien", (rows) => prisma.nhanVien.createMany({ data: rows })],
    ["TaiKhoan", (rows) => prisma.taiKhoan.createMany({ data: rows })],
    ["NhaCungCap", (rows) => prisma.nhaCungCap.createMany({ data: rows })],
    ["Voucher", (rows) => prisma.voucher.createMany({ data: rows })],
    ["DanhMuc", (rows) => prisma.danhMuc.createMany({ data: rows })],
    ["SanPham", (rows) => prisma.sanPham.createMany({ data: rows })],
    ["DonHang", (rows) => prisma.donHang.createMany({ data: rows })],
    ["ChiTietDonHang", (rows) => prisma.chiTietDonHang.createMany({ data: rows })],
    ["HangHoaKho", (rows) => prisma.hangHoaKho.createMany({ data: rows })],
    ["HoaDonKho", (rows) => prisma.hoaDonKho.createMany({ data: rows })],
    ["ChiTietHoaDonKho", (rows) => prisma.chiTietHoaDonKho.createMany({ data: rows })],
  ];

  console.log("Nhap du lieu tu " + IN_FILE);
  for (const [table, insert] of steps) {
    const rows = data[table] || [];
    const { count } = rows.length ? await insert(rows) : { count: 0 };
    console.log(`  ${table.padEnd(18)} ${count}/${rows.length} dong`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
