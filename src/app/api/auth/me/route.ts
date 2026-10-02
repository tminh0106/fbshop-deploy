import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentCustomer } from "@/lib/auth";
import { EMAIL_ERROR, EMAIL_REGEX } from "@/lib/validation";

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

    // Cung quy tac voi dang ky (Bang 3.38): ho ten, email bat buoc; email khong trung khach khac
    const name = typeof hoTen === "string" ? hoTen.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Họ tên không được để trống" }, { status: 400 });
    }
    if (name.length > 100) {
      return NextResponse.json({ error: "Họ tên tối đa 100 ký tự" }, { status: 400 });
    }

    const emailValue = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!emailValue) {
      return NextResponse.json({ error: "Email không được để trống" }, { status: 400 });
    }
    if (emailValue.length > 100 || !EMAIL_REGEX.test(emailValue)) {
      return NextResponse.json({ error: EMAIL_ERROR }, { status: 400 });
    }

    const address = typeof diaChi === "string" ? diaChi.trim() : "";
    if (address.length > 255) {
      return NextResponse.json({ error: "Địa chỉ tối đa 255 ký tự" }, { status: 400 });
    }

    const emailTaken = await prisma.khachHang.findFirst({
      where: { Email: emailValue, NOT: { MaKH: current.MaKH } },
    });
    if (emailTaken) {
      return NextResponse.json({ error: "Email đã được sử dụng" }, { status: 409 });
    }

    const updated = await prisma.khachHang.update({
      where: { MaKH: current.MaKH },
      data: {
        HoTen: name,
        Email: emailValue,
        DiaChi: address || null,
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