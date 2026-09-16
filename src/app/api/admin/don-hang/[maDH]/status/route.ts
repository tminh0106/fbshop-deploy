import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// Chuyen doi chuan hoa ten trang thai
function normalizeStatus(status: string): string {
  if (status === "Pending") return "Cho xac nhan";
  if (status === "Processing") return "Dang xu ly";
  if (status === "Shipping") return "Dang giao";
  if (status === "Completed") return "Da giao";
  if (status === "Cancelled") return "Da huy";
  return status;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ maDH: string }> }
) {
  try {
    const { maDH } = await params;
    const body = await request.json();
    const targetStatus = body.trangThai;

    if (!targetStatus) {
      return NextResponse.json({ error: "Vui lòng cung cấp trạng thái mới" }, { status: 400 });
    }

    const order = await prisma.donHang.findUnique({
      where: { MaDH: maDH },
      include: {
        ChiTietDonHangs: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
    }

    const currentStatus = normalizeStatus(order.TrangThai);
    const newStatus = normalizeStatus(targetStatus);

    // Chan chinh sua don da giao hoac da huy
    if (currentStatus === "Da giao" || currentStatus === "Da huy") {
      return NextResponse.json(
        { error: "Đơn hàng đã hoàn thành hoặc đã hủy, không được phép chỉnh sửa trạng thái tùy tiện." },
        { status: 400 }
      );
    }

    // Kiem tra luong tuan tu (Sequence 3.2.4.2.1)
    const validTransitions: Record<string, string[]> = {
      "Cho xac nhan": ["Dang xu ly", "Da huy"],
      "Dang xu ly": ["Dang giao", "Da huy"],
      "Dang giao": ["Da giao"],
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Luồng chuyển trạng thái không hợp lệ. Không thể chuyển trực tiếp từ '${currentStatus}' sang '${newStatus}'.`,
        },
        { status: 400 }
      );
    }

    // Neu chuyen sang "Da huy" -> Hoan tra ton kho cho san pham
    await prisma.$transaction(async (tx) => {
      if (newStatus === "Da huy") {
        for (const item of order.ChiTietDonHangs) {
          await tx.sanPham.update({
            where: { MaSP: item.MaSP },
            data: {
              SoLuong: { increment: item.SoLuong },
            },
          });
        }
      }

      await tx.donHang.update({
        where: { MaDH: maDH },
        data: {
          TrangThai: newStatus,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật trạng thái đơn hàng sang '${newStatus}' thành công`,
    });
  } catch (error: any) {
    console.error("PUT order status error:", error);
    return NextResponse.json({ error: error.message || "Lỗi cập nhật trạng thái" }, { status: 500 });
  }
}
