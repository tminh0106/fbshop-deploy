import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasFeature, isStaffRole, normalizeRole, type Feature } from "@/lib/permissions";
import {
  generateAdminToken,
  generateToken,
  verifyAdminToken,
  verifyToken,
  type AdminTokenPayload,
  type CustomerTokenPayload,
} from "@/lib/jwt";

export { generateAdminToken, generateToken, verifyAdminToken, verifyToken };
export type { AdminTokenPayload, CustomerTokenPayload };

// Trang thai tai khoan bi khoa (khop voi kiem tra o /api/admin/auth/login)
const LOCKED_STATUSES = ["Khoa", "Locked"];

/**
 * Hash mat khau bang bcryptjs voi saltRounds = 10
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Kiem tra mat khau
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}


/**
 * Lay thong tin khach hang hien tai tu cookie hoac token
 */
export async function getCurrentCustomer(tokenParam?: string) {
  try {
    let token = tokenParam;
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get("fbshop_token")?.value;
    }

    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload?.maKH) return null;

    const customer = await prisma.khachHang.findUnique({
      where: { MaKH: payload.maKH },
      select: {
        MaKH: true,
        HoTen: true,
        SoDienThoai: true,
        Email: true,
        DiaChi: true,
      },
    });

    return customer;
  } catch (err) {
    console.error("getCurrentCustomer error:", err);
    return null;
  }
}

/**
 * Lay thong tin admin / staff hien tai tu cookie fbshop_admin_token
 */
export async function getCurrentAdmin(tokenParam?: string): Promise<AdminTokenPayload | null> {
  try {
    let token = tokenParam;
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get("fbshop_admin_token")?.value;
    }

    if (!token) return null;

    const payload = verifyAdminToken(token);
    if (!payload?.maTK) return null;

    // Doc lai tai khoan tu CSDL: tai khoan bi khoa/xoa mat quyen ngay,
    // doi vai tro co hieu luc ngay (khong doi token 7 ngay het han)
    const taiKhoan = await prisma.taiKhoan.findUnique({
      where: { MaTK: payload.maTK },
      select: { PhanQuyen: true, TrangThai: true },
    });
    if (!taiKhoan || LOCKED_STATUSES.includes(taiKhoan.TrangThai)) return null;

    // Chi nhan vien noi bo (Admin / NhanVienKho / BanHang); ten vai tro cu duoc chuan hoa
    if (!isStaffRole(taiKhoan.PhanQuyen)) return null;
    return { ...payload, role: normalizeRole(taiKhoan.PhanQuyen)! };
  } catch (err) {
    console.error("getCurrentAdmin error:", err);
    return null;
  }
}

/**
 * Chan API theo ma tran quyen (src/lib/permissions.ts).
 * Dung: const auth = await requireFeature("kho"); if (!auth.ok) return auth.response;
 */
export async function requireFeature(
  feature: Feature | Feature[]
): Promise<{ ok: true; user: AdminTokenPayload } | { ok: false; response: NextResponse }> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Chưa đăng nhập hoặc phiên đã hết hạn" }, { status: 401 }),
    };
  }
  // Nhan mang = chi can co 1 trong cac quyen (vd: doc danh sach NCC khi lap phieu kho)
  const features = Array.isArray(feature) ? feature : [feature];
  if (!features.some((f) => hasFeature(admin.role, f))) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Bạn không có quyền thực hiện thao tác này" }, { status: 403 }),
    };
  }
  return { ok: true, user: admin };
}
