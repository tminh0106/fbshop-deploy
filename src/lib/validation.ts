// =======================================================
// KIEM TRA DU LIEU DUNG CHUNG CHO CAC MUC QUAN TRI
// (khach hang, nha cung cap, don hang, hang hoa kho, hoa don kho)
// =======================================================

// SDT: dung 10 chu so, bat dau bang 0
export const PHONE_REGEX = /^0\d{9}$/;
export const EMAIL_REGEX = /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
// Ma so thue doanh nghiep: 10 so, hoac 10 so + "-" + 3 so (chi nhanh)
export const TAX_CODE_REGEX = /^\d{10}(-\d{3})?$/;

export const PHONE_ERROR = "Số điện thoại không đúng định dạng (phải gồm đúng 10 chữ số và bắt đầu bằng số 0)";
export const EMAIL_ERROR = "Email không đúng định dạng (ví dụ hợp lệ: lienhe@fbshop.vn)";
export const TAX_CODE_ERROR = "Mã số thuế không hợp lệ (10 chữ số, hoặc 10 chữ số kèm -XXX)";

// Tu khoa tim kiem: chan ky tu dac biet (Bang 3.3 / 3.10 / 3.15 / 3.25 - A2)
const SEARCH_FORBIDDEN = /[<>{}[\]\\;'"`=%$^*|~]/;
export const SEARCH_ERROR = "Từ khóa tìm kiếm không hợp lệ";
export const MAX_KEYWORD = 100;

export function checkKeyword(keyword: string | null | undefined): string | null {
  if (!keyword) return null;
  if (keyword.length > MAX_KEYWORD || SEARCH_FORBIDDEN.test(keyword)) return SEARCH_ERROR;
  return null;
}

// Chuoi bat buoc / tuy chon co gioi han do dai (khop do dai cot CSDL)
export function requiredText(value: unknown, label: string, max: number): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== "string" || !value.trim()) return { ok: false, error: `Vui lòng nhập ${label}` };
  if (value.trim().length > max) return { ok: false, error: `${capitalize(label)} tối đa ${max} ký tự` };
  return { ok: true, value: value.trim() };
}

export function optionalText(value: unknown, label: string, max: number): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value === undefined || value === null) return { ok: true, value: null };
  const s = String(value).trim();
  if (s.length > max) return { ok: false, error: `${capitalize(label)} tối đa ${max} ký tự` };
  return { ok: true, value: s || null };
}

// So nguyen trong khoang [min, max] (so luong, don gia...)
export function parseIntInRange(value: unknown, min: number, max: number): number | null {
  const n = typeof value === "string" ? Number(value.trim()) : Number(value);
  if (value === "" || value === null || value === undefined || !Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

// Ma tiep theo = so lon nhat hien co + 1 (vd NCC001 -> NCC004); khong trung du da xoa ban ghi o giua
export function nextCode(prefix: string, existing: string[], pad = 3): string {
  const re = new RegExp(`^${prefix}(\\d+)$`, "i");
  const max = existing.reduce((m, code) => {
    const hit = re.exec(code);
    return hit ? Math.max(m, parseInt(hit[1], 10)) : m;
  }, 0);
  return `${prefix}${String(max + 1).padStart(pad, "0")}`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
