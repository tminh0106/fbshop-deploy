"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cartStore";
import { formatCurrency } from "@/lib/utils";
import {
  User,
  Phone,
  MapPin,
  FileText,
  Tag,
  CreditCard,
  Truck,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

interface VoucherInfo {
  maVoucher: string;
  loaiGiamGia: string;
  giaTriGiam: number;
  giamGia: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart, syncWithServer } = useCartStore();

  const [loadingUser, setLoadingUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  // Da tao don & xoa gio -> hien man hinh chuyen trang thay vi "gio hang trong"
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Form states
  const [tenNguoiNhan, setTenNguoiNhan] = useState("");
  const [sdtNguoiNhan, setSdtNguoiNhan] = useState("");
  const [diaChiNhan, setDiaChiNhan] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  const [phuongThucThanhToan, setPhuongThucThanhToan] = useState<"COD" | "BANKING">("COD");

  // Voucher states
  const [inputVoucher, setInputVoucher] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherInfo | null>(null);
  const [voucherError, setVoucherError] = useState("");
  const [checkingVoucher, setCheckingVoucher] = useState(false);

  // Form error states
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Cap nhat gia / ton kho trong gio theo CSDL truoc khi khach xem tong tien
  useEffect(() => {
    syncWithServer()
      .then((changes) => changes.forEach((c) => toast(c, { icon: "ℹ️" })))
      .catch(() => {});
  }, [syncWithServer]);

  useEffect(() => {
    // Kiem tra xac thuc nguoi dung
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.customer) {
          toast.error("Vui lòng đăng nhập để tiến hành đặt hàng");
          router.push("/dang-nhap?redirect=/dat-hang");
        } else {
          setTenNguoiNhan(data.customer.hoTen || "");
          setSdtNguoiNhan(data.customer.soDienThoai || "");
          setDiaChiNhan(data.customer.diaChi || "");
          setLoadingUser(false);
        }
      })
      .catch(() => {
        router.push("/dang-nhap?redirect=/dat-hang");
      });
  }, [router]);

  const subtotal = getTotalPrice();
  const shippingFee = subtotal >= 1000000 || items.length === 0 ? 0 : 30000;
  const discountAmount = appliedVoucher ? appliedVoucher.giamGia : 0;
  const finalTotal = Math.max(0, subtotal + shippingFee - discountAmount);

  const handleApplyVoucher = async () => {
    if (!inputVoucher.trim()) {
      setVoucherError("Vui lòng nhập mã giảm giá");
      return;
    }
    setVoucherError("");
    setCheckingVoucher(true);

    try {
      const res = await fetch("/api/voucher/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maVoucher: inputVoucher.trim(),
          tongTienHang: subtotal,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setVoucherError(data.error || "Mã không hợp lệ");
        setAppliedVoucher(null);
        toast.error(data.error || "Mã giảm giá không áp dụng được");
      } else {
        setAppliedVoucher(data.voucher);
        toast.success(`Đã áp dụng voucher: Giảm ${formatCurrency(data.voucher.giamGia)}`);
      }
    } catch {
      setVoucherError("Lỗi kiểm tra voucher");
    } finally {
      setCheckingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setInputVoucher("");
    setVoucherError("");
    toast.success("Đã hủy áp dụng mã giảm giá");
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!tenNguoiNhan.trim()) errs.tenNguoiNhan = "Vui lòng nhập họ tên người nhận";
    const phoneRegex = /^0\d{9}$/;
    if (!sdtNguoiNhan.trim()) {
      errs.sdtNguoiNhan = "Vui lòng nhập số điện thoại";
    } else if (!phoneRegex.test(sdtNguoiNhan.trim())) {
      errs.sdtNguoiNhan = "Số điện thoại phải gồm đúng 10 số bắt đầu bằng 0";
    }
    if (!diaChiNhan.trim()) errs.diaChiNhan = "Vui lòng nhập địa chỉ nhận hàng";
    if (items.length === 0) errs.cart = "Giỏ hàng của bạn đang trống";

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const orderPayload = {
        tenNguoiNhan: tenNguoiNhan.trim(),
        sdtNguoiNhan: sdtNguoiNhan.trim(),
        diaChiNhan: diaChiNhan.trim(),
        phuongThucThanhToan,
        ghiChu: ghiChu.trim() || undefined,
        maVoucher: appliedVoucher ? appliedVoucher.maVoucher : undefined,
        // Server doi chieu: so tien khach thay phai khop so tien he thong tinh
        tongTienDuKien: finalTotal,
        items: items.map((item) => ({
          maSP: item.productId,
          soLuong: item.quantity,
          donGia: item.price,
        })),
      };

      const res = await fetch("/api/don-hang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Đặt hàng thất bại");
        setSubmitting(false);
        // Gia / ton kho vua thay doi: dong bo lai gio de tong tien hien thi dung, bo voucher de kiem tra lai
        if (res.status === 409) {
          const changes = await syncWithServer().catch(() => []);
          changes.forEach((c) => toast(c, { icon: "ℹ️" }));
          setAppliedVoucher(null);
        }
      } else {
        // Don da tao va da giu hang trong kho -> xoa gio ngay (tranh dat trung neu khach roi trang QR)
        setOrderPlaced(true);
        clearCart();
        const maDH = encodeURIComponent(data.order.maDH);
        if (data.order.trangThai === "Cho thanh toan") {
          toast.success("Đã tạo đơn hàng, vui lòng chuyển khoản để hoàn tất");
          router.push(`/dat-hang/thanh-toan-qr?maDH=${maDH}`);
        } else {
          toast.success("Đặt hàng thành công!");
          router.push(`/dat-hang/thanh-cong?maDH=${maDH}`);
        }
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi tạo đơn hàng");
      setSubmitting(false);
    }
  };

  if (loadingUser || orderPlaced) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-t-[#f66315]" />
        <p className="mt-4 text-sm text-slate-500">{orderPlaced ? "Đang chuyển đến trang đơn hàng..." : "Đang chuẩn bị trang thanh toán..."}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Giỏ hàng của bạn đang trống</h2>
        <p className="mt-2 text-sm text-slate-500">Vui lòng chọn sản phẩm trước khi tiến hành thanh toán.</p>
        <Link
          href="/san-pham"
          className="mt-6 inline-block rounded-xl bg-[#f66315] px-6 py-2.5 text-sm font-bold text-white"
        >
          Duyệt sản phẩm ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb / Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900 sm:text-3xl">
          Thông tin đặt hàng & Thanh toán
        </h1>
      </div>

      <form onSubmit={handleCreateOrder}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* ================= COT TRAI: FORM GIAO HANG (2/3) ================= */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Thong tin nguoi nhan */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                <Truck className="h-5 w-5 text-[#f66315]" />
                Thông tin giao nhận
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Họ tên người nhận <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={tenNguoiNhan}
                      onChange={(e) => setTenNguoiNhan(e.target.value)}
                      className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all ${
                        formErrors.tenNguoiNhan
                          ? "border-red-400 focus:border-red-500"
                          : "border-slate-200 focus:border-[#f66315]"
                      }`}
                    />
                  </div>
                  {formErrors.tenNguoiNhan && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.tenNguoiNhan}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Số điện thoại nhận hàng <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="0912345678"
                      value={sdtNguoiNhan}
                      onChange={(e) => setSdtNguoiNhan(e.target.value)}
                      className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all ${
                        formErrors.sdtNguoiNhan
                          ? "border-red-400 focus:border-red-500"
                          : "border-slate-200 focus:border-[#f66315]"
                      }`}
                    />
                  </div>
                  {formErrors.sdtNguoiNhan && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.sdtNguoiNhan}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Địa chỉ nhận hàng chi tiết <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <textarea
                    rows={2}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
                    value={diaChiNhan}
                    onChange={(e) => setDiaChiNhan(e.target.value)}
                    className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all ${
                      formErrors.diaChiNhan
                        ? "border-red-400 focus:border-red-500"
                        : "border-slate-200 focus:border-[#f66315]"
                    }`}
                  />
                </div>
                {formErrors.diaChiNhan && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.diaChiNhan}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Ghi chú đơn hàng (tùy chọn)
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <textarea
                    rows={2}
                    placeholder="Ví dụ: Căng cước Yonex BG65 11kg, giao giờ hành chính..."
                    value={ghiChu}
                    onChange={(e) => setGhiChu(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-[#f66315]"
                  />
                </div>
              </div>
            </div>

            {/* 2. Ma giam gia (Voucher) */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-3">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Tag className="h-5 w-5 text-[#f66315]" />
                Mã giảm giá (Voucher)
              </h2>

              {!appliedVoucher ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập mã voucher (vd: FBSHOP50K)..."
                    value={inputVoucher}
                    onChange={(e) => {
                      setInputVoucher(e.target.value.toUpperCase());
                      setVoucherError("");
                    }}
                    className="flex-1 uppercase rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#f66315]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyVoucher}
                    disabled={checkingVoucher}
                    className="rounded-xl bg-[#f66315] px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#d4520f] disabled:opacity-50"
                  >
                    {checkingVoucher ? "Kiểm tra..." : "Áp dụng"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl bg-green-50 border border-green-200 p-3">
                  <div>
                    <span className="font-bold text-green-700 text-sm">
                      Mã: {appliedVoucher.maVoucher}
                    </span>
                    <p className="text-xs text-green-600">
                      Đã giảm: <strong>{formatCurrency(appliedVoucher.giamGia)}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveVoucher}
                    className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-red-600 shadow-xs hover:bg-red-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    Xóa mã
                  </button>
                </div>
              )}

              {voucherError && (
                <p className="text-xs text-red-500 font-medium">{voucherError}</p>
              )}
            </div>

            {/* 3. Phuong thuc thanh toan */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-3">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                <CreditCard className="h-5 w-5 text-[#f66315]" />
                Phương thức thanh toán
              </h2>

              <div className="space-y-3">
                {/* Option 1: COD */}
                <label
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                    phuongThucThanhToan === "COD"
                      ? "border-[#f66315] bg-orange-50/40 ring-1 ring-[#f66315]"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      value="COD"
                      checked={phuongThucThanhToan === "COD"}
                      onChange={() => setPhuongThucThanhToan("COD")}
                      className="accent-[#f66315]"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Thanh toán khi nhận hàng (COD)
                      </p>
                      <p className="text-xs text-slate-500">
                        Thanh toán bằng tiền mặt trực tiếp cho shipper khi nhận kiện hàng
                      </p>
                    </div>
                  </div>
                  <span className="text-xl">💵</span>
                </label>

                {/* Option 2: BANKING */}
                <label
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                    phuongThucThanhToan === "BANKING"
                      ? "border-[#f66315] bg-orange-50/40 ring-1 ring-[#f66315]"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      value="BANKING"
                      checked={phuongThucThanhToan === "BANKING"}
                      onChange={() => setPhuongThucThanhToan("BANKING")}
                      className="accent-[#f66315]"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Chuyển khoản ngân hàng / ví điện tử (VietQR)
                      </p>
                      <p className="text-xs text-slate-500">
                        Quét mã VietQR bằng app ngân hàng hoặc ví điện tử. Đơn được giữ hàng 24 giờ, FBShop xác nhận
                        sau khi đối soát giao dịch
                      </p>
                    </div>
                  </div>
                  <span className="text-xl">🏦</span>
                </label>
              </div>
            </div>
          </div>

          {/* ================= COT PHAI: TOM TAT DON HANG (1/3) ================= */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Đơn hàng của bạn ({items.length} món)
              </h2>

              {/* Danh sach mini */}
              <div className="max-h-60 overflow-y-auto space-y-3 divide-y divide-slate-100 pr-1">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3 pt-3 first:pt-0">
                    <div className="relative h-12 w-12 shrink-0 rounded-lg border border-slate-100 bg-slate-50 p-1">
                      <Image
                        src={item.imageUrl || "/images/placeholder.png"}
                        alt={item.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-bold text-slate-800">{item.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {item.quantity} x {formatCurrency(item.price)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Chi phi */}
              <div className="border-t border-slate-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Tạm tính</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Phí vận chuyển</span>
                  <span>
                    {shippingFee === 0 ? (
                      <span className="font-semibold text-green-600">Miễn phí</span>
                    ) : (
                      <span className="font-semibold text-slate-800">{formatCurrency(shippingFee)}</span>
                    )}
                  </span>
                </div>

                {appliedVoucher && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Giảm giá voucher ({appliedVoucher.maVoucher})</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
              </div>

              {/* Tong thanh toan */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-base font-bold text-slate-900">Tổng thanh toán</span>
                  <span className="text-2xl font-bold text-[#f66315]">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
              </div>

              {/* Nut Dat Hang */}
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f66315] py-4 text-sm font-bold uppercase tracking-wider text-white shadow-lg transition-all hover:bg-[#d4520f] disabled:opacity-50"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Đang xử lý đơn hàng...</span>
                  </div>
                ) : (
                  <>
                    <span>{phuongThucThanhToan === "BANKING" ? "ĐẶT HÀNG & THANH TOÁN" : "ĐẶT HÀNG NGAY"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center pt-2">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                <span>Bảo mật thông tin & Hàng chính hãng 100%</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}