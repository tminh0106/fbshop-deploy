import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { requireFeature } from "@/lib/auth";
import {
  EMAIL_ERROR,
  EMAIL_REGEX,
  PHONE_ERROR,
  PHONE_REGEX,
  TAX_CODE_ERROR,
  TAX_CODE_REGEX,
  checkKeyword,
  nextCode,
  optionalText,
  requiredText,
} from "@/lib/validation";

// =======================================================
// NHA CUNG CAP - Bang 3.22 (Them), 3.23 (Sua), 3.24 (Xoa), 3.25 (Tim kiem) - FR-21
// =======================================================

const STATUS_ACTIVE = "Active";
const STATUS_STOPPED = "Ngung hop tac";
const ALLOWED_STATUSES = [STATUS_ACTIVE, STATUS_STOPPED];
const DUPLICATE_ERROR = "Thông tin liên hệ / Mã số thuế đã tồn tại";

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

type SupplierInput = {
  tenNCC?: unknown;
  soDienThoai?: unknown;
  diaChi?: unknown;
  email?: unknown;
  maSoThue?: unknown;
  nguoiDaiDien?: unknown;
  ghiChu?: unknown;
};

// Kiem tra du lieu (A1 bo trong, A2 sai dinh dang). partial = sua: chi kiem truong duoc gui len
function validate(body: SupplierInput, partial: boolean) {
  const data: Prisma.NhaCungCapUpdateInput = {};
  const has = (k: keyof SupplierInput) => !partial || body[k] !== undefined;

  // Bat buoc: Ten NCC, SDT, Dia chi (A1)
  if (has("tenNCC")) {
    const r = requiredText(body.tenNCC, "tên nhà cung cấp", 150);
    if (!r.ok) return { error: r.error };
    data.TenNCC = r.value;
  }
  if (has("soDienThoai")) {
    const r = requiredText(body.soDienThoai, "số điện thoại", 15);
    if (!r.ok) return { error: r.error };
    if (!PHONE_REGEX.test(r.value)) return { error: PHONE_ERROR };
    data.SoDienThoai = r.value;
  }
  if (has("diaChi")) {
    const r = requiredText(body.diaChi, "địa chỉ", 255);
    if (!r.ok) return { error: r.error };
    data.DiaChi = r.value;
  }
  // Tuy chon
  if (has("email")) {
    const r = optionalText(body.email, "email", 100);
    if (!r.ok) return { error: r.error };
    const email = r.value?.toLowerCase() ?? null;
    if (email && !EMAIL_REGEX.test(email)) return { error: EMAIL_ERROR };
    data.Email = email;
  }
  if (has("maSoThue")) {
    const r = optionalText(body.maSoThue, "mã số thuế", 20);
    if (!r.ok) return { error: r.error };
    if (r.value && !TAX_CODE_REGEX.test(r.value)) return { error: TAX_CODE_ERROR };
    data.MaSoThue = r.value;
  }
  if (has("nguoiDaiDien")) {
    const r = optionalText(body.nguoiDaiDien, "người đại diện", 100);
    if (!r.ok) return { error: r.error };
    data.NguoiDaiDien = r.value;
  }
  if (has("ghiChu")) {
    const r = optionalText(body.ghiChu, "ghi chú", 500);
    if (!r.ok) return { error: r.error };
    data.GhiChu = r.value;
  }
  return { data };
}

// A3 - Trung SDT / Email / Ma so thue voi nha cung cap khac
async function findDuplicate(data: Prisma.NhaCungCapUpdateInput, exceptMaNCC?: string) {
  const or: Prisma.NhaCungCapWhereInput[] = [];
  if (typeof data.SoDienThoai === "string") or.push({ SoDienThoai: data.SoDienThoai });
  if (typeof data.Email === "string") or.push({ Email: data.Email });
  if (typeof data.MaSoThue === "string") or.push({ MaSoThue: data.MaSoThue });
  if (!or.length) return null;
  return prisma.nhaCungCap.findFirst({
    where: { OR: or, ...(exceptMaNCC && { NOT: { MaNCC: exceptMaNCC } }) },
  });
}

// GET: Danh sach (Bang 3.25). ?activeOnly=1 -> chi NCC dang hop tac (dung khi lap phieu nhap)
export async function GET(request: Request) {
  try {
    // Doc danh sach: Admin quan ly NCC; nhan vien kho can de chon NCC khi lap phieu nhap
    const auth = await requireFeature(["nhaCungCap", "nhaCungCapLookup"]);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword")?.trim();
    const keywordError = checkKeyword(keyword);
    if (keywordError) return bad(keywordError);

    const where: Prisma.NhaCungCapWhereInput = {};
    if (keyword) {
      where.OR = [
        { MaNCC: { contains: keyword } },
        { TenNCC: { contains: keyword } },
        { SoDienThoai: { contains: keyword } },
      ];
    }
    if (searchParams.get("activeOnly") === "1") where.TrangThai = { not: STATUS_STOPPED };

    const [suppliers, allCodes] = await Promise.all([
      prisma.nhaCungCap.findMany({
        where,
        include: { _count: { select: { HoaDonKhos: true } } },
        // FR-21.1: doi tac moi tao len dau (ma tang dan theo thu tu tao)
        orderBy: { MaNCC: "desc" },
      }),
      prisma.nhaCungCap.findMany({ select: { MaNCC: true } }),
    ]);

    return NextResponse.json({
      success: true,
      data: suppliers,
      nextMaNCC: nextCode("NCC", allCodes.map((c) => c.MaNCC)),
    });
  } catch (error) {
    console.error("GET nha-cung-cap error:", error);
    return bad("Lỗi tải danh sách nhà cung cấp", 500);
  }
}

// POST: Them nha cung cap (Bang 3.22). Ma NCC do he thong cap.
export async function POST(request: Request) {
  try {
    const auth = await requireFeature("nhaCungCap");
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const v = validate(body, false);
    if ("error" in v) return bad(v.error!);

    if (await findDuplicate(v.data)) return bad(DUPLICATE_ERROR, 409);

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const codes = await prisma.nhaCungCap.findMany({ select: { MaNCC: true } });
        const created = await prisma.nhaCungCap.create({
          data: {
            ...(v.data as Prisma.NhaCungCapCreateInput),
            MaNCC: nextCode("NCC", codes.map((c) => c.MaNCC)),
            TrangThai: STATUS_ACTIVE,
          },
        });
        return NextResponse.json({ success: true, message: "Thêm nhà cung cấp thành công", data: created });
      } catch (err) {
        const dupKey = err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
        if (!dupKey || attempt === 2) throw err;
      }
    }
    return bad("Không thể sinh mã nhà cung cấp, vui lòng thử lại", 500);
  } catch (error) {
    console.error("POST nha-cung-cap error:", error);
    return bad("Lỗi thêm nhà cung cấp mới", 500);
  }
}

// PUT: Sua nha cung cap (Bang 3.23). Khong cho sua Ma NCC (FR-21.4).
export async function PUT(request: Request) {
  try {
    const auth = await requireFeature("nhaCungCap");
    if (!auth.ok) return auth.response;

    const body = await request.json();
    if (!body.maNCC) return bad("Thiếu mã nhà cung cấp");

    const current = await prisma.nhaCungCap.findUnique({ where: { MaNCC: body.maNCC } });
    if (!current) return bad("Nhà cung cấp không tồn tại", 404);

    const v = validate(body, true);
    if ("error" in v) return bad(v.error!);

    if (body.trangThai !== undefined && body.trangThai !== "") {
      if (!ALLOWED_STATUSES.includes(body.trangThai)) return bad("Trạng thái không hợp lệ");
      v.data.TrangThai = body.trangThai;
    }

    if (await findDuplicate(v.data, body.maNCC)) return bad(DUPLICATE_ERROR, 409);
    if (!Object.keys(v.data).length) return bad("Không có thông tin nào để cập nhật");

    const updated = await prisma.nhaCungCap.update({ where: { MaNCC: body.maNCC }, data: v.data });
    return NextResponse.json({ success: true, message: "Cập nhật nhà cung cấp thành công", data: updated });
  } catch (error) {
    console.error("PUT nha-cung-cap error:", error);
    return bad("Lỗi cập nhật nhà cung cấp", 500);
  }
}

// DELETE: Bang 3.24 / FR-21.5 - da co phieu nhap -> xoa mem "Ngung hop tac" (giu lich su), chua co -> xoa han
export async function DELETE(request: Request) {
  try {
    const auth = await requireFeature("nhaCungCap");
    if (!auth.ok) return auth.response;

    const maNCC = new URL(request.url).searchParams.get("maNCC");
    if (!maNCC) return bad("Thiếu mã nhà cung cấp cần xóa");

    const ncc = await prisma.nhaCungCap.findUnique({ where: { MaNCC: maNCC } });
    if (!ncc) return bad("Nhà cung cấp không tồn tại", 404);

    const invoiceCount = await prisma.hoaDonKho.count({ where: { MaNCC: maNCC } });
    if (invoiceCount > 0) {
      if (ncc.TrangThai === STATUS_STOPPED) {
        return bad("Nhà cung cấp đã ngừng hợp tác và có lịch sử nhập kho nên không thể xóa khỏi hệ thống.");
      }
      await prisma.nhaCungCap.update({ where: { MaNCC: maNCC }, data: { TrangThai: STATUS_STOPPED } });
      return NextResponse.json({
        success: true,
        softDeleted: true,
        message: "Nhà cung cấp đã có lịch sử nhập kho. Đã chuyển sang 'Ngừng hợp tác' và ẩn khỏi danh sách chọn khi lập phiếu nhập.",
      });
    }

    await prisma.nhaCungCap.delete({ where: { MaNCC: maNCC } });
    return NextResponse.json({ success: true, softDeleted: false, message: "Xóa nhà cung cấp thành công" });
  } catch (error) {
    console.error("DELETE nha-cung-cap error:", error);
    return bad("Lỗi khi xóa nhà cung cấp", 500);
  }
}
