# HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY HỆ THỐNG FBSHOP
> **Đồ án tốt nghiệp / Chuyên ngành Công nghệ Thông tin**  
> **Đề tài:** Xây dựng Hệ thống Bán hàng & Quản trị Vận hành Kho Thiết bị Cầu lông FBSHOP  
> **Cơ sở đối chiếu:** Báo cáo Đồ án FBShop (Giảng viên hướng dẫn: Cô Chi)

---

## 1. YÊU CẦU MÔI TRƯỜNG HỆ THỐNG
Để chạy ứng dụng một cách tối ưu và không gặp lỗi, máy tính cần cài đặt:
- **Node.js:** Phiên bản `>= 18.17.0` (Khuyến nghị Node.js 20.x LTS).
- **Trình quản lý gói:** `npm` (đi kèm Node.js) hoặc `yarn` / `pnpm`.
- **Hệ quản trị CSDL:** **Microsoft SQL Server** (bản Developer hoặc Express 2017/2019/2022) chạy trên cổng mặc định `1433`.
- **Trình duyệt web:** Google Chrome, Microsoft Edge hoặc Firefox phiên bản mới nhất.

---

## 2. CẤU HÌNH BIẾN MÔI TRƯỜNG (.env)
Tạo file `.env` tại thư mục gốc của dự án (`fbshop-web/.env`) với cấu hình chuỗi kết nối SQL Server:

```env
# Chuỗi kết nối tới Microsoft SQL Server
DATABASE_URL="sqlserver://localhost:1433;database=FBSHOP_DB;user=sa;password=YourPassword123;trustServerCertificate=true"

# Khóa bí mật ký xác thực JWT Token
JWT_SECRET="fbshop_super_secret_jwt_key_2026_khoa_luan"

# Cấu hình môi trường chạy
NODE_ENV="development"
PORT=3000
```

> **Lưu ý:** Thay thế `user=sa` và `password=YourPassword123` theo đúng tài khoản SQL Server trên máy bạn.

---

## 3. CÁC BƯỚC KHỞI CHẠY DỰ ÁN (1-CLICK RUN)

Mở terminal (PowerShell, Command Prompt hoặc Terminal trong VS Code) tại thư mục `fbshop-web`:

### Bước 3.1: Cài đặt các thư viện phụ thuộc
```bash
npm install
```

### Bước 3.2: Đồng bộ cấu trúc CSDL (Prisma ORM)
```bash
# Đẩy schema 12 bảng vào SQL Server
npx prisma db push

# (Tùy chọn) Seed dữ liệu mẫu nếu DB đang trống
npx prisma db seed
```

### Bước 3.3: Khởi chạy Server phát triển (Localhost)
```bash
npm run dev
```
Sau khi server báo sẵn sàng, truy cập vào trình duyệt:
- **Trang Khách hàng (Storefront):** [http://localhost:3000](http://localhost:3000)
- **Trang Quản trị & Kho (Admin/Staff):** [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 4. BẢNG TÀI KHOẢN TRẢI NGHIỆM DEMO (DÀNH CHO HỘI ĐỒNG / GIÁO VIÊN)

Hệ thống đã chuẩn bị sẵn 4 tài khoản phân quyền chuẩn xác theo Chương 3 & 4 Báo cáo:

| Phân hệ / Vai trò | Tên đăng nhập / Identifier | Email dự phòng | Mật khẩu | Phạm vi quyền hạn theo thiết kế |
| :--- | :--- | :--- | :---: | :--- |
| **Admin Quản trị** | `admin` | `admin@fbshop.vn` | `123456` | Toàn quyền hệ thống: Xem doanh thu, quản lý nhân viên, duyệt đơn, cấu hình |
| **Thủ kho (Kho bãi)** | `quanlykho` | `kho@fbshop.vn` | `123456` | Quản lý kho: Lập phiếu nhập (+tồn), lập phiếu xuất (-tồn), hủy phiếu theo BR-01 |
| **Nhân viên Bán hàng** | `nhanvien` | `banhang@fbshop.vn` | `123456` | Xử lý đơn hàng: Tiếp nhận đơn mới, chuyển trạng thái giao hàng, xem thống kê cơ bản |
| **Khách hàng Mẫu** | `0912345678` | `khach@gmail.com` | `123456` | Khách mua hàng: Duyệt sản phẩm, đặt hàng COD/VNPAY, áp mã voucher, theo dõi đơn |

---

## 5. LỆNH CHẠY KIỂM THỬ TỰ ĐỘNG (AUTOMATED TESTS)

Hệ thống cung cấp sẵn các bộ script kiểm thử tự động trực tiếp trên API và CSDL thật:

### 5.1. Kiểm thử 27 Test Cases chuẩn theo Chương 4 Báo cáo (100% PASS)
```bash
npm test
# Hoặc: npx tsx scripts/run_all_tests.ts
```
*Kiểm tra toàn diện 10 ca Đăng nhập & Bảo vệ URL (TC-LOGIN-01 -> 10), 10 ca Tìm kiếm & Sản phẩm (TC-PROD-01 -> 10), 7 ca Nghiệp vụ Kho & Quy tắc BR-01 (TC-KHO-01 -> 07).*

### 5.2. Kiểm thử luồng tích hợp khép kín E2E (End-to-End Integration)
```bash
npm run test:e2e
# Hoặc: npx tsx scripts/test_e2e_flow.ts
```
*Kiểm tra luồng khép kín 5 bước: Khách xem sản phẩm -> Đặt 2 cây vợt + Áp voucher FBSHOP50K -> Tồn kho trừ ngay lập tức -> Admin chuyển trạng thái tuần tự -> Doanh thu cộng dồn chuẩn xác.*

### 5.3. Kiểm tra đóng gói Production Build
```bash
npm run build
```

---

## 6. SƠ ĐỒ ĐIỀU HƯỚNG CÁC TRANG CHÍNH (DEMO FLOW)

```
[FBSHOP STOREFRONT] (Khách hàng)
├── / ............................ Trang chủ (Banner, Sản phẩm hot, Voucher)
├── /san-pham .................... Danh mục sản phẩm (Tìm kiếm, Lọc giá/hãng, Phân trang)
├── /san-pham/[id] ............... Chi tiết sản phẩm (Thông số vợt, Chọn số lượng, Mua ngay)
├── /gio-hang .................... Giỏ hàng & Áp dụng Voucher giảm giá
├── /thanh-toan .................. Đặt hàng (COD, Thông tin người nhận)
├── /tai-khoan/don-hang .......... Tra cứu lịch sử đơn hàng của khách
└── /dang-nhap ................... Đăng nhập khách hàng bằng SĐT/Email

[FBSHOP ADMIN / STAFF] (Vận hành & Quản trị)
├── /admin/login ................. Trang đăng nhập chuyên dụng cho Admin/Staff
├── /admin/thong-ke .............. Dashboard biểu đồ doanh thu, cơ cấu kho, top bán chạy
├── /admin/hoa-don-kho ........... Phiếu nhập kho (+tồn), Phiếu xuất kho (-tồn), Hủy hoàn nguyên BR-01
├── /admin/don-hang .............. Xử lý quy trình đơn hàng 4 trạng thái
├── /admin/khach-hang ............ Quản lý danh sách khách hàng, lịch sử mua hàng, tổng chi tiêu
├── /admin/san-pham .............. Quản lý sản phẩm, giá bán, cấu hình hiển thị
├── /admin/nhan-vien ............. Quản lý danh sách nhân sự (Kiểm tra trùng SĐT/Email)
└── /admin/voucher ............... Quản lý mã ưu đãi, giới hạn sử dụng
```
