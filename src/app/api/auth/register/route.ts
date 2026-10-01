import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hashPassword, generateToken } from "@/lib/auth";
import { EMAIL_ERROR, EMAIL_REGEX } from "@/lib/validation";

// Bang 3.38 / FR-04: bat buoc Ho ten, SDT, Email, Mat khau; chan trung SDT va Email

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

    const emailValue = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!emailValue) {
      return NextResponse.json({ error: "Email không được để trống" }, { status: 400 });
    }
    if (emailValue.length > 100 || !EMAIL_REGEX.test(emailValue)) {
      return NextResponse.json({ error: EMAIL_ERROR }, { status: 400 });
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

    // Trung email (Bang 3.38 - luong phu)
    const emailTaken = await prisma.khachHang.findFirst({ where: { Email: emailValue } });
    if (emailTaken) {
      return NextResponse.json({ error: "Email đã được sử dụng" }, { status: 409 });
    }

    // Hash mat khau
    const hashedPassword = await hashPassword(matKhau);

    // Tao ban ghi KhachHang
    const customer = await prisma.khachHang.create({
      data: {
        HoTen: hoTen.trim(),
        SoDienThoai: soDienThoai.trim(),
        Email: emailValue,
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