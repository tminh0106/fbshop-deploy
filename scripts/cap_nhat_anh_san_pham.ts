// =======================================================
// GAN ANH SAN PHAM THAT (public/products/) CHO 14 SAN PHAM MAU
// Anh lay tu fbshop.vn cho muc dich hoc tap / trinh dien do an.
// Chi thay san pham dang dung anh ve mau cu (/images/...); anh da tai len qua Admin duoc giu nguyen.
// Chay: npx tsx scripts/cap_nhat_anh_san_pham.ts
// =======================================================
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ANH: Record<string, string> = {
  SP_ARC11P: "/products/sp-arc11p.jpg",
  SP_ARS100X: "/products/sp-ars100x.jpg",
  SP_AX100ZZ: "/products/sp-ax100zz.jpg",
  SP_AX88D: "/products/sp-ax88d.jpg",
  SP_AXF80: "/products/sp-axf80.jpg",
  SP_AXF90: "/products/sp-axf90.jpg",
  SP_DRIVEX9X: "/products/sp-drivex9x.jpg",
  SP_FT11Q: "/products/sp-ft11q.jpg",
  SP_HLB8000: "/products/sp-hlb8000.jpg",
  SP_JPX8F: "/products/sp-jpx8f.jpg",
  SP_NF700: "/products/sp-nf700.gif",
  SP_NF800P: "/products/sp-nf800p.jpg",
  SP_TEC9: "/products/sp-tec9.png",
  SP_TKRYUGA: "/products/sp-tkryuga.jpg",
};

async function main() {
  let changed = 0;
  for (const [maSP, path] of Object.entries(ANH)) {
    const sp = await prisma.sanPham.findUnique({ where: { MaSP: maSP }, select: { HinhAnh: true } });
    if (!sp) {
      console.log(`  ${maSP.padEnd(12)} khong ton tai - bo qua`);
      continue;
    }
    const isOldSample = !sp.HinhAnh || sp.HinhAnh.startsWith("/images/");
    if (!isOldSample) {
      console.log(`  ${maSP.padEnd(12)} da co anh rieng - giu nguyen`);
      continue;
    }
    await prisma.sanPham.update({ where: { MaSP: maSP }, data: { HinhAnh: path } });
    console.log(`  ${maSP.padEnd(12)} ${sp.HinhAnh} -> ${path}`);
    changed++;
  }
  console.log(`Da cap nhat ${changed} san pham`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
