import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { requireFeature } from "@/lib/auth";
import { checkKeyword, nextCode, optionalText, parseIntInRange } from "@/lib/validation";
import {
  NGHIEP_VU_NHAP,
  NGHIEP_VU_XUAT,
  WAREHOUSES,
  XUAT_TRA_NCC,
  invoiceDebt,
  invoicePrefix,
} from "@/lib/warehouse";

// =======================================================
// HOA DON KHO - Bang 3.16 (Lap phieu nhap), 3.17 (Lap phieu xuat), 3.20 (Tim kiem) - FR-16, FR-17, FR-19
// Phieu theo mau 01-VT / 02-VT: so phieu theo ngay, chung tu goc, nguoi giao/nhan, kho, nghiep vu,
// phieu nhap ghi nhan so tien da tra NCC -> phan con lai la cong no.
// =======================================================

const LOAI = ["NHAP", "XUAT"] as const;
const NCC_STOPPED = "Ngung hop tac";
const MAX_QTY = 100_000;
const MAX_PRICE = 999_999_999_999;
const INVALID_DATA = "Dữ liệu không hợp lệ";

// Loi nghiep vu -> 400 kem thong bao; loi khac -> A3 "Da xay ra loi, vui long thu lai sau"
class BusinessError extends Error {}

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

// Ngay YYYYMMDD theo gio Viet Nam (dung trong so phieu)
const vnDateCode = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10).replace(/-/g, "");

// Gia von binh quan gia quyen cua tung san pham, tinh tu cac phieu nhap chua huy
async function averageCost(): Promise<Record<string, number>> {
  const rows = await prisma.chiTietHoaDonKho.groupBy({
    by: ["MaSP"],
    where: { HoaDonKho: { LoaiPhieu: "NHAP", NOT: { TrangThai: { in: ["Da huy", "Cancelled"] } } } },
    _sum: { SoLuong: true, ThanhTien: true },
  });
  const map: Record<string, number> = {};
  for (const r of rows) {
    const qty = r._sum.SoLuong || 0;
    if (qty > 0) map[r.MaSP] = Math.round(Number(r._sum.ThanhTien || 0) / qty);
  }
  return map;
}

// 1. GET: Danh sach & loc hoa don kho (Bang 3.20). ?giaVon=1 tra kem gia von binh quan cho form lap phieu
export async function GET(request: Request) {
  try {
    const auth = await requireFeature("kho");
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const tuNgay = searchParams.get("tuNgay");
    const denNgay = searchParams.get("denNgay");
    const loaiPhieu = searchParams.get("loaiPhieu");
    const maNCC = searchParams.get("maNCC");
    const keyword = searchParams.get("keyword")?.trim();

    const keywordError = checkKeyword(keyword);
    if (keywordError) return bad(keywordError);
    // A2 - Sai logic thoi gian loc
    if (tuNgay && denNgay && tuNgay > denNgay) return bad("Khoảng thời gian tìm kiếm không hợp lệ");

    const where: Prisma.HoaDonKhoWhereInput = {};
    if (loaiPhieu && loaiPhieu !== "ALL") where.LoaiPhieu = loaiPhieu;
    if (maNCC && maNCC !== "ALL") where.MaNCC = maNCC;
    // Loc theo ngay gio Viet Nam (UTC+7)
    if (tuNgay || denNgay) {
      where.NgayLap = {
        ...(tuNgay && { gte: new Date(`${tuNgay}T00:00:00.000+07:00`) }),
        ...(denNgay && { lte: new Date(`${denNgay}T23:59:59.999+07:00`) }),
      };
    }
    if (keyword) {
      where.OR = [
        { MaHDK: { contains: keyword } },
        { LyDo: { contains: keyword } },
        { SoChungTu: { contains: keyword } },
        { NguoiGiaoNhan: { contains: keyword } },
        { NghiepVu: { contains: keyword } },
        { NhanVien: { HoTen: { contains: keyword } } },
        { NhaCungCap: { TenNCC: { contains: keyword } } },
      ];
    }

    const list = await prisma.hoaDonKho.findMany({
      where,
      include: {
        NhanVien: { select: { MaNV: true, HoTen: true, SoDienThoai: true } },
        NhaCungCap: { select: { MaNCC: true, TenNCC: true, SoDienThoai: true } },
        ChiTietHoaDonKhos: {
          include: {
            SanPham: { select: { MaSP: true, TenSP: true, HinhAnh: true, GiaBan: true, SoLuong: true } },
          },
        },
      },
      orderBy: { NgayLap: "desc" },
    });

    const data = list.map((inv) => ({ ...inv, CongNo: invoiceDebt(inv) }));
    const giaVon = searchParams.get("giaVon") === "1" ? await averageCost() : undefined;

    return NextResponse.json({ success: true, data, giaVon });
  } catch (error) {
    console.error("GET hoa-don-kho error:", error);
    return bad("Lỗi tải danh sách hóa đơn kho", 500);
  }
}

// 2. POST: Lap phieu nhap (Bang 3.16) / xuat (Bang 3.17) kho
export async function POST(request: Request) {
  try {
    const auth = await requireFeature("kho");
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { loaiPhieu, maNCC, items } = body;

    if (!LOAI.includes(loaiPhieu)) return bad("Loại phiếu không hợp lệ (phải là phiếu nhập hoặc phiếu xuất)");
    const isNhap = loaiPhieu === "NHAP";

    // FR-03: nguoi lap phieu = nhan vien so huu tai khoan dang dang nhap
    const maNV = auth.user.maNV;
    if (!maNV) return bad("Tài khoản chưa gắn với nhân viên nên không thể lập phiếu kho");

    // Nghiep vu: phieu nhap = nhap mua hang; phieu xuat chon trong danh muc (mac dinh "Xuat khac")
    const nghiepVu: string = isNhap ? NGHIEP_VU_NHAP : body.nghiepVu || "Xuất khác";
    if (!isNhap && !(NGHIEP_VU_XUAT as readonly string[]).includes(nghiepVu)) return bad("Nghiệp vụ xuất kho không hợp lệ");

    // Thong tin chung tu (tuy chon, gioi han do dai cot)
    const reason = optionalText(body.lyDo, "diễn giải", 500);
    const soChungTu = optionalText(body.soChungTu, "số chứng từ gốc", 50);
    const nguoiGiaoNhan = optionalText(body.nguoiGiaoNhan, isNhap ? "người giao hàng" : "người nhận hàng", 100);
    for (const r of [reason, soChungTu, nguoiGiaoNhan]) if (!r.ok) return bad(r.error);
    const lyDo = reason.ok ? reason.value : null;
    const khoHang = body.khoHang || "KHO_CHINH";
    if (!WAREHOUSES.some((w) => w.value === khoHang)) return bad("Kho hàng không hợp lệ");

    // A1 - Bo trong thong tin bat buoc
    const needNCC = isNhap || nghiepVu === XUAT_TRA_NCC;
    if (needNCC && !maNCC) return bad("Vui lòng chọn nhà cung cấp");
    if (!isNhap && !body.nghiepVu && !lyDo) return bad("Vui lòng chọn/nhập lý do xuất kho");
    if (!Array.isArray(items) || items.length === 0) return bad("Vui lòng chọn ít nhất 1 sản phẩm");

    // A2 - So luong / don gia: so nguyen; don gia nhap > 0; phieu xuat bo trong don gia -> lay gia von binh quan
    const giaVon = isNhap ? {} : await averageCost();
    const merged = new Map<string, { soLuong: number; donGia: number }>();
    for (const item of items) {
      const qty = parseIntInRange(item?.soLuong, 1, MAX_QTY);
      const rawPrice = item?.donGia === undefined || item?.donGia === "" ? (isNhap ? undefined : giaVon[item?.maSP] ?? 0) : item.donGia;
      const price = parseIntInRange(rawPrice, isNhap ? 1 : 0, MAX_PRICE);
      if (!item?.maSP || qty === null || price === null) return bad(INVALID_DATA);
      const prev = merged.get(item.maSP);
      if (prev && prev.donGia !== price) return bad(`Sản phẩm ${item.maSP} bị nhập 2 dòng với 2 đơn giá khác nhau`);
      merged.set(item.maSP, { soLuong: (prev?.soLuong || 0) + qty, donGia: price });
    }

    // FR-21.5: NCC ngung hop tac bi an khoi danh sach chon nhap hang
    if (needNCC) {
      const ncc = await prisma.nhaCungCap.findUnique({ where: { MaNCC: maNCC } });
      if (!ncc) return bad("Nhà cung cấp không tồn tại");
      if (isNhap && ncc.TrangThai === NCC_STOPPED)
        return bad(`Nhà cung cấp ${ncc.TenNCC} đã ngừng hợp tác, không thể lập phiếu nhập`);
    }

    const tongTien = [...merged.values()].reduce((s, it) => s + it.soLuong * it.donGia, 0);

    // Thanh toan cho NCC ngay khi nhap: 0 (ghi no toan bo) .. tong tien (tra du)
    let daThanhToan = 0;
    if (isNhap && body.daThanhToan !== undefined && body.daThanhToan !== "") {
      const paid = parseIntInRange(body.daThanhToan, 0, MAX_PRICE);
      if (paid === null || paid > tongTien) return bad("Số tiền đã thanh toán phải từ 0 đến tổng tiền phiếu nhập");
      daThanhToan = paid;
    }

    const prefix = invoicePrefix(loaiPhieu, vnDateCode());

    for (let attempt = 0; attempt < 3; attempt++) {
      // So phieu tang dan trong ngay: PN-20261001-001, PN-20261001-002...
      const sameDay = await prisma.hoaDonKho.findMany({ where: { MaHDK: { startsWith: prefix } }, select: { MaHDK: true } });
      const maHDK = nextCode(prefix, sameDay.map((h) => h.MaHDK), 3);
      try {
        const result = await prisma.$transaction(async (tx) => {
          for (const [maSP, it] of merged) {
            const sp = await tx.sanPham.findUnique({ where: { MaSP: maSP } });
            if (!sp) throw new BusinessError(`Sản phẩm mã ${maSP} không tồn tại`);

            if (!isNhap) {
              // A3 - Vuot ton: tru co dieu kien (khong ghi de gia tri doc truoc -> khong mat cap nhat khi co don ban cung luc)
              const done = await tx.sanPham.updateMany({
                where: { MaSP: maSP, SoLuong: { gte: it.soLuong } },
                data: { SoLuong: { decrement: it.soLuong } },
              });
              if (done.count === 0) {
                const now = await tx.sanPham.findUnique({ where: { MaSP: maSP }, select: { SoLuong: true } });
                throw new BusinessError(
                  `Số lượng xuất không được lớn hơn tồn kho (Tồn hiện tại: ${now?.SoLuong ?? 0} - ${sp.TenSP})`
                );
              }
            } else {
              await tx.sanPham.update({ where: { MaSP: maSP }, data: { SoLuong: { increment: it.soLuong } } });
              // Ghi nhan lo hang nhap vao HangHoaKho, gan so phieu de truy vet
              await tx.hangHoaKho.create({
                data: {
                  MaSP: maSP,
                  SoLuong: it.soLuong,
                  DonGiaNhap: it.donGia,
                  ViTriKho: khoHang,
                  GhiChu: `[${maHDK}] ${lyDo || NGHIEP_VU_NHAP}`.slice(0, 500),
                },
              });
            }
          }

          const created = await tx.hoaDonKho.create({
            data: {
              MaHDK: maHDK,
              LoaiPhieu: loaiPhieu,
              NghiepVu: nghiepVu,
              LyDo: lyDo || nghiepVu,
              SoChungTu: soChungTu.ok ? soChungTu.value : null,
              NguoiGiaoNhan: nguoiGiaoNhan.ok ? nguoiGiaoNhan.value : null,
              KhoHang: khoHang,
              TongTien: tongTien,
              DaThanhToan: daThanhToan,
              TrangThai: "Completed",
              MaNV: maNV,
              MaNCC: needNCC ? maNCC : null,
            },
          });

          for (const [maSP, it] of merged) {
            await tx.chiTietHoaDonKho.create({
              data: { MaHDK: maHDK, MaSP: maSP, SoLuong: it.soLuong, DonGia: it.donGia, ThanhTien: it.soLuong * it.donGia },
            });
          }
          return created;
        });

        return NextResponse.json({
          success: true,
          message: `Đã lập phiếu ${isNhap ? "nhập" : "xuất"} kho ${maHDK} thành công`,
          data: result,
        });
      } catch (err) {
        // Hai nguoi lap phieu cung luc trung so -> thu lai voi so tiep theo
        const dupKey = err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
        if (!dupKey || attempt === 2) throw err;
      }
    }
    return bad("Đã xảy ra lỗi, vui lòng thử lại sau", 500);
  } catch (error) {
    if (error instanceof BusinessError) return bad(error.message);
    console.error("POST hoa-don-kho error:", error);
    // A3 - Loi he thong: khong cap nhat ton kho (transaction da rollback)
    return bad("Đã xảy ra lỗi, vui lòng thử lại sau", 500);
  }
}
