import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hashPassword, requireFeature, verifyPassword } from "@/lib/auth";

// POST: Nhan vien tu doi mat khau cua chinh minh
// Bang 3.51 Doi mat khau - Tac nhan: Nhan vien, Quan ly, Quan tri vien
// FR-02: phai xac thuc chinh xac mat khau hien tai
export async function POST(request: Request) {
  try {
    // "dashboard" = moi vai tro noi bo dang dang nhap
    const auth = await requireFeature("dashboard");
    if (!auth.ok) return auth.response;

    const { matKhauCu, matKhauMoi } = await request.json();

    if (!matKhauCu || !matKhauMoi) {
      return NextResponse.json(
        { error: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới" },
        { status: 400 }
      );
    }
    if (typeof matKhauMoi !== "string" || matKhauMoi.trim().length < 6) {
      return NextResponse.json({ error: "Mật khẩu mới phải có ít nhất 6 ký tự" }, { status: 400 });
    }
    if (matKhauMoi === matKhauCu) {
      return NextResponse.json(
        { error: "Mật khẩu mới phải khác mật khẩu hiện tại" },
        { status: 400 }
      );
    }

    const taiKhoan = await prisma.taiKhoan.findUnique({
      where: { MaTK: auth.user.maTK },
      select: { MatKhau: true },
    });
    if (!taiKhoan || !(await verifyPassword(matKhauCu, taiKhoan.MatKhau))) {
      return NextResponse.json({ error: "Mật khẩu cũ không chính xác" }, { status: 400 });
    }

    await prisma.taiKhoan.update({
      where: { MaTK: auth.user.maTK },
      data: { MatKhau: await hashPassword(matKhauMoi.trim()) },
    });

    return NextResponse.json({ success: true, message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error("POST doi-mat-khau error:", error);
    return NextResponse.json({ error: "Lỗi khi đổi mật khẩu" }, { status: 500 });
  }
}
