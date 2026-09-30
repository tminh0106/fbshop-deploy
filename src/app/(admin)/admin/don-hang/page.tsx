"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  XCircle,
  ChevronRight,
  User,
  MapPin,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";
import { exportToExcel } from "@/lib/exportExcel";
import { ORDER_STATUS, ORDER_UNDELETABLE, orderStatusLabel } from "@/lib/orderStatus";

interface OrderItem {
  MaDH: string;
  NgayTao: string;
  TrangThai: string;
  TongTien: number;
  TenNguoiNhan: string;
  SdtNguoiNhan: string;
  DiaChiNhan: string;
  PhuongThucThanhToan: string;
  GhiChu: string | null;
  KhachHang: {
    MaKH: string;
    HoTen: string;
    SoDienThoai: string;
    Email: string | null;
  } | null;
  Voucher: {
    MaVoucher: string;
    LoaiGiamGia: string;
    GiaTriGiam: number;
  } | null;
  ChiTietDonHangs: {
    MaSP: string;
    SoLuong: number;
    DonGia: number;
    ThanhTien: number;
    SanPham: {
      MaSP: string;
      TenSP: string;
      HinhAnh: string | null;
      GiaBan: number;
    };
  }[];
}

export default function AdminDonHangPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [trangThai, setTrangThai] = useState("ALL");
  const [tuNgay, setTuNgay] = useState("");
  const [denNgay, setDenNgay] = useState("");

  const [viewingOrder, setViewingOrder] = useState<OrderItem | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (tuNgay && denNgay && tuNgay > denNgay) {
      toast.error("Khoảng thời gian tìm kiếm không hợp lệ");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.append("keyword", keyword);
      if (trangThai !== "ALL") params.append("trangThai", trangThai);
      if (tuNgay) params.append("tuNgay", tuNgay);
      if (denNgay) params.append("denNgay", denNgay);

      const res = await fetch(`/api/admin/don-hang?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setOrders(json.data || []);
      } else {
        toast.error(json.error || "Lỗi khi tải đơn hàng");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (maDH: string, newStatus: string) => {
    if (
      newStatus === ORDER_STATUS.CANCELLED &&
      !confirm("Hủy đơn hàng này? Tồn kho các sản phẩm trong đơn sẽ được hoàn trả.")
    ) {
      return;
    }
    setUpdatingId(maDH);
    try {
      const res = await fetch(`/api/admin/don-hang/${maDH}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trangThai: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể cập nhật trạng thái");
      } else {
        toast.success(data.message || "Cập nhật trạng thái thành công");
        fetchOrders();
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async (maDH: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đơn hàng này không?")) return;

    try {
      const res = await fetch(`/api/admin/don-hang/${maDH}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể xóa đơn hàng");
      } else {
        toast.success(data.message || "Xóa đơn hàng thành công");
        fetchOrders();
      }
    } catch {
      toast.error("Lỗi kết nối khi xóa đơn hàng");
    }
  };

  const handleExportExcel = () => {
    if (orders.length === 0) {
      toast.error("Không có dữ liệu đơn hàng để xuất file");
      return;
    }
    const dataToExport = orders.map((o) => ({
      "Mã đơn hàng": o.MaDH,
      "Ngày đặt": new Date(o.NgayTao).toLocaleString("vi-VN"),
      "Người nhận": o.TenNguoiNhan,
      "Số điện thoại": o.SdtNguoiNhan,
      "Địa chỉ giao": o.DiaChiNhan,
      "Tổng tiền (VNĐ)": Number(o.TongTien),
      "Phương thức": o.PhuongThucThanhToan,
      "Mã Voucher": o.Voucher?.MaVoucher || "Không dùng",
      "Trạng thái": orderStatusLabel(o.TrangThai),
      "Ghi chú": o.GhiChu || "",
    }));

    exportToExcel(dataToExport, "DanhSachDonHang_FBShop", "DonHang");
    toast.success("Đã xuất danh sách đơn hàng ra Excel!");
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "Cho thanh toan":
        return {
          label: "Chờ thanh toán",
          className: "bg-slate-50 text-slate-700 border-slate-300",
          icon: Clock,
          next: "Cho xac nhan",
          nextLabel: "Đã nhận tiền",
        };
      case "Cho xac nhan":
      case "Pending":
        return {
          label: "Chờ xác nhận",
          className: "bg-amber-50 text-amber-700 border-amber-200",
          icon: Clock,
          next: "Dang xu ly",
          nextLabel: "Xác nhận & Xử lý",
        };
      case "Dang xu ly":
      case "Processing":
        return {
          label: "Đang xử lý",
          className: "bg-blue-50 text-blue-700 border-blue-200",
          icon: PackageCheck,
          next: "Dang giao",
          nextLabel: "Giao hàng",
        };
      case "Dang giao":
      case "Shipping":
        return {
          label: "Đang giao",
          className: "bg-purple-50 text-purple-700 border-purple-200",
          icon: Truck,
          next: "Da giao",
          nextLabel: "Đã giao xong",
        };
      case "Da giao":
      case "Completed":
        return {
          label: "Đã giao",
          className: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: CheckCircle2,
          next: null,
          nextLabel: null,
        };
      default:
        return {
          label: "Đã hủy",
          className: "bg-red-50 text-red-600 border-red-200",
          icon: XCircle,
          next: null,
          nextLabel: null,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-[#f66315]" />
            QUẢN LÝ ĐƠN HÀNG
          </h2>
        </div>

        <button
          onClick={handleExportExcel}
          className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all self-start"
        >
          <Download className="h-4 w-4 text-slate-500" />
          Xuất file Excel
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchOrders();
          }}
          className="grid grid-cols-1 gap-3 md:grid-cols-5"
        >
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn, người nhận, SĐT..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-[#f66315]"
            />
          </div>

          <div>
            <select
              value={trangThai}
              onChange={(e) => setTrangThai(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-[#f66315]"
            >
              <option value="ALL">-- Tất cả trạng thái --</option>
              <option value="Cho thanh toan">Chờ thanh toán</option>
              <option value="Cho xac nhan">Chờ xác nhận</option>
              <option value="Dang xu ly">Đang xử lý</option>
              <option value="Dang giao">Đang giao</option>
              <option value="Da giao">Đã giao hoàn thành</option>
              <option value="Da huy">Đã hủy</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={tuNgay}
              onChange={(e) => setTuNgay(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-[#f66315]"
              title="Từ ngày"
            />
          </div>

          <div>
            <input
              type="date"
              value={denNgay}
              onChange={(e) => setDenNgay(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-[#f66315]"
              title="Đến ngày"
            />
          </div>
        </form>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-700 uppercase">
              <tr>
                <th className="px-4 py-3">Mã Đơn</th>
                <th className="px-4 py-3">Ngày Đặt</th>
                <th className="px-4 py-3">Khách Hàng / Nhận</th>
                <th className="px-4 py-3">Số Mặt Hàng</th>
                <th className="px-4 py-3 text-right">Tổng Tiền</th>
                <th className="px-4 py-3 text-center">Trạng Thái</th>
                <th className="px-4 py-3 text-center">Duyệt Trạng Thái</th>
                <th className="px-4 py-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    Đang tải danh sách đơn hàng...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    Không tìm thấy đơn hàng phù hợp
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const badge = getStatusBadge(o.TrangThai);
                  const Icon = badge.icon;
                  const canCancel =
                    o.TrangThai === "Cho thanh toan" ||
                    o.TrangThai === "Cho xac nhan" ||
                    o.TrangThai === "Dang xu ly" ||
                    o.TrangThai === "Pending" ||
                    o.TrangThai === "Processing";

                  return (
                    <tr key={o.MaDH} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {o.MaDH.slice(0, 10)}...
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(o.NgayTao).toLocaleString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">{o.TenNguoiNhan}</p>
                        <span className="text-[11px] text-slate-500">{o.SdtNguoiNhan}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {o.ChiTietDonHangs?.length || 0} sản phẩm
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[#f66315]">
                        {Number(o.TongTien).toLocaleString("vi-VN")} đ
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badge.className}`}
                        >
                          <Icon className="h-3 w-3" />
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {badge.next && (
                            <button
                              disabled={updatingId === o.MaDH}
                              onClick={() => handleUpdateStatus(o.MaDH, badge.next!)}
                              className="inline-flex items-center gap-1 rounded-lg bg-orange-500/10 px-2.5 py-1 text-[11px] font-bold text-[#f66315] hover:bg-[#f66315] hover:text-white transition-all disabled:opacity-50"
                            >
                              <span>{badge.nextLabel}</span>
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          )}
                          {canCancel && (
                            <button
                              disabled={updatingId === o.MaDH}
                              onClick={() => handleUpdateStatus(o.MaDH, "Da huy")}
                              className="rounded-lg border border-red-200 bg-red-50/60 px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-100 transition-all disabled:opacity-50"
                              title="Hủy đơn và hoàn tồn kho"
                            >
                              Hủy đơn
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingOrder(o)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-black transition-all"
                            title="Xem chi tiết đơn hàng"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {!ORDER_UNDELETABLE.includes(o.TrangThai) && (
                            <button
                              onClick={() => handleDeleteOrder(o.MaDH)}
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                              title="Xóa đơn hàng"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Chi Tiet Don Hang */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  CHI TIẾT ĐƠN HÀNG: {viewingOrder.MaDH}
                </h3>
                <p className="text-xs text-slate-500">
                  Đặt lúc {new Date(viewingOrder.NgayTao).toLocaleString("vi-VN")}
                </p>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <User className="h-4 w-4 text-[#f66315]" />
                  <span>{viewingOrder.TenNguoiNhan} - {viewingOrder.SdtNguoiNhan}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{viewingOrder.DiaChiNhan}</span>
                </div>
                {viewingOrder.Voucher && (
                  <div className="flex items-center gap-2 text-orange-600 font-bold">
                    <Tag className="h-4 w-4" />
                    <span>Áp dụng Voucher: {viewingOrder.Voucher.MaVoucher}</span>
                  </div>
                )}
                {viewingOrder.GhiChu && (
                  <p className="text-slate-500 italic pl-6">
                    Ghi chú: {viewingOrder.GhiChu}
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-700 mb-2">Sản phẩm đặt mua:</h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 font-bold text-slate-600">
                      <tr>
                        <th className="p-2.5">Sản phẩm</th>
                        <th className="p-2.5 text-center">SL</th>
                        <th className="p-2.5 text-right">Đơn giá</th>
                        <th className="p-2.5 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingOrder.ChiTietDonHangs?.map((ct, i) => (
                        <tr key={i}>
                          <td className="p-2.5 font-medium">{ct.SanPham?.TenSP || ct.MaSP}</td>
                          <td className="p-2.5 text-center font-bold">{ct.SoLuong}</td>
                          <td className="p-2.5 text-right">
                            {Number(ct.DonGia).toLocaleString("vi-VN")} đ
                          </td>
                          <td className="p-2.5 text-right font-bold text-[#f66315]">
                            {Number(ct.ThanhTien).toLocaleString("vi-VN")} đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                <span className="font-bold text-slate-600">Tổng thanh toán:</span>
                <span className="text-base font-bold text-slate-900">
                  {Number(viewingOrder.TongTien).toLocaleString("vi-VN")} VNĐ
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
