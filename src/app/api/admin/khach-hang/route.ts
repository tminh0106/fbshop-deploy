import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hashPassword } from "@/lib/auth";

const PHONE_REGEX = /^0\d{9}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;

// ==========================================
// GET /api/admin/khach-hang: Danh sách khách hàng
// ==========================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword")?.trim();

    const where: any = {};
    if (keyword) {
      where.OR = [
        { HoTen: { contains: keyword } },
        { SoDienThoai: { contains: keyword } },
        { Email: { contains: keyword } },
      ];
    }

    const customers = await prisma.khachHang.findMany({
      where,
      include: {
        DonHangs: {
          select: {
            MaDH: true,
            TongTien: true,
            TrangThai: true,
            NgayTao: true,
          },
          orderBy: { NgayTao: "desc" },
        },
      },
      orderBy: { HoTen: "asc" },
    });

    const formatted = customers.map((c) => {
      const validOrders = c.DonHangs.filter((o) => o.TrangThai !== "Da huy");
      const totalSpent = validOrders.reduce((sum, o) => sum + Number(o.TongTien), 0);
      const latestOrder = c.DonHangs[0]?.NgayTao || null;

      return {
        maKH: c.MaKH,
        hoTen: c.HoTen,
        soDienThoai: c.SoDienThoai,
        email: c.Email || "Chưa cập nhật",
        diaChi: c.DiaChi || "Chưa cập nhật",
        soDonHang: c.DonHangs.length,
        soDonThanhCong: validOrders.length,
        tongChiTieu: totalSpent,
        donGanNhat: latestOrder,
        danhSachDonHang: c.DonHangs.slice(0, 5),
      };
    });

    return NextResponse.json({
      success: true,
      customers: formatted,
      total: formatted.length,
    });
  } catch (error: any) {
    console.error("GET /api/admin/khach-hang error:", error);
    return NextResponse.json(
      { error: "Lỗi tải danh sách khách hàng" },
      { status: 500 }
    );
  }
}

// ==========================================
// POST /api/admin/khach-hang: Tạo khách hàng mới
// ==========================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hoTen, soDienThoai, email, diaChi, matKhau = "123456" } = body;

    if (!hoTen || !hoTen.trim()) {
      return NextResponse.json({ error: "Vui lòng nhập họ tên khách hàng" }, { status: 400 });
    }

    const cleanPhone = soDienThoai ? soDienThoai.trim() : "";
    if (!cleanPhone || !PHONE_REGEX.test(cleanPhone)) {
      return NextResponse.json(
        { error: "Số điện thoại không đúng định dạng (phải gồm 10 số và bắt đầu bằng số 0)" },
        { status: 400 }
      );
    }

    if (email && email.trim() && !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { error: "Địa chỉ email không đúng định dạng chuẩn" },
        { status: 400 }
      );
    }

    // Kiểm tra trùng SĐT
    const existing = await prisma.khachHang.findUnique({
      where: { SoDienThoai: cleanPhone },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Số điện thoại này đã được đăng ký cho khách hàng khác" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(matKhau);
    const newCustomer = await prisma.khachHang.create({
      data: {
        HoTen: hoTen.trim(),
        SoDienThoai: cleanPhone,
        Email: email?.trim() || null,
        DiaChi: diaChi?.trim() || null,
        MatKhau: hashedPassword,
      },
    });

    return NextResponse.json({
      success: true,
      customer: {
        maKH: newCustomer.MaKH,
        hoTen: newCustomer.HoTen,
        soDienThoai: newCustomer.SoDienThoai,
      },
      message: "Thêm khách hàng thành công",
    });
  } catch (error: any) {
    console.error("POST /api/admin/khach-hang error:", error);
    return NextResponse.json(
      { error: "Không thể tạo khách hàng mới" },
      { status: 500 }
    );
  }
}
