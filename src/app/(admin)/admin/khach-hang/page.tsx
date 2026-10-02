"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  ShoppingBag,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Eye,
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Edit2,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import Pagination from "@/components/admin/Pagination";

const PAGE_SIZE = 10;
import { orderStatusLabel } from "@/lib/orderStatus";
import { EMAIL_ERROR, EMAIL_REGEX, PHONE_ERROR, PHONE_REGEX } from "@/lib/validation";

interface CustomerOrder {
  MaDH: string;
  TongTien: number;
  TrangThai: string;
  NgayTao: string;
}

interface HistoryOrder {
  maDH: string;
  ngayTao: string;
  trangThai: string;
  trangThaiThanhToan: string;
  phuongThucThanhToan: string;
  tongTien: number;
  maVoucher: string | null;
  diaChiNhan: string;
  sanPham: { maSP: string; tenSP: string; hinhAnh: string; soLuong: number; donGia: number; thanhTien: number }[];
}

// Mau nhan trang thai don trong lich su mua hang
const HISTORY_BADGE: Record<string, string> = {
  "Cho thanh toan": "border-purple-200 bg-purple-50 text-purple-700",
  "Cho xac nhan": "border-amber-200 bg-amber-50 text-amber-700",
  "Dang xu ly": "border-blue-200 bg-blue-50 text-blue-700",
  "Dang giao": "border-orange-200 bg-orange-50 text-orange-700",
  "Da giao": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Da huy": "border-red-200 bg-red-50 text-red-600",
};

interface Customer {
  maKH: string;
  hoTen: string;
  soDienThoai: string;
  email: string | null;
  diaChi: string | null;
  soDonHang: number;
  soDonThanhCong: number;
  tongChiTieu: number;
  donGanNhat: string | null;
  danhSachDonHang: CustomerOrder[];
}

export default function AdminKhachHangPage() {
  const [page, setPage] = useState(1);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  // null = dang tai lich su cua khach dang chon
  const [historyOrders, setHistoryOrders] = useState<HistoryOrder[] | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [searchedKeyword, setSearchedKeyword] = useState("");

  // Form sửa khách
  const [newHoTen, setNewHoTen] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = async (keyword = "") => {
    setLoading(true);
    try {
      const url = keyword
        ? `/api/admin/khach-hang?keyword=${encodeURIComponent(keyword)}`
        : "/api/admin/khach-hang";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setCustomers(data.customers || []);
        setSearchedKeyword(keyword.trim());
      } else {
        toast.error(data.error || "Không thể tải danh sách khách hàng");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openHistory = async (c: Customer) => {
    setSelectedCustomer(c);
    setHistoryOrders(null);
    try {
      const res = await fetch(`/api/admin/khach-hang/${encodeURIComponent(c.maKH)}/don-hang`);
      const data = await res.json();
      if (res.ok) setHistoryOrders(data.orders || []);
      else {
        toast.error(data.error || "Không tải được lịch sử mua hàng");
        setHistoryOrders([]);
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
      setHistoryOrders([]);
    }
  };

  // So san pham da mua (chi tinh don da giao)
  const purchasedQty = (historyOrders || [])
    .filter((o) => o.trangThai === "Da giao")
    .reduce((sum, o) => sum + o.sanPham.reduce((t, sp) => t + sp.soLuong, 0), 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers(searchKeyword);
  };

  // Bang 3.1: form sua dien san thong tin hien tai
  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setNewHoTen(c.hoTen);
    setNewPhone(c.soDienThoai);
    setNewEmail(c.email || "");
    setNewAddress(c.diaChi || "");
    setShowAddModal(true);
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    // A1 bo trong, A2 sai dinh dang (server kiem tra lai)
    const clientError = !newHoTen.trim()
      ? "Vui lòng nhập họ tên khách hàng"
      : !newPhone.trim()
      ? "Vui lòng nhập số điện thoại"
      : !PHONE_REGEX.test(newPhone.trim())
      ? PHONE_ERROR
      : !newEmail.trim()
      ? "Vui lòng nhập email"
      : !EMAIL_REGEX.test(newEmail.trim())
      ? EMAIL_ERROR
      : "";
    if (clientError) {
      toast.error(clientError);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/khach-hang", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maKH: editingCustomer.maKH,
          hoTen: newHoTen.trim(),
          soDienThoai: newPhone.trim(),
          email: newEmail.trim(),
          diaChi: newAddress.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Lưu khách hàng thành công");
        setShowAddModal(false);
        setEditingCustomer(null);
        setNewHoTen("");
        setNewPhone("");
        setNewEmail("");
        setNewAddress("");
        fetchCustomers();
      } else {
        toast.error(data.error || "Cập nhật khách hàng thất bại");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  // Bang 3.2: xoa khach hang (chan neu da co don hang)
  const handleDeleteCustomer = async () => {
    if (!deletingCustomer) return;
    try {
      const res = await fetch(`/api/admin/khach-hang?maKH=${encodeURIComponent(deletingCustomer.maKH)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Xóa khách hàng thành công");
        fetchCustomers(searchKeyword);
      } else {
        toast.error(data.error || "Không thể xóa khách hàng");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setDeletingCustomer(null);
    }
  };

  // Tính toán thống kê
  const totalCustomers = customers.length;
  const customersWithOrders = customers.filter((c) => c.soDonHang > 0).length;
  const totalRevenueAll = customers.reduce((sum, c) => sum + c.tongChiTieu, 0);
  const avgSpent = totalCustomers > 0 ? Math.round(totalRevenueAll / totalCustomers) : 0;

  // Phan trang: sau khi sua/xoa van giu trang hien tai, tu lui ve trang cuoi neu het dong
  const pageCount = Math.max(1, Math.ceil(customers.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = customers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="h-7 w-7 text-[#f66315]" />
            Quản lý Khách hàng
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchCustomers(searchKeyword)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#f66315]" : ""}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Thẻ thống kê */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tổng số khách hàng
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#f66315]">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{totalCustomers}</p>
          <p className="mt-1 text-xs text-slate-400">Đã đăng ký trên hệ thống</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Khách đã phát sinh đơn
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{customersWithOrders}</p>
          <p className="mt-1 text-xs text-blue-600 font-medium">
            Tỷ lệ chuyển đổi: {totalCustomers > 0 ? Math.round((customersWithOrders / totalCustomers) * 100) : 0}%
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tổng tiền tích lũy
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-600">
            {totalRevenueAll.toLocaleString("vi-VN")} đ
          </p>
          <p className="mt-1 text-xs text-slate-400">Từ các đơn đã giao</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Chi tiêu trung bình
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {avgSpent.toLocaleString("vi-VN")} đ
          </p>
          <p className="mt-1 text-xs text-slate-400">Trên mỗi tài khoản</p>
        </div>
      </div>

      {/* Tìm kiếm */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo Tên khách hàng, Số điện thoại hoặc Email..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-[#f66315] focus:ring-1 focus:ring-[#f66315]"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            Tìm kiếm
          </button>
          {searchKeyword && (
            <button
              type="button"
              onClick={() => {
                setSearchKeyword("");
                fetchCustomers("");
              }}
              className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Đặt lại
            </button>
          )}
        </form>
      </div>

      {/* Bảng dữ liệu Khách hàng */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Khách hàng</th>
                <th className="px-4 py-3.5">Số điện thoại</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">Địa chỉ</th>
                <th className="px-4 py-3.5 text-center">Số đơn</th>
                <th className="px-4 py-3.5 text-right">Tổng chi tiêu</th>
                <th className="px-4 py-3.5 text-center">Đơn gần nhất</th>
                <th className="px-4 py-3.5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#f66315]" />
                    <p className="mt-2 text-xs">Đang tải danh sách khách hàng...</p>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      {searchedKeyword ? "Không tìm thấy khách hàng phù hợp" : "Chưa có khách hàng nào"}
                    </p>
                  </td>
                </tr>
              ) : (
                pagedRows.map((c) => {
                  const initial = c.hoTen ? c.hoTen.charAt(0).toUpperCase() : "K";
                  return (
                    <tr key={c.maKH} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#f66315] to-[#ff9800] text-xs font-bold text-white shadow-sm">
                            {initial}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{c.hoTen}</p>
                            <p className="text-[10px] text-slate-400 font-mono">ID: {c.maKH.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 font-mono font-medium text-slate-700">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {c.soDienThoai}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {c.email ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-slate-400" />
                            {c.email}
                          </span>
                        ) : (
                          <span className="italic text-slate-400">Chưa cập nhật</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 max-w-[200px] truncate" title={c.diaChi || ""}>
                        {c.diaChi ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate">{c.diaChi}</span>
                          </span>
                        ) : (
                          <span className="italic text-slate-400">Chưa cập nhật</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center rounded-full bg-orange-50 px-2.5 py-0.5 font-bold text-xs text-[#f66315]">
                          {c.soDonHang} đơn
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-emerald-600">
                        {c.tongChiTieu.toLocaleString("vi-VN")} đ
                      </td>
                      <td className="px-4 py-3.5 text-center text-slate-500 text-[11px]">
                        {c.donGanNhat ? (
                          <span>{new Date(c.donGanNhat).toLocaleDateString("vi-VN")}</span>
                        ) : (
                          <span className="text-slate-400 italic">Chưa có đơn</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => openHistory(c)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm hover:border-[#f66315] hover:text-[#f66315] transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          Lịch sử
                        </button>
                        <button
                          onClick={() => openEdit(c)}
                          title="Sửa thông tin khách hàng"
                          className="ml-1.5 inline-flex rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => setDeletingCustomer(c)}
                          title="Xóa khách hàng"
                          className="ml-1.5 inline-flex rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && (
          <Pagination page={currentPage} pageSize={PAGE_SIZE} total={customers.length} unit="khách hàng" onChange={setPage} />
        )}
      </div>

      {/* Modal Lịch sử mua hàng của khách (kèm sản phẩm đã mua) */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Dau hop thoai */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 pb-4 pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f66315] to-[#f6af15] text-base font-bold text-white">
                  {selectedCustomer.hoTen.trim().charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Lịch sử mua hàng: {selectedCustomer.hoTen}</h3>
                  <p className="text-xs text-slate-500">
                    {selectedCustomer.soDienThoai}
                    {selectedCustomer.email && <> • {selectedCustomer.email}</>}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tong hop */}
            <div className="grid grid-cols-2 gap-3 px-6 pt-4 sm:grid-cols-4">
              {[
                { label: "Tổng số đơn", value: String(historyOrders?.length ?? selectedCustomer.soDonHang) },
                { label: "Đơn đã giao", value: String(selectedCustomer.soDonThanhCong) },
                { label: "Sản phẩm đã mua", value: historyOrders ? String(purchasedQty) : "…" },
                { label: "Tổng chi tiêu", value: `${selectedCustomer.tongChiTieu.toLocaleString("vi-VN")} đ`, accent: true },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{s.label}</p>
                  <p className={`mt-0.5 text-sm font-bold ${s.accent ? "text-emerald-600" : "text-slate-900"}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <p className="px-6 pt-2 text-[11px] text-slate-400">
              Sản phẩm đã mua và tổng chi tiêu chỉ tính các đơn đã giao thành công.
            </p>

            {/* Danh sach don + san pham */}
            <div className="mt-3 flex-1 space-y-3 overflow-y-auto px-6 pb-2">
              {historyOrders === null ? (
                <div className="py-10 text-center text-xs text-slate-400">Đang tải lịch sử mua hàng...</div>
              ) : historyOrders.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <ShoppingBag className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-xs">Khách hàng này chưa phát sinh đơn hàng nào</p>
                </div>
              ) : (
                historyOrders.map((order) => (
                  <div key={order.maDH} className="overflow-hidden rounded-2xl border border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50/80 px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate font-mono text-[11px] font-bold text-slate-700" title={order.maDH}>
                          #{order.maDH}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(order.ngayTao).toLocaleString("vi-VN")}
                          </span>
                          <span>•</span>
                          <span>{order.phuongThucThanhToan === "COD" ? "Thanh toán COD" : "Chuyển khoản VietQR"}</span>
                          {order.maVoucher && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-[#f66315]">Mã {order.maVoucher}</span>
                            </>
                          )}
                        </p>
                      </div>
                      <span
                        className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                          HISTORY_BADGE[order.trangThai] || "border-slate-200 bg-white text-slate-600"
                        }`}
                      >
                        {orderStatusLabel(order.trangThai)}
                      </span>
                    </div>

                    <ul className="divide-y divide-slate-100">
                      {order.sanPham.map((sp) => (
                        <li key={sp.maSP} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-white">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={sp.hinhAnh} alt={sp.tenSP} className="h-full w-full object-contain" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-slate-800" title={sp.tenSP}>
                              {sp.tenSP}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {sp.soLuong} × {sp.donGia.toLocaleString("vi-VN")} đ
                            </p>
                          </div>
                          <p className="whitespace-nowrap text-xs font-semibold text-slate-800">
                            {sp.thanhTien.toLocaleString("vi-VN")} đ
                          </p>
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-2.5">
                      <p className="flex min-w-0 items-center gap-1 text-[11px] text-slate-500">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate" title={order.diaChiNhan}>
                          {order.diaChiNhan}
                        </span>
                      </p>
                      <p className="whitespace-nowrap text-xs text-slate-500">
                        Tổng thanh toán:{" "}
                        <strong className="text-sm text-slate-900">{order.tongTien.toLocaleString("vi-VN")} đ</strong>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sửa thông tin khách hàng (Bảng 3.1) */}
      {showAddModal && editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-[#f66315]" />
                Sửa thông tin khách hàng
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Họ và tên khách hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn Hoàng"
                  value={newHoTen}
                  onChange={(e) => setNewHoTen(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#f66315]"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 0988123456"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#f66315]"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Ví dụ: khachhang@gmail.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#f66315]"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Địa chỉ giao hàng</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Số 12 Chùa Láng, Đống Đa, Hà Nội"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#f66315]"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#f66315] px-5 py-2 font-bold text-white shadow-md hover:bg-[#d4520f] disabled:opacity-50"
                >
                  {submitting ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deletingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Xóa khách hàng?</h3>
            <p className="mt-1 text-sm text-slate-500">
              Bạn có chắc chắn muốn xóa khách hàng{" "}
              <strong className="text-slate-800">{deletingCustomer.hoTen}</strong> không?
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeletingCustomer(null)}
                className="h-10 flex-1 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteCustomer}
                className="h-10 flex-1 rounded-lg bg-red-600 text-sm font-semibold text-white hover:bg-red-700"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
