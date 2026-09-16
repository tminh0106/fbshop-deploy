import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";

interface TestResult {
  code: string;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const results: TestResult[] = [];

function record(code: string, name: string, expected: string, actual: string, passed: boolean) {
  results.push({ code, name, expected, actual, passed });
  const icon = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`[${code}] ${name.padEnd(45)} -> ${icon}`);
  if (!passed) {
    console.log(`    Kỳ vọng: ${expected}`);
    console.log(`    Thực tế: ${actual}`);
  }
}

async function main() {
  console.log("==========================================================================================");
  console.log("BỘ KIỂM THỬ TOÀN DIỆN HỆ THỐNG FBSHOP (CHƯƠNG 4 BÁO CÁO ĐỒ ÁN)");
  console.log("Đối chiếu: Bảng 4.1, 4.2 & Các kịch bản Use Case, BR-01");
  console.log("==========================================================================================\n");

  // =======================================================================
  // NHÓM 1: ĐĂNG NHẬP & BẢO VỆ ROUTE (TC-LOGIN-01 -> TC-LOGIN-10)
  // =======================================================================
  console.log("--- NHÓM 1: ĐĂNG NHẬP & BẢO VỆ ROUTE (TC-LOGIN-01 -> TC-LOGIN-10) ---");

  // TC-LOGIN-01: Đăng nhập Admin thành công
  try {
    const res = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenDangNhap: "admin@fbshop.vn", matKhau: "123456" }),
    });
    const data = await res.json();
    const passed = res.status === 200 && data.success === true && data.user?.role === "Admin";
    record(
      "TC-LOGIN-01",
      "Đăng nhập Admin thành công",
      "Đăng nhập thành công, phân quyền Admin",
      `Status: ${res.status}, Role: ${data.user?.role}`,
      passed
    );
  } catch (err: any) {
    record("TC-LOGIN-01", "Đăng nhập Admin thành công", "Status 200", err.message, false);
  }

  // TC-LOGIN-02: Đăng nhập Khách hàng thành công
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ soDienThoai: "0912345678", matKhau: "123456" }),
    });
    const data = await res.json();
    const passed = res.status === 200 && data.success === true && !!data.customer?.hoTen;
    record(
      "TC-LOGIN-02",
      "Đăng nhập Khách hàng thành công",
      "Đăng nhập thành công, trả về thông tin khách",
      `Status: ${res.status}, HoTen: ${data.customer?.hoTen}`,
      passed
    );
  } catch (err: any) {
    record("TC-LOGIN-02", "Đăng nhập Khách hàng thành công", "Status 200", err.message, false);
  }

  // TC-LOGIN-03: Nhập sai mật khẩu
  try {
    const res = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenDangNhap: "admin@fbshop.vn", matKhau: "mat_khau_sai_123" }),
    });
    const data = await res.json();
    const passed = res.status === 401 && data.error?.includes("không đúng");
    record(
      "TC-LOGIN-03",
      "Nhập sai mật khẩu",
      "Báo lỗi 'Tên đăng nhập hoặc mật khẩu không đúng' (401)",
      `Status: ${res.status}, Error: "${data.error}"`,
      passed
    );
  } catch (err: any) {
    record("TC-LOGIN-03", "Nhập sai mật khẩu", "Status 401", err.message, false);
  }

  // TC-LOGIN-04: Sai số điện thoại / email
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ soDienThoai: "0999999999", matKhau: "123456" }),
    });
    const data = await res.json();
    const passed = res.status === 401 && !!data.error;
    record(
      "TC-LOGIN-04",
      "Sai số điện thoại / email",
      "Báo lỗi thông tin không đúng (401)",
      `Status: ${res.status}, Error: "${data.error}"`,
      passed
    );
  } catch (err: any) {
    record("TC-LOGIN-04", "Sai số điện thoại / email", "Status 401", err.message, false);
  }

  // TC-LOGIN-05: Bỏ trống số điện thoại
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ soDienThoai: "", matKhau: "123456" }),
    });
    const data = await res.json();
    const passed = res.status === 400 && data.error?.includes("số điện thoại");
    record(
      "TC-LOGIN-05",
      "Bỏ trống số điện thoại",
      "Chặn gửi, báo lỗi 'Vui lòng nhập đầy đủ số điện thoại...' (400)",
      `Status: ${res.status}, Error: "${data.error}"`,
      passed
    );
  } catch (err: any) {
    record("TC-LOGIN-05", "Bỏ trống số điện thoại", "Status 400", err.message, false);
  }

  // TC-LOGIN-06: Bỏ trống mật khẩu
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ soDienThoai: "0912345678", matKhau: "" }),
    });
    const data = await res.json();
    const passed = res.status === 400 && data.error?.includes("mật khẩu");
    record(
      "TC-LOGIN-06",
      "Bỏ trống mật khẩu",
      "Chặn gửi, báo lỗi yêu cầu mật khẩu (400)",
      `Status: ${res.status}, Error: "${data.error}"`,
      passed
    );
  } catch (err: any) {
    record("TC-LOGIN-06", "Bỏ trống mật khẩu", "Status 400", err.message, false);
  }

  // TC-LOGIN-07: Bỏ trống cả 2 trường
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ soDienThoai: "", matKhau: "" }),
    });
    const data = await res.json();
    const passed = res.status === 400;
    record(
      "TC-LOGIN-07",
      "Bỏ trống cả 2 trường",
      "Chặn gửi, báo lỗi yêu cầu nhập đủ",
      `Status: ${res.status}, Error: "${data.error}"`,
      passed
    );
  } catch (err: any) {
    record("TC-LOGIN-07", "Bỏ trống cả 2 trường", "Status 400", err.message, false);
  }

  // TC-LOGIN-08: Đăng xuất thành công
  try {
    const res = await fetch(`${BASE_URL}/api/admin/auth/logout`, { method: "POST" });
    const data = await res.json();
    const cookieHeader = res.headers.get("set-cookie");
    const passed = res.status === 200 && data.success === true;
    record(
      "TC-LOGIN-08",
      "Đăng xuất thành công",
      "Xóa phiên đăng nhập, thông báo thành công",
      `Status: ${res.status}, Success: ${data.success}`,
      passed
    );
  } catch (err: any) {
    record("TC-LOGIN-08", "Đăng xuất thành công", "Status 200", err.message, false);
  }

  // TC-LOGIN-09: Khách truy cập trực tiếp URL Admin
  try {
    // Gui request vao /admin voi cookie khach hang (fbshop_token gia dinh)
    const res = await fetch(`${BASE_URL}/admin`, {
      headers: {
        Cookie: "fbshop_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtYUtIIjoiMTIzIiwicm9sZSI6IktoYWNoSGFuZyJ9.signature",
      },
      redirect: "manual",
    });
    const location = res.headers.get("location");
    // Middleware chuyen huong ve trang chu /
    const passed = Boolean(res.status === 307 || res.status === 302 || location === "/" || location?.endsWith(":3000/"));
    record(
      "TC-LOGIN-09",
      "Khách truy cập trực tiếp URL Admin",
      "Chặn truy cập admin, chuyển hướng về trang chủ /",
      `Status: ${res.status}, Redirect: ${location}`,
      passed
    );
  } catch (err: any) {
    record("TC-LOGIN-09", "Khách truy cập trực tiếp URL Admin", "Redirect /", err.message, false);
  }

  // TC-LOGIN-10: Chưa đăng nhập truy cập URL protected
  try {
    const res = await fetch(`${BASE_URL}/admin`, {
      redirect: "manual",
    });
    const location = res.headers.get("location");
    const passed = Boolean((res.status === 307 || res.status === 302) && location?.includes("/admin/login"));
    record(
      "TC-LOGIN-10",
      "Chưa đăng nhập truy cập URL protected",
      "Bắt buộc chuyển hướng về trang Đăng nhập (/admin/login)",
      `Status: ${res.status}, Redirect: ${location}`,
      passed
    );
  } catch (err: any) {
    record("TC-LOGIN-10", "Chưa đăng nhập truy cập URL protected", "Redirect login", err.message, false);
  }

  // =======================================================================
  // NHÓM 2: HIỂN THỊ & TÌM KIẾM SẢN PHẨM (TC-PROD-01 -> TC-PROD-10)
  // =======================================================================
  console.log("\n--- NHÓM 2: HIỂN THỊ & TÌM KIẾM SẢN PHẨM (TC-PROD-01 -> TC-PROD-10) ---");

  // TC-PROD-01: Hiển thị danh sách sản phẩm
  try {
    const res = await fetch(`${BASE_URL}/api/san-pham`);
    const data = await res.json();
    const passed = res.status === 200 && Array.isArray(data.products) && data.products.length > 0;
    record(
      "TC-PROD-01",
      "Hiển thị danh sách sản phẩm",
      "Hiển thị đầy đủ danh sách sản phẩm đang kinh doanh",
      `Tìm thấy ${data.products?.length} sản phẩm`,
      passed
    );
  } catch (err: any) {
    record("TC-PROD-01", "Hiển thị danh sách sản phẩm", "List > 0", err.message, false);
  }

  // TC-PROD-02: Hiển thị đúng thông tin sản phẩm
  try {
    const res = await fetch(`${BASE_URL}/api/san-pham`);
    const data = await res.json();
    const p = data.products?.find((item: any) => item.id === "SP_AX88D");
    const passed = p && p.name && p.price > 0 && p.stock >= 0;
    record(
      "TC-PROD-02",
      "Hiển thị đúng thông tin sản phẩm",
      "Tên, giá bán, ảnh, mô tả, tồn kho hiển thị chuẩn",
      `SP_AX88D: "${p?.name}", Giá: ${p?.price}, Tồn: ${p?.stock}`,
      passed
    );
  } catch (err: any) {
    record("TC-PROD-02", "Hiển thị đúng thông tin sản phẩm", "Thông tin khớp", err.message, false);
  }

  // TC-PROD-03: Không hiển thị sản phẩm ngừng kinh doanh
  try {
    // Tạo tạm 1 sản phẩm ngừng kinh doanh
    const dummyId = `SP_STOP_${Date.now().toString().slice(-4)}`;
    await prisma.sanPham.create({
      data: {
        MaSP: dummyId,
        TenSP: "Vợt Test Ngừng Kinh Doanh",
        GiaBan: 1000000,
        SoLuong: 10,
        MaDanhMuc: "DM_YONEX",
        MoTa: "Hidden - Sản phẩm ngừng kinh doanh thử nghiệm",
      },
    });

    const res = await fetch(`${BASE_URL}/api/san-pham`);
    const data = await res.json();
    const found = data.products?.some((item: any) => item.id === dummyId);
    const passed = !found;

    // Dọn dẹp
    await prisma.sanPham.delete({ where: { MaSP: dummyId } });

    record(
      "TC-PROD-03",
      "Không hiển thị sản phẩm ngừng kinh doanh",
      "Sản phẩm ngừng kinh doanh không xuất hiện trên store",
      passed ? "Đã lọc bỏ hoàn toàn sản phẩm ngừng kinh doanh" : "Vẫn hiển thị trên store",
      passed
    );
  } catch (err: any) {
    record("TC-PROD-03", "Không hiển thị sản phẩm ngừng kinh doanh", "Hidden", err.message, false);
  }

  // TC-PROD-04: Tìm kiếm sản phẩm theo tên
  try {
    const res = await fetch(`${BASE_URL}/api/san-pham?search=astrox`);
    const data = await res.json();
    const allMatch = data.products?.every((p: any) =>
      p.name.toLowerCase().includes("astrox")
    );
    const passed = data.products?.length > 0 && allMatch;
    record(
      "TC-PROD-04",
      "Tìm kiếm sản phẩm theo tên",
      "Trả về đúng danh sách sản phẩm khớp từ khóa 'astrox'",
      `Khớp ${data.products?.length} sản phẩm Astrox`,
      passed
    );
  } catch (err: any) {
    record("TC-PROD-04", "Tìm kiếm sản phẩm theo tên", "Match list", err.message, false);
  }

  // TC-PROD-05: Tìm kiếm không có kết quả
  try {
    const res = await fetch(`${BASE_URL}/api/san-pham?search=khong_the_tim_thay_99999`);
    const data = await res.json();
    const passed = data.products?.length === 0;
    record(
      "TC-PROD-05",
      "Tìm kiếm không có kết quả",
      "Hiển thị danh sách rỗng 0 kết quả",
      `Số lượng kết quả: ${data.products?.length}`,
      passed
    );
  } catch (err: any) {
    record("TC-PROD-05", "Tìm kiếm không có kết quả", "0 result", err.message, false);
  }

  // TC-PROD-06: Lọc theo danh mục
  try {
    const res = await fetch(`${BASE_URL}/api/san-pham?category=vot-lining`);
    const data = await res.json();
    const allLining = data.products?.every((p: any) => p.categoryId === "DM_LINING");
    const passed = data.products?.length > 0 && allLining;
    record(
      "TC-PROD-06",
      "Lọc theo danh mục",
      "Chỉ hiển thị các sản phẩm thuộc danh mục Vợt Lining",
      `Số lượng: ${data.products?.length}, 100% thuộc DM_LINING`,
      passed
    );
  } catch (err: any) {
    record("TC-PROD-06", "Lọc theo danh mục", "Category only", err.message, false);
  }

  // TC-PROD-07: Kết hợp tìm kiếm và lọc danh mục
  try {
    const res = await fetch(`${BASE_URL}/api/san-pham?category=vot-yonex&search=88D`);
    const data = await res.json();
    const passed =
      data.products?.length > 0 &&
      data.products[0].name.includes("88D") &&
      data.products[0].categoryId === "DM_YONEX";
    record(
      "TC-PROD-07",
      "Kết hợp tìm kiếm và lọc danh mục",
      "Hiển thị sản phẩm thỏa mãn cả 2 tiêu chí",
      `Khớp: "${data.products?.[0]?.name}" (${data.products?.[0]?.categoryId})`,
      passed
    );
  } catch (err: any) {
    record("TC-PROD-07", "Kết hợp tìm kiếm và lọc danh mục", "2 filters match", err.message, false);
  }

  // TC-PROD-08: Hiển thị đúng ảnh sản phẩm
  try {
    const res = await fetch(`${BASE_URL}/api/san-pham`);
    const data = await res.json();
    const allValidImg = data.products?.every((p: any) => !!p.imageUrl && p.imageUrl.length > 3);
    record(
      "TC-PROD-08",
      "Hiển thị đúng ảnh sản phẩm",
      "Đường dẫn ảnh hợp lệ, không broken link",
      `100% ảnh có đường dẫn hợp lệ (${data.products?.length} sp)`,
      allValidImg
    );
  } catch (err: any) {
    record("TC-PROD-08", "Hiển thị đúng ảnh sản phẩm", "Valid image URLs", err.message, false);
  }

  // TC-PROD-09: Hiển thị sản phẩm tồn kho thấp
  try {
    // Tao tam 1 sp ton = 2
    const lowStockId = `SP_LOW_${Date.now().toString().slice(-4)}`;
    await prisma.sanPham.create({
      data: {
        MaSP: lowStockId,
        TenSP: "Vợt Demo Low Stock 2026",
        GiaBan: 2000000,
        SoLuong: 2,
        MaDanhMuc: "DM_YONEX",
      },
    });

    const query = encodeURIComponent("Low Stock");
    const res = await fetch(`${BASE_URL}/api/san-pham?search=${query}`);
    const data = await res.json();
    const p = data.products?.find((item: any) => item.id === lowStockId);
    const passed = !!p && p.stock === 2;

    await prisma.sanPham.delete({ where: { MaSP: lowStockId } });

    record(
      "TC-PROD-09",
      "Hiển thị sản phẩm tồn kho thấp",
      "Hiển thị bình thường kèm số lượng còn lại chính xác",
      `Sản phẩm hiển thị đúng tồn kho = ${p?.stock}`,
      passed
    );
  } catch (err: any) {
    record("TC-PROD-09", "Hiển thị sản phẩm tồn kho thấp", "Low stock ok", err.message, false);
  }

  // TC-PROD-10: Dữ liệu mô tả thiếu vẫn không vỡ layout
  try {
    const res = await fetch(`${BASE_URL}/api/san-pham`);
    const data = await res.json();
    const allHaveKeys = data.products?.every((p: any) => "id" in p && "name" in p && "price" in p);
    record(
      "TC-PROD-10",
      "Dữ liệu mô tả thiếu vẫn không vỡ layout",
      "Card sản phẩm chuẩn cấu trúc, không gây lỗi render",
      allHaveKeys ? "Cấu trúc dữ liệu chuẩn hóa 100%" : "Thiếu thuộc tính",
      allHaveKeys
    );
  } catch (err: any) {
    record("TC-PROD-10", "Dữ liệu mô tả thiếu vẫn không vỡ layout", "No crash", err.message, false);
  }

  // =======================================================================
  // NHÓM 3: NGHIỆP VỤ KHO & HOÀN NGUYÊN BR-01 (TC-KHO-01 -> TC-KHO-07)
  // =======================================================================
  console.log("\n--- NHÓM 3: NGHIỆP VỤ KHO & HOÀN NGUYÊN BR-01 (TC-KHO-01 -> TC-KHO-07) ---");

  let initStock = 0;
  let testHDKNhap = "";
  let testHDKXuat = "";

  // Chuẩn bị tồn ban đầu của SP_AX88D
  const sp88d = await prisma.sanPham.findUnique({ where: { MaSP: "SP_AX88D" } });
  initStock = sp88d?.SoLuong || 15;

  // TC-KHO-01: Nhập kho tăng tồn
  try {
    const res = await fetch(`${BASE_URL}/api/admin/hoa-don-kho`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loaiPhieu: "NHAP",
        maNCC: "NCC001",
        lyDo: "Test TC-KHO-01 Nhập kho",
        items: [{ maSP: "SP_AX88D", soLuong: 10, donGia: 3500000 }],
      }),
    });
    const data = await res.json();
    testHDKNhap = data.data?.MaHDK;

    const after = await prisma.sanPham.findUnique({ where: { MaSP: "SP_AX88D" } });
    const passed = after?.SoLuong === initStock + 10;
    record(
      "TC-KHO-01",
      "Nhập kho tăng tồn",
      `Tồn kho tăng đúng 10 đơn vị (Từ ${initStock} lên ${initStock + 10})`,
      `Tồn kho thực tế: ${after?.SoLuong}`,
      passed
    );
  } catch (err: any) {
    record("TC-KHO-01", "Nhập kho tăng tồn", "+10 stock", err.message, false);
  }

  // TC-KHO-02: Xuất kho trừ tồn
  try {
    const current = (await prisma.sanPham.findUnique({ where: { MaSP: "SP_AX88D" } }))?.SoLuong || 0;
    const res = await fetch(`${BASE_URL}/api/admin/hoa-don-kho`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loaiPhieu: "XUAT",
        lyDo: "Test TC-KHO-02 Xuất kho",
        items: [{ maSP: "SP_AX88D", soLuong: 3, donGia: 4000000 }],
      }),
    });
    const data = await res.json();
    testHDKXuat = data.data?.MaHDK;

    const after = await prisma.sanPham.findUnique({ where: { MaSP: "SP_AX88D" } });
    const passed = after?.SoLuong === current - 3;
    record(
      "TC-KHO-02",
      "Xuất kho trừ tồn",
      `Tồn kho giảm đúng 3 đơn vị (Từ ${current} xuống ${current - 3})`,
      `Tồn kho thực tế: ${after?.SoLuong}`,
      passed
    );
  } catch (err: any) {
    record("TC-KHO-02", "Xuất kho trừ tồn", "-3 stock", err.message, false);
  }

  // TC-KHO-03: Xuất vượt tồn kho
  try {
    const res = await fetch(`${BASE_URL}/api/admin/hoa-don-kho`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loaiPhieu: "XUAT",
        lyDo: "Test xuất vượt tồn kho",
        items: [{ maSP: "SP_AX88D", soLuong: 9999, donGia: 4000000 }],
      }),
    });
    const data = await res.json();
    const passed = res.status === 400 && data.error?.includes("lớn hơn tồn kho");
    record(
      "TC-KHO-03",
      "Xuất vượt tồn kho",
      "Chặn xuất vượt tồn, báo lỗi 'Số lượng xuất không được lớn hơn tồn kho'",
      `Status: ${res.status}, Error: "${data.error}"`,
      passed
    );
  } catch (err: any) {
    record("TC-KHO-03", "Xuất vượt tồn kho", "Blocked", err.message, false);
  }

  // TC-KHO-04: Hủy phiếu xuất (BR-01)
  try {
    const beforeCancel = (await prisma.sanPham.findUnique({ where: { MaSP: "SP_AX88D" } }))?.SoLuong || 0;
    const res = await fetch(`${BASE_URL}/api/admin/hoa-don-kho/${testHDKXuat}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lyDoHuy: "Hủy phiếu xuất kiểm thử BR-01" }),
    });
    const data = await res.json();
    const afterCancel = (await prisma.sanPham.findUnique({ where: { MaSP: "SP_AX88D" } }))?.SoLuong || 0;
    const passed = res.status === 200 && afterCancel === beforeCancel + 3;
    record(
      "TC-KHO-04",
      "Hủy phiếu xuất (BR-01)",
      `Tồn kho tự động hoàn nguyên cộng trả lại 3 cây (Từ ${beforeCancel} lên ${beforeCancel + 3})`,
      `Tồn kho thực tế: ${afterCancel}`,
      passed
    );
  } catch (err: any) {
    record("TC-KHO-04", "Hủy phiếu xuất (BR-01)", "+3 stock", err.message, false);
  }

  // TC-KHO-05: Hủy phiếu nhập đủ tồn (BR-01)
  try {
    const beforeCancel = (await prisma.sanPham.findUnique({ where: { MaSP: "SP_AX88D" } }))?.SoLuong || 0;
    const res = await fetch(`${BASE_URL}/api/admin/hoa-don-kho/${testHDKNhap}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lyDoHuy: "Hủy phiếu nhập kiểm thử BR-01 đủ tồn" }),
    });
    const data = await res.json();
    const afterCancel = (await prisma.sanPham.findUnique({ where: { MaSP: "SP_AX88D" } }))?.SoLuong || 0;
    const passed = res.status === 200 && afterCancel === beforeCancel - 10;
    record(
      "TC-KHO-05",
      "Hủy phiếu nhập đủ tồn (BR-01)",
      `Tồn kho tự động trừ trả lại 10 cây (Từ ${beforeCancel} về ${beforeCancel - 10})`,
      `Tồn kho thực tế: ${afterCancel}`,
      passed
    );
  } catch (err: any) {
    record("TC-KHO-05", "Hủy phiếu nhập đủ tồn (BR-01)", "-10 stock", err.message, false);
  }

  // TC-KHO-06: Hủy phiếu nhập thiếu tồn (BR-01)
  try {
    // Tạo 1 phiếu nhập 10 cây
    const resNhapMoi = await fetch(`${BASE_URL}/api/admin/hoa-don-kho`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loaiPhieu: "NHAP",
        maNCC: "NCC001",
        lyDo: "Tạo phiếu nhập để test thiếu tồn",
        items: [{ maSP: "SP_AX88D", soLuong: 10, donGia: 3500000 }],
      }),
    });
    const hdkMoi = (await resNhapMoi.json()).data?.MaHDK;

    // Bán bớt hàng: giảm tồn SP_AX88D xuống còn 5 cây (< 10 cây cần trừ)
    await prisma.sanPham.update({ where: { MaSP: "SP_AX88D" }, data: { SoLuong: 5 } });

    // Thử hủy phiếu nhập 10 cây khi chỉ còn 5 cây
    const resCancelFail = await fetch(`${BASE_URL}/api/admin/hoa-don-kho/${hdkMoi}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lyDoHuy: "Cố tình hủy khi đã bán hết" }),
    });
    const dataFail = await resCancelFail.json();
    const passed = resCancelFail.status === 400 && dataFail.error?.includes("không đủ để hoàn nguyên");

    // Khôi phục lại tồn
    await prisma.sanPham.update({ where: { MaSP: "SP_AX88D" }, data: { SoLuong: 15 } });
    await prisma.chiTietHoaDonKho.deleteMany({ where: { MaHDK: hdkMoi } });
    await prisma.hoaDonKho.delete({ where: { MaHDK: hdkMoi } });

    record(
      "TC-KHO-06",
      "Hủy phiếu nhập thiếu tồn (BR-01)",
      "Chặn đứng thao tác hủy, báo lỗi tồn kho không đủ để hoàn nguyên",
      `Status: ${resCancelFail.status}, Error: "${dataFail.error}"`,
      passed
    );
  } catch (err: any) {
    record("TC-KHO-06", "Hủy phiếu nhập thiếu tồn (BR-01)", "Blocked", err.message, false);
  }

  // TC-KHO-07: Hủy bỏ trống lý do
  try {
    // Tao phieu test
    const resNhapTest = await fetch(`${BASE_URL}/api/admin/hoa-don-kho`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loaiPhieu: "NHAP",
        maNCC: "NCC001",
        lyDo: "Phiếu test bỏ trống lý do",
        items: [{ maSP: "SP_AX88D", soLuong: 1, donGia: 3500000 }],
      }),
    });
    const testHDK = (await resNhapTest.json()).data?.MaHDK;

    const resNoReason = await fetch(`${BASE_URL}/api/admin/hoa-don-kho/${testHDK}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lyDoHuy: "" }),
    });
    const dataNoReason = await resNoReason.json();
    const passed = resNoReason.status === 400 && dataNoReason.error?.includes("nhập lý do");

    // Dọn dẹp
    await prisma.sanPham.update({ where: { MaSP: "SP_AX88D" }, data: { SoLuong: initStock } });
    if (testHDK) {
      await prisma.chiTietHoaDonKho.deleteMany({ where: { MaHDK: testHDK } });
      await prisma.hoaDonKho.delete({ where: { MaHDK: testHDK } });
    }

    record(
      "TC-KHO-07",
      "Hủy bỏ trống lý do",
      "Chặn hủy, bắt buộc nhập lý do hủy",
      `Status: ${resNoReason.status}, Error: "${dataNoReason.error}"`,
      passed
    );
  } catch (err: any) {
    record("TC-KHO-07", "Hủy bỏ trống lý do", "Reason required", err.message, false);
  }

  // =======================================================================
  // TỔNG KẾT KẾT QUẢ
  // =======================================================================
  console.log("\n==========================================================================================");
  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = totalTests - passedTests;
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);

  console.log(`TỔNG KẾT KIỂM THỬ: ${passedTests}/${totalTests} PASS (${passRate}%) - THẤT BẠI: ${failedTests}`);
  console.log("==========================================================================================");

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
