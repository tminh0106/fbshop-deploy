"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { orderStatusLabel } from "@/lib/orderStatus";
import { QrCode, Copy, Check, CheckCircle, AlertCircle, Package, Clock, XCircle, Hourglass } from "lucide-react";
import toast from "react-hot-toast";

// =======================================================
// THANH TOAN CHUYEN KHOAN VIETQR (Bang 3.48)
// Don da duoc luu o trang thai "Cho thanh toan" (giu hang 24h). Trang nay:
// - lay so tien tu may chu, hien ma VietQR + dem nguoc han thanh toan
// - khach bam "Toi da chuyen khoan" -> ghi nhan de nhan vien doi soat
// - tu kiem tra trang thai moi 5 giay: shop xac nhan nhan tien -> "Thanh toan thanh cong";
//   het han / bi huy -> "Thanh toan that bai"
// =======================================================

interface OrderInfo {
  maDH: string;
  trangThai: string;
  tongTien: number;
  phuongThucThanhToan: string;
  trangThaiThanhToan: string;
  ngayBaoChuyenKhoan: string | null;
  hanThanhToan: string | null;
  coTheHuy: boolean;
}

const BANK_NAME = "Vietcombank";
const ACCOUNT_NUMBER = "1234567890";
const ACCOUNT_HOLDER = "FBSHOP";
const POLL_MS = 5000;
const CANCEL_REASONS = ["Đổi ý, không muốn mua nữa", "Muốn đổi phương thức thanh toán", "Muốn thay đổi sản phẩm / số lượng", "Lý do khác"];

function formatCountdown(ms: number) {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

function PaymentQRContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const maDH = searchParams.get("maDH") || "";

  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [fetchError, setFetchError] = useState("");
  const error = maDH ? fetchError : "Thiếu mã đơn hàng";
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [reporting, setReporting] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [cancelling, setCancelling] = useState(false);

  // So tien & trang thai lay tu may chu (khong lay tu URL de tranh bi sua so tien)
  const loadOrder = useCallback(async () => {
    if (!maDH) return;
    try {
      const res = await fetch(`/api/don-hang/${encodeURIComponent(maDH)}`, { cache: "no-store" });
      if (res.status === 401) {
        router.push(`/dang-nhap?redirect=${encodeURIComponent(`/dat-hang/thanh-toan-qr?maDH=${maDH}`)}`);
        return;
      }
      const data = await res.json();
      if (!res.ok) setFetchError(data.error || "Không tìm thấy đơn hàng");
      else setOrder(data.order);
    } catch {
      setFetchError("Lỗi kết nối máy chủ");
    }
  }, [maDH, router]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // Dang cho thanh toan: dem nguoc & kiem tra trang thai dinh ky
  const waiting = order?.trangThai === "Cho thanh toan";
  useEffect(() => {
    if (!waiting) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(loadOrder, POLL_MS);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [waiting, loadOrder]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Đã sao chép ${field}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleReport = async () => {
    setReporting(true);
    try {
      const res = await fetch(`/api/don-hang/${encodeURIComponent(maDH)}/bao-thanh-toan`, { method: "POST" });
      const data = await res.json();
      if (res.ok) toast.success(data.message);
      else toast.error(data.error || "Không thể ghi nhận");
      await loadOrder();
    } finally {
      setReporting(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/don-hang/${encodeURIComponent(maDH)}/huy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lyDo: cancelReason }),
      });
      const data = await res.json();
      if (res.ok) toast.success(data.message);
      else toast.error(data.error || "Không thể hủy đơn");
      setShowCancel(false);
      await loadOrder();
    } finally {
      setCancelling(false);
    }
  };

  if (error) {
    return (
      <StateCard icon={<XCircle className="h-7 w-7" />} tone="red" title={error}>
        <Link href="/tai-khoan/don-hang" className="text-sm font-bold text-[#f66315] hover:underline">
          Xem đơn hàng của tôi
        </Link>
      </StateCard>
    );
  }

  if (!order) {
    return <div className="p-16 text-center text-slate-400">Đang tải thông tin thanh toán...</div>;
  }

  // Ket qua thanh toan: shop da xac nhan nhan tien -> thanh cong; don bi huy / het han -> that bai
  if (!waiting) {
    const paid = order.trangThaiThanhToan === "Da thanh toan";
    const failed = order.trangThai === "Da huy";
    return (
      <StateCard
        icon={failed ? <XCircle className="h-7 w-7" /> : <CheckCircle className="h-7 w-7" />}
        tone={failed ? "red" : "green"}
        title={failed ? "Thanh toán thất bại" : paid ? "Thanh toán thành công" : "Đơn hàng không cần thanh toán thêm"}
      >
        <p className="text-sm text-slate-500">
          Đơn <strong className="font-mono">{order.maDH}</strong> hiện ở trạng thái{" "}
          <strong>{orderStatusLabel(order.trangThai)}</strong>.
          {failed &&
            " Đơn đã bị hủy hoặc hết hạn thanh toán, hàng đã được trả lại kho. Nếu bạn đã chuyển khoản, vui lòng liên hệ hotline 0123.456.789 để được hoàn tiền."}
          {paid && !failed && " FBShop đã nhận được tiền và sẽ sớm chuẩn bị hàng cho bạn."}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link
            href="/tai-khoan/don-hang"
            className="inline-flex items-center gap-2 rounded-xl bg-[#f66315] px-6 py-2.5 text-sm font-bold text-white"
          >
            <Package className="h-4 w-4" />
            Xem đơn hàng của tôi
          </Link>
          {failed && (
            <Link href="/san-pham" className="inline-flex items-center rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700">
              Tiếp tục mua sắm
            </Link>
          )}
        </div>
      </StateCard>
    );
  }

  const transferContent = `FBSHOP ${order.maDH}`;
  const qrUrl = `https://img.vietqr.io/image/${BANK_NAME}-${ACCOUNT_NUMBER}-compact.png?amount=${order.tongTien}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(ACCOUNT_HOLDER)}`;
  const deadline = order.hanThanhToan ? new Date(order.hanThanhToan) : null;
  const remaining = deadline ? deadline.getTime() - now : 0;
  const reported = !!order.ngayBaoChuyenKhoan;

  const copyRow = (label: string, value: string, display?: React.ReactNode) => (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex justify-between items-center">
      <div>
        <p className="text-[11px] text-slate-400">{label}</p>
        {display || <p className="text-sm font-bold text-slate-800 tracking-wider">{value}</p>}
      </div>
      <button
        type="button"
        onClick={() => handleCopy(value, label)}
        className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs hover:text-[#f66315]"
      >
        {copiedField === label ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
        Copy
      </button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-100 bg-white p-6 sm:p-10 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#f66315] shadow-xs">
            <QrCode className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Quét mã QR để thanh toán</h1>
          <p className="mt-1 text-sm text-slate-500">
            Đơn hàng <strong className="font-mono">{order.maDH}</strong> đã được tạo và đang giữ hàng cho bạn
          </p>
        </div>

        {/* Trang thai cho / dem nguoc */}
        {reported ? (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-800">
            <Hourglass className="mt-0.5 h-5 w-5 shrink-0 animate-pulse" />
            <p>
              Bạn đã báo chuyển khoản lúc <strong>{new Date(order.ngayBaoChuyenKhoan!).toLocaleString("vi-VN")}</strong>. FBShop đang đối
              soát giao dịch; trang này sẽ tự cập nhật ngay khi xác nhận nhận được tiền.
            </p>
          </div>
        ) : (
          deadline && (
            <div className="mb-6 flex items-center justify-center gap-2 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
              <Clock className="h-4 w-4" />
              Thời gian giữ đơn còn lại: <strong className="font-mono text-base">{formatCountdown(remaining)}</strong>
            </div>
          )
        )}

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 items-center">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center">
            <div className="relative aspect-square w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="Mã VietQR" className="h-full w-full object-contain" />
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-500">Hỗ trợ app ngân hàng & ví điện tử có VietQR</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Thông tin chuyển khoản</h3>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[11px] text-slate-400">Ngân hàng</p>
              <p className="text-sm font-bold text-slate-800">{BANK_NAME}</p>
            </div>
            {copyRow("Số tài khoản", ACCOUNT_NUMBER)}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[11px] text-slate-400">Chủ tài khoản</p>
              <p className="text-sm font-bold text-slate-800">{ACCOUNT_HOLDER}</p>
            </div>
            {copyRow("Số tiền", String(order.tongTien), <p className="text-base font-extrabold text-[#f66315]">{formatCurrency(order.tongTien)}</p>)}
            {copyRow("Nội dung", transferContent)}
          </div>
        </div>

        <div className="mt-8 rounded-2xl bg-amber-50 border border-amber-100 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            Vui lòng chuyển <strong>đúng số tiền</strong> và giữ nguyên nội dung <strong>{transferContent}</strong> để FBShop đối soát.
            Quá hạn giữ đơn mà chưa thanh toán, đơn sẽ tự động hủy và hàng được trả lại kho. Bạn có thể quay lại trang này từ mục
            <strong> Đơn hàng của tôi</strong> để thanh toán tiếp.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {!reported && (
            <button
              type="button"
              disabled={reporting}
              onClick={handleReport}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#f66315] py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#d4520f] disabled:opacity-60"
            >
              <CheckCircle className="h-4 w-4" />
              {reporting ? "Đang ghi nhận..." : "Tôi đã chuyển khoản"}
            </button>
          )}
          <Link
            href="/tai-khoan/don-hang"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-3.5 px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Package className="h-4 w-4" />
            {reported ? "Xem đơn hàng của tôi" : "Thanh toán sau"}
          </Link>
          {order.coTheHuy && (
            <button
              type="button"
              onClick={() => setShowCancel(true)}
              className="rounded-xl border border-red-200 px-6 py-3.5 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              Hủy đơn
            </button>
          )}
        </div>
      </div>

      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Hủy đơn {order.maDH}?</h3>
            <div className="space-y-2">
              {CANCEL_REASONS.map((r) => (
                <label key={r} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input type="radio" checked={cancelReason === r} onChange={() => setCancelReason(r)} className="accent-[#f66315]" />
                  {r}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCancel(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700">
                Không hủy
              </button>
              <button disabled={cancelling} onClick={handleCancel} className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
                {cancelling ? "Đang hủy..." : "Xác nhận hủy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StateCard({ icon, tone, title, children }: { icon: React.ReactNode; tone: "red" | "green"; title: string; children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl space-y-3">
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${tone === "red" ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"}`}>
          {icon}
        </div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {children}
      </div>
    </div>
  );
}

export default function PaymentQRPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-slate-400">Đang tải thông tin thanh toán...</div>}>
      <PaymentQRContent />
    </Suspense>
  );
}
