"use client";

import { useState, useEffect } from "react";
import {
  Warehouse,
  Search,
  Filter,
  Download,
  AlertTriangle,
  PackageCheck,
  Edit2,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { exportToExcel } from "@/lib/exportExcel";

interface HangHoaKhoItem {
  MaHangHoa: string;
  ViTriKho: string | null;
  SoLuong: number;
  DonGiaNhap: number;
  NgayNhap: string;
  HanSuDung: string | null;
  GhiChu: string | null;
  MaSP: string;
  SanPham: {
    MaSP: string;
    TenSP: string;
    SoLuong: number;
    DanhMuc: { TenDanhMuc: string } | null;
  };
}

export default function HangHoaKhoPage() {
  const [items, setItems] = useState<HangHoaKhoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [editingItem, setEditingItem] = useState<{
    id: string;
    viTriKho: string;
    soLuong: number;
  } | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.append("keyword", keyword);

      const res = await fetch(`/api/admin/hang-hoa-kho?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setItems(json.data || []);
      } else {
        toast.error("Không thể tải dữ liệu kho");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleUpdate = async (maHangHoa: string) => {
    if (!editingItem) return;
    try {
      const res = await fetch("/api/admin/hang-hoa-kho", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maHangHoa,
          viTriKho: editingItem.viTriKho,
          soLuong: editingItem.soLuong,
        }),
      });
      if (res.ok) {
        toast.success("Cập nhật vị trí kệ và số lượng thành công");
        setEditingItem(null);
        fetchItems();
      } else {
        toast.error("Cập nhật thất bại");
      }
    } catch {
      toast.error("Lỗi kết nối");
    }
  };

  const handleExportExcel = () => {
    const dataToExport = items.map((item) => ({
      "Mã hàng": item.MaHangHoa,
      "Mã SP": item.MaSP,
      "Tên sản phẩm": item.SanPham?.TenSP || "",
      "Danh mục": item.SanPham?.DanhMuc?.TenDanhMuc || "",
      "Vị trí kho": item.ViTriKho || "KHO_CHINH",
      "Số lượng thực tế": item.SoLuong,
      "Tổng tồn SanPham": item.SanPham?.SoLuong || 0,
      "Đơn giá nhập": Number(item.DonGiaNhap),
      "Ngày nhập": new Date(item.NgayNhap).toLocaleDateString("vi-VN"),
      "Ghi chú": item.GhiChu || "",
    }));

    exportToExcel(dataToExport, "HangHoaTonKho_FBShop", "TonKho");
    toast.success("Đã xuất danh sách Hàng hóa kho ra Excel!");
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Warehouse className="h-6 w-6 text-[#f66315]" />
            QUẢN LÝ HÀNG HÓA TỒN KHO CHI TIẾT
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Theo dõi vị trí kệ kho, số lượng thực tế của từng lô hàng nhập
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all self-start"
        >
          <Download className="h-4 w-4 text-gray-500" />
          Xuất file Excel
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchItems();
          }}
          className="flex gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo mã hàng hóa, mã SP, tên sản phẩm..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-[#f66315]"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-[#f66315] px-4 py-2 text-xs font-bold text-white hover:bg-[#e55000]"
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50/80 font-bold text-gray-700 uppercase">
              <tr>
                <th className="px-4 py-3">Mã Lô Hàng</th>
                <th className="px-4 py-3">Sản Phẩm</th>
                <th className="px-4 py-3">Danh Mục</th>
                <th className="px-4 py-3">Vị Trí Kệ Kho</th>
                <th className="px-4 py-3 text-center">SL Thực Tế</th>
                <th className="px-4 py-3 text-center">Tồn SP Tổng</th>
                <th className="px-4 py-3 text-right">Đơn Giá Nhập</th>
                <th className="px-4 py-3">Ngày Nhập</th>
                <th className="px-4 py-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400 font-medium">
                    Đang tải dữ liệu hàng hóa kho...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400 font-medium">
                    Chưa có lô hàng hóa nào trong kho
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isEditing = editingItem?.id === item.MaHangHoa;
                  const isLow = item.SoLuong <= 5;

                  return (
                    <tr key={item.MaHangHoa} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-gray-900">
                        {item.MaHangHoa.slice(0, 12)}...
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-800">{item.SanPham?.TenSP}</p>
                        <span className="text-[10px] text-gray-400">{item.MaSP}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.SanPham?.DanhMuc?.TenDanhMuc || "Chưa gán"}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingItem.viTriKho}
                            onChange={(e) =>
                              setEditingItem({ ...editingItem, viTriKho: e.target.value })
                            }
                            className="w-24 rounded-md border border-orange-400 p-1 text-xs outline-none"
                          />
                        ) : (
                          <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-[11px] text-gray-700">
                            {item.ViTriKho || "KHO_CHINH"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-bold">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editingItem.soLuong}
                            onChange={(e) =>
                              setEditingItem({
                                ...editingItem,
                                soLuong: Number(e.target.value),
                              })
                            }
                            className="w-16 rounded-md border border-orange-400 p-1 text-xs text-center outline-none"
                          />
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isLow
                                ? "bg-red-50 text-red-600 border border-red-200"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {isLow && <AlertTriangle className="h-3 w-3 text-red-500" />}
                            {item.SoLuong}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-gray-700">
                        {item.SanPham?.SoLuong || 0}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {Number(item.DonGiaNhap).toLocaleString("vi-VN")} đ
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(item.NgayNhap).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <button
                            onClick={() => handleUpdate(item.MaHangHoa)}
                            className="rounded-lg bg-emerald-600 p-1.5 text-white hover:bg-emerald-700"
                            title="Lưu"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setEditingItem({
                                id: item.MaHangHoa,
                                viTriKho: item.ViTriKho || "KHO_CHINH",
                                soLuong: item.SoLuong,
                              })
                            }
                            className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100"
                            title="Sửa vị trí/số lượng"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
