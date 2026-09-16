# BÁO CÁO KẾT QUẢ KIỂM THỬ TOÀN DIỆN HỆ THỐNG FBSHOP
> **Cơ sở đối chiếu:** Báo cáo đồ án FBShop (Chương 4: Kiểm thử hệ thống, Trang 273 – 283)  
> **Thời điểm thực thi:** 15/09/2026  
> **Môi trường kiểm thử:** Node.js v20.x, Next.js 16 (App Router), Microsoft SQL Server 2022, Prisma ORM  
> **Trạng thái chung:** **ĐẠT 100% TIÊU CHUẨN NGHIỆM THU (27/27 TEST CASES PASS & 5/5 BƯỚC E2E HOÀN HẢO)**

---

## I. TỔNG QUAN KẾT QUẢ THỰC THI

| Nhóm Kiểm thử | Số lượng Test Cases | Số lượng ĐẠT (PASS) | Tỷ lệ thành công | Trạng thái đối chiếu Báo cáo |
| :--- | :---: | :---: | :---: | :---: |
| **1. Đăng nhập & Bảo vệ Route** | 10 | 10 | 100% | ✅ Khớp 100% Bảng 4.1 (Trang 274–279) |
| **2. Hiển thị & Tìm kiếm Sản phẩm** | 10 | 10 | 100% | ✅ Khớp 100% Bảng 4.2 (Trang 279–283) |
| **3. Nghiệp vụ Kho & Quy tắc BR-01** | 7 | 7 | 100% | ✅ Khớp 100% Quy tắc Nghiệp vụ Kho |
| **4. Luồng tích hợp khép kín (E2E)** | 5 bước | 5 bước | 100% | ✅ Đồng bộ Real-time Storefront & Admin |
| **TỔNG CỘNG** | **32 nội dung** | **32 nội dung** | **100%** | **SẴN SÀNG BẢO VỆ ĐỒ ÁN** |

---

## II. CHI TIẾT KẾT QUẢ KIỂM THỬ TỪNG TEST CASE

### 1. Phân hệ Đăng nhập & Phân quyền Bảo vệ Route (Trang 274 – 279 Báo cáo)

| Mã TC | Mô tả kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi chuẩn Báo cáo | Kết quả thực tế kiểm thử | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-LOGIN-01** | Đăng nhập Admin thành công | `admin` / `123456` | Đăng nhập thành công, sinh token quản trị, chuyển hướng `/admin` | Status 200, Phân quyền Admin, Token hợp lệ | **PASS** |
| **TC-LOGIN-02** | Đăng nhập Khách hàng thành công | SĐT `0912345678` / `123456` | Đăng nhập thành công, trả về thông tin khách, chuyển về trang chủ `/` | Status 200, Customer: Nguyễn Văn A, Cookie session đã cấp | **PASS** |
| **TC-LOGIN-03** | Nhập sai mật khẩu | `admin` + `mat_khau_sai_123` | Báo lỗi "Tên đăng nhập hoặc mật khẩu không đúng", không khóa tài khoản | Status 401, Error: "Tên đăng nhập hoặc mật khẩu không đúng" | **PASS** |
| **TC-LOGIN-04** | Sai số điện thoại / email | SĐT không tồn tại `0999999999` | Thông báo lỗi không tồn tại hoặc sai thông tin đăng nhập | Status 401, Error: "Số điện thoại hoặc mật khẩu không đúng" | **PASS** |
| **TC-LOGIN-05** | Bỏ trống số điện thoại | SĐT: `""`, MK: `123456` | Chặn gửi, báo lỗi "Vui lòng nhập đầy đủ số điện thoại và mật khẩu" | Status 400, Error: "Vui lòng nhập đầy đủ số điện thoại..." | **PASS** |
| **TC-LOGIN-06** | Bỏ trống mật khẩu | SĐT: `0912345678`, MK: `""` | Chặn gửi, báo lỗi yêu cầu nhập mật khẩu | Status 400, Error: "Vui lòng nhập đầy đủ số điện thoại và mật khẩu" | **PASS** |
| **TC-LOGIN-07** | Bỏ trống cả 2 trường | SĐT: `""`, MK: `""` | Chặn gửi, báo lỗi yêu cầu nhập đủ thông tin | Status 400, Error: "Vui lòng nhập đầy đủ số điện thoại và mật khẩu" | **PASS** |
| **TC-LOGIN-08** | Đăng xuất thành công | Client gửi yêu cầu Logout | Xóa cookie phiên làm việc, chuyển hướng người dùng | Status 200, Set-Cookie: `Max-Age=0` (Xóa cookie thành công) | **PASS** |
| **TC-LOGIN-09** | Khách truy cập trực tiếp URL Admin | Cookie khách thường mở `/admin` | Chặn truy cập trang quản trị, tự động chuyển hướng về trang chủ `/` | Status 307 / 302, Location redirect về `/` | **PASS** |
| **TC-LOGIN-10** | Chưa đăng nhập truy cập URL protected | Chưa đăng nhập mở `/admin` | Chặn truy cập, bắt buộc chuyển hướng về trang đăng nhập `/admin/login` | Status 307 / 302, Location redirect về `/admin/login` | **PASS** |

---

### 2. Phân hệ Hiển thị & Tìm kiếm Sản phẩm (Trang 279 – 283 Báo cáo)

| Mã TC | Mô tả kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi chuẩn Báo cáo | Kết quả thực tế kiểm thử | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-PROD-01** | Hiển thị danh sách sản phẩm | Mở trang `/san-pham` | Hiển thị đầy đủ danh sách các sản phẩm đang kinh doanh | Status 200, trả về danh sách 14 sản phẩm hoạt động | **PASS** |
| **TC-PROD-02** | Hiển thị đúng thông tin sản phẩm | Kiểm tra sản phẩm `SP_AX88D` | Tên, giá bán, ảnh, mô tả, tồn kho hiển thị chính xác theo DB | Tên: "Vợt Cầu Lông Yonex Astrox 88D Pro", Giá: 4.150.000 đ, Tồn: 15 | **PASS** |
| **TC-PROD-03** | Không hiển thị sản phẩm ngừng kinh doanh | Sản phẩm có MoTa = `Hidden` | Không xuất hiện trên trang mua sắm của khách hàng | Hệ thống lọc tự động qua SQL Server, sản phẩm không hiển thị | **PASS** |
| **TC-PROD-04** | Tìm kiếm sản phẩm theo tên | Từ khóa tìm kiếm: `"astrox"` | Trả về đúng danh sách sản phẩm khớp từ khóa | Khớp 100% các sản phẩm dòng Astrox (Astrox 88D Pro, 77 Pro...) | **PASS** |
| **TC-PROD-05** | Tìm kiếm không có kết quả | Từ khóa không tồn tại | Hiển thị danh sách rỗng, không gây lỗi giao diện | Status 200, Danh sách 0 phần tử | **PASS** |
| **TC-PROD-06** | Lọc theo danh mục | Chọn danh mục "Vợt Lining" | Chỉ hiển thị các sản phẩm thuộc danh mục `DM_LINING` | Số lượng: 4 sản phẩm, 100% thuộc danh mục `DM_LINING` | **PASS** |
| **TC-PROD-07** | Kết hợp tìm kiếm và lọc danh mục | Từ khóa: `"88D"` + Danh mục Yonex | Hiển thị chính xác các sản phẩm thỏa mãn đồng thời cả 2 tiêu chí | Khớp chính xác "Vợt Cầu Lông Yonex Astrox 88D Pro" (DM_YONEX) | **PASS** |
| **TC-PROD-08** | Hiển thị đúng ảnh sản phẩm | Kiểm tra thuộc tính hình ảnh | 100% ảnh có đường dẫn hợp lệ hoặc có fallback ảnh mặc định | 100% sản phẩm có đường dẫn hình ảnh hợp lệ, không broken link | **PASS** |
| **TC-PROD-09** | Hiển thị sản phẩm tồn kho thấp | Sản phẩm còn ít hàng trong kho | Vẫn hiển thị bình thường kèm số lượng còn lại chính xác | Sản phẩm tồn = 2 hiển thị chuẩn xác, không bị ẩn nhầm | **PASS** |
| **TC-PROD-10** | Dữ liệu mô tả thiếu vẫn không vỡ layout | Sản phẩm không có mô tả dài | Cấu trúc dữ liệu chuẩn hóa, card hiển thị đồng đều, không lỗi | Cấu trúc dữ liệu chuẩn hóa 100%, render ổn định | **PASS** |

---

### 3. Nghiệp vụ Kho & Quy tắc Hoàn nguyên BR-01 (Trọng tâm Đồ án)

| Mã TC | Nghiệp vụ kiểm tra | Thao tác thực hiện | Kết quả mong đợi | Kết quả thực tế kiểm thử | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-KHO-01** | Nhập kho tăng tồn | Lập phiếu nhập 10 cây vợt `SP_AX88D` | `SanPham.SoLuong` tăng đúng 10 đơn vị | Tồn kho tăng từ 15 lên 25 (tăng đúng 10 đơn vị) | **PASS** |
| **TC-KHO-02** | Xuất kho trừ tồn | Lập phiếu xuất 3 cây vợt (tồn đủ) | `SanPham.SoLuong` giảm đúng 3 đơn vị | Tồn kho giảm từ 25 xuống 22 (giảm đúng 3 đơn vị) | **PASS** |
| **TC-KHO-03** | Xuất vượt tồn kho | Lập phiếu xuất 9999 cây khi tồn chỉ còn 22 | Bị chặn đứng, báo lỗi "Số lượng xuất không được lớn hơn tồn kho" | Status 400, Error: "Số lượng xuất không được lớn hơn tồn kho" | **PASS** |
| **TC-KHO-04** | Hủy phiếu xuất (BR-01) | Bấm hủy phiếu xuất 3 cây, nhập lý do hủy | Tồn kho tự động hoàn nguyên cộng trả lại 3 cây | Tồn kho tăng từ 22 lên 25, trạng thái đổi thành "Da huy" | **PASS** |
| **TC-KHO-05** | Hủy phiếu nhập đủ tồn (BR-01) | Bấm hủy phiếu nhập 10 cây khi tồn $\ge 10$ | Tồn kho tự động trừ trả lại 10 cây, phiếu đổi sang "Da huy" | Tồn kho giảm từ 25 về 15, hoàn tất quy tắc BR-01 | **PASS** |
| **TC-KHO-06** | Hủy phiếu nhập thiếu tồn (BR-01) | Bán bớt khiến tồn $< 10$, rồi bấm hủy | Bị chặn đứng! Báo lỗi "Tồn kho không đủ để hoàn nguyên" | Status 400, Error: "Tồn kho không đủ để hoàn nguyên (cần tối thiểu...)" | **PASS** |
| **TC-KHO-07** | Hủy bỏ trống lý do | Bấm xác nhận hủy nhưng để trống ô lý do | Bị chặn, báo lỗi "Vui lòng nhập lý do hủy hóa đơn" | Status 400, Error: "Vui lòng nhập lý do hủy hóa đơn" | **PASS** |

---

## III. KẾT QUẢ KIỂM THỬ TÍCH HỢP KHÉP KÍN (E2E INTEGRATION FLOW)

Kịch bản chạy thực tế qua lệnh `npm run test:e2e`:

```
=====================================================================================
BẮT ĐẦU KIỂM THỬ TÍCH HỢP KHÉP KÍN (E2E FLOW) - HỆ THỐNG FBSHOP
=====================================================================================
[*] Doanh thu hệ thống trước khi đặt hàng: 48.850.000 đ

>>> BƯỚC 1: Khách hàng duyệt web & kiểm tra tồn kho ban đầu (S0)
  - Tên sản phẩm: Vợt Cầu Lông Yonex Astrox 88D Pro
  - Đơn giá: 4.150.000 đ
  - Tồn kho ban đầu (S0): 11 cây vợt
  -> BƯỚC 1: ✅ THÀNH CÔNG (Ghi nhận S0 = 11)

>>> BƯỚC 2: Đăng nhập Khách hàng & Đặt mua 2 cây + Áp voucher FBSHOP50K
  - Mã đơn hàng sinh ra (MaDH): cmu2cq2i6002p11x08ecwhlte
  - Số lượng đặt mua: 2 cây
  - Voucher áp dụng: FBSHOP50K (Giảm 50.000 đ)
  - Thành tiền: 8.250.000 đ (Kỳ vọng: 8.250.000 đ)
  - Trạng thái khởi tạo: Cho xac nhan
  -> BƯỚC 2: ✅ THÀNH CÔNG (Đơn hàng đã được tạo hợp lệ)

>>> BƯỚC 3: Kiểm tra đồng bộ tồn kho trong CSDL (S1 = S0 - 2)
  - Tồn kho sau đặt hàng (S1): 9
  - Độ chênh lệch: 11 -> 9 (giảm đúng 2 cây)
  -> BƯỚC 3: ✅ THÀNH CÔNG (Tồn kho trừ tức thì 2 đơn vị chuẩn xác)

>>> BƯỚC 4: Admin tiếp nhận & xử lý đơn hàng theo trình tự chuẩn Use Case
  - 4.1: Chuyển sang 'Dang xu ly' -> Status 200
  - 4.2: Chuyển sang 'Dang giao'   -> Status 200
  - 4.3: Chuyển sang 'Da giao'     -> Status 200
  -> BƯỚC 4: ✅ THÀNH CÔNG (Luồng trạng thái đơn hàng hoàn tất 100%)

>>> BƯỚC 5: Kiểm tra báo cáo tài chính (/admin/thong-ke)
  - Doanh thu ban đầu:  48.850.000 đ
  - Doanh thu hiện tại: 57.100.000 đ
  - Chênh lệch thực tế: +8.250.000 đ
  - Giá trị đơn hàng:   8.250.000 đ
  -> BƯỚC 5: ✅ THÀNH CÔNG (Doanh thu đã được ghi nhận chính xác 100%)

=====================================================================================
KẾT QUẢ KIỂM THỬ KHÉP KÍN E2E: HOÀN TẤT 5/5 BƯỚC (100% PASS)
=====================================================================================
```

---

## IV. ĐÁNH GIÁ 8 TIÊU CHÍ NGHIỆM THU

1. **Kiểm thử tự động 20+ Test Cases Chương 4:**  
   ✅ Đạt 27/27 test cases PASS (100%). Lệnh chạy: `npm test`.
2. **Không còn cảnh báo đỏ hoặc lỗi cú pháp khi build:**  
   ✅ Lệnh `npm run build` hoàn thành với kết quả biên dịch 31/31 routes thành công, 0 lỗi TypeScript.
3. **Bảo vệ URL phân quyền hoạt động chuẩn:**  
   ✅ Khách thường truy cập `/admin` tự động redirect về `/`; Chưa đăng nhập truy cập protected URL tự động redirect về `/admin/login`.
4. **Luồng hoàn nguyên kho BR-01 chạy trơn tru:**  
   ✅ Đã kiểm thử đầy đủ tăng tồn khi nhập, trừ tồn khi xuất, hoàn nguyên tồn khi hủy, chặn hủy khi không đủ tồn và bắt buộc nhập lý do hủy.
5. **Giao diện Responsive Mobile & Tablet:**  
   ✅ Drawer mobile mượt mà, Admin Data Table có thanh cuộn ngang `overflow-x-auto`, trang 404 phong cách thể thao FBShop, Skeleton Loading mượt mà.
6. **Đồng bộ thời gian thực Storefront và Admin:**  
   ✅ Khách đặt hàng mới trên Store, đơn hàng xuất hiện ngay lập tức trong giao diện Quản lý đơn của Admin.
7. **Tài liệu bàn giao đầy đủ:**  
   ✅ Sinh đầy đủ `HUONG_DAN_CHAY.md` và `KET_QUA_KIEM_THU.md` tại thư mục gốc.
8. **Sẵn sàng bảo vệ trước Hội đồng:**  
   ✅ Hệ thống đã được nghiệm thu kỹ thuật, sẵn sàng 100% để demo trực tiếp.
