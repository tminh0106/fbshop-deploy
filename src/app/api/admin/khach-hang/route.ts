import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { hashPassword, requireFeature } from "@/lib/auth";
import {
  EMAIL_ERROR,
  EMAIL_REGEX,
  PHONE_ERROR,
  PHONE_REGEX,
  checkKeyword,
  optionalText,
  requiredText,
} from "@/lib/validation";

// =======================================================
// KHACH HANG - Bang 3.1 (Sua), 3.2 (Xoa), 3.3 (Tim kiem) + Them moi tai quay
// =======================================================

const ORDER_DONE = "Da giao";
const DEFAULT_PASSWORD = "123456";
const DUPLICATE_ERROR = "Thông tin (SĐT/Email) đã tồn tại";

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

// Kiem tra du lieu (A1 bo trong, A2 sai dinh dang). partial = sua: chi kiem truong duoc gui len
function validate(body: Record<string, unknown>, partial: boolean) {
  const data: Prisma.KhachHangUpdateInput = {};
  const has = (k: string) => !partial || body[k] !== undefined;

  if (has("hoTen")) {
    const r = requiredText(body.hoTen, "họ tên khách hàng", 100);
    if (!r.ok) return { error: r.error };
    data.HoTen = r.value;
  }
  if (has("soDienThoai")) {
    const r = requiredText(body.soDienThoai, "số điện thoại", 15);
    if (!r.ok) return { error: r.error };
    if (!PHONE_REGEX.test(r.value)) return { error: PHONE_ERROR };
    data.SoDienThoai = r.value;
  }
  if (has("email")) {
    const r = optionalText(body.email, "email", 100);
    if (!r.ok) return { error: r.error };
    const email = r.value?.toLowerCase() ?? null;
    if (email && !EMAIL_REGEX.test(email)) return { error: EMAIL_ERROR };
    data.Email = email;
  }
  if (has("diaChi")) {
    const r = optionalText(body.diaChi, "địa chỉ", 255);
    if (!r.ok) return { error: r.error };
    data.DiaChi = r.value;
  }
  return { data };
}

// A3 - SDT/Email da thuoc khach hang khac
async function findDuplicate(data: Prisma.KhachHangUpdateInput, exceptMaKH?: string) {
  const or: Prisma.KhachHangWhereInput[] = [];
  if (typeof data.SoDienThoai === "string") or.push({ SoDienThoai: data.SoDienThoai });
  if (typeof data.Email === "string") or.push({ Email: data.Email });
  if (!or.length) return null;
  return prisma.khachHang.findFirst({ where: { OR: or, ...(exceptMaKH && { NOT: { MaKH: exceptMaKH } }) } });
}

// GET: Danh sach + tim kiem (Bang 3.3)
export async function GET(request: Request) {
  try {
    const auth = await requireFeature("khachHang");
    if (!auth.ok) return auth.response;

    const keyword = new URL(request.url).searchParams.get("keyword")?.trim();
    const keywordError = checkKeyword(keyword);
    if (keywordError) return bad(keywordError); // A2

    const where: Prisma.KhachHangWhereInput = {};
    if (keyword) {
      where.OR = [
        { MaKH: { contains: keyword } },
        { HoTen: { contains: keyword } },
        { SoDienThoai: { contains: keyword } },
        { Email: { contains: keyword } },
      ];
    }

    const customers = await prisma.khachHang.findMany({
      where,
      include: {
        DonHangs: {
          select: { MaDH: true, TongTien: true, TrangThai: true, NgayTao: true },
          orderBy: { NgayTao: "desc" },
        },
      },
      orderBy: { HoTen: "asc" },
    });

    const formatted = customers.map((c) => {
      // Chi tieu tinh tren don da giao (khop voi bao cao thong ke)
      const doneOrders = c.DonHangs.filter((o) => o.TrangThai === ORDER_DONE);
      return {
        maKH: c.MaKH,
        hoTen: c.HoTen,
        soDienThoai: c.SoDienThoai,
        email: c.Email, // null = chua cap nhat (giao dien tu hien thi)
        diaChi: c.DiaChi,
        soDonHang: c.DonHangs.length,
        soDonThanhCong: doneOrders.length,
        tongChiTieu: doneOrders.reduce((sum, o) => sum + Number(o.TongTien), 0),
        donGanNhat: c.DonHangs[0]?.NgayTao || null,
        danhSachDonHang: c.DonHangs.slice(0, 5),
      };
    });

    return NextResponse.json({ success: true, customers: formatted, total: formatted.length });
  } catch (error) {
    console.error("GET /api/admin/khach-hang error:", error);
    return bad("Lỗi tải danh sách khách hàng", 500);
  }
}

// POST: Them khach hang tai quay (mat khau dang nhap mac dinh 123456)
export async function POST(request: Request) {
  try {
    const auth = await requireFeature("khachHang");
    if (!auth.ok) return auth.response;

    const v = validate(await request.json(), false);
    if ("error" in v) return bad(v.error!);
    if (await findDuplicate(v.data)) return bad(DUPLICATE_ERROR, 409);

    const created = await prisma.khachHang.create({
      data: {
        ...(v.data as Omit<Prisma.KhachHangCreateInput, "MatKhau">),
        MatKhau: await hashPassword(DEFAULT_PASSWORD),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Thêm khách hàng thành công",
      customer: { maKH: created.MaKH, hoTen: created.HoTen, soDienThoai: created.SoDienThoai },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return bad(DUPLICATE_ERROR, 409);
    }
    console.error("POST /api/admin/khach-hang error:", error);
    return bad("Không thể tạo khách hàng mới", 500);
  }
}

// PUT: Sua thong tin khach hang (Bang 3.1)
export async function PUT(request: Request) {
  try {
    const auth = await requireFeature("khachHang");
    if (!auth.ok) return auth.response;

    const body = await request.json();
    if (!body.maKH) return bad("Thiếu mã khách hàng");

    const current = await prisma.khachHang.findUnique({ where: { MaKH: body.maKH } });
    if (!current) return bad("Khách hàng không tồn tại", 404);

    const v = validate(body, true);
    if ("error" in v) return bad(v.error!);
    if (!Object.keys(v.data).length) return bad("Không có thông tin nào để cập nhật");
    if (await findDuplicate(v.data, body.maKH)) return bad(DUPLICATE_ERROR, 409); // A3

    const updated = await prisma.khachHang.update({
      where: { MaKH: body.maKH },
      data: v.data,
      select: { MaKH: true, HoTen: true, SoDienThoai: true, Email: true, DiaChi: true },
    });
    return NextResponse.json({ success: true, message: "Cập nhật thông tin khách hàng thành công", customer: updated });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return bad(DUPLICATE_ERROR, 409);
    }
    console.error("PUT /api/admin/khach-hang error:", error);
    return bad("Lỗi cập nhật khách hàng", 500);
  }
}

// DELETE: Xoa khach hang (Bang 3.2) - da co don hang thi chan (A2)
export async function DELETE(request: Request) {
  try {
    const auth = await requireFeature("khachHang");
    if (!auth.ok) return auth.response;

    const maKH = new URL(request.url).searchParams.get("maKH");
    if (!maKH) return bad("Thiếu mã khách hàng");

    const customer = await prisma.khachHang.findUnique({
      where: { MaKH: maKH },
      include: { _count: { select: { DonHangs: true } } },
    });
    if (!customer) return bad("Khách hàng không tồn tại", 404);
    if (customer._count.DonHangs > 0) return bad("Không thể xóa khách hàng do đã có lịch sử giao dịch.");

    await prisma.khachHang.delete({ where: { MaKH: maKH } });
    return NextResponse.json({ success: true, message: "Xóa khách hàng thành công" });
  } catch (error) {
    console.error("DELETE /api/admin/khach-hang error:", error);
    return bad("Lỗi khi xóa khách hàng", 500);
  }
}
