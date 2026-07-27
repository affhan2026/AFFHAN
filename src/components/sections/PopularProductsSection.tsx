"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { ProductCard } from "@/components/ui/ProductCard";
import { InquiryModal } from "@/components/ui/InquiryModal";

export function PopularProductsSection() {
  const [products, setProducts] = useState<any[]>([]);
  const [inquiryProduct, setInquiryProduct] = useState<any | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/products?limit=18")
      .then((res) => res.json())
      .then((data) => {
        if (data?.data) setProducts(data.data.slice(0, 18));
      })
      .catch((err) => console.error(err));
  }, []);

  const scroll = (dir: number) => {
    if (railRef.current) railRef.current.scrollBy({ left: dir * 640, behavior: "smooth" });
  };

  return (
    <section id="popular-products" className="w-full bg-slate-50 py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-brand">
              <Flame size={14} /> Popular Products
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900">
              Trending products ready for global sourcing
            </h2>
            <p className="mt-2 text-slate-500 max-w-xl">
              High-demand listings across our top sourcing categories. Tap any product to request a quote.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex gap-2">
              <button onClick={() => scroll(-1)} aria-label="Scroll left" className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-brand/40 hover:text-brand-dark transition-colors">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => scroll(1)} aria-label="Scroll right" className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-brand/40 hover:text-brand-dark transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
            <Link href="/products" className="inline-flex items-center gap-2 text-sm font-bold text-brand-dark hover:gap-3 transition-all">
              View more <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="flex gap-4 overflow-hidden">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="w-[220px] shrink-0 rounded-xl border border-slate-100 overflow-hidden">
                <div className="h-44 bg-slate-100 animate-pulse" />
                <div className="p-4 space-y-2"><div className="h-3.5 bg-slate-100 rounded animate-pulse w-3/4" /><div className="h-8 bg-slate-100 rounded-full animate-pulse mt-3" /></div>
              </div>
            ))}
          </div>
        ) : (
          <div
            ref={railRef}
            className="flex gap-4 overflow-x-auto pb-2 snap-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {products.map((product) => (
              <div key={product.id} className="w-[200px] sm:w-[230px] shrink-0 snap-start">
                <ProductCard product={product} onClick={() => setInquiryProduct(product)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {inquiryProduct && (
        <InquiryModal product={inquiryProduct} onClose={() => setInquiryProduct(null)} />
      )}
    </section>
  );
}
