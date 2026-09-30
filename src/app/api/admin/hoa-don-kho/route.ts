import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { requireFeature } from "@/lib/auth";
import { checkKeyword, parseIntInRange } from "@/lib/validation";

// =======================================================
// HOA DON KHO - Bang 3.16 (Lap phieu nhap), 3.17 (Lap phieu xuat), 3.20 (Tim kiem) - FR-16, FR-17, FR-19
// =======================================================

const LOAI = ["NHAP", "XUAT"] as const;
const NCC_STOPPED = "Ngung hop tac";
const MAX_QTY = 100_000;
const MAX_PRICE = 999_999_999_999;
const INVALID_DATA = "Dữ liệu không hợp lệ";

// Loi nghiep vu -> 400 kem thong bao; loi khac -> A3 "Da xay ra loi, vui long thu lai sau"
class BusinessError extends Error {}

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

// Ngay YYYYMMDD theo gio Viet Nam (dung trong ma phieu)
const vnDateCode = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10).replace(/-/g, "");

// 1. GET: Danh sach & loc hoa don kho (Bang 3.20)
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

    return NextResponse.json({ success: true, data: list });
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

    const { loaiPhieu, maNCC, lyDo, items } = await request.json();

    if (!LOAI.includes(loaiPhieu)) return bad("Loại phiếu không hợp lệ (phải là phiếu nhập hoặc phiếu xuất)");

    // FR-03: nguoi lap phieu = nhan vien so huu tai khoan dang dang nhap
    const maNV = auth.user.maNV;
    if (!maNV) return bad("Tài khoản chưa gắn với nhân viên nên không thể lập phiếu kho");

    // A1 - Bo trong thong tin bat buoc
    const reason = typeof lyDo === "string" ? lyDo.trim() : "";
    if (loaiPhieu === "NHAP" && !maNCC) return bad("Vui lòng chọn nhà cung cấp");
    if (loaiPhieu === "XUAT" && !reason) return bad("Vui lòng chọn/nhập lý do xuất kho");
    if (reason.length > 500) return bad("Lý do tối đa 500 ký tự");
    if (!Array.isArray(items) || items.length === 0) return bad("Vui lòng chọn ít nhất 1 sản phẩm");

    // A2 - So luong / don gia: so nguyen, > 0 (don gia nhap bat buoc > 0; phieu xuat cho phep 0)
    // Gop cac dong trung san pham (khoa chinh ChiTietHoaDonKho la MaHDK + MaSP)
    const merged = new Map<string, { soLuong: number; donGia: number; viTriKho?: string }>();
    for (const item of items) {
      const qty = parseIntInRange(item?.soLuong, 1, MAX_QTY);
      const price = parseIntInRange(item?.donGia ?? 0, loaiPhieu === "NHAP" ? 1 : 0, MAX_PRICE);
      if (!item?.maSP || qty === null || price === null) return bad(INVALID_DATA);
      const prev = merged.get(item.maSP);
      if (prev && prev.donGia !== price) return bad(`Sản phẩm ${item.maSP} bị nhập 2 dòng với 2 đơn giá khác nhau`);
      merged.set(item.maSP, {
        soLuong: (prev?.soLuong || 0) + qty,
        donGia: price,
        viTriKho: typeof item.viTriKho === "string" && item.viTriKho.trim() ? item.viTriKho.trim().slice(0, 100) : prev?.viTriKho,
      });
    }

    // FR-21.5: NCC ngung hop tac bi an khoi danh sach chon nhap hang
    if (loaiPhieu === "NHAP") {
      const ncc = await prisma.nhaCungCap.findUnique({ where: { MaNCC: maNCC } });
      if (!ncc) return bad("Nhà cung cấp không tồn tại");
      if (ncc.TrangThai === NCC_STOPPED) return bad(`Nhà cung cấp ${ncc.TenNCC} đã ngừng hợp tác, không thể lập phiếu nhập`);
    }

    const tongTien = [...merged.values()].reduce((s, it) => s + it.soLuong * it.donGia, 0);

    for (let attempt = 0; attempt < 3; attempt++) {
      const maHDK = `HDK-${loaiPhieu}-${vnDateCode()}-${Math.floor(1000 + Math.random() * 9000)}`;
      try {
        const result = await prisma.$transaction(async (tx) => {
          for (const [maSP, it] of merged) {
            const sp = await tx.sanPham.findUnique({ where: { MaSP: maSP } });
            if (!sp) throw new BusinessError(`Sản phẩm mã ${maSP} không tồn tại`);

            if (loaiPhieu === "XUAT") {
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
              // Ghi nhan lo hang nhap vao HangHoaKho, gan ma phieu de truy vet
              await tx.hangHoaKho.create({
                data: {
                  MaSP: maSP,
                  SoLuong: it.soLuong,
                  DonGiaNhap: it.donGia,
                  ViTriKho: it.viTriKho || "KHO_CHINH",
                  GhiChu: `[${maHDK}] ${reason || "Nhập hàng nhà cung cấp"}`.slice(0, 500),
                },
              });
            }
          }

          const created = await tx.hoaDonKho.create({
            data: {
              MaHDK: maHDK,
              LoaiPhieu: loaiPhieu,
              LyDo: reason || "Nhập hàng nhà cung cấp",
              TongTien: tongTien,
              TrangThai: "Completed",
              MaNV: maNV,
              MaNCC: loaiPhieu === "NHAP" ? maNCC : null,
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
          message: `Đã lập phiếu ${loaiPhieu === "NHAP" ? "nhập" : "xuất"} kho ${maHDK} thành công`,
          data: result,
        });
      } catch (err) {
        // Trung ma phieu ngau nhien -> thu lai voi ma khac
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
