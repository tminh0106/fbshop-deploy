import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyPassword, generateAdminToken } from "@/lib/auth";
import { isStaffRole, normalizeRole } from "@/lib/permissions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenDangNhap, matKhau } = body;

    if (!tenDangNhap || !matKhau) {
      return NextResponse.json(
        { error: "Vui lòng nhập tên đăng nhập và mật khẩu" },
        { status: 400 }
      );
    }

    let trimmedUser = tenDangNhap.trim().toLowerCase();
    const cleanUser = trimmedUser.replace("@fbshop.vn", "");

    // Alias mapping giua cac file seed
    const candidateUsernames = [
      trimmedUser,
      cleanUser,
      `${cleanUser}@fbshop.vn`,
    ];
    if (cleanUser === "kho" || cleanUser === "quanlykho") {
      candidateUsernames.push("quanlykho", "kho", "kho@fbshop.vn", "quanlykho@fbshop.vn");
    }
    if (cleanUser === "banhang" || cleanUser === "nhanvien") {
      candidateUsernames.push("nhanvien", "banhang", "banhang@fbshop.vn", "nhanvien@fbshop.vn");
    }
    if (cleanUser === "admin") {
      candidateUsernames.push("admin", "admin@fbshop.vn");
    }

    // Tim tai khoan theo TenDangNhap
    const taiKhoan = await prisma.taiKhoan.findFirst({
      where: {
        TenDangNhap: { in: candidateUsernames },
      },
      include: {
        NhanVien: true,
      },
    });

    if (!taiKhoan) {
      return NextResponse.json(
        { error: "Tên đăng nhập hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }

    if (taiKhoan.TrangThai === "Khoa" || taiKhoan.TrangThai === "Locked") {
      return NextResponse.json(
        { error: "Tài khoản đang bị khóa. Vui lòng liên hệ Quản trị viên để mở khóa!" },
        { status: 403 }
      );
    }

    const isMatch = await verifyPassword(matKhau, taiKhoan.MatKhau);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Tên đăng nhập hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }

    // Cong quan tri chi danh cho 3 vai tro noi bo (FR-03): Admin, NhanVienKho, BanHang
    if (!isStaffRole(taiKhoan.PhanQuyen)) {
      return NextResponse.json(
        { error: "Tài khoản không có quyền truy cập trang quản trị" },
        { status: 403 }
      );
    }
    const role = normalizeRole(taiKhoan.PhanQuyen)!;

    const hoTen = taiKhoan.NhanVien?.HoTen || taiKhoan.TenDangNhap;
    const token = generateAdminToken({
      maTK: taiKhoan.MaTK,
      tenDangNhap: taiKhoan.TenDangNhap,
      hoTen,
      role,
      maNV: taiKhoan.MaNV,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        maTK: taiKhoan.MaTK,
        tenDangNhap: taiKhoan.TenDangNhap,
        hoTen,
        role,
        maNV: taiKhoan.MaNV,
      },
    });

    response.cookies.set("fbshop_admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Admin Login error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi trong quá trình đăng nhập máy chủ" },
      { status: 500 }
    );
  }
}
