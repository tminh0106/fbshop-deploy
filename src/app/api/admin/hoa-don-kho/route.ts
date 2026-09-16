import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";

// 1. GET: Danh sach & loc hoa don kho
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tuNgay = searchParams.get("tuNgay");
    const denNgay = searchParams.get("denNgay");
    const loaiPhieu = searchParams.get("loaiPhieu");
    const maNCC = searchParams.get("maNCC");
    const keyword = searchParams.get("keyword")?.trim();

    // Validate khoang thoi gian
    if (tuNgay && denNgay && new Date(tuNgay) > new Date(denNgay)) {
      return NextResponse.json(
        { error: "Khoảng thời gian tìm kiếm không hợp lệ" },
        { status: 400 }
      );
    }

    const where: any = {};

    if (loaiPhieu && loaiPhieu !== "ALL") {
      where.LoaiPhieu = loaiPhieu;
    }

    if (maNCC && maNCC !== "ALL") {
      where.MaNCC = maNCC;
    }

    if (tuNgay || denNgay) {
      where.NgayLap = {};
      if (tuNgay) {
        where.NgayLap.gte = new Date(`${tuNgay}T00:00:00.000Z`);
      }
      if (denNgay) {
        where.NgayLap.lte = new Date(`${denNgay}T23:59:59.999Z`);
      }
    }

    if (keyword) {
      where.OR = [
        { MaHDK: { contains: keyword } },
        { LyDo: { contains: keyword } },
        { NhanVien: { HoTen: { contains: keyword } } },
        { NhaCungCap: { TenNCC: { contains: keyword } } },
      ];
    }

    const list = await prisma.hoaDonKho.findMany({
      where,
      include: {
        NhanVien: {
          select: { MaNV: true, HoTen: true, SoDienThoai: true },
        },
        NhaCungCap: {
          select: { MaNCC: true, TenNCC: true, SoDienThoai: true },
        },
        ChiTietHoaDonKhos: {
          include: {
            SanPham: {
              select: { MaSP: true, TenSP: true, HinhAnh: true, GiaBan: true, SoLuong: true },
            },
          },
        },
      },
      orderBy: { NgayLap: "desc" },
    });

    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    console.error("GET hoa-don-kho error:", error);
    return NextResponse.json({ error: "Lỗi tải danh sách hóa đơn kho" }, { status: 500 });
  }
}

// 2. POST: Lap phieu nhap / xuat kho
export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    const body = await request.json();
    const { loaiPhieu, maNCC, lyDo, items, maNV: customMaNV } = body;

    if (!loaiPhieu || !["NHAP", "XUAT"].includes(loaiPhieu)) {
      return NextResponse.json(
        { error: "Loại phiếu không hợp lệ (Phải là NHAP hoặc XUAT)" },
        { status: 400 }
      );
    }

    if (loaiPhieu === "NHAP" && !maNCC) {
      return NextResponse.json(
        { error: "Vui lòng chọn Nhà cung cấp khi lập phiếu nhập" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Vui lòng chọn ít nhất 1 sản phẩm cho hóa đơn kho" },
        { status: 400 }
      );
    }

    // Xac dinh nhan vien lap phieu
    let maNV = admin?.maNV || customMaNV;
    if (!maNV) {
      // Fallback ve NV_KHO hoac NV dau tien
      const firstNV = await prisma.nhanVien.findFirst();
      maNV = firstNV?.MaNV || "NV_KHO";
    }

    // Sinh MaHDK theo ngay gio chuan
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const maHDK = `HDK-${loaiPhieu}-${todayStr}-${randomSuffix}`;

    // Tinh TongTien
    let tongTien = 0;
    for (const item of items) {
      const sl = Number(item.soLuong) || 0;
      const dg = Number(item.donGia) || 0;
      if (sl <= 0) {
        return NextResponse.json(
          { error: `Số lượng cho sản phẩm ${item.maSP} phải lớn hơn 0` },
          { status: 400 }
        );
      }
      tongTien += sl * dg;
    }

    // Thuc thi trong Transaction an toan
    const result = await prisma.$transaction(async (tx) => {
      // 1. Kiem tra va cap nhat ton kho tung san pham
      for (const item of items) {
        const sp = await tx.sanPham.findUnique({
          where: { MaSP: item.maSP },
        });

        if (!sp) {
          throw new Error(`Sản phẩm mã ${item.maSP} không tồn tại trong hệ thống`);
        }

        const sl = Number(item.soLuong);
        const dg = Number(item.donGia) || 0;

        if (loaiPhieu === "XUAT") {
          if (sp.SoLuong < sl) {
            throw new Error(
              `Số lượng xuất không được lớn hơn tồn kho (Tồn hiện tại: ${sp.SoLuong} cho sản phẩm ${sp.TenSP})`
            );
          }
          // Giam ton kho
          await tx.sanPham.update({
            where: { MaSP: item.maSP },
            data: { SoLuong: sp.SoLuong - sl },
          });
        } else {
          // Tang ton kho
          await tx.sanPham.update({
            where: { MaSP: item.maSP },
            data: { SoLuong: sp.SoLuong + sl },
          });

          // Them ban ghi vao HangHoaKho
          await tx.hangHoaKho.create({
            data: {
              MaSP: item.maSP,
              SoLuong: sl,
              DonGiaNhap: dg,
              ViTriKho: item.viTriKho || "KHO_CHINH",
              GhiChu: lyDo || "Nhập hàng theo hóa đơn " + maHDK,
            },
          });
        }
      }

      // 2. Tao HoaDonKho
      const newHDK = await tx.hoaDonKho.create({
        data: {
          MaHDK: maHDK,
          LoaiPhieu: loaiPhieu,
          LyDo: lyDo || (loaiPhieu === "NHAP" ? "Nhập hàng nhà cung cấp" : "Xuất kho"),
          TongTien: tongTien,
          TrangThai: "Completed",
          MaNV: maNV,
          MaNCC: loaiPhieu === "NHAP" ? maNCC : null,
        },
      });

      // 3. Tao ChiTietHoaDonKho
      for (const item of items) {
        const sl = Number(item.soLuong);
        const dg = Number(item.donGia) || 0;
        await tx.chiTietHoaDonKho.create({
          data: {
            MaHDK: maHDK,
            MaSP: item.maSP,
            SoLuong: sl,
            DonGia: dg,
            ThanhTien: sl * dg,
          },
        });
      }

      return newHDK;
    });

    return NextResponse.json({
      success: true,
      message: `Đã lập phiếu ${loaiPhieu} kho ${maHDK} thành công`,
      data: result,
    });
  } catch (error: any) {
    console.error("POST hoa-don-kho error:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi xử lý lập hóa đơn kho" },
      { status: 400 }
    );
  }
}
