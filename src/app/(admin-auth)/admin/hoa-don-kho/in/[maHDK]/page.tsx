"use client";

import { use, useEffect, useState } from "react";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SHOP_INFO, isInvoiceCancelled, numberToVietnameseWords, warehouseLabel } from "@/lib/warehouse";

// =======================================================
// IN PHIEU NHAP KHO (Mau so 01-VT) / PHIEU XUAT KHO (Mau so 02-VT)
// Theo Thong tu 200/2014/TT-BTC - ban in A4, co cho ky xac nhan
// =======================================================

interface Invoice {
  MaHDK: string;
  NgayLap: string;
  LoaiPhieu: "NHAP" | "XUAT";
  NghiepVu: string | null;
  LyDo: string | null;
  SoChungTu: string | null;
  NguoiGiaoNhan: string | null;
  KhoHang: string | null;
  TongTien: number;
  DaThanhToan: number;
  CongNo: number;
  TrangThai: string;
  NhanVien: { MaNV: string; HoTen: string } | null;
  NhaCungCap: { MaNCC: string; TenNCC: string; DiaChi: string | null; MaSoThue: string | null } | null;
  ChiTietHoaDonKhos: { MaSP: string; SoLuong: number; DonGia: number; ThanhTien: number; SanPham: { TenSP: string } | null }[];
}

const money = (n: number | string) => Number(n).toLocaleString("vi-VN");

// Tai khoan ghi No theo nghiep vu xuat (Co 156 - Hang hoa)
const DEBIT_BY_XUAT: Record<string, string> = {
  "Xuất trả nhà cung cấp": "331",
  "Xuất hủy hàng lỗi/hỏng": "811",
  "Xuất bảo hành": "641",
  "Xuất sử dụng nội bộ": "642",
  "Xuất điều chuyển kho": "156",
};

export default function PrintInvoicePage({ params }: { params: Promise<{ maHDK: string }> }) {
  const { maHDK } = use(params);
  const [inv, setInv] = useState<Invoice | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/hoa-don-kho/${encodeURIComponent(maHDK)}`)
      .then(async (res) => {
        const json = await res.json();
        if (res.ok) setInv(json.data);
        else setError(json.error || "Không tải được phiếu");
      })
      .catch(() => setError("Lỗi kết nối máy chủ"));
  }, [maHDK]);

  if (error) return <p className="p-10 text-center text-sm text-red-600">{error}</p>;
  if (!inv) return <p className="p-10 text-center text-sm text-slate-400">Đang tải phiếu...</p>;

  const isNhap = inv.LoaiPhieu === "NHAP";
  const d = new Date(inv.NgayLap);
  const vnDate = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(d);
  const part = (t: string) => vnDate.find((p) => p.type === t)?.value;
  const totalQty = inv.ChiTietHoaDonKhos.reduce((s, c) => s + c.SoLuong, 0);
  const cancelled = isInvoiceCancelled(inv.TrangThai);

  const signers = isNhap
    ? ["Người lập phiếu", "Người giao hàng", "Thủ kho", "Kế toán trưởng"]
    : ["Người lập phiếu", "Người nhận hàng", "Thủ kho", "Kế toán trưởng"];

  return (
    <div className="min-h-screen bg-slate-100 py-6 print:bg-white print:py-0">
      {/* Thanh cong cu - an khi in */}
      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-2 print:hidden">
        <Link href="/admin/hoa-don-kho" className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl bg-[#f66315] px-4 py-2 text-sm font-bold text-white hover:bg-[#e55000]"
        >
          <Printer className="h-4 w-4" />
          In phiếu
        </button>
      </div>

      <div className="relative mx-auto w-full max-w-[210mm] bg-white p-[14mm] text-[13px] leading-relaxed text-black shadow-lg print:max-w-none print:p-[10mm] print:shadow-none" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
        {cancelled && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="rotate-[-25deg] rounded-lg border-4 border-red-500 px-6 py-2 text-5xl font-bold text-red-500/40">ĐÃ HỦY</span>
          </div>
        )}

        {/* Dau trang */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="font-bold uppercase">{SHOP_INFO.name}</p>
            <p>Địa chỉ: {SHOP_INFO.address}</p>
            <p>Điện thoại: {SHOP_INFO.phone}</p>
          </div>
          <div className="text-center">
            <p className="font-bold">Mẫu số {isNhap ? "01 - VT" : "02 - VT"}</p>
            <p className="text-[11px] italic">(Ban hành theo Thông tư số 200/2014/TT-BTC</p>
            <p className="text-[11px] italic">ngày 22/12/2014 của Bộ Tài chính)</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-[1fr_auto] items-start">
          <div className="text-center">
            <h1 className="text-2xl font-bold uppercase tracking-wide">{isNhap ? "Phiếu nhập kho" : "Phiếu xuất kho"}</h1>
            <p className="italic">
              Ngày {part("day")} tháng {part("month")} năm {part("year")}
            </p>
            <p>
              Số: <strong>{inv.MaHDK}</strong>
            </p>
          </div>
          <div className="text-[12px]">
            <p>Nợ: {isNhap ? "156" : DEBIT_BY_XUAT[inv.NghiepVu || ""] || "........"}</p>
            <p>
              Có:{" "}
              {!isNhap
                ? "156"
                : Number(inv.DaThanhToan) === 0
                ? "331"
                : inv.CongNo > 0
                ? "111/112, 331"
                : "111/112"}
            </p>
          </div>
        </div>

        {/* Thong tin chung */}
        <div className="mt-5 space-y-1">
          {isNhap ? (
            <>
              <p>- Họ và tên người giao: <strong>{inv.NguoiGiaoNhan || "...................................."}</strong></p>
              <p>
                - Theo hóa đơn/chứng từ số: <strong>{inv.SoChungTu || "........................"}</strong>{" "}
                của <strong>{inv.NhaCungCap?.TenNCC || "........................"}</strong>
                {inv.NhaCungCap?.MaSoThue && <> (MST: {inv.NhaCungCap.MaSoThue})</>}
              </p>
              <p>- Nhập tại kho: <strong>{warehouseLabel(inv.KhoHang)}</strong> — Địa điểm: {SHOP_INFO.address}</p>
              <p>- Diễn giải: {inv.LyDo || inv.NghiepVu || "Nhập mua hàng"}</p>
            </>
          ) : (
            <>
              <p>- Họ và tên người nhận hàng: <strong>{inv.NguoiGiaoNhan || "...................................."}</strong></p>
              {inv.NhaCungCap && <p>- Đơn vị nhận: <strong>{inv.NhaCungCap.TenNCC}</strong></p>}
              <p>- Lý do xuất kho: <strong>{inv.NghiepVu || "Xuất khác"}</strong>{inv.LyDo && inv.LyDo !== inv.NghiepVu ? ` — ${inv.LyDo}` : ""}</p>
              <p>- Xuất tại kho: <strong>{warehouseLabel(inv.KhoHang)}</strong> — Địa điểm: {SHOP_INFO.address}</p>
              {inv.SoChungTu && <p>- Chứng từ kèm theo: {inv.SoChungTu}</p>}
            </>
          )}
        </div>

        {/* Bang hang hoa */}
        <table className="mt-4 w-full border-collapse text-[12px]">
          <thead>
            <tr className="text-center font-bold">
              <th className="border border-black px-1 py-1.5 w-8">STT</th>
              <th className="border border-black px-1 py-1.5">Tên, nhãn hiệu, quy cách hàng hóa</th>
              <th className="border border-black px-1 py-1.5 w-20">Mã số</th>
              <th className="border border-black px-1 py-1.5 w-12">ĐVT</th>
              <th className="border border-black px-1 py-1.5 w-16">Số lượng</th>
              <th className="border border-black px-1 py-1.5 w-24">Đơn giá</th>
              <th className="border border-black px-1 py-1.5 w-28">Thành tiền</th>
            </tr>
            <tr className="text-center text-[11px] italic">
              {["A", "B", "C", "D", "1", "2", "3"].map((c) => (
                <td key={c} className="border border-black py-0.5">{c}</td>
              ))}
            </tr>
          </thead>
          <tbody>
            {inv.ChiTietHoaDonKhos.map((ct, i) => (
              <tr key={ct.MaSP}>
                <td className="border border-black px-1 py-1 text-center">{i + 1}</td>
                <td className="border border-black px-2 py-1">{ct.SanPham?.TenSP || ct.MaSP}</td>
                <td className="border border-black px-1 py-1 text-center">{ct.MaSP}</td>
                <td className="border border-black px-1 py-1 text-center">Cái</td>
                <td className="border border-black px-1 py-1 text-center">{ct.SoLuong}</td>
                <td className="border border-black px-2 py-1 text-right">{money(ct.DonGia)}</td>
                <td className="border border-black px-2 py-1 text-right">{money(ct.ThanhTien)}</td>
              </tr>
            ))}
            <tr className="font-bold">
              <td className="border border-black" />
              <td className="border border-black px-2 py-1 text-center">Cộng</td>
              <td className="border border-black" />
              <td className="border border-black" />
              <td className="border border-black px-1 py-1 text-center">{totalQty}</td>
              <td className="border border-black" />
              <td className="border border-black px-2 py-1 text-right">{money(inv.TongTien)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-3 space-y-1">
          <p>
            - Tổng số tiền (viết bằng chữ): <strong className="italic">{numberToVietnameseWords(Number(inv.TongTien))}</strong>
          </p>
          {isNhap && (
            <p>
              - Đã thanh toán cho nhà cung cấp: <strong>{money(inv.DaThanhToan)} đ</strong> — Còn nợ:{" "}
              <strong>{money(inv.CongNo)} đ</strong>
            </p>
          )}
          <p>- Số chứng từ gốc kèm theo: {inv.SoChungTu ? 1 : "........"}</p>
        </div>

        <p className="mt-4 text-right italic">
          Ngày {part("day")} tháng {part("month")} năm {part("year")}
        </p>

        {/* Chu ky */}
        <div className="mt-2 grid grid-cols-4 text-center">
          {signers.map((s, i) => (
            <div key={s}>
              <p className="font-bold">{s}</p>
              <p className="text-[11px] italic">(Ký, họ tên)</p>
              <p className="mt-16 font-semibold">{i === 0 ? inv.NhanVien?.HoTen : i === 1 ? inv.NguoiGiaoNhan || "" : ""}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
