"use client";

import { useEffect, useMemo, useState } from "react";
import { UserCog, PlusCircle, Search, Lock, Unlock, Trash2, Edit2, ShieldCheck, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { isStaffRole, normalizeRole, ROLE_LABELS, ROLE_OPTIONS, ROLES } from "@/lib/permissions";

// =======================================================
// QUAN LY TAI KHOAN - Bang 3.48 (Them), 3.49 (Sua), 3.50 (Xoa)
// =======================================================

interface AccountItem {
  MaTK: string;
  TenDangNhap: string;
  PhanQuyen: string;
  TrangThai: string;
  MaNV: string | null;
  NhanVien?: { MaNV: string; HoTen: string; SoDienThoai: string; TrangThai: string } | null;
}

interface EmployeeOption {
  MaNV: string;
  HoTen: string;
}

const ROLE_BADGE: Record<string, string> = {
  [ROLES.ADMIN]: "bg-rose-50 text-rose-700 border-rose-200",
  [ROLES.KHO]: "bg-sky-50 text-sky-700 border-sky-200",
  [ROLES.BAN_HANG]: "bg-amber-50 text-amber-700 border-amber-200",
};

const MIN_PASSWORD = 6;
const USERNAME_RE = /^[a-z0-9._@-]{3,100}$/;
const isLockedStatus = (s: string) => s === "Khoa" || s === "Locked";

const inputBase = "w-full rounded-xl border p-2.5 outline-none transition-colors";
const inputClass = (error?: string) =>
  `${inputBase} ${error ? "border-red-400 bg-red-50/40 focus:border-red-500" : "border-slate-200 focus:border-[#f66315]"}`;

export default function AdminTaiKhoanPage() {
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [currentMaTK, setCurrentMaTK] = useState("");
  const [loading, setLoading] = useState(true);

  // Tim kiem / loc
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Them tai khoan
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    tenDangNhap: "",
    matKhau: "",
    phanQuyen: ROLES.BAN_HANG as string,
    trangThai: "Active",
    maNV: "",
  });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  // Sua tai khoan
  const [editing, setEditing] = useState<AccountItem | null>(null);
  const [editForm, setEditForm] = useState({ phanQuyen: "", trangThai: "", matKhauMoi: "" });
  const [editError, setEditError] = useState("");

  // Xoa tai khoan
  const [deleting, setDeleting] = useState<AccountItem | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tai-khoan");
      const json = await res.json();
      if (res.ok) {
        setAccounts(json.data || []);
        setEmployees(json.availableEmployees || []);
        setCurrentMaTK(json.currentMaTK || "");
      } else {
        toast.error(json.error || "Lỗi tải danh sách tài khoản");
      }
    } catch {
      toast.error("Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Loc tai khoan theo tu khoa (ma TK, ten dang nhap, nhan vien), vai tro, trang thai
  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return accounts.filter((acc) => {
      if (roleFilter && normalizeRole(acc.PhanQuyen) !== roleFilter) return false;
      if (statusFilter === "active" && isLockedStatus(acc.TrangThai)) return false;
      if (statusFilter === "locked" && !isLockedStatus(acc.TrangThai)) return false;
      if (!kw) return true;
      return [acc.MaTK, acc.TenDangNhap, acc.NhanVien?.HoTen, acc.NhanVien?.MaNV]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(kw));
    });
  }, [accounts, keyword, roleFilter, statusFilter]);

  const hasFilter = !!(keyword.trim() || roleFilter || statusFilter);

  // ===== Them (Bang 3.48) =====
  const openCreate = () => {
    setCreateForm({
      tenDangNhap: "",
      matKhau: "",
      phanQuyen: ROLES.BAN_HANG,
      trangThai: "Active",
      maNV: employees[0]?.MaNV || "",
    });
    setCreateErrors({});
    setShowCreate(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    // A2 - bao loi do tai truong tuong ung
    const errors: Record<string, string> = {};
    const username = createForm.tenDangNhap.trim().toLowerCase();
    if (!username) errors.tenDangNhap = "Vui lòng nhập tên đăng nhập";
    else if (!USERNAME_RE.test(username))
      errors.tenDangNhap = "3–100 ký tự, không dấu cách, chỉ gồm chữ, số và . _ - @";
    if (!createForm.matKhau) errors.matKhau = "Vui lòng nhập mật khẩu";
    else if (createForm.matKhau.length < MIN_PASSWORD) errors.matKhau = `Tối thiểu ${MIN_PASSWORD} ký tự`;
    if (!createForm.maNV) errors.maNV = "Vui lòng chọn nhân viên sở hữu tài khoản";
    setCreateErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/tai-khoan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...createForm, tenDangNhap: username }),
      });
      const data = await res.json();
      if (!res.ok) {
        // A1 - Trung tai khoan -> bao tai o ten dang nhap
        if (data.error === "Tài khoản đã tồn tại") setCreateErrors({ tenDangNhap: data.error });
        toast.error(data.error || "Không thể thêm tài khoản");
        return;
      }
      toast.success(data.message || "Thêm tài khoản thành công");
      setShowCreate(false);
      fetchAccounts();
    } catch {
      toast.error("Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại!");
    } finally {
      setSaving(false);
    }
  };

  // ===== Sua (Bang 3.49) =====
  const openEdit = (acc: AccountItem) => {
    setEditing(acc);
    setEditForm({
      phanQuyen: normalizeRole(acc.PhanQuyen) || "",
      trangThai: isLockedStatus(acc.TrangThai) ? "Khoa" : "Active",
      matKhauMoi: "",
    });
    setEditError("");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (editForm.matKhauMoi && editForm.matKhauMoi.length < MIN_PASSWORD) {
      setEditError(`Mật khẩu mới tối thiểu ${MIN_PASSWORD} ký tự`);
      return;
    }

    // Chi gui cac truong thay doi
    const body: Record<string, string> = { maTK: editing.MaTK };
    if (isStaffRole(editing.PhanQuyen) && editForm.phanQuyen !== normalizeRole(editing.PhanQuyen)) {
      body.phanQuyen = editForm.phanQuyen;
    }
    if (editForm.trangThai !== (isLockedStatus(editing.TrangThai) ? "Khoa" : "Active")) {
      body.trangThai = editForm.trangThai;
    }
    if (editForm.matKhauMoi) body.matKhauMoi = editForm.matKhauMoi;
    if (Object.keys(body).length === 1) {
      setEditError("Chưa có thay đổi nào để lưu");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/tai-khoan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        // A2 - Tai khoan da bi xoa o phien khac -> dong form, tai lai danh sach
        if (res.status === 404) {
          toast.error(data.error || "Tài khoản không tồn tại");
          setEditing(null);
          fetchAccounts();
          return;
        }
        setEditError(data.error || "Không thể cập nhật tài khoản");
        return;
      }
      toast.success(data.message || "Cập nhật thành công");
      setEditing(null);
      fetchAccounts();
    } catch {
      setEditError("Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại!");
    } finally {
      setSaving(false);
    }
  };

  // Khoa / mo khoa nhanh ngay tren danh sach
  const handleToggleLock = async (acc: AccountItem) => {
    const locked = isLockedStatus(acc.TrangThai);
    try {
      const res = await fetch("/api/admin/tai-khoan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maTK: acc.MaTK, trangThai: locked ? "Active" : "Khoa" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(locked ? `Đã mở khóa "${acc.TenDangNhap}"` : `Đã khóa "${acc.TenDangNhap}"`);
      } else {
        toast.error(data.error || "Không thể cập nhật trạng thái");
      }
    } catch {
      toast.error("Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại!");
    } finally {
      fetchAccounts();
    }
  };

  // ===== Xoa (Bang 3.50) =====
  const handleDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/tai-khoan?maTK=${encodeURIComponent(deleting.MaTK)}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) toast.success(data.message || "Xóa thành công");
      else toast.error(data.error || "Không thể xóa tài khoản");
      setDeleting(null);
      fetchAccounts();
    } catch {
      toast.error("Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tieu de */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <UserCog className="h-6 w-6 text-[#f66315]" />
          QUẢN LÝ TÀI KHOẢN
        </h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 self-start rounded-xl bg-[#f66315] px-4 py-2 text-xs font-bold text-white shadow-md shadow-orange-900/20 transition-all hover:bg-[#e55000]"
        >
          <PlusCircle className="h-4 w-4" />
          Thêm tài khoản
        </button>
      </div>

      {/* Tim kiem */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên đăng nhập, mã tài khoản, tên hoặc mã nhân viên..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-[#f66315]"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#f66315]"
          >
            <option value="">Tất cả vai trò</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {ROLE_LABELS[r.value]}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#f66315]"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="locked">Bị khóa</option>
          </select>
          {hasFilter && (
            <button
              onClick={() => {
                setKeyword("");
                setRoleFilter("");
                setStatusFilter("");
              }}
              className="px-2 text-xs font-semibold text-slate-500 hover:text-[#f66315]"
            >
              Bỏ lọc
            </button>
          )}
        </div>
      </div>

      {/* Danh sach */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase text-slate-700">
              <tr>
                <th className="px-4 py-3">Mã TK</th>
                <th className="px-4 py-3">Tên đăng nhập</th>
                <th className="px-4 py-3">Phân quyền</th>
                <th className="px-4 py-3">Nhân sự sở hữu</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center font-medium text-slate-400">
                    Đang tải danh sách tài khoản...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center font-medium text-slate-400">
                    {hasFilter ? "Không tìm thấy tài khoản phù hợp" : "Hiện chưa có tài khoản nào"}
                  </td>
                </tr>
              ) : (
                filtered.map((acc) => {
                  const locked = isLockedStatus(acc.TrangThai);
                  const isSelf = acc.MaTK === currentMaTK;
                  const role = normalizeRole(acc.PhanQuyen) || "";
                  return (
                    <tr key={acc.MaTK} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900" title={acc.MaTK}>
                        {acc.MaTK.length > 10 ? acc.MaTK.slice(0, 10) + "…" : acc.MaTK}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">
                        {acc.TenDangNhap}
                        {isSelf && (
                          <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-px text-[10px] font-semibold text-slate-500">
                            bạn
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                            ROLE_BADGE[role] || "border-slate-200 bg-slate-50 text-slate-500"
                          }`}
                        >
                          {ROLE_LABELS[role] || acc.PhanQuyen}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {acc.NhanVien ? (
                          <span>
                            {acc.NhanVien.HoTen} ({acc.NhanVien.MaNV})
                            {acc.NhanVien.TrangThai === "Da nghi viec" && (
                              <span className="ml-1 text-[10px] font-semibold text-red-500">· đã nghỉ việc</span>
                            )}
                          </span>
                        ) : (
                          <span className="italic text-slate-400">Không gắn nhân viên</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                            locked
                              ? "border-red-200 bg-red-50 text-red-600"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {locked ? <Lock className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                          {locked ? "Bị khóa" : "Hoạt động"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(acc)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                            title="Sửa tài khoản"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          {!isSelf && (
                            <>
                              <button
                                onClick={() => handleToggleLock(acc)}
                                className={`rounded-lg border p-1.5 transition-all ${
                                  locked
                                    ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                    : "border-red-200 text-red-600 hover:bg-red-50"
                                }`}
                                title={locked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                              >
                                {locked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                onClick={() => setDeleting(acc)}
                                className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                title="Xóa tài khoản"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
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

      {/* Modal them tai khoan (Bang 3.48) */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">THÊM TÀI KHOẢN</h3>
              <button onClick={() => setShowCreate(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs" noValidate>
              <div>
                <label className="mb-1 block font-bold text-slate-700">Tên đăng nhập *</label>
                <input
                  type="text"
                  placeholder="vd: nhanvien01@fbshop.vn"
                  value={createForm.tenDangNhap}
                  onChange={(e) => setCreateForm({ ...createForm, tenDangNhap: e.target.value })}
                  className={inputClass(createErrors.tenDangNhap)}
                />
                {createErrors.tenDangNhap && <p className="mt-1 text-red-600">{createErrors.tenDangNhap}</p>}
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Mật khẩu *</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder={`Tối thiểu ${MIN_PASSWORD} ký tự`}
                  value={createForm.matKhau}
                  onChange={(e) => setCreateForm({ ...createForm, matKhau: e.target.value })}
                  className={inputClass(createErrors.matKhau)}
                />
                {createErrors.matKhau && <p className="mt-1 text-red-600">{createErrors.matKhau}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Phân quyền *</label>
                  <select
                    value={createForm.phanQuyen}
                    onChange={(e) => setCreateForm({ ...createForm, phanQuyen: e.target.value })}
                    className={inputClass()}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {ROLE_LABELS[r.value]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Trạng thái *</label>
                  <select
                    value={createForm.trangThai}
                    onChange={(e) => setCreateForm({ ...createForm, trangThai: e.target.value })}
                    className={inputClass()}
                  >
                    <option value="Active">Hoạt động</option>
                    <option value="Khoa">Bị khóa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Nhân viên sở hữu *</label>
                {employees.length === 0 ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-amber-700">
                    Tất cả nhân viên đang làm việc đều đã có tài khoản. Hãy thêm nhân viên mới trước.
                  </p>
                ) : (
                  <select
                    value={createForm.maNV}
                    onChange={(e) => setCreateForm({ ...createForm, maNV: e.target.value })}
                    className={inputClass(createErrors.maNV)}
                  >
                    {employees.map((emp) => (
                      <option key={emp.MaNV} value={emp.MaNV}>
                        {emp.HoTen} ({emp.MaNV})
                      </option>
                    ))}
                  </select>
                )}
                {createErrors.maNV && <p className="mt-1 text-red-600">{createErrors.maNV}</p>}
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving || employees.length === 0}
                  className="rounded-xl bg-[#f66315] px-5 py-2 font-bold text-white hover:bg-[#e55000] disabled:opacity-50"
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal sua tai khoan (Bang 3.49) */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">SỬA TÀI KHOẢN</h3>
              <button onClick={() => setEditing(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
                ✕
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Tên đăng nhập</label>
                  <p className="truncate rounded-xl bg-slate-100 p-2.5 font-semibold text-slate-700">
                    {editing.TenDangNhap}
                  </p>
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Nhân sự sở hữu</label>
                  <p className="truncate rounded-xl bg-slate-100 p-2.5 font-semibold text-slate-700">
                    {editing.NhanVien ? `${editing.NhanVien.HoTen} (${editing.NhanVien.MaNV})` : "—"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Phân quyền</label>
                  {isStaffRole(editing.PhanQuyen) ? (
                    <select
                      value={editForm.phanQuyen}
                      onChange={(e) => setEditForm({ ...editForm, phanQuyen: e.target.value })}
                      className={inputClass()}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {ROLE_LABELS[r.value]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="rounded-xl bg-slate-100 p-2.5 font-semibold text-slate-500">{editing.PhanQuyen}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Trạng thái</label>
                  <select
                    value={editForm.trangThai}
                    onChange={(e) => setEditForm({ ...editForm, trangThai: e.target.value })}
                    className={inputClass()}
                  >
                    <option value="Active">Hoạt động</option>
                    <option value="Khoa">Bị khóa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Đặt lại mật khẩu</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Để trống nếu không đổi"
                  value={editForm.matKhauMoi}
                  onChange={(e) => setEditForm({ ...editForm, matKhauMoi: e.target.value })}
                  className={inputClass()}
                />
              </div>

              {editError && (
                <p className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 p-2.5 font-semibold text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {editError}
                </p>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#f66315] px-5 py-2 font-bold text-white hover:bg-[#e55000] disabled:opacity-50"
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hop thoai xac nhan xoa (Bang 3.50) */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Xóa tài khoản?</h3>
            <p className="mt-1 text-sm text-slate-500">
              Tài khoản <strong className="text-slate-800">{deleting.TenDangNhap}</strong> sẽ bị xóa vĩnh viễn và
              không thể đăng nhập được nữa.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleting(null)}
                className="h-10 flex-1 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="h-10 flex-1 rounded-lg bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? "Đang xóa..." : "Đồng ý"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
