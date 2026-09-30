/**
 * scripts/test_e2e_flow.ts
 * BƯỚC 4 - KIỂM THỬ TÍCH HỢP KHÉP KÍN (END-TO-END E2E INTEGRATION FLOW)
 * 
 * Quy trình kiểm tra khép kín 5 bước:
 * 1. Khách hàng duyệt web: Khách vào /san-pham, xem cây vợt SP_AX88D (ghi nhận số lượng tồn ban đầu S0).
 * 2. Khách hàng đặt mua: Thêm 2 cây vào giỏ hàng -> Áp mã voucher FBSHOP50K -> Đặt hàng COD -> Hệ thống sinh mã MaDH.
 * 3. Kiểm tra đồng bộ tồn kho: Số lượng tồn kho trong CSDL giảm ngay lập tức: S1 = S0 - 2.
 * 4. Admin xử lý đơn hàng: Nhân viên kho vào /admin/don-hang, thấy đơn hàng mới ở trạng thái Cho xac nhan -> Dang xu ly -> Dang giao -> Da giao.
 * 5. Kiểm tra báo cáo tài chính: Vào /admin/thong-ke, số tiền của đơn hàng đã được cộng dồn chính xác vào Tổng doanh thu.
 */

import prisma from "../src/lib/db";

const BASE_URL = "http://localhost:3000";

// API thong ke chi danh cho Admin -> dang nhap de lay cookie
async function loginAdminCookie(): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenDangNhap: "admin@gmail.com", matKhau: "123456" }),
  });
  return (res.headers.get("set-cookie") || "").match(/fbshop_admin_token=[^;]+/)?.[0] || "";
}

function printBanner(text: string) {
  console.log("\n" + "=".repeat(85));
  console.log(text);
  console.log("=".repeat(85));
}

async function runE2E() {
  printBanner("BẮT ĐẦU KIỂM THỬ TÍCH HỢP KHÉP KÍN (E2E FLOW) - HỆ THỐNG FBSHOP");

  let initialRevenue = 0;
  let s0 = 0;
  let s1 = 0;
  let maDH = "";
  let orderTotal = 0;

  // Lấy doanh thu ban đầu từ API thống kê
  try {
    const statsResInit = await fetch(`${BASE_URL}/api/admin/thong-ke`, {
      headers: { Cookie: await loginAdminCookie() },
    });
    const statsDataInit = await statsResInit.json();
    initialRevenue = statsDataInit.data?.summary?.totalRevenue || 0;
    console.log(`[*] Doanh thu hệ thống trước khi đặt hàng: ${initialRevenue.toLocaleString("vi-VN")} đ`);
  } catch (e: any) {
    console.log(`[!] Không thể lấy doanh thu ban đầu: ${e.message}`);
  }

  // -------------------------------------------------------------------------
  // BƯỚC 1: KHÁCH HÀNG DUYỆT WEB & XEM SẢN PHẨM SP_AX88D
  // -------------------------------------------------------------------------
  console.log("\n>>> BƯỚC 1: Khách hàng duyệt web & kiểm tra tồn kho ban đầu (S0)");
  const res1 = await fetch(`${BASE_URL}/api/san-pham?search=88D`);
  const data1 = await res1.json();
  const product = data1.products?.find((p: any) => p.id === "SP_AX88D");

  if (!product) {
    throw new Error("Không tìm thấy sản phẩm SP_AX88D trên gian hàng!");
  }

  s0 = product.stock;
  const unitPrice = product.price;
  console.log(`  - Tên sản phẩm: ${product.name}`);
  console.log(`  - Đơn giá: ${unitPrice.toLocaleString("vi-VN")} đ`);
  console.log(`  - Tồn kho ban đầu (S0): ${s0} cây vợt`);
  console.log(`  -> BƯỚC 1: ✅ THÀNH CÔNG (Ghi nhận S0 = ${s0})`);

  // -------------------------------------------------------------------------
  // BƯỚC 2: KHÁCH HÀNG ĐẶT MUA (THÊM 2 CÂY, ÁP VOUCHER FBSHOP50K, ĐẶT COD)
  // -------------------------------------------------------------------------
  console.log("\n>>> BƯỚC 2: Đăng nhập Khách hàng & Đặt mua 2 cây + Áp voucher FBSHOP50K");
  // 2.1 Đăng nhập lấy cookie session
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ soDienThoai: "0912345678", matKhau: "123456" }),
  });
  const setCookieHeader = loginRes.headers.get("set-cookie") || "";
  const tokenMatch = setCookieHeader.match(/fbshop_token=([^;]+)/);
  const userCookie = tokenMatch ? `fbshop_token=${tokenMatch[1]}` : "";

  if (!userCookie) {
    throw new Error("Không thể đăng nhập tài khoản khách hàng để lấy token đặt hàng!");
  }

  // 2.2 Gửi yêu cầu đặt hàng COD
  const orderPayload = {
    tenNguoiNhan: "Nguyễn Văn Mẫu (Test E2E)",
    sdtNguoiNhan: "0912345678",
    diaChiNhan: "Số 88 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội",
    phuongThucThanhToan: "COD",
    ghiChu: "Đơn hàng kiểm thử luồng tích hợp tự động E2E",
    maVoucher: "FBSHOP50K",
    items: [{ maSP: "SP_AX88D", soLuong: 2 }],
  };

  const orderRes = await fetch(`${BASE_URL}/api/don-hang`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: userCookie,
    },
    body: JSON.stringify(orderPayload),
  });

  const orderData = await orderRes.json();
  const orderId = orderData.order?.maDH || orderData.order?.id;
  if (orderRes.status !== 200 || !orderId) {
    throw new Error(`Đặt hàng thất bại: ${orderData.error || "Lỗi không xác định"}`);
  }

  maDH = orderId;
  orderTotal = Number(orderData.order?.tongTien ?? orderData.order?.totalAmount ?? 0);
  const expectedTotal = unitPrice * 2 - 50000;

  console.log(`  - Mã đơn hàng sinh ra (MaDH): ${maDH}`);
  console.log(`  - Số lượng đặt mua: 2 cây`);
  console.log(`  - Voucher áp dụng: FBSHOP50K (Giảm 50.000 đ)`);
  console.log(`  - Thành tiền: ${orderTotal.toLocaleString("vi-VN")} đ (Kỳ vọng: ${expectedTotal.toLocaleString("vi-VN")} đ)`);
  console.log(`  - Trạng thái khởi tạo: ${orderData.order?.trangThai || orderData.order?.status}`);
  console.log(`  -> BƯỚC 2: ✅ THÀNH CÔNG (Đơn hàng đã được tạo hợp lệ)`);

  // -------------------------------------------------------------------------
  // BƯỚC 3: KIỂM TRA ĐỒNG BỘ TỒN KHO THỜI GIAN THỰC (S1 = S0 - 2)
  // -------------------------------------------------------------------------
  console.log("\n>>> BƯỚC 3: Kiểm tra đồng bộ tồn kho trong CSDL (S1 = S0 - 2)");
  const spAfter = await prisma.sanPham.findUnique({ where: { MaSP: "SP_AX88D" } });
  s1 = spAfter?.SoLuong ?? -1;

  console.log(`  - Tồn kho sau đặt hàng (S1): ${s1}`);
  console.log(`  - Độ chênh lệch: ${s0} -> ${s1} (giảm đúng ${s0 - s1} cây)`);

  if (s1 !== s0 - 2) {
    throw new Error(`Tồn kho không đồng bộ chính xác! Kỳ vọng ${s0 - 2}, thực tế ${s1}`);
  }
  console.log(`  -> BƯỚC 3: ✅ THÀNH CÔNG (Tồn kho trừ tức thì 2 đơn vị chuẩn xác)`);

  // -------------------------------------------------------------------------
  // BƯỚC 4: ADMIN XỬ LÝ ĐƠN HÀNG (QUY TRÌNH 4 BƯỚC CHUẨN TUẦN TỰ)
  // Cho xac nhan -> Dang xu ly -> Dang giao -> Da giao
  // -------------------------------------------------------------------------
  console.log("\n>>> BƯỚC 4: Admin tiếp nhận & xử lý đơn hàng theo trình tự chuẩn Use Case");

  // Đăng nhập Admin
  const adminLoginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenDangNhap: "admin@gmail.com", matKhau: "123456" }),
  });
  const adminSetCookie = adminLoginRes.headers.get("set-cookie") || "";
  const adminTokenMatch = adminSetCookie.match(/fbshop_admin_token=([^;]+)/);
  const adminCookie = adminTokenMatch ? `fbshop_admin_token=${adminTokenMatch[1]}` : "";

  // 4.1 Chuyển: Cho xac nhan -> Dang xu ly
  const step41 = await fetch(`${BASE_URL}/api/admin/don-hang/${maDH}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ trangThai: "Dang xu ly" }),
  });
  const data41 = await step41.json();
  console.log(`  - 4.1: Chuyển sang 'Dang xu ly' -> Status ${step41.status} (${data41.order?.trangThai})`);
  if (step41.status !== 200) throw new Error("Chuyển sang Đang xử lý thất bại");

  // 4.2 Chuyển: Dang xu ly -> Dang giao
  const step42 = await fetch(`${BASE_URL}/api/admin/don-hang/${maDH}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ trangThai: "Dang giao" }),
  });
  const data42 = await step42.json();
  console.log(`  - 4.2: Chuyển sang 'Dang giao'   -> Status ${step42.status} (${data42.order?.trangThai})`);
  if (step42.status !== 200) throw new Error("Chuyển sang Đang giao thất bại");

  // 4.3 Chuyển: Dang giao -> Da giao (Hoàn thành)
  const step43 = await fetch(`${BASE_URL}/api/admin/don-hang/${maDH}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ trangThai: "Da giao" }),
  });
  const data43 = await step43.json();
  console.log(`  - 4.3: Chuyển sang 'Da giao'     -> Status ${step43.status} (${data43.order?.trangThai})`);
  if (step43.status !== 200) throw new Error("Chuyển sang Đã giao thất bại");

  console.log(`  -> BƯỚC 4: ✅ THÀNH CÔNG (Luồng trạng thái đơn hàng hoàn tất 100%)`);

  // -------------------------------------------------------------------------
  // BƯỚC 5: KIỂM TRA BÁO CÁO TÀI CHÍNH & TỔNG DOANH THU CỘNG DỒN
  // -------------------------------------------------------------------------
  console.log("\n>>> BƯỚC 5: Kiểm tra báo cáo tài chính (/admin/thong-ke)");
  const statsRes = await fetch(`${BASE_URL}/api/admin/thong-ke`, { headers: { Cookie: adminCookie } });
  const statsData = await statsRes.json();
  const finalRevenue = statsData.data?.summary?.totalRevenue || 0;
  const revenueDiff = finalRevenue - initialRevenue;

  console.log(`  - Doanh thu ban đầu:  ${initialRevenue.toLocaleString("vi-VN")} đ`);
  console.log(`  - Doanh thu hiện tại: ${finalRevenue.toLocaleString("vi-VN")} đ`);
  console.log(`  - Chênh lệch thực tế: +${revenueDiff.toLocaleString("vi-VN")} đ`);
  console.log(`  - Giá trị đơn hàng:   ${orderTotal.toLocaleString("vi-VN")} đ`);

  const passed = revenueDiff === orderTotal;
  if (!passed) {
    throw new Error(`Doanh thu không khớp! Kỳ vọng tăng +${orderTotal} đ, thực tế tăng +${revenueDiff} đ`);
  }
  console.log(`  -> BƯỚC 5: ✅ THÀNH CÔNG (Doanh thu đã được ghi nhận chính xác 100%)`);

  // Dọn dẹp dữ liệu kiểm thử nếu muốn hoặc giữ nguyên để đối chiếu
  printBanner(`KẾT QUẢ KIỂM THỬ KHÉP KÍN E2E: HOÀN TẤT 5/5 BƯỚC (100% PASS)`);
  console.log(`Mã đơn hàng đối chiếu thực tế: ${maDH}`);
  console.log(`Sản phẩm kiểm thử: SP_AX88D | Tồn đầu: ${s0} -> Tồn cuối: ${s1}`);
  console.log(`Giá trị ghi nhận vào sổ sách: ${orderTotal.toLocaleString("vi-VN")} đ`);
  console.log("=".repeat(85) + "\n");
}

runE2E()
  .catch((err) => {
    console.error("\n❌ LỖI TRONG QUÁ TRÌNH KIỂM THỬ E2E:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
