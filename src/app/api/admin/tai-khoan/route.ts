import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { hashPassword, requireFeature } from "@/lib/auth";
import { isStaffRole, normalizeRole, ROLES } from "@/lib/permissions";

// =======================================================
// QUAN LY TAI KHOAN - Bang 3.48 (Them), 3.49 (Sua), 3.50 (Xoa) - FR-03
// Tac nhan: Quan tri vien he thong (Admin)
// =======================================================

const INVALID_ROLE_ERROR = "Vai trò không hợp lệ (chỉ nhận Admin, NhanVienKho, BanHang)";
const NOT_FOUND_ERROR = "Tài khoản không tồn tại";

const STATUS_ACTIVE = "Active";
const LOCKED_STATUSES = ["Khoa", "Locked"];
const ALLOWED_STATUSES = [STATUS_ACTIVE, "Hoat dong", ...LOCKED_STATUSES];
const EMPLOYEE_RESIGNED = "Da nghi viec";

// Ten dang nhap: 3-100 ky tu (VarChar 100), khong dau cach; chu, so, . _ - @
const USERNAME_RE = /^[a-z0-9._@-]{3,100}$/;
const MIN_PASSWORD = 6;
const MAX_PASSWORD = 100;

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });
const isLocked = (s: string) => LOCKED_STATUSES.includes(s);

const ACCOUNT_SELECT = {
  MaTK: true,
  TenDangNhap: true,
  PhanQuyen: true,
  TrangThai: true,
  MaNV: true,
  NhanVien: { select: { MaNV: true, HoTen: true, SoDienThoai: true, TrangThai: true } },
} satisfies Prisma.TaiKhoanSelect;

function checkPassword(pw: unknown): string | null {
  if (typeof pw !== "string" || pw.length < MIN_PASSWORD) return `Mật khẩu phải có ít nhất ${MIN_PASSWORD} ký tự`;
  if (pw.length > MAX_PASSWORD) return `Mật khẩu tối đa ${MAX_PASSWORD} ký tự`;
  return null;
}

// GET: Danh sach tai khoan + nhan vien con co the cap tai khoan
export async function GET() {
  try {
    const auth = await requireFeature("taiKhoan");
    if (!auth.ok) return auth.response;

    // Khong tra ve MatKhau (ma bam) cho trinh duyet
    const [accounts, availableEmployees] = await Promise.all([
      prisma.taiKhoan.findMany({ select: ACCOUNT_SELECT, orderBy: { MaTK: "asc" } }),
      // Moi nhan vien 1 tai khoan; nguoi da nghi viec khong duoc cap
      prisma.nhanVien.findMany({
        where: { TaiKhoans: { none: {} }, TrangThai: { not: EMPLOYEE_RESIGNED } },
        select: { MaNV: true, HoTen: true },
        orderBy: { MaNV: "asc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: accounts,
      availableEmployees,
      currentMaTK: auth.user.maTK, // de giao dien an nut xoa/khoa chinh minh
    });
  } catch (error) {
    console.error("GET tai-khoan error:", error);
    return bad("Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại!", 500);
  }
}

// POST: Them tai khoan - Bang 3.48 (A1 trung, A2 bo trong/khong hop le)
export async function POST(request: Request) {
  try {
    const auth = await requireFeature("taiKhoan");
    if (!auth.ok) return auth.response;

    const { tenDangNhap, matKhau, phanQuyen, maNV, trangThai } = await request.json();

    // A2 - Bo trong truong bat buoc
    if (!tenDangNhap || typeof tenDangNhap !== "string" || !tenDangNhap.trim()) return bad("Vui lòng nhập tên đăng nhập");
    if (!matKhau) return bad("Vui lòng nhập mật khẩu");
    if (!phanQuyen) return bad("Vui lòng chọn phân quyền");
    if (!maNV) return bad("Vui lòng chọn nhân viên sở hữu tài khoản");

    const username = tenDangNhap.trim().toLowerCase();
    if (!USERNAME_RE.test(username)) {
      return bad("Tên đăng nhập 3–100 ký tự, không dấu cách, chỉ gồm chữ, số và . _ - @");
    }
    const pwError = checkPassword(matKhau);
    if (pwError) return bad(pwError);
    if (!isStaffRole(phanQuyen)) return bad(INVALID_ROLE_ERROR);
    const status = trangThai || STATUS_ACTIVE;
    if (!ALLOWED_STATUSES.includes(status)) return bad("Trạng thái không hợp lệ");

    // FR-03: tai khoan gan voi nhan vien cu the, moi nhan vien 1 tai khoan, khong cap cho nguoi da nghi
    const emp = await prisma.nhanVien.findUnique({ where: { MaNV: maNV }, include: { TaiKhoans: true } });
    if (!emp) return bad("Nhân viên không tồn tại");
    if (emp.TrangThai === EMPLOYEE_RESIGNED) return bad("Nhân viên đã nghỉ việc, không thể cấp tài khoản");
    if (emp.TaiKhoans.length > 0) {
      return bad(`Nhân viên ${emp.HoTen} đã có tài khoản ${emp.TaiKhoans[0].TenDangNhap}`, 409);
    }

    // A1 - Trung tai khoan
    const existing = await prisma.taiKhoan.findUnique({ where: { TenDangNhap: username } });
    if (existing) return bad("Tài khoản đã tồn tại", 409);

    const newAcc = await prisma.taiKhoan.create({
      data: {
        TenDangNhap: username,
        MatKhau: await hashPassword(matKhau),
        PhanQuyen: normalizeRole(phanQuyen)!,
        TrangThai: status,
        MaNV: maNV,
      },
      select: ACCOUNT_SELECT,
    });

    return NextResponse.json({ success: true, message: "Thêm tài khoản thành công", data: newAcc });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return bad("Tài khoản đã tồn tại", 409);
    }
    console.error("POST tai-khoan error:", error);
    return bad("Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại!", 500);
  }
}

// PUT: Sua tai khoan - Bang 3.49 (phan quyen, trang thai, dat lai mat khau)
export async function PUT(request: Request) {
  try {
    const auth = await requireFeature("taiKhoan");
    if (!auth.ok) return auth.response;

    const { maTK, phanQuyen, trangThai, matKhauMoi } = await request.json();
    if (!maTK) return bad("Thiếu mã tài khoản");

    // A2 - Tai khoan da bi xoa boi phien lam viec khac
    const current = await prisma.taiKhoan.findUnique({ where: { MaTK: maTK }, include: { NhanVien: true } });
    if (!current) return bad(NOT_FOUND_ERROR, 404);

    const isSelf = maTK === auth.user.maTK;
    const data: Prisma.TaiKhoanUpdateInput = {};

    if (phanQuyen !== undefined && phanQuyen !== null && phanQuyen !== "") {
      if (!isStaffRole(phanQuyen)) return bad(INVALID_ROLE_ERROR);
      // Khong tu ha quyen (tranh mat quyen quan tri)
      if (isSelf && normalizeRole(phanQuyen) !== ROLES.ADMIN) {
        return bad("Không thể tự hạ quyền tài khoản đang đăng nhập");
      }
      data.PhanQuyen = normalizeRole(phanQuyen)!;
    }

    if (trangThai !== undefined && trangThai !== null && trangThai !== "") {
      if (!ALLOWED_STATUSES.includes(trangThai)) return bad("Trạng thái không hợp lệ");
      if (isSelf && isLocked(trangThai)) return bad("Không thể tự khóa tài khoản đang đăng nhập");
      // FR-28: nhan vien da nghi viec thi tai khoan phai giu khoa
      if (!isLocked(trangThai) && isLocked(current.TrangThai) && current.NhanVien?.TrangThai === EMPLOYEE_RESIGNED) {
        return bad("Nhân viên sở hữu tài khoản đã nghỉ việc, không thể mở khóa");
      }
      data.TrangThai = trangThai;
    }

    if (matKhauMoi !== undefined && matKhauMoi !== null && matKhauMoi !== "") {
      // Truoc day mat khau < 6 ky tu bi bo qua ngam nhung van bao thanh cong
      const pwError = checkPassword(matKhauMoi);
      if (pwError) return bad(pwError);
      data.MatKhau = await hashPassword(matKhauMoi);
    }

    // A1 - Khong co du lieu hop le de cap nhat
    if (Object.keys(data).length === 0) return bad("Không có thông tin nào để cập nhật");

    const updated = await prisma.taiKhoan.update({ where: { MaTK: maTK }, data, select: ACCOUNT_SELECT });
    return NextResponse.json({ success: true, message: "Cập nhật thành công", data: updated });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return bad(NOT_FOUND_ERROR, 404);
    }
    console.error("PUT tai-khoan error:", error);
    return bad("Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại!", 500);
  }
}

// DELETE: Xoa tai khoan - Bang 3.50 (khong the tu xoa tai khoan dang dang nhap)
export async function DELETE(request: Request) {
  try {
    const auth = await requireFeature("taiKhoan");
    if (!auth.ok) return auth.response;

    const maTK = new URL(request.url).searchParams.get("maTK");
    if (!maTK) return bad("Thiếu mã tài khoản");
    if (maTK === auth.user.maTK) return bad("Không thể tự xóa tài khoản đang đăng nhập");

    const existing = await prisma.taiKhoan.findUnique({ where: { MaTK: maTK } });
    if (!existing) return bad(NOT_FOUND_ERROR, 404);

    // Tai khoan khong co bang nao tham chieu (phieu kho gan voi NhanVien, khong gan TaiKhoan)
    await prisma.taiKhoan.delete({ where: { MaTK: maTK } });
    return NextResponse.json({ success: true, message: "Xóa thành công" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return bad(NOT_FOUND_ERROR, 404);
    }
    console.error("DELETE tai-khoan error:", error);
    return bad("Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại!", 500);
  }
}
