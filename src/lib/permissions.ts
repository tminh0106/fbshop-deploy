// =======================================================
// MA TRAN PHAN QUYEN (RBAC) - NGUON DUY NHAT CHO TOAN HE THONG
// Dung chung cho: proxy (chan trang), API route (chan du lieu), sidebar (an menu)
// Khong import thu vien server o day de dung duoc ca phia client
//
// Can cu tai lieu dac ta (Chuong 3):
// - FR-03 / NFR-03 / Tu dien du lieu TaiKhoan.PhanQuyen: 3 vai tro Admin, NhanVienKho, BanHang
// - Tac nhan "Nguoi quan ly" / "Quan tri vien he thong" = Admin
// - Tac nhan "Nhan vien" = nhan vien kho + nhan vien ban hang (muc 1.3), chia theo bo phan
// =======================================================

export const ROLES = {
  ADMIN: "Admin",
  KHO: "NhanVienKho",
  BAN_HANG: "BanHang",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

const { ADMIN, KHO, BAN_HANG } = ROLES;
const STAFF: Role[] = [ADMIN, KHO, BAN_HANG];

// Ten vai tro cu trong CSDL (truoc khi chuan hoa theo FR-03) -> ten moi.
// Giu de token/may chua cap nhat van hoat dong dung.
const LEGACY_ROLES: Record<string, Role> = {
  QuanLyKho: KHO,
  NhanVien: BAN_HANG,
};

export function normalizeRole(role: string | undefined | null): string | null {
  if (!role) return null;
  return LEGACY_ROLES[role] ?? role;
}

// Chi 3 vai tro noi bo duoc vao cong quan tri (KhachHang thi khong)
export function isStaffRole(role: string | undefined | null): boolean {
  const r = normalizeRole(role);
  return !!r && (STAFF as string[]).includes(r);
}

// Chuc nang -> vai tro duoc phep (doi chieu bang dac ta Use Case)
export const FEATURE_ROLES = {
  // Dang nhap, dang xuat, doi mat khau (Bang 3.51), trang tong quan: ca 3 vai tro
  dashboard: STAFF,
  // Bang 3.1-3.3 Quan ly khach hang - Tac nhan: Nhan vien / Nguoi quan ly
  khachHang: [ADMIN, BAN_HANG],
  // Bang 3.8-3.11 Quan ly don hang - Tac nhan: Nhan vien / Nguoi quan ly (FR-11: Quan tri vien/Nhan vien)
  donHang: [ADMIN, BAN_HANG],
  // Bang 3.4-3.7 Quan ly san pham - Tac nhan: Nhan vien / Nguoi quan ly (FR-10)
  sanPham: [ADMIN, KHO, BAN_HANG],
  // Bang 3.12-3.15 Hang hoa kho (Nhan vien / Nguoi quan ly) + Bang 3.16-3.21 Hoa don kho (Nhan vien) - bo phan kho
  kho: [ADMIN, KHO],
  // Bang 3.22-3.25 Quan ly nha cung cap - Tac nhan: Nguoi quan ly (FR-21)
  nhaCungCap: [ADMIN],
  // Chi doc danh sach NCC de chon khi lap phieu nhap (tien dieu kien Bang 3.16)
  nhaCungCapLookup: [ADMIN, KHO],
  // Bang 3.26-3.29 Quan ly voucher - Tac nhan: Nguoi quan ly (FR-22..25)
  voucher: [ADMIN],
  // Bang 3.30-3.33 Quan ly nhan vien - Tac nhan: Quan ly (FR-26..29)
  nhanVien: [ADMIN],
  // Bang 3.48-3.50 Quan ly tai khoan - Tac nhan: Quan tri vien he thong (FR-03)
  taiKhoan: [ADMIN],
  // Bang 3.34-3.37 Bao cao - Tac nhan: Quan ly (FR-30..34)
  thongKe: [ADMIN],
} satisfies Record<string, Role[]>;

export type Feature = keyof typeof FEATURE_ROLES;

// Trang quan tri -> chuc nang (so khop theo tien to, tu dai den ngan)
export const PAGE_FEATURES: [prefix: string, feature: Feature][] = [
  ["/admin/don-hang", "donHang"],
  ["/admin/khach-hang", "khachHang"],
  ["/admin/san-pham", "sanPham"],
  ["/admin/nha-cung-cap", "nhaCungCap"],
  ["/admin/hoa-don-kho", "kho"],
  ["/admin/hang-hoa-kho", "kho"],
  ["/admin/voucher", "voucher"],
  ["/admin/nhan-vien", "nhanVien"],
  ["/admin/tai-khoan", "taiKhoan"],
  ["/admin/thong-ke", "thongKe"],
  ["/admin", "dashboard"],
];

export function hasFeature(role: string | undefined | null, feature: Feature): boolean {
  const r = normalizeRole(role);
  return !!r && (FEATURE_ROLES[feature] as readonly string[]).includes(r);
}

export function featureForPath(pathname: string): Feature | null {
  const match = PAGE_FEATURES.find(
    ([prefix]) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
  return match ? match[1] : null;
}

export function canAccessPath(role: string | undefined | null, pathname: string): boolean {
  const feature = featureForPath(pathname);
  return feature ? hasFeature(role, feature) : false;
}

export const ROLE_LABELS: Record<string, string> = {
  [ADMIN]: "Quản lý (Admin)",
  [KHO]: "Nhân viên kho",
  [BAN_HANG]: "Nhân viên bán hàng",
};

// Lua chon vai tro khi tao/sua tai khoan (FR-03)
export const ROLE_OPTIONS: { value: Role; label: string; desc: string }[] = [
  { value: ADMIN, label: "Admin", desc: "Quản lý: toàn quyền, NCC, voucher, nhân sự, tài khoản, báo cáo" },
  { value: KHO, label: "NhanVienKho", desc: "Nhân viên kho: sản phẩm, hàng hóa kho, hóa đơn nhập/xuất/hủy" },
  { value: BAN_HANG, label: "BanHang", desc: "Nhân viên bán hàng: đơn hàng, khách hàng, sản phẩm" },
];
