// =======================================================
// TRANG THAI DON HANG - nguon duy nhat cho API va giao dien
// Quy trinh (FR-11, Bang 3.8): Cho xac nhan -> Dang xu ly -> Dang giao -> Da giao
// Don thanh toan QR bat dau o "Cho thanh toan". Da giao / Da huy la trang thai cuoi.
// =======================================================

export const ORDER_STATUS = {
  WAITING_PAYMENT: "Cho thanh toan",
  PENDING: "Cho xac nhan",
  PROCESSING: "Dang xu ly",
  SHIPPING: "Dang giao",
  DONE: "Da giao",
  CANCELLED: "Da huy",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  [ORDER_STATUS.WAITING_PAYMENT]: "Chờ thanh toán",
  [ORDER_STATUS.PENDING]: "Chờ xác nhận",
  [ORDER_STATUS.PROCESSING]: "Đang xử lý",
  [ORDER_STATUS.SHIPPING]: "Đang giao",
  [ORDER_STATUS.DONE]: "Đã giao",
  [ORDER_STATUS.CANCELLED]: "Đã hủy",
};

// Chuyen trang thai hop le (A1: sai quy trinh -> "Luong chuyen trang thai khong hop le")
export const ORDER_TRANSITIONS: Record<string, OrderStatus[]> = {
  [ORDER_STATUS.WAITING_PAYMENT]: [ORDER_STATUS.PENDING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPING]: [ORDER_STATUS.DONE],
  [ORDER_STATUS.DONE]: [],
  [ORDER_STATUS.CANCELLED]: [],
};

// Bang 3.9 A2: khong xoa don dang giao / da giao
export const ORDER_UNDELETABLE: string[] = [ORDER_STATUS.SHIPPING, ORDER_STATUS.DONE];

export const orderStatusLabel = (s: string) => ORDER_STATUS_LABELS[s] || s;

// =======================================================
// TRANG THAI THANH TOAN - tach rieng khoi trang thai xu ly don (Bang 3.48)
// - COD: Chua thanh toan -> Da thanh toan khi giao thanh cong (shipper thu tien)
// - Chuyen khoan VietQR: Chua thanh toan -> Da thanh toan khi nhan vien doi soat va xac nhan nhan tien
// - Huy don da thanh toan -> Cho hoan tien -> Da hoan tien
// =======================================================

export const PAYMENT_STATUS = {
  UNPAID: "Chua thanh toan",
  PAID: "Da thanh toan",
  REFUND_PENDING: "Cho hoan tien",
  REFUNDED: "Da hoan tien",
} as const;

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  [PAYMENT_STATUS.UNPAID]: "Chưa thanh toán",
  [PAYMENT_STATUS.PAID]: "Đã thanh toán",
  [PAYMENT_STATUS.REFUND_PENDING]: "Chờ hoàn tiền",
  [PAYMENT_STATUS.REFUNDED]: "Đã hoàn tiền",
};

export const paymentStatusLabel = (s: string | null | undefined) => (s && PAYMENT_STATUS_LABELS[s]) || "Chưa thanh toán";

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: "Thanh toán khi nhận hàng (COD)",
  BANKING: "Chuyển khoản / ví điện tử (VietQR)",
};
export const paymentMethodLabel = (m: string) => PAYMENT_METHOD_LABELS[m] || m;

// Khach duoc tu huy don khi shop chua xu ly va chua tra tien
export const canCustomerCancel = (o: { TrangThai: string; TrangThaiThanhToan: string; NgayBaoChuyenKhoan?: Date | string | null }) =>
  o.TrangThaiThanhToan === PAYMENT_STATUS.UNPAID &&
  ((o.TrangThai === ORDER_STATUS.WAITING_PAYMENT && !o.NgayBaoChuyenKhoan) || o.TrangThai === ORDER_STATUS.PENDING);
