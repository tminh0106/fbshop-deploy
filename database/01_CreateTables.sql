-- =======================================================
-- FBSHOP DATABASE - SCRIPT TAO 12 BANG (SQL Server)
-- Theo tai lieu Bao cao Do an muc 3.3.2
-- =======================================================

-- Tao Database
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'FBSHOP_DB')
BEGIN
  CREATE DATABASE FBSHOP_DB;
END
GO

USE FBSHOP_DB;
GO

-- -------------------------------------------------------
-- 1. KhachHang
-- -------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='KhachHang' AND xtype='U')
CREATE TABLE KhachHang (
  MaKH          NVARCHAR(30)   PRIMARY KEY,
  HoTen         NVARCHAR(100)  NOT NULL,
  SoDienThoai   VARCHAR(15)    NOT NULL UNIQUE,
  Email         VARCHAR(100)   NULL,
  DiaChi        NVARCHAR(255)  NULL,
  MatKhau       VARCHAR(255)   NOT NULL
);

-- -------------------------------------------------------
-- 2. NhanVien
-- -------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='NhanVien' AND xtype='U')
CREATE TABLE NhanVien (
  MaNV          NVARCHAR(30)   PRIMARY KEY,
  HoTen         NVARCHAR(100)  NOT NULL,
  SoDienThoai   VARCHAR(15)    NOT NULL,
  DiaChi        NVARCHAR(255)  NULL,
  LuongCoBan    DECIMAL(15,0)  NOT NULL DEFAULT 0,
  PhuCap        DECIMAL(15,0)  NOT NULL DEFAULT 0,
  TrangThai     NVARCHAR(50)   NOT NULL DEFAULT N'Dang lam viec'
);

-- -------------------------------------------------------
-- 3. TaiKhoan
-- -------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TaiKhoan' AND xtype='U')
CREATE TABLE TaiKhoan (
  MaTK          NVARCHAR(30)   PRIMARY KEY,
  TenDangNhap   VARCHAR(100)   NOT NULL UNIQUE,
  MatKhau       VARCHAR(255)   NOT NULL,
  PhanQuyen     NVARCHAR(50)   NOT NULL, -- Admin, QuanLyKho, NhanVien, KhachHang
  TrangThai     NVARCHAR(50)   NOT NULL DEFAULT N'Hoat dong',
  MaNV          NVARCHAR(30)   NULL,
  CONSTRAINT FK_TaiKhoan_NhanVien FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV)
);

-- -------------------------------------------------------
-- 4. NhaCungCap
-- -------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='NhaCungCap' AND xtype='U')
CREATE TABLE NhaCungCap (
  MaNCC         NVARCHAR(30)   PRIMARY KEY,
  TenNCC        NVARCHAR(150)  NOT NULL,
  SoDienThoai   VARCHAR(15)    NOT NULL,
  DiaChi        NVARCHAR(255)  NULL,
  Email         VARCHAR(100)   NULL,
  MaSoThue      VARCHAR(20)    NULL,
  NguoiDaiDien  NVARCHAR(100)  NULL,
  GhiChu        NVARCHAR(500)  NULL,
  TrangThai     NVARCHAR(50)   NOT NULL DEFAULT N'Dang hop tac'
);

-- -------------------------------------------------------
-- 5. Voucher
-- -------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Voucher' AND xtype='U')
CREATE TABLE Voucher (
  MaVoucher         VARCHAR(50)    PRIMARY KEY,
  LoaiGiamGia       NVARCHAR(30)   NOT NULL, -- TIEN / PHANTRAM
  GiaTriGiam        DECIMAL(15,2)  NOT NULL,
  DonHangToiThieu   DECIMAL(15,0)  NOT NULL DEFAULT 0,
  MucGiamToiDa      DECIMAL(15,0)  NOT NULL DEFAULT 0,
  TongSoLuong       INT            NOT NULL DEFAULT 0,
  GioiHanSuDung     INT            NOT NULL DEFAULT 1,
  NgayBatDau        DATETIME       NOT NULL,
  NgayKetThuc       DATETIME       NOT NULL,
  TrangThai         NVARCHAR(50)   NOT NULL DEFAULT N'Dang hoat dong'
);

-- -------------------------------------------------------
-- 6. DanhMuc
-- -------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DanhMuc' AND xtype='U')
CREATE TABLE DanhMuc (
  MaDanhMuc     VARCHAR(50)    PRIMARY KEY,
  TenDanhMuc    NVARCHAR(100)  NOT NULL
);

-- -------------------------------------------------------
-- 7. SanPham
-- -------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SanPham' AND xtype='U')
CREATE TABLE SanPham (
  MaSP          VARCHAR(50)    PRIMARY KEY,
  TenSP         NVARCHAR(200)  NOT NULL,
  GiaBan        DECIMAL(15,0)  NOT NULL,
  SoLuong       INT            NOT NULL DEFAULT 0,
  TrongLuong    VARCHAR(10)    NULL,
  HinhAnh       NVARCHAR(500)  NULL,
  MoTa          NVARCHAR(MAX)  NULL,
  MaDanhMuc     VARCHAR(50)    NOT NULL,
  CONSTRAINT FK_SanPham_DanhMuc FOREIGN KEY (MaDanhMuc) REFERENCES DanhMuc(MaDanhMuc)
);

-- -------------------------------------------------------
-- 8. DonHang
-- -------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DonHang' AND xtype='U')
CREATE TABLE DonHang (
  MaDH                NVARCHAR(50)   PRIMARY KEY,
  NgayTao             DATETIME       NOT NULL DEFAULT GETDATE(),
  TrangThai           NVARCHAR(50)   NOT NULL DEFAULT N'Cho xac nhan',
  TongTien            DECIMAL(15,0)  NOT NULL DEFAULT 0,
  TenNguoiNhan        NVARCHAR(100)  NOT NULL,
  SdtNguoiNhan        VARCHAR(15)    NOT NULL,
  DiaChiNhan          NVARCHAR(255)  NOT NULL,
  PhuongThucThanhToan NVARCHAR(50)   NOT NULL DEFAULT N'COD',
  GhiChu              NVARCHAR(500)  NULL,
  MaKH                NVARCHAR(30)   NOT NULL,
  MaVoucher           VARCHAR(50)    NULL,
  CONSTRAINT FK_DonHang_KhachHang FOREIGN KEY (MaKH) REFERENCES KhachHang(MaKH),
  CONSTRAINT FK_DonHang_Voucher   FOREIGN KEY (MaVoucher) REFERENCES Voucher(MaVoucher)
);

-- -------------------------------------------------------
-- 9. ChiTietDonHang
-- -------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ChiTietDonHang' AND xtype='U')
CREATE TABLE ChiTietDonHang (
  MaDH          NVARCHAR(50)   NOT NULL,
  MaSP          VARCHAR(50)    NOT NULL,
  SoLuong       INT            NOT NULL,
  DonGia        DECIMAL(15,0)  NOT NULL,
  ThanhTien     DECIMAL(15,0)  NOT NULL,
  CONSTRAINT PK_ChiTietDonHang PRIMARY KEY (MaDH, MaSP),
  CONSTRAINT FK_CTDH_DonHang   FOREIGN KEY (MaDH) REFERENCES DonHang(MaDH),
  CONSTRAINT FK_CTDH_SanPham   FOREIGN KEY (MaSP) REFERENCES SanPham(MaSP)
);

-- -------------------------------------------------------
-- 10. HangHoaKho
-- -------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='HangHoaKho' AND xtype='U')
CREATE TABLE HangHoaKho (
  MaHangHoa     NVARCHAR(30)   PRIMARY KEY,
  ViTriKho      NVARCHAR(100)  NULL,
  SoLuong       INT            NOT NULL DEFAULT 0,
  DonGiaNhap    DECIMAL(15,0)  NOT NULL,
  NgayNhap      DATETIME       NOT NULL DEFAULT GETDATE(),
  HanSuDung     DATETIME       NULL,
  GhiChu        NVARCHAR(500)  NULL,
  MaSP          VARCHAR(50)    NOT NULL,
  CONSTRAINT FK_HangHoaKho_SanPham FOREIGN KEY (MaSP) REFERENCES SanPham(MaSP)
);

-- -------------------------------------------------------
-- 11. HoaDonKho
-- -------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='HoaDonKho' AND xtype='U')
CREATE TABLE HoaDonKho (
  MaHDK         NVARCHAR(30)   PRIMARY KEY,
  NgayLap       DATETIME       NOT NULL DEFAULT GETDATE(),
  LoaiPhieu     NVARCHAR(30)   NOT NULL, -- Nhap kho / Xuat kho
  LyDo          NVARCHAR(500)  NULL,
  TongTien      DECIMAL(15,0)  NOT NULL DEFAULT 0,
  TrangThai     NVARCHAR(50)   NOT NULL DEFAULT N'Hoan thanh',
  MaNV          NVARCHAR(30)   NOT NULL,
  MaNCC         NVARCHAR(30)   NULL,
  CONSTRAINT FK_HoaDonKho_NhanVien   FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV),
  CONSTRAINT FK_HoaDonKho_NhaCungCap FOREIGN KEY (MaNCC) REFERENCES NhaCungCap(MaNCC)
);

-- -------------------------------------------------------
-- 12. ChiTietHoaDonKho
-- -------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ChiTietHoaDonKho' AND xtype='U')
CREATE TABLE ChiTietHoaDonKho (
  MaHDK         NVARCHAR(30)   NOT NULL,
  MaSP          VARCHAR(50)    NOT NULL,
  SoLuong       INT            NOT NULL,
  DonGia        DECIMAL(15,0)  NOT NULL,
  ThanhTien     DECIMAL(15,0)  NOT NULL,
  CONSTRAINT PK_ChiTietHoaDonKho PRIMARY KEY (MaHDK, MaSP),
  CONSTRAINT FK_CTHDKHO_HoaDonKho FOREIGN KEY (MaHDK) REFERENCES HoaDonKho(MaHDK),
  CONSTRAINT FK_CTHDKHO_SanPham   FOREIGN KEY (MaSP) REFERENCES SanPham(MaSP)
);

PRINT N'=== DA TAO XONG 12 BANG CHO FBSHOP_DB ===';
GO
