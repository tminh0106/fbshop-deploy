import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireFeature } from "@/lib/auth";

// =======================================================
// HUY HOA DON KHO - Bang 3.18 / FR-18, quy tac hoan nguyen BR-01
// - Huy phieu XUAT: Ton moi = Ton hien tai + SL xuat
// - Huy phieu NHAP: Ton moi = Ton hien tai - SL nhap (chi khi Ton hien tai >= SL nhap)
// =======================================================

const CANCELLED = "Da huy";
const MAX_REASON = 300;

class BusinessError extends Error {}
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(request: Request, { params }: { params: Promise<{ maHDK: string }> }) {
  try {
    const auth = await requireFeature("kho");
    if (!auth.ok) return auth.response;

    const { maHDK } = await params;
    const { lyDoHuy } = await request.json();

    // A1 - Bo trong ly do huy
    if (!lyDoHuy || typeof lyDoHuy !== "string" || !lyDoHuy.trim()) return bad("Vui lòng nhập lý do hủy hóa đơn");
    if (lyDoHuy.trim().length > MAX_REASON) return bad(`Lý do hủy tối đa ${MAX_REASON} ký tự`);

    const hdk = await prisma.hoaDonKho.findUnique({
      where: { MaHDK: maHDK },
      include: { ChiTietHoaDonKhos: { include: { SanPham: true } } },
    });
    if (!hdk) return bad("Hóa đơn không tồn tại hoặc đã bị xóa", 404);
    if (hdk.TrangThai === CANCELLED || hdk.TrangThai === "Cancelled") return bad("Hóa đơn kho này đã được hủy trước đó");

    await prisma.$transaction(async (tx) => {
      // Khoa trang thai truoc: 2 nguoi huy cung luc thi chi 1 nguoi thanh cong (khong hoan nguyen 2 lan)
      const locked = await tx.hoaDonKho.updateMany({
        where: { MaHDK: maHDK, TrangThai: hdk.TrangThai },
        data: {
          TrangThai: CANCELLED,
          LyDo: (hdk.LyDo ? `[ĐÃ HỦY] ${lyDoHuy.trim()} (Gốc: ${hdk.LyDo})` : `[ĐÃ HỦY] ${lyDoHuy.trim()}`).slice(0, 500),
        },
      });
      if (locked.count === 0) throw new BusinessError("Hóa đơn kho này đã được hủy trước đó");

      for (const ct of hdk.ChiTietHoaDonKhos) {
        if (hdk.LoaiPhieu === "NHAP") {
          // A2 - Khong du ton de tru: tru co dieu kien ngay trong transaction
          const done = await tx.sanPham.updateMany({
            where: { MaSP: ct.MaSP, SoLuong: { gte: ct.SoLuong } },
            data: { SoLuong: { decrement: ct.SoLuong } },
          });
          if (done.count === 0) {
            const now = await tx.sanPham.findUnique({ where: { MaSP: ct.MaSP }, select: { SoLuong: true } });
            throw new BusinessError(
              `Không thể hủy: Tồn kho hiện tại của mặt hàng [${ct.SanPham?.TenSP || ct.MaSP}] không đủ để hoàn nguyên (Tồn hiện tại: ${now?.SoLuong ?? 0}, cần trừ: ${ct.SoLuong})`
            );
          }
        } else {
          await tx.sanPham.update({ where: { MaSP: ct.MaSP }, data: { SoLuong: { increment: ct.SoLuong } } });
        }
      }

      // Phieu nhap bi huy -> xoa lo hang da ghi nhan tu phieu nay (lo gan ma phieu trong ghi chu)
      if (hdk.LoaiPhieu === "NHAP") {
        await tx.hangHoaKho.deleteMany({ where: { GhiChu: { startsWith: `[${maHDK}]` } } });
      }
    });

    return NextResponse.json({
      success: true,
      message: `Đã hủy hóa đơn kho ${maHDK} và hoàn nguyên tồn kho thành công`,
    });
  } catch (error) {
    if (error instanceof BusinessError) return bad(error.message);
    console.error("Cancel hoa-don-kho error:", error);
    return bad("Đã xảy ra lỗi, vui lòng thử lại sau", 500);
  }
}
