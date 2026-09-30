// =======================================================
// PROXY (Next.js 16, truoc day la middleware) - CHAN TRANG THEO VAI TRO
// - Xac thuc chu ky JWT (khong chi giai ma) -> cookie gia mao bi tu choi
// - Quyen trang lay tu ma tran chung src/lib/permissions.ts
// - Du lieu van duoc chan lan nua o tung API route (requireFeature)
// =======================================================
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminToken, verifyToken } from "@/lib/jwt";
import { canAccessPath, isStaffRole } from "@/lib/permissions";

const ADMIN_COOKIE = "fbshop_admin_token";
const CUSTOMER_COOKIE = "fbshop_token";

function redirectTo(request: NextRequest, pathname: string, clearCookie?: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const res = NextResponse.redirect(url);
  if (clearCookie) res.cookies.delete(clearCookie);
  return res;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const adminToken = request.cookies.get(ADMIN_COOKIE)?.value;
  const customerToken = request.cookies.get(CUSTOMER_COOKIE)?.value;

  // 1. Khu vuc quan tri /admin/* (tru trang dang nhap)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const admin = adminToken ? verifyAdminToken(adminToken) : null;
    // Token sai chu ky / het han -> xoa cookie de khong lap lai
    const staleCookie = adminToken && !admin ? ADMIN_COOKIE : undefined;

    if (!admin?.role) {
      // TC-LOGIN-09: khach hang da dang nhap vao URL admin -> ve trang chu
      if (customerToken && verifyToken(customerToken)) {
        return redirectTo(request, "/", staleCookie);
      }
      // TC-LOGIN-10: chua dang nhap -> trang dang nhap quan tri
      return redirectTo(request, "/admin/login", staleCookie);
    }

    // Token hop le nhung khong phai vai tro noi bo (vd: KhachHang) -> dang nhap lai, tranh vong lap
    if (!isStaffRole(admin.role)) {
      return redirectTo(request, "/admin/login", ADMIN_COOKIE);
    }

    // Phan quyen theo vai tro: trang khong thuoc quyen -> ve bang dieu khien
    if (!canAccessPath(admin.role, pathname)) {
      return redirectTo(request, "/admin");
    }
  }

  // 2. Trang ca nhan khach hang /tai-khoan/*
  if (pathname.startsWith("/tai-khoan")) {
    if (!customerToken || !verifyToken(customerToken)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dang-nhap";
      url.search = "";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/tai-khoan/:path*"],
};
