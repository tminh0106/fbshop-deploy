// =======================================================
// CAP NHAT DU LIEU MAU SANG TIENG VIET CO DAU
// San pham, danh muc, nhan vien, khach hang, nha cung cap
// Chi doi truong hien thi (ten, mo ta) - khong doi ma, gia, ton kho
// Slug van giu nguyen vi createSlug() bo dau: "Vợt Cầu Lông" -> "vot-cau-long"
// Chay: npx tsx scripts/cap_nhat_tieng_viet.ts
// =======================================================
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DANH_MUC: Record<string, string> = {
  DM_BALO: "Balo & Bao Vợt",
  DM_GIAY: "Giày Cầu Lông",
  DM_LINING: "Vợt Cầu Lông Lining",
  DM_MIZUNO: "Vợt Cầu Lông Mizuno",
  DM_PHUKIEN: "Phụ Kiện Cầu Lông",
  DM_VICTOR: "Vợt Cầu Lông Victor",
  DM_YONEX: "Vợt Cầu Lông Yonex",
};

const SAN_PHAM: Record<string, { ten: string; moTa: string }> = {
  SP_ARC11P: { ten: "Vợt Cầu Lông Yonex Arcsaber 11 Pro", moTa: "Công thủ toàn diện, hoàn hảo." },
  SP_ARS100X: { ten: "Vợt Cầu Lông Victor Auraspeed 100X", moTa: "Phản tạt tốc độ cao." },
  SP_AX100ZZ: { ten: "Vợt Cầu Lông Yonex Astrox 100ZZ", moTa: "Cực phẩm tấn công của Viktor Axelsen." },
  SP_AX88D: { ten: "Vợt Cầu Lông Yonex Astrox 88D Pro", moTa: "Dòng vợt thiên công mạnh mẽ, smash uy lực." },
  SP_AXF80: { ten: "Vợt Cầu Lông Lining Axforce 80", moTa: "Tấn công uy lực, trợ lực smash cực tốt." },
  SP_AXF90: { ten: "Vợt Cầu Lông Lining Axforce 90 Dragon Max", moTa: "Dòng vợt đỉnh cao, tấn công đầm chắc." },
  SP_DRIVEX9X: { ten: "Vợt Cầu Lông Victor DriveX 9X", moTa: "Vợt đầm tay, ổn định." },
  SP_FT11Q: { ten: "Vợt Cầu Lông Mizuno Fortius 11 Quick", moTa: "Vợt cao cấp Nhật Bản." },
  SP_HLB8000: { ten: "Vợt Cầu Lông Lining Halbertec 8000", moTa: "Kiểm soát điểm rơi tinh chuẩn." },
  SP_JPX8F: { ten: "Vợt Cầu Lông Mizuno JPX 8 Force", moTa: "Vợt tầm trung, dễ thuần." },
  SP_NF700: { ten: "Vợt Cầu Lông Yonex Nanoflare 700", moTa: "Vợt tốc độ cao, linh hoạt." },
  SP_NF800P: { ten: "Vợt Cầu Lông Yonex Nanoflare 800 Pro", moTa: "Tốc độ chớp nhoáng." },
  SP_TEC9: { ten: "Vợt Cầu Lông Lining Tectonic 9", moTa: "Hấp thụ chấn, đàn hồi nhanh." },
  SP_TKRYUGA: { ten: "Vợt Cầu Lông Victor Thruster Ryuga II", moTa: "Cây vợt rồng, đập cầu cắm sân." },
};

// Du lieu mau nhan vien / khach hang / nha cung cap: [gia tri cu khong dau, gia tri moi co dau]
// Chi doi khi gia tri hien tai van dung la ban cu (khong ghi de neu da co nguoi sua tay).
// NV004, NV005 do thanh vien nhom tu nhap ("anh", "tminh") -> khong doan, giu nguyen.
type Pair = [cu: string, moi: string];
const NHAN_VIEN: Record<string, { HoTen?: Pair; DiaChi?: Pair }> = {
  NV001: { HoTen: ["Nguyen Van Admin", "Nguyễn Văn Admin"], DiaChi: ["277 Nguyen Trai, Ha Noi", "277 Nguyễn Trãi, Hà Nội"] },
  NV002: { HoTen: ["Tran Thi Kho", "Trần Thị Kho"], DiaChi: ["Ha Noi", "Hà Nội"] },
  NV003: { HoTen: ["Le Van BanHang", "Lê Văn Bán Hàng"], DiaChi: ["Ha Noi", "Hà Nội"] },
};
const KHACH_HANG: Record<string, { HoTen?: Pair; DiaChi?: Pair }> = {
  KH001: { HoTen: ["Pham Thi Khach Hang", "Phạm Thị Khách Hàng"], DiaChi: ["Ha Noi", "Hà Nội"] },
};
const NHA_CUNG_CAP: Record<string, { TenNCC?: Pair; DiaChi?: Pair; NguoiDaiDien?: Pair }> = {
  NCC001: { TenNCC: ["Yonex Viet Nam", "Yonex Việt Nam"], DiaChi: ["TP. Ho Chi Minh", "TP. Hồ Chí Minh"], NguoiDaiDien: ["Nguyen Van Y", "Nguyễn Văn Y"] },
  NCC002: { TenNCC: ["Lining Viet Nam", "Lining Việt Nam"], DiaChi: ["Ha Noi", "Hà Nội"], NguoiDaiDien: ["Tran Van L", "Trần Văn L"] },
  NCC003: { TenNCC: ["Victor Viet Nam", "Victor Việt Nam"], DiaChi: ["Ha Noi", "Hà Nội"], NguoiDaiDien: ["Le Van V", "Lê Văn V"] },
};

// Tra ve cac truong can doi (chi truong co gia tri hien tai = ban cu)
function changes(current: Record<string, unknown>, pairs: Record<string, Pair | undefined>) {
  const data: Record<string, string> = {};
  for (const [field, pair] of Object.entries(pairs)) {
    if (pair && current[field] === pair[0]) data[field] = pair[1];
  }
  return data;
}

async function capNhatNguoiVaDoiTac() {
  let n = 0;
  for (const [ma, pairs] of Object.entries(NHAN_VIEN)) {
    const cur = await prisma.nhanVien.findUnique({ where: { MaNV: ma } });
    const data = cur ? changes(cur, pairs) : {};
    if (Object.keys(data).length) {
      await prisma.nhanVien.update({ where: { MaNV: ma }, data });
      n++;
    }
  }
  for (const [ma, pairs] of Object.entries(KHACH_HANG)) {
    const cur = await prisma.khachHang.findUnique({ where: { MaKH: ma } });
    const data = cur ? changes(cur, pairs) : {};
    if (Object.keys(data).length) {
      await prisma.khachHang.update({ where: { MaKH: ma }, data });
      n++;
    }
  }
  for (const [ma, pairs] of Object.entries(NHA_CUNG_CAP)) {
    const cur = await prisma.nhaCungCap.findUnique({ where: { MaNCC: ma } });
    const data = cur ? changes(cur, pairs) : {};
    if (Object.keys(data).length) {
      await prisma.nhaCungCap.update({ where: { MaNCC: ma }, data });
      n++;
    }
  }
  console.log(`Da cap nhat ${n} ban ghi nhan vien / khach hang / nha cung cap`);
}

async function main() {
  await capNhatNguoiVaDoiTac();
  // Chi doi truong con la ban khong dau (chi ky tu ASCII) -> khong ghi de ten/mo ta da duoc sua tay
  const isUnaccented = (s: string | null | undefined) => !!s && /^[\x00-\x7F]*$/.test(s);

  let dm = 0;
  for (const [ma, ten] of Object.entries(DANH_MUC)) {
    const cur = await prisma.danhMuc.findUnique({ where: { MaDanhMuc: ma }, select: { TenDanhMuc: true } });
    if (!cur || !isUnaccented(cur.TenDanhMuc)) continue;
    await prisma.danhMuc.update({ where: { MaDanhMuc: ma }, data: { TenDanhMuc: ten } });
    dm++;
  }

  let sp = 0;
  for (const [ma, { ten, moTa }] of Object.entries(SAN_PHAM)) {
    const cur = await prisma.sanPham.findUnique({ where: { MaSP: ma }, select: { TenSP: true, MoTa: true } });
    if (!cur) continue;
    // Giu nhan [NGỪNG KINH DOANH] neu san pham da bi an
    const stopped = cur.MoTa?.startsWith("[NGỪNG KINH DOANH]");
    const rawMoTa = stopped ? cur.MoTa!.replace("[NGỪNG KINH DOANH]", "").trim() : cur.MoTa;
    const data: { TenSP?: string; MoTa?: string } = {};
    if (isUnaccented(cur.TenSP)) data.TenSP = ten;
    if (isUnaccented(rawMoTa)) data.MoTa = (stopped ? "[NGỪNG KINH DOANH] " : "") + moTa;
    if (!Object.keys(data).length) continue;
    await prisma.sanPham.update({ where: { MaSP: ma }, data });
    sp++;
  }

  console.log(`Da cap nhat ${dm} danh muc, ${sp} san pham sang tieng Viet co dau`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
