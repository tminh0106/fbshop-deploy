// =======================================================
// NGHIEP VU KHO - dung chung cho API va giao dien (khong import CSDL o day)
// Mau phieu theo che do ke toan doanh nghiep (Mau 01-VT Phieu nhap kho / 02-VT Phieu xuat kho)
// =======================================================

export const SHOP_INFO = {
  name: "CỬA HÀNG CẦU LÔNG FBSHOP",
  address: "277 Đ. Nguyễn Trãi, Thanh Xuân, Hà Nội",
  phone: "0123.456.789",
  email: "contact@fbshop.vn",
};

export const WAREHOUSES = [
  { value: "KHO_CHINH", label: "Kho chính FBShop" },
  { value: "KHO_TRUNG_BAY", label: "Kho trưng bày cửa hàng" },
] as const;
export const warehouseLabel = (v: string | null | undefined) =>
  WAREHOUSES.find((w) => w.value === v)?.label || v || "Kho chính FBShop";

export const NGHIEP_VU_NHAP = "Nhập mua hàng";
export const XUAT_TRA_NCC = "Xuất trả nhà cung cấp";
export const NGHIEP_VU_XUAT = [
  XUAT_TRA_NCC,
  "Xuất hủy hàng lỗi/hỏng",
  "Xuất bảo hành",
  "Xuất sử dụng nội bộ",
  "Xuất điều chuyển kho",
  "Xuất khác",
] as const;

export const INVOICE_CANCELLED = "Da huy";
export const isInvoiceCancelled = (s: string) => s === INVOICE_CANCELLED || s === "Cancelled";

// Ma phieu theo ngay: PN-20261001-001 (phieu nhap) / PX-20261001-001 (phieu xuat)
export const invoicePrefix = (loai: "NHAP" | "XUAT", dateCode: string) => `${loai === "NHAP" ? "PN" : "PX"}-${dateCode}-`;

// Cong no cua 1 phieu nhap = tong tien - da thanh toan (phieu huy khong tinh)
export function invoiceDebt(inv: { LoaiPhieu: string; TrangThai: string; TongTien: unknown; DaThanhToan: unknown }) {
  if (inv.LoaiPhieu !== "NHAP" || isInvoiceCancelled(inv.TrangThai)) return 0;
  return Math.max(0, Number(inv.TongTien) - Number(inv.DaThanhToan));
}

// ---------- Doc so tien bang chu (tieng Viet) ----------
const DIGITS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
const UNITS = ["", " nghìn", " triệu", " tỷ", " nghìn tỷ", " triệu tỷ"];

function readTriple(n: number, full: boolean): string {
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const u = n % 10;
  const parts: string[] = [];
  if (full || h > 0) parts.push(`${DIGITS[h]} trăm`);
  if (t > 1) {
    parts.push(`${DIGITS[t]} mươi`);
    if (u === 1) parts.push("mốt");
    else if (u === 4) parts.push("tư");
    else if (u === 5) parts.push("lăm");
    else if (u > 0) parts.push(DIGITS[u]);
  } else if (t === 1) {
    parts.push("mười");
    if (u === 5) parts.push("lăm");
    else if (u > 0) parts.push(DIGITS[u]);
  } else if (u > 0) {
    if (full || h > 0) parts.push("lẻ");
    parts.push(DIGITS[u]);
  }
  return parts.join(" ");
}

export function numberToVietnameseWords(value: number): string {
  let n = Math.round(Math.abs(value));
  if (n === 0) return "Không đồng";
  const groups: number[] = [];
  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }
  const words: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] === 0) continue;
    words.push(readTriple(groups[i], i < groups.length - 1) + UNITS[i]);
  }
  const text = words.join(" ").replace(/\s+/g, " ").trim();
  return `${text.charAt(0).toUpperCase()}${text.slice(1)} đồng`;
}
