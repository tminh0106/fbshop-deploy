import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { ROLES } from "@/lib/permissions";
import { hashPassword, requireFeature } from "@/lib/auth";
import { checkKeyword } from "@/lib/validation";

// Regex chuan theo dac ta
const PHONE_REGEX = /^0\d{9}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;

// Trang thai lam viec (du lieu cu co ca "Dang lam viec" va "Active" cung nghia)
const STATUS_ACTIVE = "Active";
const STATUS_RESIGNED = "Da nghi viec";
const WORKING_STATUSES = [STATUS_ACTIVE, "Dang lam viec"];
const ALLOWED_STATUSES = [...WORKING_STATUSES, STATUS_RESIGNED];
const ACCOUNT_LOCKED = "Khoa";

// Gioi han theo cot CSDL (HoTen VarChar(100), DiaChi VarChar(255), Luong Decimal(15,0))
const MAX_NAME = 100;
const MAX_ADDRESS = 255;
const MAX_EMAIL = 100;
const MAX_MONEY = 999_999_999_999;

const DUPLICATE_ERROR = "Thông tin đã tồn tại";

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

// Ma NV tiep theo = so lon nhat hien co + 1 (NV001, NV002...).
// Khong xoa nhan vien nao thi bang dung so luong + 1; da xoa bot thi van khong trung ma cu.
async function nextMaNV(db: Prisma.TransactionClient | typeof prisma): Promise<string> {
  const rows = await db.nhanVien.findMany({ select: { MaNV: true } });
  const max = rows.reduce((m, r) => {
    const n = /^NV(\d+)$/i.exec(r.MaNV);
    return n ? Math.max(m, parseInt(n[1], 10)) : m;
  }, 0);
  return `NV${String(max + 1).padStart(3, "0")}`;
}

// Tien luong / phu cap: so nguyen >= 0
function parseMoney(value: unknown, label: string): { ok: true; value: number } | { ok: false; error: string } {
  const n = typeof value === "string" ? Number(value.trim()) : Number(value);
  if (value === "" || value === null || value === undefined || !Number.isFinite(n)) {
    return { ok: false, error: `${label} phải là một số hợp lệ` };
  }
  if (n < 0) return { ok: false, error: `${label} không được âm` };
  if (!Number.isInteger(n)) return { ok: false, error: `${label} phải là số nguyên (VNĐ)` };
  if (n > MAX_MONEY) return { ok: false, error: `${label} vượt quá giới hạn cho phép` };
  return { ok: true, value: n };
}

// GET: Danh sach nhan vien (+ ma NV tiep theo de hien tren form them moi)
export async function GET(request: Request) {
  try {
    const auth = await requireFeature("nhanVien");
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword")?.trim();
    // Bang 3.33 A2 - tu khoa chua ky tu dac biet / qua dai
    const keywordError = checkKeyword(keyword);
    if (keywordError) return bad(keywordError);

    const where: Prisma.NhanVienWhereInput = {};
    if (keyword) {
      where.OR = [
        { MaNV: { contains: keyword } },
        { HoTen: { contains: keyword } },
        { SoDienThoai: { contains: keyword } },
        // Tim theo email (email la ten dang nhap cua tai khoan lien ket)
        { TaiKhoans: { some: { TenDangNhap: { contains: keyword } } } },
      ];
    }

    const [employees, nextCode] = await Promise.all([
      prisma.nhanVien.findMany({
        where,
        include: {
          TaiKhoans: {
            select: { MaTK: true, TenDangNhap: true, PhanQuyen: true, TrangThai: true },
          },
          _count: {
            select: { HoaDonKhos: true },
          },
        },
        orderBy: { MaNV: "asc" },
      }),
      nextMaNV(prisma),
    ]);

    // Email = ten dang nhap dang email cua tai khoan lien ket.
    // Ten dang nhap khong phai email thi KHONG coi la email (tranh form sua bao sai dinh dang).
    const formatted = employees.map((emp) => {
      const emailAcc = emp.TaiKhoans.find((tk) => tk.TenDangNhap.includes("@"));
      return { ...emp, Email: emailAcc ? emailAcc.TenDangNhap : null };
    });

    return NextResponse.json({ success: true, data: formatted, nextMaNV: nextCode });
  } catch (error) {
    console.error("GET nhan-vien error:", error);
    return NextResponse.json({ error: "Lỗi tải danh sách nhân viên" }, { status: 500 });
  }
}

// POST: Them nhan vien - Bang 3.30 (A1 bo trong, A2 sai dinh dang, A3 trung lap)
// Ma NV do he thong tu sinh, khong nhan tu client.
export async function POST(request: Request) {
  try {
    const auth = await requireFeature("nhanVien");
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { hoTen, soDienThoai, email, diaChi, luongCoBan, phuCap } = body;

    // A1 - Bo trong thong tin bat buoc
    if (!hoTen || typeof hoTen !== "string" || !hoTen.trim()) {
      return bad("Vui lòng nhập họ tên nhân viên");
    }
    if (hoTen.trim().length > MAX_NAME) return bad(`Họ tên tối đa ${MAX_NAME} ký tự`);
    if (!soDienThoai || typeof soDienThoai !== "string" || !soDienThoai.trim()) {
      return bad("Vui lòng nhập số điện thoại nhân viên");
    }

    // A2 - Sai dinh dang
    const cleanPhone = soDienThoai.trim();
    if (!PHONE_REGEX.test(cleanPhone)) {
      return bad(
        "Số điện thoại không đúng định dạng. Vui lòng nhập số điện thoại gồm đúng 10 chữ số và bắt đầu bằng số 0."
      );
    }
    let cleanEmail: string | null = null;
    if (email && typeof email === "string" && email.trim()) {
      cleanEmail = email.trim().toLowerCase();
      // Email la ten dang nhap cua tai khoan (cot VarChar 100)
      if (cleanEmail.length > MAX_EMAIL) return bad(`Email tối đa ${MAX_EMAIL} ký tự`);
      if (!EMAIL_REGEX.test(cleanEmail)) {
        return bad("Email không đúng định dạng. Vui lòng kiểm tra lại cấu trúc email (ví dụ: nhanvien@fbshop.vn).");
      }
    }
    const cleanAddress = typeof diaChi === "string" ? diaChi.trim() : "";
    if (cleanAddress.length > MAX_ADDRESS) return bad(`Địa chỉ tối đa ${MAX_ADDRESS} ký tự`);
    const salary = parseMoney(luongCoBan, "Lương cơ bản");
    if (!salary.ok) return bad(salary.error);
    const allowance = parseMoney(phuCap, "Phụ cấp");
    if (!allowance.ok) return bad(allowance.error);

    // A3 - Trung lap du lieu doc nhat (SDT o nhan vien khac, Email o tai khoan khac)
    const existingPhone = await prisma.nhanVien.findFirst({ where: { SoDienThoai: cleanPhone } });
    if (existingPhone) return bad(DUPLICATE_ERROR, 409);
    if (cleanEmail) {
      const existingEmail = await prisma.taiKhoan.findFirst({ where: { TenDangNhap: cleanEmail } });
      if (existingEmail) return bad(DUPLICATE_ERROR, 409);
    }

    // Luu nhan vien + tai khoan email lien ket (neu co) trong 1 transaction.
    // Sinh ma trong transaction; neu 2 nguoi them cung luc bi trung ma thi thu lai.
    const defaultHash = cleanEmail ? await hashPassword("123456") : null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const newEmp = await prisma.$transaction(async (tx) => {
          const code = await nextMaNV(tx);
          const emp = await tx.nhanVien.create({
            data: {
              MaNV: code,
              HoTen: hoTen.trim(),
              SoDienThoai: cleanPhone,
              DiaChi: cleanAddress || null,
              LuongCoBan: salary.value,
              PhuCap: allowance.value,
              TrangThai: STATUS_ACTIVE, // nhan vien moi luon o trang thai dang lam viec
            },
          });
          if (cleanEmail && defaultHash) {
            await tx.taiKhoan.create({
              data: {
                TenDangNhap: cleanEmail,
                MatKhau: defaultHash,
                PhanQuyen: ROLES.BAN_HANG,
                TrangThai: STATUS_ACTIVE,
                MaNV: code,
              },
            });
          }
          return emp;
        });

        return NextResponse.json({
          success: true,
          // Bao cho Admin biet da cap tai khoan (truoc day tao ngam)
          message: cleanEmail
            ? `Thêm nhân viên mới thành công. Đã cấp tài khoản ${cleanEmail} (mật khẩu mặc định 123456, vai trò BanHang).`
            : "Thêm nhân viên mới thành công",
          data: newEmp,
        });
      } catch (err) {
        const isDuplicateKey = err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
        if (!isDuplicateKey || attempt === 2) throw err;
      }
    }
    return bad("Không thể sinh mã nhân viên, vui lòng thử lại", 500);
  } catch (error) {
    console.error("POST nhan-vien error:", error);
    return NextResponse.json({ error: "Lỗi tạo mới nhân viên" }, { status: 500 });
  }
}

// PUT: Cap nhat nhan vien - Bang 3.31 (A1 xoa trang / sai dinh dang)
// Ma NV khong doi duoc. Chuyen "Da nghi viec" -> khoa tai khoan (FR-28).
export async function PUT(request: Request) {
  try {
    const auth = await requireFeature("nhanVien");
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { maNV, hoTen, soDienThoai, email, diaChi, luongCoBan, phuCap, trangThai } = body;

    if (!maNV) return bad("Thiếu mã nhân viên");

    const currentEmp = await prisma.nhanVien.findUnique({
      where: { MaNV: maNV },
      include: { TaiKhoans: true },
    });
    if (!currentEmp) return bad("Không tìm thấy nhân viên cần sửa", 404);

    const data: Prisma.NhanVienUpdateInput = {};

    if (hoTen !== undefined) {
      if (typeof hoTen !== "string" || !hoTen.trim()) return bad("Họ tên không được để trống");
      if (hoTen.trim().length > MAX_NAME) return bad(`Họ tên tối đa ${MAX_NAME} ký tự`);
      data.HoTen = hoTen.trim();
    }

    if (soDienThoai !== undefined) {
      if (!soDienThoai || typeof soDienThoai !== "string" || !soDienThoai.trim()) {
        return bad("Số điện thoại không được để trống");
      }
      const cleanPhone = soDienThoai.trim();
      if (!PHONE_REGEX.test(cleanPhone)) {
        return bad(
          "Số điện thoại không đúng định dạng. Vui lòng nhập số điện thoại gồm đúng 10 chữ số và bắt đầu bằng số 0."
        );
      }
      const dupPhone = await prisma.nhanVien.findFirst({
        where: { SoDienThoai: cleanPhone, NOT: { MaNV: maNV } },
      });
      if (dupPhone) return bad(DUPLICATE_ERROR, 409);
      data.SoDienThoai = cleanPhone;
    }

    let cleanEmail: string | null = null;
    if (email !== undefined && email !== null) {
      const emailStr = String(email).trim();
      // Xoa trang email: email dang la ten dang nhap cua tai khoan -> khong cho xoa (truoc day bi bo qua ngam)
      const currentEmailAcc = currentEmp.TaiKhoans.find((tk) => tk.TenDangNhap.includes("@"));
      if (!emailStr && currentEmailAcc) {
        return bad(
          "Không thể để trống email vì đây là tên đăng nhập của tài khoản nhân viên. Muốn thu hồi quyền đăng nhập, hãy khóa tài khoản ở trang Quản lý tài khoản."
        );
      }
      if (emailStr) {
        cleanEmail = emailStr.toLowerCase();
        if (cleanEmail.length > MAX_EMAIL) return bad(`Email tối đa ${MAX_EMAIL} ký tự`);
        if (!EMAIL_REGEX.test(cleanEmail)) {
          return bad("Email không đúng định dạng. Vui lòng kiểm tra lại cấu trúc email (ví dụ: nhanvien@fbshop.vn).");
        }
        const dupEmail = await prisma.taiKhoan.findFirst({
          where: { TenDangNhap: cleanEmail, NOT: { MaNV: maNV } },
        });
        if (dupEmail) return bad(DUPLICATE_ERROR, 409);
      }
    }

    if (diaChi !== undefined) {
      const cleanAddress = typeof diaChi === "string" ? diaChi.trim() : "";
      if (cleanAddress.length > MAX_ADDRESS) return bad(`Địa chỉ tối đa ${MAX_ADDRESS} ký tự`);
      data.DiaChi = cleanAddress || null;
    }
    if (luongCoBan !== undefined) {
      const salary = parseMoney(luongCoBan, "Lương cơ bản");
      if (!salary.ok) return bad(salary.error);
      data.LuongCoBan = salary.value;
    }
    if (phuCap !== undefined) {
      const allowance = parseMoney(phuCap, "Phụ cấp");
      if (!allowance.ok) return bad(allowance.error);
      data.PhuCap = allowance.value;
    }

    let resigning = false;
    let returning = false;
    if (trangThai !== undefined && trangThai !== null && trangThai !== "") {
      if (!ALLOWED_STATUSES.includes(trangThai)) return bad("Trạng thái làm việc không hợp lệ");
      resigning = trangThai === STATUS_RESIGNED && currentEmp.TrangThai !== STATUS_RESIGNED;
      returning = trangThai !== STATUS_RESIGNED && currentEmp.TrangThai === STATUS_RESIGNED;
      if (resigning && maNV === auth.user.maNV) {
        return bad("Không thể tự chuyển chính mình sang Đã nghỉ việc");
      }
      data.TrangThai = trangThai;
    }

    let createdAccount = false;
    const updated = await prisma.$transaction(async (tx) => {
      const emp = await tx.nhanVien.update({ where: { MaNV: maNV }, data });

      // Cap nhat email vao tai khoan lien ket neu co
      if (cleanEmail) {
        const existingTK = await tx.taiKhoan.findFirst({ where: { MaNV: maNV } });
        if (existingTK) {
          await tx.taiKhoan.update({
            where: { MaTK: existingTK.MaTK },
            data: { TenDangNhap: cleanEmail },
          });
        } else {
          await tx.taiKhoan.create({
            data: {
              TenDangNhap: cleanEmail,
              MatKhau: await hashPassword("123456"),
              PhanQuyen: ROLES.BAN_HANG,
              // Nhan vien da nghi viec thi tai khoan tao moi cung bi khoa
              TrangThai: emp.TrangThai === STATUS_RESIGNED ? ACCOUNT_LOCKED : STATUS_ACTIVE,
              MaNV: maNV,
            },
          });
          createdAccount = true;
        }
      }

      // FR-28: nghi viec -> khoa tai khoan dang nhap
      if (resigning) {
        await tx.taiKhoan.updateMany({ where: { MaNV: maNV }, data: { TrangThai: ACCOUNT_LOCKED } });
      }
      return emp;
    });

    const notes = ["Cập nhật thông tin thành công."];
    if (resigning) notes.push("Nhân viên đã nghỉ việc, tài khoản đăng nhập đã bị khóa.");
    if (returning && currentEmp.TaiKhoans.length > 0) {
      notes.push("Tài khoản đăng nhập vẫn đang khóa, mở khóa tại trang Quản lý tài khoản nếu cần.");
    }
    if (createdAccount) {
      notes.push(`Đã cấp tài khoản ${cleanEmail} (mật khẩu mặc định 123456, vai trò BanHang).`);
    }

    return NextResponse.json({ success: true, message: notes.join(" "), data: updated });
  } catch (error) {
    console.error("PUT nhan-vien error:", error);
    return NextResponse.json({ error: "Lỗi cập nhật nhân viên" }, { status: 500 });
  }
}

// DELETE: Bang 3.32 - co lich su lam viec -> chuyen "Da nghi viec" + khoa tai khoan; chua co -> xoa han
export async function DELETE(request: Request) {
  try {
    const auth = await requireFeature("nhanVien");
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const maNV = searchParams.get("maNV");
    if (!maNV) return bad("Thiếu mã nhân viên cần xóa");

    // Khong tu xoa chinh minh (mat tai khoan dang dung)
    if (maNV === auth.user.maNV) return bad("Không thể xóa nhân viên gắn với tài khoản đang đăng nhập");

    const emp = await prisma.nhanVien.findUnique({ where: { MaNV: maNV } });
    if (!emp) return bad("Không tìm thấy nhân viên cần xóa", 404);

    // A1 - Rang buoc du lieu lien quan (hoa don kho; don hang khong gan voi nhan vien)
    const invoiceCount = await prisma.hoaDonKho.count({ where: { MaNV: maNV } });

    if (invoiceCount > 0) {
      // Da nghi viec san thi khong con gi de doi - bao ro thay vi lap lai thong bao "da chuyen"
      if (emp.TrangThai === STATUS_RESIGNED) {
        return bad("Nhân viên đã nghỉ việc và có lịch sử làm việc nên không thể xóa khỏi hệ thống.");
      }
      await prisma.$transaction([
        prisma.nhanVien.update({ where: { MaNV: maNV }, data: { TrangThai: STATUS_RESIGNED } }),
        prisma.taiKhoan.updateMany({ where: { MaNV: maNV }, data: { TrangThai: ACCOUNT_LOCKED } }),
      ]);
      return NextResponse.json({
        success: true,
        softDeleted: true,
        message:
          "Không thể xóa nhân viên đã phát sinh lịch sử làm việc. Hệ thống đã chuyển trạng thái nhân viên sang Đã nghỉ việc và khóa tài khoản.",
      });
    }

    // Chua co lich su: xoa tai khoan lien ket va nhan vien trong 1 transaction
    await prisma.$transaction([
      prisma.taiKhoan.deleteMany({ where: { MaNV: maNV } }),
      prisma.nhanVien.delete({ where: { MaNV: maNV } }),
    ]);

    return NextResponse.json({
      success: true,
      softDeleted: false,
      message: "Xóa nhân viên thành công",
    });
  } catch (error) {
    console.error("DELETE nhan-vien error:", error);
    return NextResponse.json({ error: "Lỗi khi xóa nhân viên" }, { status: 500 });
  }
}
