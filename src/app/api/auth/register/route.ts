import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hashPassword, generateToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hoTen, soDienThoai, email, diaChi, matKhau, xacNhanMatKhau } = body;

    // Validate
    if (!hoTen || typeof hoTen !== "string" || !hoTen.trim()) {
      return NextResponse.json({ error: "Họ tên không được để trống" }, { status: 400 });
    }

    const phoneRegex = /^0\d{9}$/;
    if (!soDienThoai || !phoneRegex.test(soDienThoai.trim())) {
      return NextResponse.json(
        { error: "Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng số 0" },
        { status: 400 }
      );
    }

    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json({ error: "Email không đúng định dạng" }, { status: 400 });
      }
    }

    if (!matKhau || matKhau.length < 6) {
      return NextResponse.json({ error: "Mật khẩu phải từ 6 ký tự trở lên" }, { status: 400 });
    }

    if (matKhau !== xacNhanMatKhau) {
      return NextResponse.json({ error: "Xác nhận mật khẩu không khớp" }, { status: 400 });
    }

    // Kiem tra trung so dien thoai
    const existing = await prisma.khachHang.findUnique({
      where: { SoDienThoai: soDienThoai.trim() },
    });

    if (existing) {
      return NextResponse.json({ error: "Số điện thoại đã được sử dụng" }, { status: 409 });
    }

    // Hash mat khau
    const hashedPassword = await hashPassword(matKhau);

    // Tao ban ghi KhachHang
    const customer = await prisma.khachHang.create({
      data: {
        HoTen: hoTen.trim(),
        SoDienThoai: soDienThoai.trim(),
        Email: email?.trim() || null,
        DiaChi: diaChi?.trim() || null,
        MatKhau: hashedPassword,
      },
    });

    // Tao JWT token
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
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng thử lại!" },
      { status: 500 }
    );
  }
}