import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hashPassword, requireRoles } from "@/lib/auth";

// GET: Danh sach tai khoan
export async function GET() {
  try {
    const authCheck = await requireRoles(["Admin"]);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const accounts = await prisma.taiKhoan.findMany({
      include: {
        NhanVien: true,
      },
      orderBy: { MaTK: "asc" },
    });

    return NextResponse.json({ success: true, data: accounts });
  } catch (error: any) {
    console.error("GET tai-khoan error:", error);
    return NextResponse.json({ error: "Lỗi tải danh sách tài khoản" }, { status: 500 });
  }
}

// POST: Tao tai khoan moi
export async function POST(request: Request) {
  try {
    const authCheck = await requireRoles(["Admin"]);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { tenDangNhap, matKhau, phanQuyen, maNV } = body;

    if (!tenDangNhap || !matKhau || !phanQuyen) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ tên đăng nhập, mật khẩu và phân quyền" },
        { status: 400 }
      );
    }

    const existing = await prisma.taiKhoan.findUnique({
      where: { TenDangNhap: tenDangNhap.trim() },
    });
    if (existing) {
      return NextResponse.json({ error: "Tên đăng nhập này đã được sử dụng" }, { status: 409 });
    }

    const hashed = await hashPassword(matKhau);
    const newAcc = await prisma.taiKhoan.create({
      data: {
        TenDangNhap: tenDangNhap.trim(),
        MatKhau: hashed,
        PhanQuyen: phanQuyen,
        TrangThai: "Active",
        MaNV: maNV || null,
      },
    });

    return NextResponse.json({ success: true, data: newAcc });
  } catch (error: any) {
    console.error("POST tai-khoan error:", error);
    return NextResponse.json({ error: "Lỗi tạo tài khoản mới" }, { status: 500 });
  }
}

// PUT: Cap nhat / Mo khoa / Doi mat khau
export async function PUT(request: Request) {
  try {
    const authCheck = await requireRoles(["Admin"]);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { maTK, phanQuyen, trangThai, matKhauMoi } = body;

    if (!maTK) {
      return NextResponse.json({ error: "Thiếu mã tài khoản" }, { status: 400 });
    }

    const data: any = {};
    if (phanQuyen) data.PhanQuyen = phanQuyen;
    if (trangThai) data.TrangThai = trangThai;
    if (matKhauMoi && matKhauMoi.trim().length >= 6) {
      data.MatKhau = await hashPassword(matKhauMoi.trim());
    }

    const updated = await prisma.taiKhoan.update({
      where: { MaTK: maTK },
      data,
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật tài khoản thành công",
      data: updated,
    });
  } catch (error: any) {
    console.error("PUT tai-khoan error:", error);
    return NextResponse.json({ error: "Lỗi cập nhật tài khoản" }, { status: 500 });
  }
}

// DELETE: Xoa tai khoan
export async function DELETE(request: Request) {
  try {
    const authCheck = await requireRoles(["Admin"]);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const maTK = searchParams.get("maTK");

    if (!maTK) {
      return NextResponse.json({ error: "Thiếu mã tài khoản" }, { status: 400 });
    }

    await prisma.taiKhoan.delete({
      where: { MaTK: maTK },
    });

    return NextResponse.json({ success: true, message: "Đã xóa tài khoản" });
  } catch (error: any) {
    console.error("DELETE tai-khoan error:", error);
    return NextResponse.json({ error: "Lỗi khi xóa tài khoản" }, { status: 500 });
  }
}
