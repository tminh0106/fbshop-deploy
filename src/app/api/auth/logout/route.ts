import { NextResponse } from "next/server";
import { COOKIE_SECURE } from "@/lib/cookie";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Đăng xuất thành công" });
  response.cookies.set("fbshop_token", "", {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}