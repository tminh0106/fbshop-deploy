"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
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
} from "lucide-react";
import toast from "react-hot-toast";

interface CustomerOrder {
  MaDH: string;
  TongTien: number;
  TrangThai: string;
  NgayTao: string;
}

interface Customer {
  maKH: string;
  hoTen: string;
  soDienThoai: string;
  email: string;
  diaChi: string;
  soDonHang: number;
  soDonThanhCong: number;
  tongChiTieu: number;
  donGanNhat: string | null;
  danhSachDonHang: CustomerOrder[];
}

export default function AdminKhachHangPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form thêm khách
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(searchKeyword);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHoTen.trim()) {
      toast.error("Vui lòng nhập họ tên");
      return;
    }
    if (!newPhone.trim()) {
      toast.error("Vui lòng nhập số điện thoại");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/khach-hang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hoTen: newHoTen.trim(),
          soDienThoai: newPhone.trim(),
          email: newEmail.trim() || undefined,
          diaChi: newAddress.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Thêm khách hàng thành công!");
        setShowAddModal(false);
        setNewHoTen("");
        setNewPhone("");
        setNewEmail("");
        setNewAddress("");
        fetchCustomers();
      } else {
        toast.error(data.error || "Thêm khách hàng thất bại");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  // Tính toán thống kê
  const totalCustomers = customers.length;
  const customersWithOrders = customers.filter((c) => c.soDonHang > 0).length;
  const totalRevenueAll = customers.reduce((sum, c) => sum + c.tongChiTieu, 0);
  const avgSpent = totalCustomers > 0 ? Math.round(totalRevenueAll / totalCustomers) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Users className="h-7 w-7 text-[#f66315]" />
            Quản lý Khách hàng
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Theo dõi hồ sơ khách hàng, thông tin liên hệ và lịch sử giao dịch mua sắm
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchCustomers(searchKeyword)}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#f66315]" : ""}`} />
            Làm mới
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#e55000] to-[#f66315] px-4 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:brightness-110 transition-all"
          >
            <Plus className="h-4 w-4" />
            Thêm khách hàng
          </button>
        </div>
      </div>

      {/* Thẻ thống kê */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Tổng số khách hàng
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#f66315]">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-gray-900">{totalCustomers}</p>
          <p className="mt-1 text-xs text-gray-400">Đã đăng ký trên hệ thống</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Khách đã phát sinh đơn
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-gray-900">{customersWithOrders}</p>
          <p className="mt-1 text-xs text-blue-600 font-medium">
            Tỷ lệ chuyển đổi: {totalCustomers > 0 ? Math.round((customersWithOrders / totalCustomers) * 100) : 0}%
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Tổng tiền tích lũy
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-emerald-600">
            {totalRevenueAll.toLocaleString("vi-VN")} đ
          </p>
          <p className="mt-1 text-xs text-gray-400">Từ các đơn hàng thành công</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Chi tiêu trung bình
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-gray-900">
            {avgSpent.toLocaleString("vi-VN")} đ
          </p>
          <p className="mt-1 text-xs text-gray-400">Trên mỗi tài khoản</p>
        </div>
      </div>

      {/* Tìm kiếm */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo Tên khách hàng, Số điện thoại hoặc Email..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-[#f66315] focus:ring-1 focus:ring-[#f66315]"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-gray-800 transition-colors"
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
              className="rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Đặt lại
            </button>
          )}
        </form>
      </div>

      {/* Bảng dữ liệu Khách hàng */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-bold uppercase tracking-wider text-gray-500">
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
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#f66315]" />
                    <p className="mt-2 text-xs">Đang tải danh sách khách hàng...</p>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <Users className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="mt-2 text-xs font-medium text-gray-500">
                      Không tìm thấy khách hàng nào phù hợp
                    </p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const initial = c.hoTen ? c.hoTen.charAt(0).toUpperCase() : "K";
                  return (
                    <tr key={c.maKH} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#f66315] to-[#ff9800] text-xs font-black text-white shadow-sm">
                            {initial}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{c.hoTen}</p>
                            <p className="text-[10px] text-gray-400 font-mono">ID: {c.maKH.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 font-mono font-medium text-gray-700">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {c.soDienThoai}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">
                        {c.email !== "Chưa cập nhật" ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-gray-400" />
                            {c.email}
                          </span>
                        ) : (
                          <span className="italic text-gray-400">{c.email}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 max-w-[200px] truncate" title={c.diaChi}>
                        {c.diaChi !== "Chưa cập nhật" ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                            <span className="truncate">{c.diaChi}</span>
                          </span>
                        ) : (
                          <span className="italic text-gray-400">{c.diaChi}</span>
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
                      <td className="px-4 py-3.5 text-center text-gray-500 text-[11px]">
                        {c.donGanNhat ? (
                          <span>{new Date(c.donGanNhat).toLocaleDateString("vi-VN")}</span>
                        ) : (
                          <span className="text-gray-400 italic">Chưa có đơn</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 shadow-sm hover:border-[#f66315] hover:text-[#f66315] transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          Lịch sử
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lịch sử đơn hàng của khách */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Lịch sử mua hàng: {selectedCustomer.hoTen}
                </h3>
                <p className="text-xs text-gray-500">
                  SĐT: {selectedCustomer.soDienThoai} | Tổng chi tiêu:{" "}
                  <strong className="text-emerald-600">
                    {selectedCustomer.tongChiTieu.toLocaleString("vi-VN")} đ
                  </strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 max-h-96 overflow-y-auto space-y-2.5">
              {selectedCustomer.danhSachDonHang.length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                  <ShoppingBag className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-xs">Khách hàng này chưa phát sinh đơn hàng nào</p>
                </div>
              ) : (
                selectedCustomer.danhSachDonHang.map((order) => (
                  <div
                    key={order.MaDH}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 p-3 text-xs"
                  >
                    <div>
                      <p className="font-mono font-bold text-gray-900">Mã đơn: {order.MaDH}</p>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {new Date(order.NgayTao).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {Number(order.TongTien).toLocaleString("vi-VN")} đ
                      </p>
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          order.TrangThai === "Da giao"
                            ? "bg-emerald-50 text-emerald-700"
                            : order.TrangThai === "Da huy"
                            ? "bg-red-50 text-red-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {order.TrangThai}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end border-t border-gray-100 pt-4">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm khách hàng mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#f66315]" />
                Thêm Khách Hàng Mới
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="mb-1 block font-bold text-gray-700">
                  Họ và tên khách hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn Hoàng"
                  value={newHoTen}
                  onChange={(e) => setNewHoTen(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-[#f66315]"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-gray-700">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 0988123456"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-[#f66315]"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-gray-700">Email (Tùy chọn)</label>
                <input
                  type="email"
                  placeholder="Ví dụ: khachhang@gmail.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-[#f66315]"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-gray-700">Địa chỉ giao hàng</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Số 12 Chùa Láng, Đống Đa, Hà Nội"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-[#f66315]"
                />
              </div>

              <div className="rounded-xl bg-orange-50 p-3 text-[11px] text-orange-800 border border-orange-200/60">
                <p>Mật khẩu đăng nhập mặc định cho khách hàng sẽ là: <strong>123456</strong></p>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl bg-gray-100 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#f66315] px-5 py-2 font-bold text-white shadow-md hover:bg-orange-700 disabled:opacity-50"
                >
                  {submitting ? "Đang tạo..." : "Xác nhận thêm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
