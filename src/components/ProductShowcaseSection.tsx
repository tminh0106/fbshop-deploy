import Image from "next/image";
import Link from "next/link";
import ProductCard from "./ProductCard";
import type { ProductItem } from "@/lib/types";

interface ProductShowcaseProps {
  title: string;
  categoryLink: string;
  bannerImage: string;
  products: ProductItem[];
  reverse?: boolean;
}

export default function ProductShowcaseSection({
  title,
  categoryLink,
  bannerImage,
  products,
  reverse = false,
}: ProductShowcaseProps) {
  return (
    <section className="container mx-auto my-12 px-4">
      {/* Tieu de & Nut Xem tat ca */}
      <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold uppercase tracking-wide text-slate-800">
          {title}
        </h2>
        <Link
          href={categoryLink}
          className="text-sm font-semibold text-[#f66315] transition-colors hover:text-[#d4520f]"
        >
          Xem tat ca &rarr;
        </Link>
      </div>

      {/* Bo cuc Banner + Luoi */}
      <div
        className={"flex flex-col gap-6 lg:flex-row" + (reverse ? " lg:flex-row-reverse" : "")}
      >
        {/* Banner Doc thuong hieu (1/4) */}
        <div className="relative h-64 w-full overflow-hidden rounded-2xl lg:h-auto lg:w-1/4">
          <Image
            src={bannerImage}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 hover:scale-105"
          />
        </div>

        {/* Luoi san pham (3/4) */}
        <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
