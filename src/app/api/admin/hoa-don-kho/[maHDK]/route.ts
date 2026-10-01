import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireFeature } from "@/lib/auth";
import { invoiceDebt } from "@/lib/warehouse";

// GET: Xem chi tiet / in phieu kho (Bang 3.19)
export async function GET(_request: Request, { params }: { params: Promise<{ maHDK: string }> }) {
  try {
    const auth = await requireFeature("kho");
    if (!auth.ok) return auth.response;

    const { maHDK } = await params;
    const hdk = await prisma.hoaDonKho.findUnique({
      where: { MaHDK: maHDK },
      include: {
        NhanVien: { select: { MaNV: true, HoTen: true } },
        NhaCungCap: true,
        ChiTietHoaDonKhos: { include: { SanPham: { select: { MaSP: true, TenSP: true } } } },
      },
    });
    if (!hdk) return NextResponse.json({ error: "Hóa đơn không tồn tại hoặc đã bị xóa" }, { status: 404 });

    return NextResponse.json({ success: true, data: { ...hdk, CongNo: invoiceDebt(hdk) } });
  } catch (error) {
    console.error("GET hoa-don-kho/[maHDK] error:", error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau" }, { status: 500 });
  }
}
