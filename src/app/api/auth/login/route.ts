import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyPassword, generateToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { soDienThoai, matKhau } = body;

    if (!soDienThoai || !matKhau) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ số điện thoại và mật khẩu" },
        { status: 400 }
      );
    }

    const trimmed = soDienThoai.trim().toLowerCase();
    if (
      trimmed.includes("@fbshop.vn") ||
      ["admin", "kho", "quanlykho", "banhang", "nhanvien"].includes(trimmed)
    ) {
      return NextResponse.json(
        {
          error: "Đây là tài khoản Nhân viên / Quản trị. Vui lòng đăng nhập tại Cổng Quản trị (/admin/login).",
        },
        { status: 401 }
      );
    }

    const customer = await prisma.khachHang.findUnique({
      where: { SoDienThoai: soDienThoai.trim() },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Số điện thoại hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(matKhau, customer.MatKhau);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Số điện thoại hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }

    const token = generateToken({
      maKH: customer.MaKH,
      hoTen: customer.HoTen,
      sdt: customer.SoDienThoai,
    });

    const response = NextResponse.json({
      success: true,
      customer: {
        maKH: customer.MaKH,
        hoTen: customer.HoTen,
        soDienThoai: customer.SoDienThoai,
      },
    });

    response.cookies.set("fbshop_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi đăng nhập. Vui lòng thử lại!" },
      { status: 500 }
    );
  }
}