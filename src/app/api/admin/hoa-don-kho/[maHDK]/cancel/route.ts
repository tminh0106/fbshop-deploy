import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ maHDK: string }> }
) {
  try {
    const { maHDK } = await params;
    const body = await request.json();
    const { lyDoHuy } = body;

    // 1. Kiem tra ly do huy
    if (!lyDoHuy || typeof lyDoHuy !== "string" || !lyDoHuy.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập lý do hủy hóa đơn" },
        { status: 400 }
      );
    }

    // 2. Tim hoa don kho kem chi tiet
    const hdk = await prisma.hoaDonKho.findUnique({
      where: { MaHDK: maHDK },
      include: {
        ChiTietHoaDonKhos: {
          include: {
            SanPham: true,
          },
        },
      },
    });

    if (!hdk) {
      return NextResponse.json(
        { error: "Không tìm thấy hóa đơn kho cần hủy" },
        { status: 404 }
      );
    }

    if (hdk.TrangThai === "Da huy" || hdk.TrangThai === "Cancelled") {
      return NextResponse.json(
        { error: "Hóa đơn kho này đã được hủy trước đó" },
        { status: 400 }
      );
    }

    // 3. Quy tac BR-01 kiem tra hoan nguyen
    // Voi loai NHAP: Can tru lai so luong. Kiem tra ton kho xem co du de tru khong.
    if (hdk.LoaiPhieu === "NHAP") {
      for (const ct of hdk.ChiTietHoaDonKhos) {
        const sp = ct.SanPham;
        if (!sp) continue;

        if (sp.SoLuong < ct.SoLuong) {
          return NextResponse.json(
            {
              error: `Không thể hủy: Tồn kho hiện tại của mặt hàng [${sp.TenSP}] không đủ để hoàn nguyên (Tồn hiện tại: ${sp.SoLuong}, Số lượng cần hoàn nguyên trừ: ${ct.SoLuong})`,
            },
            { status: 400 }
          );
        }
      }
    }

    // 4. Thuc thi Transaction hoan nguyen kho BR-01
    await prisma.$transaction(async (tx) => {
      for (const ct of hdk.ChiTietHoaDonKhos) {
        if (!ct.SanPham) continue;

        if (hdk.LoaiPhieu === "NHAP") {
          // Huy phieu nhap -> Tru lai ton kho
          await tx.sanPham.update({
            where: { MaSP: ct.MaSP },
            data: {
              SoLuong: { decrement: ct.SoLuong },
            },
          });
        } else if (hdk.LoaiPhieu === "XUAT") {
          // Huy phieu xuat -> Cong lai ton kho (luon hop le)
          await tx.sanPham.update({
            where: { MaSP: ct.MaSP },
            data: {
              SoLuong: { increment: ct.SoLuong },
            },
          });
        }
      }

      // Cap nhat trang thai va ly do huy
      const ghiChuHuy = hdk.LyDo
        ? `[ĐÃ HỦY] ${lyDoHuy.trim()} (Gốc: ${hdk.LyDo})`
        : `[ĐÃ HỦY] ${lyDoHuy.trim()}`;

      await tx.hoaDonKho.update({
        where: { MaHDK: maHDK },
        data: {
          TrangThai: "Da huy",
          LyDo: ghiChuHuy.slice(0, 500),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Đã hủy hóa đơn kho ${maHDK} và hoàn nguyên tồn kho thành công theo quy tắc BR-01`,
    });
  } catch (error: any) {
    console.error("Cancel hoa-don-kho error:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi xử lý hủy hóa đơn kho" },
      { status: 500 }
    );
  }
}
