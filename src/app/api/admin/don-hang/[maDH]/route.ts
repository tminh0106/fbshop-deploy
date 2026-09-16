import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ maDH: string }> }
) {
  try {
    const { maDH } = await params;
    const order = await prisma.donHang.findUnique({
      where: { MaDH: maDH },
    });

    if (!order) {
      return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
    }

    const st = order.TrangThai;
    if (st === "Dang giao" || st === "Da giao" || st === "Shipping" || st === "Completed") {
      return NextResponse.json(
        {
          error: "Không thể xóa đơn hàng đang trong quá trình vận chuyển hoặc đã hoàn thành",
        },
        { status: 400 }
      );
    }

    // Xoa an toan ChiTietDonHang truoc, roi xoa DonHang
    await prisma.$transaction(async (tx) => {
      await tx.chiTietDonHang.deleteMany({
        where: { MaDH: maDH },
      });
      await tx.donHang.delete({
        where: { MaDH: maDH },
      });
    });

    return NextResponse.json({ success: true, message: "Đã xóa đơn hàng thành công" });
  } catch (error: any) {
    console.error("DELETE order error:", error);
    return NextResponse.json({ error: "Lỗi khi xóa đơn hàng" }, { status: 500 });
  }
}
