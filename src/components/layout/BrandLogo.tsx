import Link from "next/link";

interface BrandLogoProps {
  href?: string;
  tone?: "light" | "dark";
  subtitle?: string;
  size?: "sm" | "md";
}

// Bieu tuong qua cau long (shuttlecock) - dung chung cho storefront, footer, admin
export function BrandMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff8a50] via-[#f66315] to-[#d4520f] shadow-brand ${className}`}
    >
      <svg viewBox="0 0 32 32" className="h-[62%] w-[62%]" fill="none" aria-hidden="true">
        <path
          d="M16 27c2.2 0 4-1.6 4-3.6V22h-8v1.4c0 2 1.8 3.6 4 3.6Z"
          fill="white"
        />
        <path
          d="M12 22 7 6.5M20 22l5-15.5M14.6 22 13 5M17.4 22 19 5"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path d="M8.2 10.5c5.3-1.6 10.3-1.6 15.6 0" stroke="white" strokeOpacity=".7" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M9.6 15.5c4.3-1.2 8.5-1.2 12.8 0" stroke="white" strokeOpacity=".7" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export default function BrandLogo({
  href = "/",
  tone = "dark",
  subtitle = "Chuyên gia cầu lông",
  size = "md",
}: BrandLogoProps) {
  const isLight = tone === "light";
  return (
    <Link href={href} className="group flex shrink-0 items-center gap-2.5">
      <BrandMark className={size === "sm" ? "h-9 w-9" : "h-10 w-10"} />
      <span className="leading-none">
        <span
          className={`block font-display font-bold tracking-tight ${size === "sm" ? "text-lg" : "text-[22px]"} ${
            isLight ? "text-white" : "text-slate-900"
          }`}
        >
          FB<span className="text-[#f66315]">Shop</span>
        </span>
        {subtitle && (
          <span
            className={`mt-1 block text-[10px] font-medium uppercase tracking-[0.14em] ${
              isLight ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {subtitle}
          </span>
        )}
      </span>
    </Link>
  );
}
