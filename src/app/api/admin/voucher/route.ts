import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireFeature } from "@/lib/auth";

const LOAI_GIAM_GIA = ["TIEN", "PHANTRAM"];
const TRANG_THAI = ["Active", "Disabled"];
const LOAI_ERROR = "Loại giảm giá không hợp lệ (chỉ nhận TIEN hoặc PHANTRAM)";
const OVER_100 = "Định dạng dữ liệu không hợp lệ: Phần trăm giảm không được vượt quá 100%";
const END_BEFORE_START = "Thời gian kết thúc phải sau thời gian bắt đầu";
const PAST_START = "Thời gian bắt đầu không được nhỏ hơn thời điểm hiện tại";
const NOT_FOUND = "Voucher không tồn tại";

// Phut hien tai (form chon den phut)
const currentMinute = () => {
  const d = new Date();
  d.setSeconds(0, 0);
  return d;
};

// GET: Danh sach voucher (Ho tro tim kiem va loc theo dac ta)
export async function GET(request: Request) {
  try {
    const auth = await requireFeature("voucher");
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword")?.trim();
    const status = searchParams.get("status")?.trim();
    const fromDate = searchParams.get("fromDate")?.trim();
    const toDate = searchParams.get("toDate")?.trim();

    // Kiem tra logic thoi gian loc (A2: Tu ngay > Den ngay)
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      return NextResponse.json(
        { error: "Khoảng thời gian tìm kiếm không hợp lệ" },
        { status: 400 }
      );
    }

    const where: any = {};
    if (keyword) {
      where.OR = [
        { MaVoucher: { contains: keyword } },
        { LoaiGiamGia: { contains: keyword } },
      ];
    }

    if (fromDate) {
      where.NgayKetThuc = { gte: new Date(fromDate) };
    }
    if (toDate) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      where.NgayBatDau = { lte: endOfDay };
    }

    const vouchers = await prisma.voucher.findMany({
      where,
      include: {
        _count: {
          select: { DonHangs: true },
        },
      },
      orderBy: { NgayBatDau: "desc" },
    });

    const now = new Date();
    // Loc theo trang thai vong doi (Sap dien ra, Dang hoat dong, Da ket thuc, Da vo hieu hoa)
    let filtered = vouchers;
    if (status && status !== "ALL" && status !== "Tất cả") {
      filtered = vouchers.filter((v) => {
        const isDis = v.TrangThai === "Disabled";
        const start = new Date(v.NgayBatDau);
        const end = new Date(v.NgayKetThuc);

        if (status === "Đã vô hiệu hóa" || status === "Disabled") {
          return isDis;
        }
        if (isDis) return false;

        if (status === "Sắp diễn ra" || status === "Upcoming") {
          return now < start;
        }
        if (status === "Đã kết thúc" || status === "Expired") {
          return now > end;
        }
        if (status === "Đang hoạt động" || status === "Active") {
          return now >= start && now <= end;
        }
        return true;
      });
    }

    return NextResponse.json({ success: true, data: filtered });
  } catch (error: any) {
    console.error("GET voucher error:", error);
    return NextResponse.json({ error: "Lỗi tải danh sách voucher" }, { status: 500 });
  }
}

// POST: Them voucher moi
export async function POST(request: Request) {
  try {
    const auth = await requireFeature("voucher");
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const {
      maVoucher,
      loaiGiamGia,
      giaTriGiam,
      donHangToiThieu,
      mucGiamToiDa,
      tongSoLuong,
      gioiHanSuDung,
      ngayBatDau,
      ngayKetThuc,
    } = body;

    if (!maVoucher || !loaiGiamGia || !giaTriGiam || !ngayBatDau || !ngayKetThuc) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ thông tin bắt buộc của Voucher" },
        { status: 400 }
      );
    }

    // Cot MaVoucher trong CSDL la VarChar(50)
    if (String(maVoucher).trim().length > 50) {
      return NextResponse.json(
        { error: "Mã voucher tối đa 50 ký tự" },
        { status: 400 }
      );
    }

    const loai = String(loaiGiamGia).toUpperCase();
    if (!LOAI_GIAM_GIA.includes(loai)) {
      return NextResponse.json({ error: LOAI_ERROR }, { status: 400 });
    }

    const numGiaTri = Number(giaTriGiam);
    const numDonHangToiThieu = Number(donHangToiThieu) || 0;
    const numMucGiamToiDa = Number(mucGiamToiDa) || 0;
    // Chi mac dinh 100 khi khong gui so luong; gui 0 thi bi chan o buoc kiem tra ben duoi
    const numTongSoLuong =
      tongSoLuong === undefined || tongSoLuong === null || tongSoLuong === ""
        ? 100
        : Number(tongSoLuong);

    // So khong hop le (chu, so le o so luong) cung bao loi thay vi loi he thong
    const badNumber =
      !Number.isFinite(numGiaTri) || !Number.isFinite(numDonHangToiThieu) || !Number.isFinite(numMucGiamToiDa) || !Number.isInteger(numTongSoLuong);
    if (badNumber || numGiaTri <= 0 || numDonHangToiThieu < 0 || numMucGiamToiDa < 0 || numTongSoLuong <= 0) {
      return NextResponse.json(
        { error: "Định dạng dữ liệu không hợp lệ: Số lượng và giá trị không được là số âm hoặc bằng 0" },
        { status: 400 }
      );
    }

    if (loai === "PHANTRAM" && numGiaTri > 100) {
      return NextResponse.json({ error: OVER_100 }, { status: 400 });
    }

    const start = new Date(ngayBatDau);
    const end = new Date(ngayKetThuc);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return NextResponse.json({ error: "Thời gian không hợp lệ" }, { status: 400 });
    }

    if (start.getTime() < currentMinute().getTime()) {
      return NextResponse.json({ error: PAST_START }, { status: 400 });
    }

    if (end <= start) {
      return NextResponse.json({ error: END_BEFORE_START }, { status: 400 });
    }

    const existing = await prisma.voucher.findUnique({
      where: { MaVoucher: maVoucher.trim().toUpperCase() },
    });
    if (existing) {
      return NextResponse.json({ error: "Mã voucher này đã tồn tại" }, { status: 409 });
    }

    const newVoucher = await prisma.voucher.create({
      data: {
        MaVoucher: maVoucher.trim().toUpperCase(),
        LoaiGiamGia: loai,
        GiaTriGiam: numGiaTri,
        DonHangToiThieu: numDonHangToiThieu,
        MucGiamToiDa: numMucGiamToiDa,
        TongSoLuong: numTongSoLuong,
        GioiHanSuDung: Number(gioiHanSuDung) || 1,
        NgayBatDau: start,
        NgayKetThuc: end,
        TrangThai: "Active",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Tạo voucher thành công",
      data: newVoucher,
    });
  } catch (error: any) {
    console.error("POST voucher error:", error);
    return NextResponse.json({ error: "Lỗi tạo voucher mới" }, { status: 500 });
  }
}

// PUT: Cap nhat voucher (Bao toan ke toan)
export async function PUT(request: Request) {
  try {
    const auth = await requireFeature("voucher");
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const {
      maVoucher,
      loaiGiamGia,
      giaTriGiam,
      donHangToiThieu,
      mucGiamToiDa,
      tongSoLuong,
      ngayBatDau,
      ngayKetThuc,
      trangThai,
    } = body;

    if (!maVoucher) {
      return NextResponse.json({ error: "Thiếu mã voucher" }, { status: 400 });
    }

    const current = await prisma.voucher.findUnique({ where: { MaVoucher: maVoucher } });
    if (!current) {
      return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
    }

    // Loai / trang thai: chi nhan gia tri chuan (giu nguyen gia tri cu cua du lieu cu thi van cho qua)
    if (loaiGiamGia !== undefined && loaiGiamGia !== current.LoaiGiamGia && !LOAI_GIAM_GIA.includes(loaiGiamGia)) {
      return NextResponse.json({ error: LOAI_ERROR }, { status: 400 });
    }
    if (trangThai !== undefined && trangThai !== "" && trangThai !== current.TrangThai && !TRANG_THAI.includes(trangThai)) {
      return NextResponse.json({ error: "Trạng thái voucher không hợp lệ" }, { status: 400 });
    }

    const isNum = (v: unknown) => v === undefined || Number.isFinite(Number(v));
    if (!isNum(giaTriGiam) || !isNum(donHangToiThieu) || !isNum(mucGiamToiDa) || (tongSoLuong !== undefined && !Number.isInteger(Number(tongSoLuong)))) {
      return NextResponse.json({ error: "Định dạng dữ liệu không hợp lệ: Giá trị phải là số" }, { status: 400 });
    }

    if (giaTriGiam !== undefined && Number(giaTriGiam) <= 0) {
      return NextResponse.json(
        { error: "Định dạng dữ liệu không hợp lệ: Mức giảm phải lớn hơn 0" },
        { status: 400 }
      );
    }

    if (loaiGiamGia === "PHANTRAM" && giaTriGiam !== undefined && Number(giaTriGiam) > 100) {
      return NextResponse.json(
        { error: "Định dạng dữ liệu không hợp lệ: Phần trăm giảm không được vượt quá 100%" },
        { status: 400 }
      );
    }

    if (donHangToiThieu !== undefined && Number(donHangToiThieu) < 0) {
      return NextResponse.json(
        { error: "Định dạng dữ liệu không hợp lệ: Đơn tối thiểu không được là số âm" },
        { status: 400 }
      );
    }

    if (mucGiamToiDa !== undefined && Number(mucGiamToiDa) < 0) {
      return NextResponse.json(
        { error: "Định dạng dữ liệu không hợp lệ: Mức giảm tối đa không được là số âm" },
        { status: 400 }
      );
    }

    if (tongSoLuong !== undefined && Number(tongSoLuong) <= 0) {
      return NextResponse.json(
        { error: "Định dạng dữ liệu không hợp lệ: Tổng số lượng phải lớn hơn 0" },
        { status: 400 }
      );
    }

    // Kiem tra so luot da su dung trong DonHang
    const usedCount = await prisma.donHang.count({
      where: { MaVoucher: maVoucher },
    });

    let updateData: any = {};

    if (usedCount > 0) {
      // DA CO DON HANG DUNG -> Khoa dinh gia, chi cho sua ngay ket thuc, tong so luong bo sung va trang thai
      if (ngayKetThuc) updateData.NgayKetThuc = new Date(ngayKetThuc);
      if (tongSoLuong !== undefined) updateData.TongSoLuong = Number(tongSoLuong);
      if (trangThai) updateData.TrangThai = trangThai;
    } else {
      // CHUA CO DON HANG DUNG -> Cho sua toan dien
      if (loaiGiamGia) updateData.LoaiGiamGia = loaiGiamGia;
      if (giaTriGiam !== undefined) updateData.GiaTriGiam = Number(giaTriGiam);
      if (donHangToiThieu !== undefined) updateData.DonHangToiThieu = Number(donHangToiThieu);
      if (mucGiamToiDa !== undefined) updateData.MucGiamToiDa = Number(mucGiamToiDa);
      if (tongSoLuong !== undefined) updateData.TongSoLuong = Number(tongSoLuong);
      if (ngayBatDau) updateData.NgayBatDau = new Date(ngayBatDau);
      if (ngayKetThuc) updateData.NgayKetThuc = new Date(ngayKetThuc);
      if (trangThai) updateData.TrangThai = trangThai;
    }

    // Kiem tra tren gia tri SAU KHI SUA (truong khong gui giu gia tri cu)
    const loaiMoi = String(updateData.LoaiGiamGia ?? current.LoaiGiamGia).toUpperCase();
    const giaTriMoi = Number(updateData.GiaTriGiam ?? current.GiaTriGiam);
    if (loaiMoi === "PHANTRAM" && giaTriMoi > 100) {
      return NextResponse.json({ error: OVER_100 }, { status: 400 });
    }
    const startMoi: Date = updateData.NgayBatDau ?? current.NgayBatDau;
    const endMoi: Date = updateData.NgayKetThuc ?? current.NgayKetThuc;
    if (Number.isNaN(startMoi.getTime()) || Number.isNaN(endMoi.getTime())) {
      return NextResponse.json({ error: "Thời gian không hợp lệ" }, { status: 400 });
    }
    if (updateData.NgayBatDau && startMoi.getTime() !== current.NgayBatDau.getTime() && startMoi < currentMinute()) {
      return NextResponse.json({ error: PAST_START }, { status: 400 });
    }
    if (endMoi <= startMoi) {
      return NextResponse.json({ error: END_BEFORE_START }, { status: 400 });
    }

    const updated = await prisma.voucher.update({
      where: { MaVoucher: maVoucher },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      usedCount,
      lockedPrice: usedCount > 0,
      data: updated,
      message:
        usedCount > 0
          ? "Voucher đã có lượt sử dụng. Định giá được khóa bảo toàn kế toán, chỉ cập nhật thời hạn/số lượng."
          : "Cập nhật voucher thành công.",
    });
  } catch (error: any) {
    console.error("PUT voucher error:", error);
    return NextResponse.json({ error: "Lỗi cập nhật voucher" }, { status: 500 });
  }
}

// DELETE: Vo hieu hoa hoac xoa voucher
export async function DELETE(request: Request) {
  try {
    const auth = await requireFeature("voucher");
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const maVoucher = searchParams.get("maVoucher");

    if (!maVoucher) {
      return NextResponse.json({ error: "Thiếu mã voucher cần xóa" }, { status: 400 });
    }

    const exists = await prisma.voucher.findUnique({ where: { MaVoucher: maVoucher }, select: { MaVoucher: true } });
    if (!exists) {
      return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
    }

    const usedCount = await prisma.donHang.count({
      where: { MaVoucher: maVoucher },
    });

    if (usedCount > 0) {
      // Vo hieu hoa thay vi xoa
      await prisma.voucher.update({
        where: { MaVoucher: maVoucher },
        data: { TrangThai: "Disabled" },
      });

      return NextResponse.json({
        success: true,
        softDeleted: true,
        message: "Voucher đã có lịch sử đơn hàng. Đã chuyển trạng thái sang 'Vô hiệu hóa'.",
      });
    }

    await prisma.voucher.delete({
      where: { MaVoucher: maVoucher },
    });

    return NextResponse.json({
      success: true,
      softDeleted: false,
      message: "Đã xóa voucher thành công.",
    });
  } catch (error: any) {
    console.error("DELETE voucher error:", error);
    return NextResponse.json({ error: "Lỗi khi xóa voucher" }, { status: 500 });
  }
}
