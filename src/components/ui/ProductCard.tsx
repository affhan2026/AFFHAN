"use client";

import { useState } from "react";
import Image from "next/image";

export interface ProductCardData {
  id: number | string;
  name: string;
  imageUrl?: string | null;
  category?: string | null;
  categoryRef?: { name: string | null } | null;
}

interface ProductCardProps {
  product: ProductCardData;
  onClick: () => void;
}

// Shared product card used by every product grid (homepage desktop/mobile
// grids, catalog page). Do not add a `title=` attribute to the name — that
// triggers a native browser tooltip, which was one of the recurring bugs
// this component was created to stop reintroducing per-page.
export function ProductCard({ product, onClick }: ProductCardProps) {
  const categoryLabel = product.categoryRef?.name || product.category || "Product";
  // CJ's hotlinked CDN images occasionally go dead — next/image renders
  // nothing visible when a remote image 404s/errors, which looked like a
  // blank, borderless hole in the grid. Track load failure and fall back
  // to the same placeholder used for a missing imageUrl.
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = product.imageUrl && !imageFailed;

  return (
    <button
      onClick={onClick}
      className="group flex flex-col text-left w-full bg-white rounded-2xl border border-slate-200/70 hover:border-brand/30 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_-12px_rgba(15,23,42,0.18)] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      {/* Fixed image height so cards stay a consistent height regardless of
          how many grid columns fit. */}
      <div className="relative w-full h-40 sm:h-48 shrink-0 bg-slate-50 overflow-hidden">
        {showImage ? (
          <Image
            src={product.imageUrl as string}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, (max-width: 1536px) 20vw, 16vw"
            className="object-cover group-hover:scale-[1.07] transition-transform duration-500 ease-out"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-sm">No Image</div>
        )}
        {/* Category chip floating on the image */}
        <span className="absolute top-2.5 left-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-700 bg-white/85 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm max-w-[85%] truncate">
          {categoryLabel}
        </span>
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-3 sm:p-4 flex flex-col w-full shrink-0">
        <div className="h-[40px] sm:h-[44px] mb-2.5 sm:mb-3 w-full">
          <h3 className="text-[13.5px] sm:text-sm font-bold text-slate-800 leading-snug line-clamp-2 tracking-[-0.01em]">
            {product.name}
          </h3>
        </div>
        <div className="mt-auto">
          <span className="flex items-center justify-center gap-1.5 text-[11px] sm:text-[12px] font-bold text-slate-700 bg-slate-100 px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl group-hover:bg-brand group-hover:text-white group-hover:shadow-md group-hover:shadow-brand/25 transition-all w-full">
            Inquire Now
            <svg className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </span>
        </div>
      </div>
    </button>
  );
}
