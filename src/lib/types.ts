// ===================================================
// Type definitions cho he thong FBSHOP
// Map 1:1 voi Prisma schema
// ===================================================

// ---- San Pham & Danh Muc ----
export interface ProductItem {
  id: string;         // MaSP
  name: string;       // TenSP
  slug: string;       // auto-generated
  price: number;      // GiaBan
  originalPrice?: number;
  imageUrl: string;   // HinhAnh
  isBestSeller?: boolean;
  discountPercent?: number;
  weight?: string;    // TrongLuong (3U, 4U...)
  description?: string;
  categoryId?: string;
  stock?: number;     // SoLuong
}

export interface Category {
  id: string;         // MaDanhMuc
  name: string;       // TenDanhMuc
  slug: string;
  productCount?: number;
}

// ---- Khach Hang ----
export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface AuthCustomer {
  maKH: string;
  hoTen: string;
  soDienThoai: string;
  email?: string | null;
  diaChi?: string | null;
}

// ---- Gio hang (Cart) ----
export interface CartItem {
  productId: string;      // MaSP
  name: string;           // TenSP
  price: number;          // GiaBan
  quantity: number;
  maxStock: number;       // SoLuong ton kho
  imageUrl: string;
  weight?: string;        // TrongLuong
  note?: string;          // Ghi chu cang cuoc
}

// ---- Don Hang & Checkout ----
export type OrderStatus =
  | "Cho xac nhan"
  | "Da xac nhan"
  | "Dang giao"
  | "Da giao"
  | "Da huy"
  | "Cho thanh toan";

export interface Order {
  id: string;
  createdAt: Date;
  status: OrderStatus;
  totalAmount: number;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  paymentMethod: string;
  note?: string;
  customerId: string;
  voucherId?: string;
  items: OrderItem[];
}

export interface OrderItem {
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CheckoutForm {
  tenNguoiNhan: string;
  sdtNguoiNhan: string;
  diaChiNhan: string;
  phuongThucThanhToan: "COD" | "BANKING";
  ghiChu?: string;
  maVoucher?: string;
  items: {
    maSP: string;
    soLuong: number;
    donGia: number;
  }[];
}

// ---- Kho ----
export type WarehouseInvoiceType = "Nhap kho" | "Xuat kho";
export type WarehouseInvoiceStatus = "Hoan thanh" | "Da huy";

export interface WarehouseInvoice {
  id: string;
  createdAt: Date;
  type: WarehouseInvoiceType;
  reason?: string;
  totalAmount: number;
  status: WarehouseInvoiceStatus;
  employeeId: string;
  supplierId?: string;
  items: WarehouseInvoiceItem[];
}

export interface WarehouseInvoiceItem {
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

// ---- Nha Cung Cap ----
export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address?: string;
  email?: string;
  taxCode?: string;
  representative?: string;
  note?: string;
  status: string;
}

// ---- Voucher ----
export type VoucherType = "TIEN" | "PHANTRAM";

export interface VoucherData {
  code: string;
  discountType: VoucherType;
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number;
  totalQuantity: number;
  usageLimit: number;
  startDate: Date;
  endDate: Date;
  status: string;
}

// ---- Nhan Vien & Tai Khoan ----
export type UserRole = "Admin" | "NhanVienKho" | "BanHang" | "KhachHang";

export interface Employee {
  id: string;
  fullName: string;
  phone: string;
  address?: string;
  baseSalary: number;
  allowance: number;
  status: string;
}

export interface Account {
  id: string;
  username: string;
  role: UserRole;
  status: string;
  employeeId?: string;
}