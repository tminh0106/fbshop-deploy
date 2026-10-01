# HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY HỆ THỐNG FBSHOP
> **Đồ án tốt nghiệp / Chuyên ngành Công nghệ Thông tin**  
> **Đề tài:** Xây dựng Hệ thống Bán hàng & Quản trị Vận hành Kho Thiết bị Cầu lông FBSHOP  
> **Cơ sở đối chiếu:** Báo cáo Đồ án FBShop (Giảng viên hướng dẫn: Cô Chi)

---

## 1. YÊU CẦU MÔI TRƯỜNG HỆ THỐNG
Để chạy ứng dụng một cách tối ưu và không gặp lỗi, máy tính cần cài đặt:
- **Node.js:** Phiên bản `>= 20.9.0` (bắt buộc với Next.js 16; khuyến nghị Node.js 22 LTS). Kiểm tra bằng `node -v`.
- **Trình quản lý gói:** `npm` (đi kèm Node.js) hoặc `yarn` / `pnpm`.
- **Hệ quản trị CSDL:** **MySQL / MariaDB dùng chung** trên hosting (không cần cài CSDL trên máy cá nhân). Mọi thành viên kết nối cùng một CSDL nên dữ liệu luôn đồng bộ giữa các máy.
- **Trình duyệt web:** Google Chrome, Microsoft Edge hoặc Firefox phiên bản mới nhất.

---

## 2. CẤU HÌNH BIẾN MÔI TRƯỜNG (.env)
Sao chép file mẫu `.env.example` thành `.env` (cùng thư mục với `package.json`) rồi thay `<MAT_KHAU>` bằng mật khẩu CSDL:

```bash
# Windows PowerShell
Copy-Item .env.example .env
# macOS / Linux / Git Bash
cp .env.example .env
```

Nội dung file `.env`:

```env
# CSDL MySQL dùng chung - xin mật khẩu từ trưởng nhóm, KHÔNG đưa lên Git
DATABASE_URL="mysql://dctcnynhhosting_yanhioidvn:<MAT_KHAU>@onehost-wphn092505.000nethost.com:3306/dctcnynhhosting_yanhioidvn"

# Khóa bí mật ký xác thực JWT Token
JWT_SECRET="fbshop_super_secret_jwt_key_2026_khoa_luan"
```

> **Lưu ý:**
> - Mật khẩu có ký tự đặc biệt phải mã hóa URL: `@` → `%40`, `#` → `%23`, `%` → `%25`, `/` → `%2F`, `:` → `%3A`.
> - File `.env` đã nằm trong `.gitignore`, gửi chuỗi kết nối cho thành viên qua kênh riêng.

---

## 3. CÁC BƯỚC KHỞI CHẠY DỰ ÁN (1-CLICK RUN)

Mở terminal (PowerShell, Command Prompt hoặc Terminal trong VS Code) tại thư mục dự án:

### Bước 3.1: Cài đặt thư viện và sinh Prisma Client
```bash
npm install
npx prisma generate
```
> `npm install` đã tự chạy `prisma generate`; lệnh thứ hai chỉ để chắc chắn. Cảnh báo `npm warn install-scripts` của npm 11 là bình thường, không ảnh hưởng.
>
> Nếu chạy báo lỗi kết nối CSDL hoặc "Environment variable not found: DATABASE_URL": kiểm tra lại file `.env` (Bước 2) đã đặt đúng ở thư mục gốc dự án (cùng cấp `package.json`).

### Bước 3.2: CSDL
12 bảng đã được tạo sẵn trên CSDL dùng chung, **không cần** chạy `prisma db push` hay seed.

> ⚠️ **Khi cần sửa cấu trúc bảng** (đổi `schema.prisma`): chỉ một người thực hiện, và lưu ý máy chủ MariaDB mặc định tạo bảng MyISAM (không hỗ trợ transaction/khóa ngoại). Bảng mới phải chuyển sang InnoDB: `ALTER TABLE <TenBang> ENGINE=InnoDB;`
>
> Công cụ chuyển dữ liệu: `npm run db:export` (xuất CSDL hiện tại ra JSON) và `npm run db:import` (**xóa sạch** 12 bảng rồi nhập lại từ JSON), dùng khi cần chuyển sang CSDL khác.

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
| **Admin – Người quản lý** | `admin@gmail.com` | — | `123456` | Vai trò `Admin`: toàn quyền + nhà cung cấp, voucher, nhân viên, phân quyền tài khoản, báo cáo |
| **Nhân viên kho** | `kho@gmail.com` | — | `123456` | Vai trò `NhanVienKho`: sản phẩm, hàng hóa kho, lập/hủy phiếu nhập–xuất (BR-01) |
| **Nhân viên bán hàng** | `banhang@gmail.com` | — | `123456` | Vai trò `BanHang`: đơn hàng, khách hàng, sản phẩm |
| **Khách hàng Mẫu** | `0912345678` | `khach@gmail.com` | `123456` | Khách mua hàng: duyệt sản phẩm, đặt hàng COD hoặc chuyển khoản VietQR, áp mã voucher, theo dõi / tự hủy đơn |

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
├── /gio-hang .................... Giỏ hàng (tự cập nhật giá / tồn kho)
├── /dat-hang .................... Đặt hàng: thông tin người nhận, voucher, COD hoặc VietQR
├── /dat-hang/thanh-toan-qr ...... Thanh toán chuyển khoản VietQR (giữ đơn 24 giờ)
├── /tai-khoan/don-hang .......... Lịch sử đơn, trạng thái thanh toán, thanh toán tiếp / hủy đơn
└── /dang-nhap ................... Đăng nhập khách hàng bằng SĐT/Email

[FBSHOP ADMIN / STAFF] (Vận hành & Quản trị)
├── /admin/login ................. Trang đăng nhập chuyên dụng cho Admin/Staff
├── /admin/thong-ke .............. Dashboard biểu đồ doanh thu, cơ cấu kho, top bán chạy
├── /admin/hoa-don-kho ........... Phiếu nhập/xuất kho (mẫu 01-VT/02-VT, in phiếu), công nợ NCC, hủy hoàn nguyên BR-01
├── /admin/hang-hoa-kho .......... Lô hàng trong kho (thêm / sửa / xóa)
├── /admin/nha-cung-cap .......... Nhà cung cấp, công nợ, chặn xóa khi còn nợ
├── /admin/don-hang .............. Quy trình đơn: Chờ thanh toán → Chờ xác nhận → Đang xử lý → Đang giao → Đã giao; xác nhận nhận tiền, hoàn tiền
├── /admin/khach-hang ............ Khách hàng: tìm kiếm, sửa, xóa (khách tự đăng ký), lịch sử mua, tổng chi tiêu
├── /admin/san-pham .............. Quản lý sản phẩm, giá bán, cấu hình hiển thị
├── /admin/nhan-vien ............. Quản lý danh sách nhân sự (Kiểm tra trùng SĐT/Email)
├── /admin/voucher ............... Quản lý mã ưu đãi, giới hạn sử dụng
└── /admin/tai-khoan ............. Quản lý tài khoản & phân quyền
```
