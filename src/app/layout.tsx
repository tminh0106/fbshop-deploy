import type { Metadata } from "next";
import { Familjen_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Font chinh (giong fbshop.vn): Familjen Grotesk - grotesk hien dai, ho tro day du tieng Viet
const familjen = Familjen_Grotesk({
  variable: "--font-familjen",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});
// Font ma so: ma don hang, ma san pham, ma phieu kho
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FBShop - Chuyên gia dụng cụ cầu lông",
  description:
    "Hệ thống website thương mại điện tử bán dụng cụ cầu lông FBShop. Vợt Yonex, Lining, Victor, Mizuno chính hãng. Giá tốt nhất thị trường.",
  keywords: ["cầu lông", "vợt cầu lông", "FBShop", "Yonex", "Lining", "Victor", "Mizuno"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${familjen.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
