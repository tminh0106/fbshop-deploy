import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { createSlug } from "@/lib/utils";
import type { ProductItem } from "@/lib/types";
import { cancelExpiredUnpaidOrders } from "@/lib/orderExpiry";

// Map friendly category slugs / aliases to DB MaDanhMuc
const CATEGORY_MAP: Record<string, string> = {
  "vot-yonex": "DM_YONEX",
  "vot-lining": "DM_LINING",
  "vot-victor": "DM_VICTOR",
  "vot-mizuno": "DM_MIZUNO",
  "giay-cau-long": "DM_GIAY",
  "balo-bao-vot": "DM_BALO",
  "phu-kien": "DM_PHUKIEN",
};

export async function GET(request: Request) {
  try {
    // Don chuyen khoan qua han -> tra hang ve kho de ton kho hien thi dung
    await cancelExpiredUnpaidOrders();
    const { searchParams } = new URL(request.url);

    const categoryParam = searchParams.get("category");
    const searchParam = searchParams.get("search");
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    const weightParam = searchParams.get("weight");
    const sortParam = searchParams.get("sort") || "name_asc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "12", 10));
    const skip = (page - 1) * limit;

    const andConditions: any[] = [
      {
        OR: [
          { MoTa: null },
          {
            // Trang quan tri danh dau ngung kinh doanh bang "[NGỪNG KINH DOANH]" (giu them ma cu de tuong thich)
            NOT: [
              { MoTa: { contains: "[NGỪNG KINH DOANH]" } },
              { MoTa: { contains: "NGUNG_KINH_DOANH" } },
              { MoTa: { contains: "Hidden" } },
            ],
          },
        ],
      },
    ];

    // 1. Danh muc
    if (categoryParam) {
      const maDM = CATEGORY_MAP[categoryParam] || categoryParam;
      andConditions.push({ MaDanhMuc: maDM });
    }

    // 2. Tim kiem theo ten
    if (searchParam && searchParam.trim()) {
      andConditions.push({
        TenSP: {
          contains: searchParam.trim(),
        },
      });
    }

    // 3. Khoang gia
    if (minPriceParam || maxPriceParam) {
      const giaBanCondition: any = {};
      if (minPriceParam && !isNaN(Number(minPriceParam))) {
        giaBanCondition.gte = Number(minPriceParam);
      }
      if (maxPriceParam && !isNaN(Number(maxPriceParam))) {
        giaBanCondition.lte = Number(maxPriceParam);
      }
      andConditions.push({ GiaBan: giaBanCondition });
    }

    // 4. Trong luong (3U, 4U, 5U)
    if (weightParam && weightParam.trim()) {
      // Mot so mau co nhieu phien ban trong luong (vd "4U/5U") -> loc theo "co chua"
      andConditions.push({ TrongLuong: { contains: weightParam.trim() } });
    }

    const where: any = { AND: andConditions };

    // 5. Sap xep
    let orderBy: any = { TenSP: "asc" };
    if (sortParam === "price_asc") {
      orderBy = { GiaBan: "asc" };
    } else if (sortParam === "price_desc") {
      orderBy = { GiaBan: "desc" };
    } else if (sortParam === "newest") {
      orderBy = { MaSP: "desc" };
    }

    const [dbProducts, total, categories] = await Promise.all([
      prisma.sanPham.findMany({
        where,
        include: { DanhMuc: true },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.sanPham.count({ where }),
      prisma.danhMuc.findMany({ orderBy: { TenDanhMuc: "asc" } }),
    ]);

    const products: ProductItem[] = dbProducts.map((p) => {
      const priceNum = Number(p.GiaBan);
      return {
        id: p.MaSP,
        name: p.TenSP,
        slug: createSlug(p.TenSP),
        price: priceNum,
        imageUrl: p.HinhAnh || "/images/placeholder.png",
        weight: p.TrongLuong || undefined,
        description: p.MoTa || undefined,
        categoryId: p.MaDanhMuc,
        stock: p.SoLuong,
        isBestSeller: p.SoLuong > 12,
        discountPercent: p.SoLuong > 15 ? 8 : undefined,
        originalPrice: p.SoLuong > 15 ? Math.round(priceNum * 1.08) : undefined,
      };
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      products,
      total,
      page,
      totalPages,
      categories: categories.map((c) => ({
        id: c.MaDanhMuc,
        name: c.TenDanhMuc,
        slug: createSlug(c.TenDanhMuc),
      })),
    });
  } catch (error: any) {
    console.error("GET /api/san-pham error:", error);
    return NextResponse.json(
      { error: "Lỗi tải danh sách sản phẩm" },
      { status: 500 }
    );
  }
}