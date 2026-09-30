"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import toast from "react-hot-toast";

// Bang 3.51 Doi mat khau: nguoi dung tu doi mat khau sau khi xac thuc mat khau hien tai
export default function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [matKhauCu, setMatKhauCu] = useState("");
  const [matKhauMoi, setMatKhauMoi] = useState("");
  const [xacNhan, setXacNhan] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (matKhauMoi.length < 6) return setError("Mật khẩu mới phải có ít nhất 6 ký tự");
    if (matKhauMoi !== xacNhan) return setError("Xác nhận mật khẩu mới không khớp");

    setSaving(true);
    try {
      const res = await fetch("/api/admin/auth/doi-mat-khau", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matKhauCu, matKhauMoi }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể đổi mật khẩu");
        return;
      }
      toast.success("Đổi mật khẩu thành công");
      onClose();
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition-all focus:border-[#f66315] focus:ring-4 focus:ring-orange-100";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-50 text-[#f66315]">
          <KeyRound className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-900">Đổi mật khẩu</h3>

        <div className="mt-5 space-y-3">
          <input
            type="password"
            placeholder="Mật khẩu hiện tại"
            autoComplete="current-password"
            value={matKhauCu}
            onChange={(e) => setMatKhauCu(e.target.value)}
            className={inputClass}
            required
          />
          <input
            type="password"
            placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
            autoComplete="new-password"
            value={matKhauMoi}
            onChange={(e) => setMatKhauMoi(e.target.value)}
            className={inputClass}
            required
          />
          <input
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            autoComplete="new-password"
            value={xacNhan}
            onChange={(e) => setXacNhan(e.target.value)}
            className={inputClass}
            required
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 flex-1 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-10 flex-1 rounded-lg bg-[#f66315] text-sm font-semibold text-white transition-colors hover:bg-[#d4520f] disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Lưu mật khẩu"}
          </button>
        </div>
      </form>
    </div>
  );
}
