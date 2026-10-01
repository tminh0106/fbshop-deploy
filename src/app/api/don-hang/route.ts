import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getCurrentCustomer } from "@/lib/auth";
import { ORDER_STATUS, PAYMENT_STATUS, canCustomerCancel } from "@/lib/orderStatus";
import { cancelExpiredUnpaidOrders, paymentDeadline } from "@/lib/orderExpiry";

// Phuong thuc thanh toan trang dat hang gui len (COD / chuyen khoan QR)
const PAYMENT_METHODS = ["COD", "BANKING"];
const MAX_QTY_PER_ITEM = 999;
const STOPPED_TAG = "[NGỪNG KINH DOANH]";
// Phi van chuyen: mien phi tu 1.000.000d tien hang (khop voi trang dat hang)
const FREE_SHIP_FROM = 1_000_000;
const SHIPPING_FEE = 30_000;

// Het hang giua luc kiem tra va luc tru ton (nhieu khach dat cung luc)
class OutOfStockError extends Error {
  constructor(public productName: string) {
    super("OUT_OF_STOCK");
  }
}

// Voucher vua het luot giua luc kiem tra va luc tru luot (nhieu khach dung ma cuoi cung luc)
class VoucherExhaustedError extends Error {}

// MySQL huy 1 trong 2 giao dich ghi cung luc (deadlock / write conflict - P2034): thu lai.
// Lan thu lai doc du lieu moi nen se bao dung "het hang" / "het luot voucher" neu co.
async function withDeadlockRetry<T>(run: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await run();
    } catch (err) {
      const deadlock = err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034";
      if (!deadlock || i >= attempts) throw err;
      await new Promise((r) => setTimeout(r, 50 * i + Math.random() * 50));
    }
  }
}

// ==========================================
// GET /api/don-hang: Lay lich su don hang cua khach
// ==========================================
export async function GET() {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json({ error: "Vui lòng đăng nhập để xem đơn hàng" }, { status: 401 });
    }

    // Don chuyen khoan qua han thanh toan -> tu huy, tra hang ve kho
    await cancelExpiredUnpaidOrders(customer.MaKH);

    const orders = await prisma.donHang.findMany({
      where: { MaKH: customer.MaKH },
      include: {
        ChiTietDonHangs: {
          include: {
            SanPham: true,
          },
        },
        Voucher: true,
      },
      orderBy: { NgayTao: "desc" },
    });

    const formattedOrders = orders.map((o) => ({
      id: o.MaDH,
      createdAt: o.NgayTao,
      status: o.TrangThai,
      totalAmount: Number(o.TongTien),
      recipientName: o.TenNguoiNhan,
      recipientPhone: o.SdtNguoiNhan,
      recipientAddress: o.DiaChiNhan,
      paymentMethod: o.PhuongThucThanhToan,
      paymentStatus: o.TrangThaiThanhToan,
      paymentReportedAt: o.NgayBaoChuyenKhoan,
      paymentDeadline: o.TrangThai === ORDER_STATUS.WAITING_PAYMENT ? paymentDeadline(o.NgayTao) : null,
      canCancel: canCustomerCancel(o),
      note: o.GhiChu,
      voucher: o.Voucher ? {
        code: o.Voucher.MaVoucher,
        discountType: o.Voucher.LoaiGiamGia,
        discountValue: Number(o.Voucher.GiaTriGiam),
      } : null,
      items: o.ChiTietDonHangs.map((item) => ({
        productId: item.MaSP,
        productName: item.SanPham.TenSP,
        imageUrl: item.SanPham.HinhAnh || "/images/placeholder.png",
        weight: item.SanPham.TrongLuong,
        quantity: item.SoLuong,
        unitPrice: Number(item.DonGia),
        subtotal: Number(item.ThanhTien),
      })),
    }));

    return NextResponse.json({ orders: formattedOrders });
  } catch (error: any) {
    console.error("GET /api/don-hang error:", error);
    return NextResponse.json({ error: "Lỗi tải danh sách đơn hàng" }, { status: 500 });
  }
}

// ==========================================
// POST /api/don-hang: Dat hang (Tao don hang)
// ==========================================
export async function POST(request: Request) {
  try {
    // BUOC 1: Xac thuc nguoi dung
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để đặt hàng" },
        { status: 401 }
      );
    }

    // Tra hang cua cac don chuyen khoan qua han ve kho truoc khi kiem tra ton
    await cancelExpiredUnpaidOrders();

    const body = await request.json();
    const {
      tenNguoiNhan,
      sdtNguoiNhan,
      diaChiNhan,
      phuongThucThanhToan = "COD",
      ghiChu,
      maVoucher,
      items,
      tongTienDuKien,
    } = body;

    // BUOC 2: Validate thong tin giao hang
    if (!tenNguoiNhan || !tenNguoiNhan.trim()) {
      return NextResponse.json({ error: "Vui lòng nhập họ tên người nhận" }, { status: 400 });
    }
    if (tenNguoiNhan.trim().length > 100) {
      return NextResponse.json({ error: "Họ tên người nhận không được quá 100 ký tự" }, { status: 400 });
    }

    const phoneRegex = /^0\d{9}$/;
    if (!sdtNguoiNhan || !phoneRegex.test(sdtNguoiNhan.trim())) {
      return NextResponse.json(
        { error: "Số điện thoại nhận hàng phải gồm đúng 10 số và bắt đầu bằng số 0" },
        { status: 400 }
      );
    }

    if (!diaChiNhan || !diaChiNhan.trim()) {
      return NextResponse.json({ error: "Vui lòng nhập địa chỉ nhận hàng" }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Giỏ hàng không có sản phẩm nào" }, { status: 400 });
    }

    if (!PAYMENT_METHODS.includes(phuongThucThanhToan)) {
      return NextResponse.json({ error: "Phương thức thanh toán không hợp lệ" }, { status: 400 });
    }

    // Gop cac dong trung san pham (tranh loi trung khoa chinh ChiTietDonHang) + so luong phai la so nguyen duong
    const mergedItems = new Map<string, number>();
    for (const item of items) {
      const qty = Number(item?.soLuong);
      if (!item?.maSP || !Number.isInteger(qty) || qty <= 0 || qty > MAX_QTY_PER_ITEM) {
        return NextResponse.json({ error: "Thông tin sản phẩm trong giỏ không hợp lệ" }, { status: 400 });
      }
      mergedItems.set(item.maSP, (mergedItems.get(item.maSP) || 0) + qty);
    }

    // BUOC 3: Kiem tra ton kho & lay gia goc tu DB
    const verifiedItems: { maSP: string; soLuong: number; donGia: number; tenSP: string }[] = [];
    let tongTienHang = 0;

    for (const [maSP, soLuong] of mergedItems) {
      const item = { maSP, soLuong };
      const product = await prisma.sanPham.findUnique({
        where: { MaSP: item.maSP },
      });

      if (!product) {
        return NextResponse.json(
          { error: `Sản phẩm ${item.maSP} không tồn tại` },
          { status: 400 }
        );
      }

      // San pham da ngung kinh doanh (xoa mem) thi khong ban nua
      if (product.MoTa?.includes(STOPPED_TAG)) {
        return NextResponse.json(
          { error: `Sản phẩm "${product.TenSP}" đã ngừng kinh doanh` },
          { status: 400 }
        );
      }

      if (product.SoLuong < item.soLuong) {
        return NextResponse.json(
          { error: `Sản phẩm "${product.TenSP}" chỉ còn ${product.SoLuong} trong kho` },
          { status: 400 }
        );
      }

      const unitPrice = Number(product.GiaBan);
      verifiedItems.push({
        maSP: product.MaSP,
        soLuong: item.soLuong,
        donGia: unitPrice,
        tenSP: product.TenSP,
      });

      tongTienHang += unitPrice * item.soLuong;
    }

    // BUOC 4: Xu ly Voucher (neu co)
    let giamGia = 0;
    let validVoucher: any = null;

    if (maVoucher && maVoucher.trim()) {
      validVoucher = await prisma.voucher.findUnique({
        where: { MaVoucher: maVoucher.trim() },
      });

      if (!validVoucher) {
        return NextResponse.json({ error: "Mã giảm giá không hợp lệ" }, { status: 400 });
      }

      const statusNormalized = validVoucher.TrangThai.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (statusNormalized.includes("huy") || statusNormalized.includes("inactive") || statusNormalized.includes("khoa") || statusNormalized.includes("disabled")) {
        return NextResponse.json({ error: "Mã giảm giá đã hết hiệu lực" }, { status: 400 });
      }

      const now = new Date();
      if (now < new Date(validVoucher.NgayBatDau)) {
        return NextResponse.json({ error: "Mã giảm giá chưa đến thời gian sử dụng" }, { status: 400 });
      }
      if (now > new Date(validVoucher.NgayKetThuc)) {
        return NextResponse.json({ error: "Mã giảm giá đã hết hạn sử dụng" }, { status: 400 });
      }

      if (validVoucher.TongSoLuong <= 0) {
        return NextResponse.json({ error: "Mã giảm giá đã hết lượt sử dụng" }, { status: 400 });
      }

      const minOrder = Number(validVoucher.DonHangToiThieu);
      if (tongTienHang < minOrder) {
        return NextResponse.json(
          { error: `Đơn hàng tối thiểu ${minOrder.toLocaleString("vi-VN")}đ để áp dụng mã này` },
          { status: 400 }
        );
      }

      const giaTri = Number(validVoucher.GiaTriGiam);
      const mucGiamMax = Number(validVoucher.MucGiamToiDa);

      if (validVoucher.LoaiGiamGia.toUpperCase() === "TIEN") {
        giamGia = giaTri;
      } else if (validVoucher.LoaiGiamGia.toUpperCase() === "PHANTRAM") {
        giamGia = (tongTienHang * giaTri) / 100;
        if (mucGiamMax > 0 && giamGia > mucGiamMax) {
          giamGia = mucGiamMax;
        }
      }
    }

    // BUOC 5: Tinh tong tien
    const phiVanChuyen = tongTienHang >= FREE_SHIP_FROM ? 0 : SHIPPING_FEE;
    let tongTien = tongTienHang + phiVanChuyen - giamGia;
    if (tongTien < 0) tongTien = 0;
    // Tien VND khong co so le (giam theo % co the ra so le)
    tongTien = Math.round(tongTien);

    // So tien khach thay tren trang dat hang phai khop so tien he thong tinh (gia SP co the vua thay doi)
    if (tongTienDuKien !== undefined && Math.abs(Math.round(Number(tongTienDuKien)) - tongTien) > 1) {
      return NextResponse.json(
        {
          error: `Tổng thanh toán đã thay đổi (giá sản phẩm vừa được cập nhật): ${tongTien.toLocaleString("vi-VN")}đ. Vui lòng kiểm tra lại giỏ hàng.`,
          tongTien,
        },
        { status: 409 }
      );
    }

    // BUOC 6: Tao don hang trong Transaction
    // COD -> cho shop xac nhan; chuyen khoan -> cho khach thanh toan (don 0d khong can chuyen khoan)
    const orderStatus =
      phuongThucThanhToan === "BANKING" && tongTien > 0 ? ORDER_STATUS.WAITING_PAYMENT : ORDER_STATUS.PENDING;

    const result = await withDeadlockRetry(() => prisma.$transaction(async (tx) => {
      // a) Tao DonHang
      const newOrder = await tx.donHang.create({
        data: {
          TenNguoiNhan: tenNguoiNhan.trim(),
          SdtNguoiNhan: sdtNguoiNhan.trim(),
          DiaChiNhan: diaChiNhan.trim(),
          PhuongThucThanhToan: phuongThucThanhToan,
          TrangThai: orderStatus,
          // Don 0d (giam gia het) coi nhu da thanh toan; con lai chua thanh toan cho den khi shop nhan tien
          TrangThaiThanhToan: tongTien === 0 ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.UNPAID,
          GhiChu: ghiChu?.trim() || null,
          TongTien: tongTien,
          MaKH: customer.MaKH,
          MaVoucher: validVoucher ? validVoucher.MaVoucher : null,
        },
      });

      // b) Tao ChiTietDonHang & tru ton kho tung san pham
      for (const item of verifiedItems) {
        await tx.chiTietDonHang.create({
          data: {
            MaDH: newOrder.MaDH,
            MaSP: item.maSP,
            SoLuong: item.soLuong,
            DonGia: item.donGia,
            ThanhTien: item.donGia * item.soLuong,
          },
        });

        // Tru ton co dieu kien: chi tru khi van du hang (tranh ban am kho khi nhieu khach dat cung luc)
        const deducted = await tx.sanPham.updateMany({
          where: { MaSP: item.maSP, SoLuong: { gte: item.soLuong } },
          data: { SoLuong: { decrement: item.soLuong } },
        });
        if (deducted.count === 0) throw new OutOfStockError(item.tenSP);
      }

      // c) Giam luot dung voucher neu co
      // Chi tru khi con luot (khong de so luot bi am); het luot -> huy ca giao dich dat hang
      if (validVoucher) {
        const used = await tx.voucher.updateMany({
          where: { MaVoucher: validVoucher.MaVoucher, TongSoLuong: { gt: 0 } },
          data: { TongSoLuong: { decrement: 1 } },
        });
        if (used.count === 0) throw new VoucherExhaustedError();
      }

      return newOrder;
    }));

    // BUOC 7: Tra ket qua
    return NextResponse.json({
      success: true,
      order: {
        maDH: result.MaDH,
        tongTien: Number(result.TongTien),
        trangThai: result.TrangThai,
        phuongThucThanhToan: result.PhuongThucThanhToan,
        hanThanhToan: result.TrangThai === ORDER_STATUS.WAITING_PAYMENT ? paymentDeadline(result.NgayTao) : null,
      },
    });
  } catch (error: any) {
    if (error instanceof VoucherExhaustedError) {
      return NextResponse.json(
        { error: "Mã giảm giá vừa hết lượt sử dụng. Vui lòng bỏ mã và đặt hàng lại." },
        { status: 409 }
      );
    }
    if (error instanceof OutOfStockError) {
      return NextResponse.json(
        { error: `Sản phẩm "${error.productName}" vừa hết hàng hoặc không đủ số lượng. Vui lòng kiểm tra lại giỏ hàng.` },
        { status: 409 }
      );
    }
    console.error("POST /api/don-hang error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi tạo đơn hàng. Vui lòng thử lại!" },
      { status: 500 }
    );
  }
}