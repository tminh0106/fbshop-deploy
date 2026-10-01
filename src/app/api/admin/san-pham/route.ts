import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireFeature } from "@/lib/auth";

const DEFAULT_IMAGE = "/images/placeholder.png";
// Anh da nen o trinh duyet thuong ~30-80KB; chan tren 1.5MB de khong lam nang CSDL dung chung
const MAX_DATA_URL_LENGTH = 1_500_000;

// Hop le: duong dan noi bo (/images/...), URL http(s), hoac anh nhung dang data URL
function validateHinhAnh(value: unknown): { ok: true; value: string | undefined } | { ok: false; error: string } {
  if (value === undefined) return { ok: true, value: undefined };
  if (typeof value !== "string" || !value.trim()) return { ok: true, value: DEFAULT_IMAGE };
  const v = value.trim();
  if (v.startsWith("data:")) {
    if (!/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v)) {
      return { ok: false, error: "Định dạng ảnh không hợp lệ (chỉ nhận PNG, JPG, WEBP, GIF)" };
    }
    if (v.length > MAX_DATA_URL_LENGTH) {
      return { ok: false, error: "Ảnh quá lớn, vui lòng chọn ảnh nhỏ hơn" };
    }
    return { ok: true, value: v };
  }
  if (v.length > 500 || !(v.startsWith("/") || /^https?:\/\//.test(v))) {
    return { ok: false, error: "Đường dẫn ảnh không hợp lệ" };
  }
  return { ok: true, value: v };
}

// GET: Danh sach san pham
export async function GET(request: Request) {
  try {
    const auth = await requireFeature("sanPham");
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword")?.trim();
    const maDanhMuc = searchParams.get("maDanhMuc");

    const where: any = {};
    if (maDanhMuc && maDanhMuc !== "ALL") {
      where.MaDanhMuc = maDanhMuc;
    }
    if (keyword) {
      where.OR = [
        { MaSP: { contains: keyword } },
        { TenSP: { contains: keyword } },
      ];
    }

    const products = await prisma.sanPham.findMany({
      where,
      include: {
        DanhMuc: true,
        _count: {
          select: {
            ChiTietDonHangs: true,
            ChiTietHoaDonKhos: true,
          },
        },
      },
      orderBy: { MaSP: "asc" },
    });

    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    console.error("GET san-pham error:", error);
    return NextResponse.json({ error: "Lỗi tải danh sách sản phẩm" }, { status: 500 });
  }
}

// POST: Them san pham moi
export async function POST(request: Request) {
  try {
    const auth = await requireFeature("sanPham");
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { maSP, tenSP, giaBan, soLuong, trongLuong, hinhAnh, moTa, maDanhMuc } = body;

    if (!maSP || !tenSP || !giaBan || !maDanhMuc) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ: Mã SP, Tên SP, Giá bán và Danh mục" },
        { status: 400 }
      );
    }

    // Kiem tra trung ma
    const existing = await prisma.sanPham.findUnique({
      where: { MaSP: maSP.trim() },
    });
    if (existing) {
      return NextResponse.json({ error: "Mã sản phẩm đã tồn tại" }, { status: 409 });
    }

    const image = validateHinhAnh(hinhAnh ?? "");
    if (!image.ok) {
      return NextResponse.json({ error: image.error }, { status: 400 });
    }

    const newProd = await prisma.sanPham.create({
      data: {
        MaSP: maSP.trim().toUpperCase(),
        TenSP: tenSP.trim(),
        GiaBan: Number(giaBan),
        SoLuong: Number(soLuong) || 0,
        TrongLuong: trongLuong || "4U",
        HinhAnh: image.value,
        MoTa: moTa || "",
        MaDanhMuc: maDanhMuc,
      },
    });

    return NextResponse.json({ success: true, data: newProd });
  } catch (error: any) {
    console.error("POST san-pham error:", error);
    return NextResponse.json({ error: "Lỗi thêm sản phẩm mới" }, { status: 500 });
  }
}

// PUT: Cap nhat san pham
export async function PUT(request: Request) {
  try {
    const auth = await requireFeature("sanPham");
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { maSP, tenSP, giaBan, soLuong, trongLuong, hinhAnh, moTa, maDanhMuc } = body;

    if (!maSP) {
      return NextResponse.json({ error: "Thiếu mã sản phẩm" }, { status: 400 });
    }

    const image = validateHinhAnh(hinhAnh);
    if (!image.ok) {
      return NextResponse.json({ error: image.error }, { status: 400 });
    }

    const updated = await prisma.sanPham.update({
      where: { MaSP: maSP },
      data: {
        TenSP: tenSP?.trim(),
        GiaBan: giaBan !== undefined ? Number(giaBan) : undefined,
        SoLuong: soLuong !== undefined ? Number(soLuong) : undefined,
        TrongLuong: trongLuong,
        HinhAnh: image.value,
        MoTa: moTa,
        MaDanhMuc: maDanhMuc,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT san-pham error:", error);
    return NextResponse.json({ error: "Lỗi cập nhật sản phẩm" }, { status: 500 });
  }
}

// DELETE: Xoa hoac chuyen sang ngung kinh doanh
export async function DELETE(request: Request) {
  try {
    const auth = await requireFeature("sanPham");
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const maSP = searchParams.get("maSP");

    if (!maSP) {
      return NextResponse.json({ error: "Thiếu mã sản phẩm cần xóa" }, { status: 400 });
    }

    const existing = await prisma.sanPham.findUnique({ where: { MaSP: maSP }, select: { MaSP: true } });
    if (!existing) {
      return NextResponse.json({ error: "Sản phẩm không tồn tại hoặc đã bị xóa" }, { status: 404 });
    }

    // Kiem tra rang buoc giao dich trong ChiTietDonHang, ChiTietHoaDonKho va lo hang trong kho (HangHoaKho)
    const [donHangCount, hoaDonKhoCount, loHangCount] = await Promise.all([
      prisma.chiTietDonHang.count({ where: { MaSP: maSP } }),
      prisma.chiTietHoaDonKho.count({ where: { MaSP: maSP } }),
      prisma.hangHoaKho.count({ where: { MaSP: maSP } }),
    ]);

    if (donHangCount > 0 || hoaDonKhoCount > 0 || loHangCount > 0) {
      // Khong duoc xoa cung, cap nhat trang thai ngung kinh doanh vao MoTa
      const sp = await prisma.sanPham.findUnique({ where: { MaSP: maSP } });
      const currentMoTa = sp?.MoTa || "";
      const updatedMoTa = currentMoTa.includes("[NGỪNG KINH DOANH]")
        ? currentMoTa
        : `[NGỪNG KINH DOANH] ${currentMoTa}`;

      await prisma.sanPham.update({
        where: { MaSP: maSP },
        data: {
          MoTa: updatedMoTa,
        },
      });

      return NextResponse.json({
        success: true,
        softDeleted: true,
        message: "Không thể xóa sản phẩm do đã có lịch sử giao dịch. Đã chuyển sang ngừng kinh doanh.",
      });
    }

    // Neu chua tung co giao dich thi xoa cung
    await prisma.sanPham.delete({
      where: { MaSP: maSP },
    });

    return NextResponse.json({
      success: true,
      softDeleted: false,
      message: "Đã xóa sản phẩm thành công.",
    });
  } catch (error: any) {
    console.error("DELETE san-pham error:", error);
    return NextResponse.json({ error: "Lỗi khi xóa sản phẩm" }, { status: 500 });
  }
}
