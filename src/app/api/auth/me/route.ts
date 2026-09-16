import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentCustomer } from "@/lib/auth";

export async function GET() {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json({ customer: null });
    }

    return NextResponse.json({
      customer: {
        maKH: customer.MaKH,
        hoTen: customer.HoTen,
        soDienThoai: customer.SoDienThoai,
        email: customer.Email,
        diaChi: customer.DiaChi,
      },
    });
  } catch (error: any) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json({ customer: null });
  }
}

export async function PUT(request: Request) {
  try {
    const current = await getCurrentCustomer();
    if (!current) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const body = await request.json();
    const { hoTen, email, diaChi } = body;

    if (!hoTen || !hoTen.trim()) {
      return NextResponse.json({ error: "Họ tên không được để trống" }, { status: 400 });
    }

    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json({ error: "Email không đúng định dạng" }, { status: 400 });
      }
    }

    const updated = await prisma.khachHang.update({
      where: { MaKH: current.MaKH },
      data: {
        HoTen: hoTen.trim(),
        Email: email?.trim() || null,
        DiaChi: diaChi?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      customer: {
        maKH: updated.MaKH,
        hoTen: updated.HoTen,
        soDienThoai: updated.SoDienThoai,
        email: updated.Email,
        diaChi: updated.DiaChi,
      },
    });
  } catch (error: any) {
    console.error("PUT /api/auth/me error:", error);
    return NextResponse.json(
      { error: "Cập nhật thông tin thất bại" },
      { status: 500 }
    );
  }
}