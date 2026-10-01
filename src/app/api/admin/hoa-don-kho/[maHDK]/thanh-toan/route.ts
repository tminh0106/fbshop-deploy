import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireFeature } from "@/lib/auth";
import { parseIntInRange } from "@/lib/validation";
import { invoiceDebt, isInvoiceCancelled } from "@/lib/warehouse";

// =======================================================
// THANH TOAN CONG NO NHA CUNG CAP cho 1 phieu nhap
// Tra them soTien (1 .. so con no) -> DaThanhToan tang, cong no NCC giam
// =======================================================

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(request: Request, { params }: { params: Promise<{ maHDK: string }> }) {
  try {
    const auth = await requireFeature("kho");
    if (!auth.ok) return auth.response;

    const { maHDK } = await params;
    const { soTien } = await request.json();

    const hdk = await prisma.hoaDonKho.findUnique({ where: { MaHDK: maHDK } });
    if (!hdk) return bad("Hóa đơn không tồn tại hoặc đã bị xóa", 404);
    if (hdk.LoaiPhieu !== "NHAP") return bad("Chỉ phiếu nhập mới phát sinh công nợ nhà cung cấp");
    if (isInvoiceCancelled(hdk.TrangThai)) return bad("Phiếu nhập đã hủy, không thể thanh toán");

    const conNo = invoiceDebt(hdk);
    if (conNo <= 0) return bad("Phiếu nhập này đã được thanh toán đủ");
    const amount = parseIntInRange(soTien, 1, conNo);
    if (amount === null) return bad(`Số tiền thanh toán phải là số nguyên từ 1 đến ${conNo.toLocaleString("vi-VN")}đ`);

    // Khoa lac quan: chi cong khi DaThanhToan chua bi nguoi khac thay doi (tranh tra trung)
    const done = await prisma.hoaDonKho.updateMany({
      where: { MaHDK: maHDK, DaThanhToan: hdk.DaThanhToan, NOT: { TrangThai: { in: ["Da huy", "Cancelled"] } } },
      data: { DaThanhToan: { increment: amount } },
    });
    if (done.count === 0) return bad("Phiếu vừa được cập nhật bởi người khác, vui lòng tải lại", 409);

    const conLai = conNo - amount;
    return NextResponse.json({
      success: true,
      message:
        conLai === 0
          ? `Đã thanh toán đủ phiếu nhập ${maHDK}`
          : `Đã ghi nhận thanh toán ${amount.toLocaleString("vi-VN")}đ. Còn nợ ${conLai.toLocaleString("vi-VN")}đ`,
      conNo: conLai,
    });
  } catch (error) {
    console.error("POST hoa-don-kho thanh-toan error:", error);
    return bad("Đã xảy ra lỗi, vui lòng thử lại sau", 500);
  }
}
