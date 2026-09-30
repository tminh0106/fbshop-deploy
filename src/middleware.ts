import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = atob(base64);
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const adminToken = request.cookies.get("fbshop_admin_token")?.value;
  const customerToken = request.cookies.get("fbshop_token")?.value;

  // 1. Bao ve URL Admin: /admin/* (ngoai tru /admin/login)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const adminPayload = adminToken ? parseJwt(adminToken) : null;

    // TC-LOGIN-09: Khach thuong (co customer token ma khong co admin role) truy cap URL Admin
    if (customerToken && (!adminPayload || !adminPayload.role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // TC-LOGIN-10: Chua dang nhap bat ky tai khoan nao ma truy cap /admin
    if (!adminPayload || !adminPayload.role) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    // --- PHAN QUYEN THEO ROLE ---
    const role = adminPayload.role;

    // Admin-only routes
    const adminOnlyRoutes = ["/admin/nhan-vien", "/admin/tai-khoan", "/admin/thong-ke"];
    if (adminOnlyRoutes.some(r => pathname.startsWith(r)) && role !== "Admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/don-hang";
      return NextResponse.redirect(url);
    }

    // Kho-routes (Admin & QuanLyKho only)
    const khoRoutes = ["/admin/hoa-don-kho", "/admin/hang-hoa-kho"];
    if (khoRoutes.some(r => pathname.startsWith(r)) && role !== "Admin" && role !== "QuanLyKho") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/don-hang";
      return NextResponse.redirect(url);
    }
  }

  // 2. Bao ve URL Khach Hang ca nhan: /tai-khoan/*
  if (pathname.startsWith("/tai-khoan")) {
    const customerPayload = customerToken ? parseJwt(customerToken) : null;
    // TC-LOGIN-10: Chua dang nhap truy cap /tai-khoan
    if (!customerPayload) {
      const url = request.nextUrl.clone();
      url.pathname = "/dang-nhap";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/tai-khoan/:path*",
  ],
};
