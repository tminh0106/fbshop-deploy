import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "@/lib/db";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "fbshop-jwt-secret-key-2026-very-secure";

export interface CustomerTokenPayload {
  maKH: string;
  hoTen: string;
  sdt: string;
}

export interface AdminTokenPayload {
  maTK: string;
  tenDangNhap: string;
  hoTen: string;
  role: string; // "Admin" | "QuanLyKho" | "NhanVien"
  maNV?: string | null;
}

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
 * Tao JWT token thoi han 7 ngay cho khach hang
 */
export function generateToken(payload: CustomerTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Tao JWT token thoi han 7 ngay cho admin/staff
 */
export function generateAdminToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Verify JWT token, tra ve payload hoac null neu khong hop le
 */
export function verifyToken(token: string): CustomerTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as CustomerTokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Verify JWT Admin token
 */
export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
    return decoded;
  } catch {
    return null;
  }
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

    return payload;
  } catch (err) {
    console.error("getCurrentAdmin error:", err);
    return null;
  }
}

/**
 * Kiem tra quyen cho API Route
 */
export async function requireRoles(allowedRoles: string[]) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { error: "Chưa đăng nhập", status: 401 };
  }
  if (!allowedRoles.includes(admin.role)) {
    return { error: "Bạn không có quyền thực hiện thao tác này", status: 403 };
  }
  return { user: admin, status: 200 };
}