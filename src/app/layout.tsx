import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FBShop - Chuyen gia dung cu cau long",
  description:
    "He thong website thuong mai dien tu ban dung cu cau long FBShop. Vot Yonex, Lining, Victor, Mizuno chinh hang. Gia tot nhat thi truong.",
  keywords: ["cau long", "vot cau long", "FBShop", "Yonex", "Lining", "Victor", "Mizuno"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={geistSans.variable + " " + geistMono.variable + " antialiased"}
      >
        {children}
      </body>
    </html>
  );
}
