"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { QrCode, Copy, Check, CheckCircle, ArrowLeft, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

function PaymentQRContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const maDH = searchParams.get("maDH") || "DH_DEMO";
  const tongTien = parseInt(searchParams.get("tongTien") || "0", 10);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const bankName = "Vietcombank";
  const accountNumber = "1234567890";
  const accountHolder = "FBSHOP";
  const transferContent = `FBSHOP ${maDH}`;

  const qrUrl = `https://img.vietqr.io/image/Vietcombank-${accountNumber}-compact.png?amount=${tongTien}&addInfo=${encodeURIComponent(transferContent)}`;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Đã sao chép ${field}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-3xl border border-gray-100 bg-white p-6 sm:p-10 shadow-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#f66315] shadow-xs">
            <QrCode className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 sm:text-3xl">
            Quét mã QR để thanh toán
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Mở ứng dụng ngân hàng hoặc ví điện tử bất kỳ để quét mã VietQR tự động
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 items-center">
          {/* VietQR Code Image */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
            <div className="relative aspect-square w-64 overflow-hidden rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
              <img
                src={qrUrl}
                alt="VietQR Code"
                className="h-full w-full object-contain"
              />
            </div>
            <p className="mt-3 text-xs font-semibold text-gray-500">
              Quét QR hỗ trợ hơn 40 ngân hàng & ví MoMo
            </p>
          </div>

          {/* Manual transfer details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Thông tin chuyển khoản thủ công
            </h3>

            {/* Ngan hang */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 flex justify-between items-center">
              <div>
                <p className="text-[11px] text-gray-400">Ngân hàng</p>
                <p className="text-sm font-bold text-gray-800">{bankName}</p>
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                VCB
              </span>
            </div>

            {/* So tai khoan */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 flex justify-between items-center">
              <div>
                <p className="text-[11px] text-gray-400">Số tài khoản</p>
                <p className="text-sm font-bold text-gray-800 tracking-wider">{accountNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(accountNumber, "Số tài khoản")}
                className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-xs hover:text-[#f66315]"
              >
                {copiedField === "Số tài khoản" ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                Copy
              </button>
            </div>

            {/* Chu tai khoan */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-[11px] text-gray-400">Chủ tài khoản</p>
              <p className="text-sm font-bold text-gray-800">{accountHolder}</p>
            </div>

            {/* So tien */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 flex justify-between items-center">
              <div>
                <p className="text-[11px] text-gray-400">Số tiền</p>
                <p className="text-base font-extrabold text-[#f66315]">{formatCurrency(tongTien)}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(tongTien.toString(), "Số tiền")}
                className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-xs hover:text-[#f66315]"
              >
                {copiedField === "Số tiền" ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                Copy
              </button>
            </div>

            {/* Noi dung chuyen khoan */}
            <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-3 flex justify-between items-center">
              <div>
                <p className="text-[11px] font-bold text-orange-800">Nội dung chuyển khoản (Bắt buộc)</p>
                <p className="text-sm font-black text-gray-900 tracking-wider">{transferContent}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(transferContent, "Nội dung")}
                className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-[#f66315] shadow-xs hover:bg-orange-100"
              >
                {copiedField === "Nội dung" ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                Copy
              </button>
            </div>
          </div>
        </div>

        {/* Note & Actions */}
        <div className="mt-8 rounded-2xl bg-amber-50 border border-amber-100 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Lưu ý quan trọng:</strong> Vui lòng giữ nguyên nội dung chuyển khoản <strong>{transferContent}</strong> để hệ thống tự động xác nhận giao dịch. Đơn hàng sẽ được chuyển sang trạng thái chuẩn bị gửi ngay sau khi nhận được chuyển khoản.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push(`/dat-hang/thanh-cong?maDH=${maDH}`)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#f66315] py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-orange-700"
          >
            <CheckCircle className="h-4 w-4" />
            Tôi đã chuyển khoản
          </button>

          <Link
            href="/gio-hang"
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-3.5 px-6 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại giỏ hàng
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentQRPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-gray-400">Đang tải thông tin VietQR...</div>}>
      <PaymentQRContent />
    </Suspense>
  );
}