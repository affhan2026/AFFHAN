import { FooterSection } from "@/components/sections/FooterSection";
import { MarketplaceHeroSection } from "@/components/sections/MarketplaceHeroSection";
import { PopularProductsSection } from "@/components/sections/PopularProductsSection";
import { ProductCategoriesSection } from "@/components/sections/ProductCategoriesSection";

export default function Home() {
  return (
    <main className="w-full overflow-x-hidden scroll-smooth bg-slate-50">
      <MarketplaceHeroSection />
      <ProductCategoriesSection />
      <PopularProductsSection />
      <FooterSection />
    </main>
  );
}
