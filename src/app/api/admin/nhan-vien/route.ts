import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hashPassword } from "@/lib/auth";

// Regex chuan theo dac ta
const PHONE_REGEX = /^0\d{9}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;

// GET: Danh sach nhan vien
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword")?.trim();

    const where: any = {};
    if (keyword) {
      where.OR = [
        { MaNV: { contains: keyword } },
        { HoTen: { contains: keyword } },
        { SoDienThoai: { contains: keyword } },
      ];
    }

    const employees = await prisma.nhanVien.findMany({
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
    });

    // Bổ sung thuộc tính email từ TaiKhoans (nếu có tài khoản dạng email)
    const formatted = employees.map((emp) => {
      const emailAcc = emp.TaiKhoans.find((tk) => tk.TenDangNhap.includes("@"));
      return {
        ...emp,
        Email: emailAcc ? emailAcc.TenDangNhap : (emp.TaiKhoans[0]?.TenDangNhap || null),
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error("GET nhan-vien error:", error);
    return NextResponse.json({ error: "Lỗi tải danh sách nhân viên" }, { status: 500 });
  }
}

// POST: Them nhan vien (Bao gom rang buoc A2 & Trung lap du lieu doc nhat)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { maNV, hoTen, soDienThoai, email, diaChi, luongCoBan, phuCap } = body;

    // 1. Kiem tra bat buoc
    if (!hoTen || typeof hoTen !== "string" || !hoTen.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập họ tên nhân viên" },
        { status: 400 }
      );
    }

    if (!soDienThoai || typeof soDienThoai !== "string" || !soDienThoai.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập số điện thoại nhân viên" },
        { status: 400 }
      );
    }

    const cleanPhone = soDienThoai.trim();

    // 2. Ngoai le A2 - Du lieu sai dinh dang: So dien thoai
    if (!PHONE_REGEX.test(cleanPhone)) {
      return NextResponse.json(
        {
          error:
            "Số điện thoại không đúng định dạng. Vui lòng nhập số điện thoại gồm đúng 10 chữ số và bắt đầu bằng số 0.",
        },
        { status: 400 }
      );
    }

    // 3. Ngoai le A2 - Du lieu sai dinh dang: Email (neu co nhap)
    let cleanEmail: string | null = null;
    if (email && typeof email === "string" && email.trim()) {
      cleanEmail = email.trim().toLowerCase();
      if (!EMAIL_REGEX.test(cleanEmail)) {
        return NextResponse.json(
          {
            error: "Email không đúng định dạng. Vui lòng kiểm tra lại cấu trúc email (ví dụ: nhanvien@fbshop.vn).",
          },
          { status: 400 }
        );
      }
    }

    // 4. Trung lap du lieu doc nhat: Kiem tra SoDienThoai da ton tai o nhan vien khac chua
    const existingPhone = await prisma.nhanVien.findFirst({
      where: { SoDienThoai: cleanPhone },
    });
    if (existingPhone) {
      return NextResponse.json(
        { error: "Thông tin đã tồn tại" },
        { status: 409 }
      );
    }

    // 5. Trung lap du lieu doc nhat: Kiem tra Email da ton tai o nhan vien khac (trong TaiKhoan) chua
    if (cleanEmail) {
      const existingEmail = await prisma.taiKhoan.findFirst({
        where: { TenDangNhap: cleanEmail },
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: "Thông tin đã tồn tại" },
          { status: 409 }
        );
      }
    }

    let code = maNV?.trim();
    if (!code) {
      const count = await prisma.nhanVien.count();
      code = `NV${String(count + 1).padStart(3, "0")}`;
    }

    // Kiem tra trung MaNV
    const existingMa = await prisma.nhanVien.findUnique({ where: { MaNV: code } });
    if (existingMa) {
      return NextResponse.json(
        { error: "Thông tin đã tồn tại" },
        { status: 409 }
      );
    }

    // 6. Luu thong tin nhan vien va tai khoan email lien ket (neu co)
    const newEmp = await prisma.$transaction(async (tx) => {
      const emp = await tx.nhanVien.create({
        data: {
          MaNV: code,
          HoTen: hoTen.trim(),
          SoDienThoai: cleanPhone,
          DiaChi: diaChi?.trim() || null,
          LuongCoBan: Number(luongCoBan) || 8000000,
          PhuCap: Number(phuCap) || 1000000,
          TrangThai: "Active",
        },
      });

      // Neu co nhap email, tao tai khoan dang nhap mac dinh cho nhan vien
      if (cleanEmail) {
        const defaultHash = await hashPassword("123456");
        await tx.taiKhoan.create({
          data: {
            TenDangNhap: cleanEmail,
            MatKhau: defaultHash,
            PhanQuyen: "NhanVien",
            TrangThai: "Active",
            MaNV: code,
          },
        });
      }

      return emp;
    });

    return NextResponse.json({
      success: true,
      message: "Thêm nhân viên mới thành công",
      data: newEmp,
    });
  } catch (error: any) {
    console.error("POST nhan-vien error:", error);
    return NextResponse.json({ error: error.message || "Lỗi tạo mới nhân viên" }, { status: 500 });
  }
}

// PUT: Cap nhat nhan vien (Bao gom rang buoc A2 & Trung lap du lieu doc nhat)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { maNV, hoTen, soDienThoai, email, diaChi, luongCoBan, phuCap, trangThai } = body;

    if (!maNV) {
      return NextResponse.json({ error: "Thiếu mã nhân viên" }, { status: 400 });
    }

    const currentEmp = await prisma.nhanVien.findUnique({
      where: { MaNV: maNV },
      include: { TaiKhoans: true },
    });

    if (!currentEmp) {
      return NextResponse.json({ error: "Không tìm thấy nhân viên cần sửa" }, { status: 404 });
    }

    let cleanPhone = currentEmp.SoDienThoai;
    if (soDienThoai !== undefined) {
      if (!soDienThoai || typeof soDienThoai !== "string" || !soDienThoai.trim()) {
        return NextResponse.json(
          { error: "Số điện thoại không được để trống" },
          { status: 400 }
        );
      }
      cleanPhone = soDienThoai.trim();

      // Ngoai le A2: Sai dinh dang SoDienThoai
      if (!PHONE_REGEX.test(cleanPhone)) {
        return NextResponse.json(
          {
            error:
              "Số điện thoại không đúng định dạng. Vui lòng nhập số điện thoại gồm đúng 10 chữ số và bắt đầu bằng số 0.",
          },
          { status: 400 }
        );
      }

      // Trung lap du lieu doc nhat: Kiem tra SoDienThoai o nhan vien KHAC
      const dupPhone = await prisma.nhanVien.findFirst({
        where: {
          SoDienThoai: cleanPhone,
          NOT: { MaNV: maNV },
        },
      });
      if (dupPhone) {
        return NextResponse.json(
          { error: "Thông tin đã tồn tại" },
          { status: 409 }
        );
      }
    }

    // Ngoai le A2 & Trung lap voi Email
    let cleanEmail: string | null = null;
    if (email !== undefined && email !== null) {
      const emailStr = String(email).trim();
      if (emailStr) {
        cleanEmail = emailStr.toLowerCase();
        // A2: Sai dinh dang email
        if (!EMAIL_REGEX.test(cleanEmail)) {
          return NextResponse.json(
            {
              error:
                "Email không đúng định dạng. Vui lòng kiểm tra lại cấu trúc email (ví dụ: nhanvien@fbshop.vn).",
            },
            { status: 400 }
          );
        }

        // Trung lap du lieu doc nhat: Kiem tra Email o nhan vien KHAC
        const dupEmail = await prisma.taiKhoan.findFirst({
          where: {
            TenDangNhap: cleanEmail,
            NOT: { MaNV: maNV },
          },
        });
        if (dupEmail) {
          return NextResponse.json(
            { error: "Thông tin đã tồn tại" },
            { status: 409 }
          );
        }
      }
    }

    // Thuc thi cap nhat
    const updated = await prisma.$transaction(async (tx) => {
      const emp = await tx.nhanVien.update({
        where: { MaNV: maNV },
        data: {
          HoTen: hoTen !== undefined ? hoTen.trim() : undefined,
          SoDienThoai: cleanPhone,
          DiaChi: diaChi !== undefined ? diaChi?.trim() || null : undefined,
          LuongCoBan: luongCoBan !== undefined ? Number(luongCoBan) : undefined,
          PhuCap: phuCap !== undefined ? Number(phuCap) : undefined,
          TrangThai: trangThai || undefined,
        },
      });

      // Cap nhat email vao tai khoan lien ket neu co
      if (cleanEmail) {
        const existingTK = await tx.taiKhoan.findFirst({ where: { MaNV: maNV } });
        if (existingTK) {
          await tx.taiKhoan.update({
            where: { MaTK: existingTK.MaTK },
            data: { TenDangNhap: cleanEmail },
          });
        } else {
          const defaultHash = await hashPassword("123456");
          await tx.taiKhoan.create({
            data: {
              TenDangNhap: cleanEmail,
              MatKhau: defaultHash,
              PhanQuyen: "NhanVien",
              TrangThai: "Active",
              MaNV: maNV,
            },
          });
        }
      }

      return emp;
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật nhân viên thành công",
      data: updated,
    });
  } catch (error: any) {
    console.error("PUT nhan-vien error:", error);
    return NextResponse.json({ error: error.message || "Lỗi cập nhật nhân viên" }, { status: 500 });
  }
}

// DELETE: Xoa hoac chuyen Da nghi viec
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const maNV = searchParams.get("maNV");

    if (!maNV) {
      return NextResponse.json({ error: "Thiếu mã nhân viên cần xóa" }, { status: 400 });
    }

    // Kiem tra rang buoc trong HoaDonKho
    const invoiceCount = await prisma.hoaDonKho.count({
      where: { MaNV: maNV },
    });

    if (invoiceCount > 0) {
      await prisma.nhanVien.update({
        where: { MaNV: maNV },
        data: { TrangThai: "Da nghi viec" },
      });

      return NextResponse.json({
        success: true,
        softDeleted: true,
        message: "Nhân viên đã có lịch sử lập hóa đơn kho. Đã chuyển trạng thái sang 'Đã nghỉ việc'.",
      });
    }

    // Xoa ca tai khoan lien ket neu co
    await prisma.taiKhoan.deleteMany({ where: { MaNV: maNV } });

    await prisma.nhanVien.delete({
      where: { MaNV: maNV },
    });

    return NextResponse.json({
      success: true,
      softDeleted: false,
      message: "Đã xóa nhân viên thành công.",
    });
  } catch (error: any) {
    console.error("DELETE nhan-vien error:", error);
    return NextResponse.json({ error: "Lỗi khi xóa nhân viên" }, { status: 500 });
  }
}
