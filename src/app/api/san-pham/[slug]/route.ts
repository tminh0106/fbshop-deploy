import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { createSlug } from "@/lib/utils";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

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

    const priceNum = Number(product.GiaBan);
    return NextResponse.json({
      product: {
        id: product.MaSP,
        name: product.TenSP,
        slug: createSlug(product.TenSP),
        price: priceNum,
        stock: product.SoLuong,
        weight: product.TrongLuong,
        imageUrl: product.HinhAnh || "/images/placeholder.png",
        description: product.MoTa,
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