"use client";

import { useState, useEffect } from "react";
import {
  UserCog,
  PlusCircle,
  KeyRound,
  ShieldCheck,
  Lock,
  Unlock,
  Trash2,
  Edit2,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

interface AccountItem {
  MaTK: string;
  TenDangNhap: string;
  PhanQuyen: string;
  TrangThai: string;
  MaNV: string | null;
  NhanVien?: {
    MaNV: string;
    HoTen: string;
    SoDienThoai: string;
  } | null;
}

interface NhanVienOption {
  MaNV: string;
  HoTen: string;
}

export default function AdminTaiKhoanPage() {
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [employees, setEmployees] = useState<NhanVienOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTenDangNhap, setNewTenDangNhap] = useState("");
  const [newMatKhau, setNewMatKhau] = useState("123456");
  const [newPhanQuyen, setNewPhanQuyen] = useState("NhanVien");
  const [newMaNV, setNewMaNV] = useState("");

  // Change Password Modal
  const [passwordTarget, setPasswordTarget] = useState<AccountItem | null>(null);
  const [newPassInput, setNewPassInput] = useState("123456");

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tai-khoan");
      const json = await res.json();
      if (res.ok) {
        setAccounts(json.data || []);
      }
    } catch {
      toast.error("Lỗi tải danh sách tài khoản");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/admin/nhan-vien");
      const json = await res.json();
      if (json.data) setEmployees(json.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchEmployees();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenDangNhap.trim() || !newMatKhau) {
      toast.error("Vui lòng điền đủ tên đăng nhập và mật khẩu");
      return;
    }

    try {
      const res = await fetch("/api/admin/tai-khoan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenDangNhap: newTenDangNhap.trim(),
          matKhau: newMatKhau,
          phanQuyen: newPhanQuyen,
          maNV: newMaNV || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể tạo tài khoản");
      } else {
        toast.success("Tạo tài khoản thành công!");
        setShowCreateModal(false);
        setNewTenDangNhap("");
        setNewMatKhau("123456");
        fetchAccounts();
      }
    } catch {
      toast.error("Lỗi kết nối");
    }
  };

  const handleToggleLock = async (acc: AccountItem) => {
    const isLocked = acc.TrangThai === "Khoa" || acc.TrangThai === "Locked";
    const newStatus = isLocked ? "Active" : "Khoa";

    try {
      const res = await fetch("/api/admin/tai-khoan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maTK: acc.MaTK,
          trangThai: newStatus,
        }),
      });
      if (res.ok) {
        toast.success(
          isLocked
            ? `Đã mở khóa tài khoản "${acc.TenDangNhap}"`
            : `Đã khóa tài khoản "${acc.TenDangNhap}"`
        );
        fetchAccounts();
      }
    } catch {
      toast.error("Lỗi kết nối");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTarget || newPassInput.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    try {
      const res = await fetch("/api/admin/tai-khoan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maTK: passwordTarget.MaTK,
          matKhauMoi: newPassInput,
        }),
      });
      if (res.ok) {
        toast.success(`Đã đổi mật khẩu cho ${passwordTarget.TenDangNhap}`);
        setPasswordTarget(null);
      } else {
        toast.error("Không thể đổi mật khẩu");
      }
    } catch {
      toast.error("Lỗi kết nối");
    }
  };

  const handleDelete = async (maTK: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) return;
    try {
      const res = await fetch(`/api/admin/tai-khoan?maTK=${maTK}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Đã xóa tài khoản");
        fetchAccounts();
      }
    } catch {
      toast.error("Lỗi khi xóa");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <UserCog className="h-6 w-6 text-[#f66315]" />
            PHÂN QUYỀN & TÀI KHOẢN HỆ THỐNG
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Quản lý tài khoản đăng nhập nội bộ (Admin, QuanLyKho, NhanVien) và mở khóa tài khoản
          </p>
        </div>

        <button
          onClick={() => {
            setNewTenDangNhap("");
            setNewMaNV(employees[0]?.MaNV || "");
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-[#f66315] px-4 py-2 text-xs font-bold text-white shadow-md shadow-orange-900/20 hover:bg-[#e55000] transition-all self-start"
        >
          <PlusCircle className="h-4 w-4" />
          Cấp tài khoản mới
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50/80 font-bold text-gray-700 uppercase">
              <tr>
                <th className="px-4 py-3">Mã TK</th>
                <th className="px-4 py-3">Tên Đăng Nhập</th>
                <th className="px-4 py-3">Phân Quyền</th>
                <th className="px-4 py-3">Nhân Sự Sở Hữu</th>
                <th className="px-4 py-3 text-center">Trạng Thái</th>
                <th className="px-4 py-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 font-medium">
                    Đang tải danh sách tài khoản...
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => {
                  const isLocked = acc.TrangThai === "Khoa" || acc.TrangThai === "Locked";

                  return (
                    <tr key={acc.MaTK} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-gray-900">
                        {acc.MaTK.slice(0, 10)}...
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-800">
                        {acc.TenDangNhap}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            acc.PhanQuyen === "Admin"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : acc.PhanQuyen === "QuanLyKho"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {acc.PhanQuyen}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {acc.NhanVien ? (
                          <span>
                            {acc.NhanVien.HoTen} ({acc.NhanVien.MaNV})
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Tài khoản độc lập</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isLocked
                              ? "bg-red-50 text-red-600 border border-red-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {isLocked ? <Lock className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                          {isLocked ? "Bị khóa" : "Hoạt động"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleLock(acc)}
                            className={`rounded-lg border p-1.5 transition-all ${
                              isLocked
                                ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                : "border-red-200 text-red-600 hover:bg-red-50"
                            }`}
                            title={isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                          >
                            {isLocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => {
                              setPasswordTarget(acc);
                              setNewPassInput("123456");
                            }}
                            className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100"
                            title="Đặt lại mật khẩu"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </button>
                          {acc.TenDangNhap !== "admin" && (
                            <button
                              onClick={() => handleDelete(acc.MaTK)}
                              className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50"
                              title="Xóa tài khoản"
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

      {/* Modal Cap Tai Khoan Moi */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-base font-black text-gray-900">CẤP TÀI KHOẢN MỚI</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="mb-1 block font-bold text-gray-700">Tên đăng nhập *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: kho02, sales01..."
                  value={newTenDangNhap}
                  onChange={(e) => setNewTenDangNhap(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-[#f66315]"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-gray-700">Mật khẩu ban đầu</label>
                <input
                  type="password"
                  required
                  value={newMatKhau}
                  onChange={(e) => setNewMatKhau(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-[#f66315]"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-gray-700">Phân quyền vai trò</label>
                <select
                  value={newPhanQuyen}
                  onChange={(e) => setNewPhanQuyen(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-[#f66315]"
                >
                  <option value="Admin">Admin (Toàn quyền)</option>
                  <option value="QuanLyKho">QuanLyKho (Kho hàng & Hóa đơn kho)</option>
                  <option value="NhanVien">NhanVien (Bán hàng & đơn hàng)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-gray-700">Nhân sự liên kết</label>
                <select
                  value={newMaNV}
                  onChange={(e) => setNewMaNV(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-[#f66315]"
                >
                  <option value="">-- Không liên kết nhân sự --</option>
                  {employees.map((emp) => (
                    <option key={emp.MaNV} value={emp.MaNV}>
                      {emp.HoTen} ({emp.MaNV})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 font-bold text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#f66315] px-5 py-2 font-bold text-white hover:bg-[#e55000]"
                >
                  Cấp tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dat Lai Mat Khau */}
      {passwordTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-gray-100">
            <h3 className="text-base font-black text-gray-900 mb-2">
              ĐỔI MẬT KHẨU CHO: {passwordTarget.TenDangNhap}
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-bold text-gray-700">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                <input
                  type="password"
                  value={newPassInput}
                  onChange={(e) => setNewPassInput(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-[#f66315]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordTarget(null)}
                  className="rounded-xl border border-gray-300 px-3.5 py-2 font-bold text-gray-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#f66315] px-4 py-2 font-bold text-white hover:bg-[#e55000]"
                >
                  Lưu mật khẩu mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
