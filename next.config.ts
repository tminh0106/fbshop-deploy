import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // An nut tron "N" (dev tools cua Next.js) khi chay npm run dev; loi bien dich van hien binh thuong
  devIndicators: false,
  // Hosting dung chung gioi han so tien trinh: dat NEXT_BUILD_CPUS=1 khi build tren may chu
  // (mac dinh Next.js mo so tien trinh = so nhan CPU -> loi spawn EAGAIN)
  ...(process.env.NEXT_BUILD_CPUS && { experimental: { cpus: Number(process.env.NEXT_BUILD_CPUS) } }),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    unoptimized: true,
  },
  // Anh san pham mau trong public/images la SVG nhung dat duoi .jpg (khop duong dan trong CSDL)
  // -> tra dung Content-Type de trinh duyet hien thi duoc
  async headers() {
    return [
      {
        source: "/images/:file*.jpg",
        headers: [{ key: "Content-Type", value: "image/svg+xml" }],
      },
      {
        source: "/images/placeholder.png",
        headers: [{ key: "Content-Type", value: "image/svg+xml" }],
      },
    ];
  },
};

export default nextConfig;
