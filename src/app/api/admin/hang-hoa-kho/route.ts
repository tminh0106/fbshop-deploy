import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { requireFeature } from "@/lib/auth";
import { checkKeyword, optionalText, parseIntInRange, requiredText } from "@/lib/validation";

// =======================================================
// HANG HOA KHO (LO HANG) - Bang 3.12 (Them), 3.13 (Sua), 3.14 (Xoa), 3.15 (Tim kiem) - FR-15
// Ton kho thuc te cua san pham = SanPham.SoLuong. Moi lo hang la ban ghi nhap kho:
// - Lo sinh tu phieu nhap (GhiChu bat dau "[PN-...]", phieu cu "[HDK-...]"): so luong & don gia khoa theo phieu,
//   chi sua vi tri / han su dung / ghi chu; khong xoa duoc (phai huy phieu hoac lap phieu xuat).
// - Lo them tay (ton dau ky / kiem ke): them -> cong ton, sua SL -> cong/tru chenh lech, xoa -> tru ton.
// =======================================================

const MAX_QTY = 100_000;
const MAX_PRICE = 999_999_999_999;
const DEFAULT_LOCATION = "KHO_CHINH";
const INVALID_NUMBER = "Số lượng (1 - 100.000) và đơn giá nhập phải là số nguyên lớn hơn 0";
const DUPLICATE = "Hàng hóa/Lô hàng đã tồn tại trong kho";
const HAS_HISTORY =
  "Không thể xóa hàng hóa đã phát sinh lịch sử xuất/nhập kho. Vui lòng thực hiện phiếu xuất hủy hoặc hủy hóa đơn nhập tương ứng.";

class BusinessError extends Error {}
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

// Tach so phieu nhap gan o dau ghi chu: "[PN-20261001-001] noi dung" (phieu cu: "[HDK-NHAP-...]")
const TAG_RE = /^\[((?:PN|HDK)-[^\]]+)\]\s*/;
function splitNote(note: string | null) {
  const hit = note ? TAG_RE.exec(note) : null;
  return { maHDK: hit ? hit[1] : null, text: note ? note.replace(TAG_RE, "") : "" };
}
const joinNote = (maHDK: string | null, text: string | null) =>
  (maHDK ? `[${maHDK}] ${text || ""}`.trim() : text || null)?.slice(0, 500) || null;

// Han su dung: rong -> null, sai dinh dang -> loi
function parseExpiry(value: unknown): { ok: true; value: Date | null } | { ok: false } {
  if (value === undefined || value === null || value === "") return { ok: true, value: null };
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00.000+07:00`);
  return Number.isNaN(d.getTime()) ? { ok: false } : { ok: true, value: d };
}

// Lo them tay cung san pham + cung vi tri da ton tai -> trung (A3)
async function findDuplicate(maSP: string, viTriKho: string, exceptId?: string) {
  const lots = await prisma.hangHoaKho.findMany({
    where: { MaSP: maSP, ViTriKho: viTriKho, ...(exceptId && { NOT: { MaHangHoa: exceptId } }) },
    select: { GhiChu: true },
  });
  return lots.some((l) => !splitNote(l.GhiChu).maHDK);
}

// 1. GET: Danh sach & tim kiem (Bang 3.15)
export async function GET(request: Request) {
  try {
    const auth = await requireFeature("kho");
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword")?.trim();
    const viTriKho = searchParams.get("viTriKho");

    const keywordError = checkKeyword(keyword);
    if (keywordError) return bad(keywordError);

    const where: Prisma.HangHoaKhoWhereInput = {};
    if (viTriKho && viTriKho !== "ALL") where.ViTriKho = viTriKho;
    if (keyword) {
      where.OR = [
        { MaHangHoa: { contains: keyword } },
        { MaSP: { contains: keyword } },
        { ViTriKho: { contains: keyword } },
        { GhiChu: { contains: keyword } },
        { SanPham: { TenSP: { contains: keyword } } },
      ];
    }

    const items = await prisma.hangHoaKho.findMany({
      where,
      include: {
        SanPham: {
          select: { MaSP: true, TenSP: true, SoLuong: true, DanhMuc: { select: { TenDanhMuc: true } } },
        },
      },
      orderBy: { NgayNhap: "desc" },
    });

    const data = items.map((it) => {
      const { maHDK, text } = splitNote(it.GhiChu);
      return { ...it, DonGiaNhap: Number(it.DonGiaNhap), MaHDK: maHDK, GhiChu: text || null };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET hang-hoa-kho error:", error);
    return bad("Lỗi tải dữ liệu tồn kho", 500);
  }
}

// 2. POST: Them hang hoa kho - lo ton dau ky / kiem ke (Bang 3.12)
export async function POST(request: Request) {
  try {
    const auth = await requireFeature("kho");
    if (!auth.ok) return auth.response;

    const body = await request.json();

    // A1 - Bo trong thong tin bat buoc
    if (!body.maSP) return bad("Vui lòng chọn sản phẩm");
    const viTri = requiredText(body.viTriKho, "vị trí kho", 100);
    if (!viTri.ok) return bad(viTri.error);
    if (body.soLuong === undefined || body.soLuong === "" || body.donGiaNhap === undefined || body.donGiaNhap === "")
      return bad("Vui lòng nhập số lượng và đơn giá nhập");

    // A2 - So khong hop le
    const soLuong = parseIntInRange(body.soLuong, 1, MAX_QTY);
    const donGia = parseIntInRange(body.donGiaNhap, 1, MAX_PRICE);
    if (soLuong === null || donGia === null) return bad(INVALID_NUMBER);

    const ghiChu = optionalText(body.ghiChu, "ghi chú", 450);
    if (!ghiChu.ok) return bad(ghiChu.error);
    if (ghiChu.value && TAG_RE.test(ghiChu.value)) return bad("Ghi chú không được bắt đầu bằng số phiếu nhập trong ngoặc vuông");
    const han = parseExpiry(body.hanSuDung);
    if (!han.ok) return bad("Hạn sử dụng không hợp lệ");

    const sp = await prisma.sanPham.findUnique({ where: { MaSP: body.maSP } });
    if (!sp) return bad("Sản phẩm không tồn tại");

    // A3 - Trung lo
    if (await findDuplicate(sp.MaSP, viTri.value)) return bad(DUPLICATE, 409);

    const created = await prisma.$transaction(async (tx) => {
      await tx.sanPham.update({ where: { MaSP: sp.MaSP }, data: { SoLuong: { increment: soLuong } } });
      return tx.hangHoaKho.create({
        data: {
          MaSP: sp.MaSP,
          ViTriKho: viTri.value,
          SoLuong: soLuong,
          DonGiaNhap: donGia,
          HanSuDung: han.value,
          GhiChu: ghiChu.value,
        },
      });
    });

    return NextResponse.json({ success: true, message: "Thêm hàng hóa kho thành công", data: created });
  } catch (error) {
    console.error("POST hang-hoa-kho error:", error);
    return bad("Đã xảy ra lỗi, vui lòng thử lại sau", 500);
  }
}

// 3. PUT: Sua hang hoa kho (Bang 3.13)
export async function PUT(request: Request) {
  try {
    const auth = await requireFeature("kho");
    if (!auth.ok) return auth.response;

    const body = await request.json();
    if (!body.maHangHoa) return bad("Thiếu mã hàng hóa");

    const lot = await prisma.hangHoaKho.findUnique({ where: { MaHangHoa: body.maHangHoa } });
    if (!lot) return bad("Hàng hóa kho không tồn tại hoặc đã bị xóa", 404);
    const { maHDK } = splitNote(lot.GhiChu);

    // A1 - Bo trong
    const viTri = requiredText(body.viTriKho ?? lot.ViTriKho ?? DEFAULT_LOCATION, "vị trí kho", 100);
    if (!viTri.ok) return bad(viTri.error);
    const ghiChu = optionalText(body.ghiChu, "ghi chú", 450);
    if (!ghiChu.ok) return bad(ghiChu.error);
    if (ghiChu.value && TAG_RE.test(ghiChu.value)) return bad("Ghi chú không được bắt đầu bằng số phiếu nhập trong ngoặc vuông");
    const han = body.hanSuDung === undefined ? { ok: true as const, value: lot.HanSuDung } : parseExpiry(body.hanSuDung);
    if (!han.ok) return bad("Hạn sử dụng không hợp lệ");

    // A2 - So khong hop le
    const soLuong = body.soLuong === undefined ? lot.SoLuong : parseIntInRange(body.soLuong, 1, MAX_QTY);
    const donGia = body.donGiaNhap === undefined ? Number(lot.DonGiaNhap) : parseIntInRange(body.donGiaNhap, 1, MAX_PRICE);
    if (soLuong === null || donGia === null) return bad(INVALID_NUMBER);

    // Lo tu phieu nhap: SL & don gia la so lieu chung tu, khong duoc sua tay
    if (maHDK && (soLuong !== lot.SoLuong || donGia !== Number(lot.DonGiaNhap))) {
      return bad(
        `Lô hàng thuộc phiếu nhập ${maHDK}: không được sửa số lượng/đơn giá. Vui lòng hủy phiếu hoặc lập phiếu xuất để điều chỉnh tồn kho.`
      );
    }

    // A3 - Trung lo khi doi vi tri
    if (!maHDK && viTri.value !== lot.ViTriKho && (await findDuplicate(lot.MaSP, viTri.value, lot.MaHangHoa))) {
      return bad(DUPLICATE, 409);
    }

    const delta = soLuong - lot.SoLuong;
    const updated = await prisma.$transaction(async (tx) => {
      if (delta > 0) {
        await tx.sanPham.update({ where: { MaSP: lot.MaSP }, data: { SoLuong: { increment: delta } } });
      } else if (delta < 0) {
        const done = await tx.sanPham.updateMany({
          where: { MaSP: lot.MaSP, SoLuong: { gte: -delta } },
          data: { SoLuong: { decrement: -delta } },
        });
        if (done.count === 0) {
          const now = await tx.sanPham.findUnique({ where: { MaSP: lot.MaSP }, select: { SoLuong: true } });
          throw new BusinessError(`Không thể giảm ${-delta} sản phẩm: tồn kho hiện tại chỉ còn ${now?.SoLuong ?? 0}`);
        }
      }
      return tx.hangHoaKho.update({
        where: { MaHangHoa: lot.MaHangHoa },
        data: {
          ViTriKho: viTri.value,
          SoLuong: soLuong,
          DonGiaNhap: donGia,
          HanSuDung: han.value,
          GhiChu: body.ghiChu === undefined ? lot.GhiChu : joinNote(maHDK, ghiChu.value),
        },
      });
    });

    return NextResponse.json({ success: true, message: "Cập nhật hàng hóa kho thành công", data: updated });
  } catch (error) {
    if (error instanceof BusinessError) return bad(error.message);
    console.error("PUT hang-hoa-kho error:", error);
    return bad("Đã xảy ra lỗi, vui lòng thử lại sau", 500);
  }
}

// 4. DELETE: Xoa hang hoa kho (Bang 3.14)
export async function DELETE(request: Request) {
  try {
    const auth = await requireFeature("kho");
    if (!auth.ok) return auth.response;

    const maHangHoa = new URL(request.url).searchParams.get("maHangHoa");
    if (!maHangHoa) return bad("Thiếu mã hàng hóa");

    const lot = await prisma.hangHoaKho.findUnique({ where: { MaHangHoa: maHangHoa }, include: { SanPham: true } });
    if (!lot) return bad("Hàng hóa kho không tồn tại hoặc đã bị xóa", 404);

    // A2 - Lo gan voi phieu nhap -> khong xoa
    if (splitNote(lot.GhiChu).maHDK) return bad(HAS_HISTORY);

    await prisma.$transaction(async (tx) => {
      // Lo them tay: rut so luong cua lo khoi ton (chi khi ton con du, tranh ton am vi hang da ban)
      const done = await tx.sanPham.updateMany({
        where: { MaSP: lot.MaSP, SoLuong: { gte: lot.SoLuong } },
        data: { SoLuong: { decrement: lot.SoLuong } },
      });
      if (done.count === 0) {
        throw new BusinessError(
          `Không thể xóa: tồn kho hiện tại của ${lot.SanPham.TenSP} (${lot.SanPham.SoLuong}) nhỏ hơn số lượng lô (${lot.SoLuong}) do hàng đã được bán/xuất.`
        );
      }
      await tx.hangHoaKho.delete({ where: { MaHangHoa: maHangHoa } });
    });

    return NextResponse.json({ success: true, message: "Xóa hàng hóa kho thành công" });
  } catch (error) {
    if (error instanceof BusinessError) return bad(error.message);
    console.error("DELETE hang-hoa-kho error:", error);
    return bad("Đã xảy ra lỗi, vui lòng thử lại sau", 500);
  }
}
