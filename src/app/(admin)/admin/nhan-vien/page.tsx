"use client";

import { useState, useEffect } from "react";
import {
  Users,
  PlusCircle,
  Search,
  Download,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  BadgeDollarSign,
  ShieldCheck,
  AlertCircle,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import Pagination from "@/components/admin/Pagination";

const PAGE_SIZE = 10;
import { exportToExcel } from "@/lib/exportExcel";
import { normalizeRole, ROLE_LABELS } from "@/lib/permissions";

interface EmployeeItem {
  MaNV: string;
  HoTen: string;
  SoDienThoai: string;
  Email?: string | null;
  DiaChi: string | null;
  LuongCoBan: number;
  PhuCap: number;
  TrangThai: string;
  TaiKhoans?: {
    TenDangNhap: string;
    PhanQuyen: string;
    TrangThai: string;
  }[];
  _count?: { HoaDonKhos: number };
}

const PHONE_REGEX = /^0\d{9}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;

export default function AdminNhanVienPage() {
  const [page, setPage] = useState(1);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<EmployeeItem | null>(null);
  const [formData, setFormData] = useState({
    maNV: "",
    hoTen: "",
    soDienThoai: "",
    email: "",
    diaChi: "277 Nguyễn Trãi, Thanh Xuân, Hà Nội",
    luongCoBan: 10000000,
    phuCap: 1500000,
    trangThai: "Active",
  });

  const [nextMaNV, setNextMaNV] = useState("");
  // Tu khoa cua lan tim gan nhat (de phan biet "khong tim thay" voi "danh sach trong")
  const [searchedKeyword, setSearchedKeyword] = useState("");

  // Validation errors
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formGeneralError, setFormGeneralError] = useState("");

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.append("keyword", keyword);

      const res = await fetch(`/api/admin/nhan-vien?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setEmployees(json.data || []);
        setSearchedKeyword(keyword.trim());
        // Ma NV tiep theo do server tinh tren toan bo nhan vien (khong phu thuoc bo loc tim kiem)
        if (json.nextMaNV) setNextMaNV(json.nextMaNV);
      } else {
        toast.error(json.error || "Lỗi khi tải danh sách nhân viên");
      }
    } catch {
      toast.error("Lỗi khi tải danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleOpenCreate = () => {
    setEditingEmp(null);
    setPhoneError("");
    setEmailError("");
    setFormGeneralError("");
    setFormData({
      maNV: nextMaNV || "Tự động",
      hoTen: "",
      soDienThoai: "",
      email: "",
      diaChi: "277 Nguyễn Trãi, Thanh Xuân, Hà Nội",
      luongCoBan: 10000000,
      phuCap: 1500000,
      trangThai: "Active",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (emp: EmployeeItem) => {
    setEditingEmp(emp);
    setPhoneError("");
    setEmailError("");
    setFormGeneralError("");
    setFormData({
      maNV: emp.MaNV,
      hoTen: emp.HoTen,
      soDienThoai: emp.SoDienThoai,
      email: emp.Email || "",
      diaChi: emp.DiaChi || "",
      luongCoBan: Number(emp.LuongCoBan),
      phuCap: Number(emp.PhuCap),
      // Du lieu cu dung "Dang lam viec" -> hien thi chung la dang lam viec
      trangThai: emp.TrangThai === "Da nghi viec" ? "Da nghi viec" : "Active",
    });
    setShowModal(true);
  };

  // Bước 6: Lưu thông tin kèm kiểm tra ngoại lệ A2 & Trùng lặp
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");
    setEmailError("");
    setFormGeneralError("");

    let hasClientError = false;

    // 1. Kiểm tra họ tên
    if (!formData.hoTen.trim()) {
      setFormGeneralError("Vui lòng nhập họ và tên nhân viên");
      return;
    }
    if (formData.hoTen.trim().length > 100) {
      setFormGeneralError("Họ tên tối đa 100 ký tự");
      return;
    }
    if (formData.diaChi.trim().length > 255) {
      setFormGeneralError("Địa chỉ tối đa 255 ký tự");
      return;
    }
    // Luong, phu cap: so nguyen khong am
    for (const [label, value] of [
      ["Lương cơ bản", formData.luongCoBan],
      ["Phụ cấp", formData.phuCap],
    ] as const) {
      if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
        setFormGeneralError(`${label} phải là số nguyên không âm (VNĐ)`);
        return;
      }
    }

    // 2. A2 - Kiểm tra định dạng Số điện thoại
    const cleanPhone = formData.soDienThoai.trim();
    if (!cleanPhone) {
      setPhoneError("Vui lòng nhập số điện thoại");
      hasClientError = true;
    } else if (!PHONE_REGEX.test(cleanPhone)) {
      setPhoneError(
        "Số điện thoại không đúng định dạng (phải gồm đúng 10 chữ số và bắt đầu bằng số 0)"
      );
      hasClientError = true;
    }

    // 3. A2 - Kiểm tra định dạng Email (nếu có nhập)
    const cleanEmail = formData.email.trim();
    if (cleanEmail && !EMAIL_REGEX.test(cleanEmail)) {
      setEmailError("Email không đúng định dạng (ví dụ hợp lệ: nhanvien@fbshop.vn)");
      hasClientError = true;
    }

    if (hasClientError) {
      toast.error("Dữ liệu nhập sai định dạng. Vui lòng kiểm tra lại!");
      return;
    }

    try {
      const method = editingEmp ? "PUT" : "POST";
      const res = await fetch("/api/admin/nhan-vien", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          // Them moi: ma NV do server tu cap, khong gui ma tu form
          maNV: editingEmp ? formData.maNV : undefined,
          soDienThoai: cleanPhone,
          email: cleanEmail || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Trùng lặp dữ liệu độc nhất hoặc lỗi định dạng từ server
        if (data.error === "Thông tin đã tồn tại" || res.status === 409) {
          setFormGeneralError("Thông tin đã tồn tại (Số điện thoại hoặc Email đã thuộc về nhân viên khác)!");
          toast.error("Thông tin đã tồn tại");
        } else {
          setFormGeneralError(data.error || "Không thể lưu nhân viên");
          toast.error(data.error || "Lỗi khi lưu thông tin");
        }
      } else {
        toast.success(
          data.message || (editingEmp ? "Cập nhật thông tin thành công" : "Thêm nhân viên mới thành công")
        );
        setShowModal(false);
        fetchEmployees();
      }
    } catch {
      setFormGeneralError("Lỗi kết nối máy chủ");
      toast.error("Lỗi kết nối máy chủ");
    }
  };

  const handleDelete = async (maNV: string, hoTen: string) => {
    // Bang 3.32 buoc 5: hop thoai xac nhan
    if (!confirm(`Bạn có chắc chắn muốn xóa nhân viên ${hoTen} không?`)) return;

    try {
      const res = await fetch(`/api/admin/nhan-vien?maNV=${maNV}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể xóa");
      } else {
        if (data.softDeleted) {
          toast(data.message, { icon: "⚠️", duration: 5000 });
        } else {
          toast.success(data.message);
        }
        fetchEmployees();
      }
    } catch {
      toast.error("Lỗi kết nối");
    }
  };

  const handleExportExcel = () => {
    const dataToExport = employees.map((emp) => ({
      "Mã NV": emp.MaNV,
      "Họ tên": emp.HoTen,
      "Số điện thoại": emp.SoDienThoai,
      "Email": emp.Email || "",
      "Địa chỉ": emp.DiaChi || "",
      "Lương cơ bản (VNĐ)": Number(emp.LuongCoBan),
      "Phụ cấp (VNĐ)": Number(emp.PhuCap),
      "Tài khoản hệ thống": emp.TaiKhoans?.map((t) => t.TenDangNhap).join(", ") || "Chưa cấp",
      "Phân quyền":
        emp.TaiKhoans?.map((t) => ROLE_LABELS[normalizeRole(t.PhanQuyen) || ""] || t.PhanQuyen).join(", ") ||
        "N/A",
      "Hóa đơn kho liên kết": emp._count?.HoaDonKhos || 0,
      "Trạng thái": emp.TrangThai === "Da nghi viec" ? "Đã nghỉ việc" : "Đang làm việc",
    }));

    exportToExcel(dataToExport, "DanhSachNhanVien_FBShop", "NhanVien");
    toast.success("Đã xuất danh sách nhân viên ra Excel!");
  };

  // Phan trang: sau khi sua/xoa van giu trang hien tai, tu lui ve trang cuoi neu het dong
  const pageCount = Math.max(1, Math.ceil(employees.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = employees.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-[#f66315]" />
            QUẢN LÝ DANH SÁCH NHÂN VIÊN
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-xl bg-[#f66315] px-4 py-2 text-xs font-bold text-white shadow-md shadow-orange-900/20 hover:bg-[#e55000] transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            Thêm nhân viên mới
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchEmployees();
          }}
          className="flex gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo họ tên, số điện thoại, email, mã nhân viên..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-[#f66315]"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-black"
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-700 uppercase">
              <tr>
                <th className="px-4 py-3">Mã NV</th>
                <th className="px-4 py-3">Họ Tên</th>
                <th className="px-4 py-3">Số Điện Thoại</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 text-right">Lương Cơ Bản</th>
                <th className="px-4 py-3 text-right">Phụ Cấp</th>
                <th className="px-4 py-3">Tài Khoản Liên Kết</th>
                <th className="px-4 py-3 text-center">Trạng Thái</th>
                <th className="px-4 py-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    Đang tải danh sách nhân sự...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    {searchedKeyword
                      ? `Không tìm thấy nhân viên phù hợp với "${searchedKeyword}"`
                      : "Hiện chưa có nhân viên nào trong danh sách"}
                  </td>
                </tr>
              ) : (
                pagedRows.map((emp) => {
                  const isRetired = emp.TrangThai === "Da nghi viec";

                  return (
                    <tr key={emp.MaNV} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{emp.MaNV}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">{emp.HoTen}</p>
                        {emp.DiaChi && <p className="text-[10px] text-slate-400">{emp.DiaChi}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800 flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {emp.SoDienThoai}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {emp.Email ? (
                          <span className="flex items-center gap-1 text-[11px] text-blue-600">
                            <Mail className="h-3 w-3 text-slate-400" />
                            {emp.Email}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {Number(emp.LuongCoBan).toLocaleString("vi-VN")} đ
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {Number(emp.PhuCap).toLocaleString("vi-VN")} đ
                      </td>
                      <td className="px-4 py-3">
                        {emp.TaiKhoans && emp.TaiKhoans.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {emp.TaiKhoans.map((tk, idx) => {
                              const locked = tk.TrangThai === "Khoa" || tk.TrangThai === "Locked";
                              return (
                                <span
                                  key={idx}
                                  title={tk.TenDangNhap}
                                  className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${
                                    locked
                                      ? "border-slate-300 bg-slate-100 text-slate-500"
                                      : "border-orange-200 bg-orange-50 text-orange-700"
                                  }`}
                                >
                                  {locked && <Lock className="h-2.5 w-2.5" />}
                                  {ROLE_LABELS[normalizeRole(tk.PhanQuyen) || ""] || tk.PhanQuyen}
                                  {locked && " · đã khóa"}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Chưa cấp tài khoản</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isRetired
                              ? "bg-red-50 text-red-600 border border-red-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {isRetired ? "Đã nghỉ việc" : "Đang làm việc"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                            title="Sửa thông tin"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(emp.MaNV, emp.HoTen)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Xóa hoặc chuyển Đã nghỉ việc"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && (
          <Pagination page={currentPage} pageSize={PAGE_SIZE} total={employees.length} unit="nhân viên" onChange={setPage} />
        )}
      </div>

      {/* Modal Thêm / Sửa Nhân Viên (Đặc tả Bước 6) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingEmp ? `SỬA NHÂN VIÊN: ${editingEmp.MaNV}` : "THÊM NHÂN VIÊN MỚI"}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {formGeneralError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formGeneralError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Mã NV <span className="font-normal text-slate-400">(hệ thống tự cấp)</span>
                  </label>
                  {/* Ma NV do server sinh (so lon nhat hien co + 1), khong cho sua tay */}
                  <input
                    type="text"
                    readOnly
                    value={formData.maNV}
                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 p-2.5 font-mono font-bold text-slate-700 outline-none"
                  />
                </div>
                {editingEmp ? (
                  <div>
                    <label className="mb-1 block font-bold text-slate-700">Trạng thái làm việc</label>
                    <select
                      value={formData.trangThai}
                      onChange={(e) => setFormData({ ...formData, trangThai: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#f66315]"
                    >
                      <option value="Active">Đang làm việc</option>
                      <option value="Da nghi viec">Đã nghỉ việc (khóa tài khoản)</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="mb-1 block font-bold text-slate-700">Trạng thái làm việc</label>
                    <p className="flex h-[38px] items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 font-semibold text-emerald-700">
                      Đang làm việc
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Họ và tên *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Trần Văn C"
                  value={formData.hoTen}
                  onChange={(e) => {
                    setFormData({ ...formData, hoTen: e.target.value });
                    setFormGeneralError("");
                  }}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#f66315]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Số điện thoại */}
                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Số điện thoại * <span className="text-[10px] text-slate-400">(10 số, đầu 0)</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ví dụ: 0901234567"
                    value={formData.soDienThoai}
                    onChange={(e) => {
                      setFormData({ ...formData, soDienThoai: e.target.value });
                      setPhoneError("");
                      setFormGeneralError("");
                    }}
                    className={`w-full rounded-xl border p-2.5 outline-none transition-all ${
                      phoneError
                        ? "border-red-500 bg-red-50/50 text-red-600 focus:ring-1 focus:ring-red-500"
                        : "border-slate-200 focus:border-[#f66315]"
                    }`}
                  />
                  {phoneError && (
                    <p className="mt-1 text-[11px] font-semibold text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {phoneError}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Email <span className="text-[10px] text-slate-400">(Định dạng email chuẩn)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="nhanvien@fbshop.vn"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      setEmailError("");
                      setFormGeneralError("");
                    }}
                    className={`w-full rounded-xl border p-2.5 outline-none transition-all ${
                      emailError
                        ? "border-red-500 bg-red-50/50 text-red-600 focus:ring-1 focus:ring-red-500"
                        : "border-slate-200 focus:border-[#f66315]"
                    }`}
                  />
                  {emailError && (
                    <p className="mt-1 text-[11px] font-semibold text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {emailError}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Địa chỉ</label>
                <input
                  type="text"
                  placeholder="277 Nguyễn Trãi, Thanh Xuân, Hà Nội"
                  value={formData.diaChi}
                  onChange={(e) => setFormData({ ...formData, diaChi: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#f66315]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Lương cơ bản (VNĐ)</label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={formData.luongCoBan}
                    onChange={(e) =>
                      setFormData({ ...formData, luongCoBan: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#f66315]"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Phụ cấp (VNĐ)</label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={formData.phuCap}
                    onChange={(e) =>
                      setFormData({ ...formData, phuCap: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#f66315]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#f66315] px-5 py-2 font-bold text-white hover:bg-[#e55000] shadow-md shadow-orange-900/20"
                >
                  Lưu nhân viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
