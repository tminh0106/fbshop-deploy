// =======================================================
// JWT: ky va xac thuc token (khong phu thuoc CSDL)
// Tach rieng de proxy.ts dung duoc ma khong keo theo Prisma
// =======================================================
import jwt from "jsonwebtoken";

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
  role: string; // "Admin" | "NhanVienKho" | "BanHang" (xem src/lib/permissions.ts)
  maNV?: string | null;
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
