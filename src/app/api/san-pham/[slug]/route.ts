import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { createSlug } from "@/lib/utils";
import { cancelExpiredUnpaidOrders } from "@/lib/orderExpiry";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    await cancelExpiredUnpaidOrders();

    if (!slug) {
      return NextResponse.json({ error: "Thiếu mã hoặc slug sản phẩm" }, { status: 400 });
    }

    // 1. Thu tim truc tiep theo MaSP
    let product = await prisma.sanPham.findUnique({
      where: { MaSP: slug },
      include: { DanhMuc: true },
    });

    // 2. Neu khong tim thay theo MaSP, tim theo slug tao tu TenSP
    if (!product) {
      const allProducts = await prisma.sanPham.findMany({
        include: { DanhMuc: true },
      });
      product = allProducts.find((p) => createSlug(p.TenSP) === slug) || null;
    }

    if (!product) {
      return NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
    }

    // San pham ngung kinh doanh: van xem duoc (link cu) nhung khong ban -> ton = 0, an the danh dau khoi mo ta
    const stopped = !!product.MoTa?.includes("[NGỪNG KINH DOANH]");
    const priceNum = Number(product.GiaBan);
    return NextResponse.json({
      product: {
        id: product.MaSP,
        name: product.TenSP,
        slug: createSlug(product.TenSP),
        price: priceNum,
        stock: stopped ? 0 : product.SoLuong,
        discontinued: stopped,
        weight: product.TrongLuong,
        imageUrl: product.HinhAnh || "/images/placeholder.png",
        description: product.MoTa?.replace("[NGỪNG KINH DOANH]", "").trim() || null,
        category: product.DanhMuc ? {
          id: product.DanhMuc.MaDanhMuc,
          name: product.DanhMuc.TenDanhMuc,
        } : null,
      },
    });
  } catch (error: any) {
    console.error("GET /api/san-pham/[slug] error:", error);
    return NextResponse.json(
      { error: "Lỗi tải thông tin chi tiết sản phẩm" },
      { status: 500 }
    );
  }
}