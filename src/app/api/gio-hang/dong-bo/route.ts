import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// =======================================================
// DONG BO GIO HANG (Bang 3.39 - 3.41)
// Gio hang luu o trinh duyet nen gia / ton kho co the cu. Trang gio hang va trang dat hang
// goi API nay de lay gia ban, ton kho hien tai va biet san pham nao da ngung kinh doanh.
// =======================================================

const STOPPED_TAG = "[NGỪNG KINH DOANH]";
const MAX_ITEMS = 100;

export async function POST(request: Request) {
  try {
    const { maSP } = await request.json().catch(() => ({ maSP: null }));
    if (!Array.isArray(maSP) || maSP.length > MAX_ITEMS || !maSP.every((m) => typeof m === "string")) {
      return NextResponse.json({ error: "Dữ liệu giỏ hàng không hợp lệ" }, { status: 400 });
    }
    if (maSP.length === 0) return NextResponse.json({ products: [] });

    const products = await prisma.sanPham.findMany({
      where: { MaSP: { in: maSP } },
      select: { MaSP: true, TenSP: true, GiaBan: true, SoLuong: true, MoTa: true },
    });

    return NextResponse.json({
      products: products.map((p) => ({
        maSP: p.MaSP,
        tenSP: p.TenSP,
        giaBan: Number(p.GiaBan),
        soLuong: p.SoLuong,
        ngungKinhDoanh: !!p.MoTa?.includes(STOPPED_TAG),
      })),
    });
  } catch (error) {
    console.error("POST /api/gio-hang/dong-bo error:", error);
    return NextResponse.json({ error: "Không thể kiểm tra giỏ hàng" }, { status: 500 });
  }
}
