-- =======================================================
-- FBSHOP DATABASE - SEED DATA
-- Nap du lieu mau cho DanhMuc, SanPham, TaiKhoan test
-- =======================================================
USE FBSHOP_DB;
GO

-- ============================================
-- DANH MUC
-- ============================================
INSERT INTO DanhMuc (MaDanhMuc, TenDanhMuc) VALUES
('DM_YONEX',   N'Vot Cau Long Yonex'),
('DM_LINING',  N'Vot Cau Long Lining'),
('DM_VICTOR',  N'Vot Cau Long Victor'),
('DM_MIZUNO',  N'Vot Cau Long Mizuno'),
('DM_GIAY',    N'Giay Cau Long'),
('DM_BALO',    N'Balo & Bao Vot'),
('DM_PHUKIEN', N'Phu Kien Cau Long');
GO

-- ============================================
-- SAN PHAM - YONEX (Astrox, Nanoflare, ArcSaber)
-- ============================================
INSERT INTO SanPham (MaSP, TenSP, GiaBan, SoLuong, TrongLuong, HinhAnh, MoTa, MaDanhMuc) VALUES
('SP_AX88D',   N'Vot Cau Long Yonex Astrox 88D Pro',    4150000, 15, '4U', '/images/yonex-astrox-88d-pro.jpg',   N'Dong vot thien cong manh me, smash uy luc.', 'DM_YONEX'),
('SP_AX100ZZ', N'Vot Cau Long Yonex Astrox 100ZZ',      4400000, 10, '3U', '/images/yonex-astrox-100zz.jpg',     N'Cuc pham tan cong cua Viktor Axelsen.', 'DM_YONEX'),
('SP_NF700',   N'Vot Cau Long Yonex Nanoflare 700',     3850000, 20, '4U', '/images/yonex-nanoflare-700.jpg',    N'Vot toc do cao, linh hoat.', 'DM_YONEX'),
('SP_NF800P',  N'Vot Cau Long Yonex Nanoflare 800 Pro', 4200000, 12, '4U', '/images/yonex-nanoflare-800-pro.jpg',N'Toc do chop nhoang.', 'DM_YONEX'),
('SP_ARC11P',  N'Vot Cau Long Yonex Arcsaber 11 Pro',   4250000, 18, '4U', '/images/yonex-arcsaber-11-pro.jpg',  N'Cong thu toan dien hoan hao.', 'DM_YONEX');
GO

-- ============================================
-- SAN PHAM - LINING (Axforce, Halbertec, Tectonic)
-- ============================================
INSERT INTO SanPham (MaSP, TenSP, GiaBan, SoLuong, TrongLuong, HinhAnh, MoTa, MaDanhMuc) VALUES
('SP_AXF80',   N'Vot Cau Long Lining Axforce 80',               4100000, 14, '4U', '/images/lining-axforce-80.jpg',       N'Tan cong uy luc, tro luc smash cuc tot.', 'DM_LINING'),
('SP_AXF90',   N'Vot Cau Long Lining Axforce 90 Dragon Max',    4600000,  8, '3U', '/images/lining-axforce-90-max.jpg',    N'Dong vot dinh cao tan cong dam chac.', 'DM_LINING'),
('SP_HLB8000', N'Vot Cau Long Lining Halbertec 8000',           4300000, 16, '4U', '/images/lining-halbertec-8000.jpg',    N'Kiem soat diem roi tinh chuan.', 'DM_LINING'),
('SP_TEC9',    N'Vot Cau Long Lining Tectonic 9',               3900000, 10, '4U', '/images/lining-tectonic-9.jpg',        N'Hap thu chan, dan hoi nhanh.', 'DM_LINING');
GO

-- ============================================
-- SAN PHAM - VICTOR (Thruster K, Auraspeed)
-- ============================================
INSERT INTO SanPham (MaSP, TenSP, GiaBan, SoLuong, TrongLuong, HinhAnh, MoTa, MaDanhMuc) VALUES
('SP_TKRYUGA',  N'Vot Cau Long Victor Thruster Ryuga II', 3950000, 15, '4U', '/images/victor-thruster-ryuga-2.jpg', N'Cay vot rong dap cau cam san.', 'DM_VICTOR'),
('SP_ARS100X',  N'Vot Cau Long Victor Auraspeed 100X',    4050000, 12, '4U', '/images/victor-auraspeed-100x.jpg',   N'Phan tat toc do cao.', 'DM_VICTOR'),
('SP_DRIVEX9X', N'Vot Cau Long Victor DriveX 9X',         3800000,  9, '3U', '/images/victor-drivex-9x.jpg',        N'Vot dam tay, on dinh.', 'DM_VICTOR');
GO

-- ============================================
-- SAN PHAM - MIZUNO
-- ============================================
INSERT INTO SanPham (MaSP, TenSP, GiaBan, SoLuong, TrongLuong, HinhAnh, MoTa, MaDanhMuc) VALUES
('SP_FT11Q', N'Vot Cau Long Mizuno Fortius 11 Quick', 4500000, 7, '4U', '/images/mizuno-fortius-11-quick.jpg', N'Vot cao cap Nhat Ban.', 'DM_MIZUNO'),
('SP_JPX8F', N'Vot Cau Long Mizuno JPX 8 Force',      3200000, 11, '4U', '/images/mizuno-jpx-8-force.jpg',     N'Vot tam trung de thuan.', 'DM_MIZUNO');
GO

-- ============================================
-- NHAN VIEN MAU
-- ============================================
INSERT INTO NhanVien (MaNV, HoTen, SoDienThoai, DiaChi, LuongCoBan, PhuCap, TrangThai) VALUES
('NV001', N'Nguyen Van Admin',    '0901000001', N'277 Nguyen Trai, Ha Noi', 15000000, 3000000, N'Dang lam viec'),
('NV002', N'Tran Thi Kho',       '0901000002', N'Ha Noi', 10000000, 2000000, N'Dang lam viec'),
('NV003', N'Le Van BanHang',     '0901000003', N'Ha Noi',  9000000, 1500000, N'Dang lam viec');
GO

-- ============================================
-- TAI KHOAN MAU (Mat khau plaintext cho test: 123456)
-- Admin, QuanLyKho, NhanVien, KhachHang
-- ============================================
INSERT INTO TaiKhoan (MaTK, TenDangNhap, MatKhau, PhanQuyen, TrangThai, MaNV) VALUES
('TK001', 'admin@fbshop.vn',    '123456', N'Admin',      N'Hoat dong', 'NV001'),
('TK002', 'kho@fbshop.vn',      '123456', N'QuanLyKho',  N'Hoat dong', 'NV002'),
('TK003', 'banhang@fbshop.vn',  '123456', N'NhanVien',   N'Hoat dong', 'NV003');
GO

-- Tai khoan khach hang mau
INSERT INTO KhachHang (MaKH, HoTen, SoDienThoai, Email, DiaChi, MatKhau) VALUES
('KH001', N'Pham Thi Khach Hang', '0912345678', 'khach@gmail.com', N'Ha Noi', '123456');
GO

INSERT INTO TaiKhoan (MaTK, TenDangNhap, MatKhau, PhanQuyen, TrangThai, MaNV) VALUES
('TK004', 'khach@gmail.com', '123456', N'KhachHang', N'Hoat dong', NULL);
GO

-- ============================================
-- NHA CUNG CAP MAU
-- ============================================
INSERT INTO NhaCungCap (MaNCC, TenNCC, SoDienThoai, DiaChi, Email, MaSoThue, NguoiDaiDien, TrangThai) VALUES
('NCC001', N'Yonex Viet Nam',     '0281234567', N'TP. Ho Chi Minh', 'yonex@vn.com',  '0312345678', N'Nguyen Van Y', N'Dang hop tac'),
('NCC002', N'Lining Viet Nam',    '0281234568', N'Ha Noi',          'lining@vn.com', '0312345679', N'Tran Van L',   N'Dang hop tac'),
('NCC003', N'Victor Viet Nam',    '0281234569', N'Ha Noi',          'victor@vn.com', '0312345680', N'Le Van V',     N'Dang hop tac');
GO

-- ============================================
-- VOUCHER MAU
-- ============================================
INSERT INTO Voucher (MaVoucher, LoaiGiamGia, GiaTriGiam, DonHangToiThieu, MucGiamToiDa, TongSoLuong, GioiHanSuDung, NgayBatDau, NgayKetThuc, TrangThai) VALUES
('FBSHOP50K',   N'TIEN',     50000,  1000000, 50000,  500, 1, '2026-09-01', '2026-10-31', N'Dang hoat dong'),
('FBSHOP10',    N'PHANTRAM',  10,     2000000, 300000, 200, 1, '2026-09-01', '2026-10-31', N'Dang hoat dong'),
('CHAOBANMOI',  N'TIEN',     100000, 1500000, 100000, 1000, 1, '2026-09-01', '2026-12-31', N'Dang hoat dong');
GO

PRINT N'=== DA NAP SEED DATA HOAN TAT ===';
GO
