"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Search, X, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { FooterSection } from "@/components/sections/FooterSection";
import { InquiryModal } from "@/components/ui/InquiryModal";
import { ProductCard } from "@/components/ui/ProductCard";
import { CategoryTile } from "@/components/ui/CategoryTile";
import { Pagination } from "@/components/ui/Pagination";
import { buildCategoryTree, flattenLeaves } from "@/lib/categoryTree";

const PAGE_SIZE = 48; // divisible by 2/3/4/6 so every column layout fills whole rows

// Reads ?q= / ?categoryId= reactively WITHOUT next/navigation's
// useSearchParams — that requires a Suspense boundary and, in this setup,
// the boundary re-suspended on the client and left the page stuck on its
// fallback. We read window.location and re-read on history changes
// (router.push patches pushState, which we hook) so same-page category
// navigations still update.
function useUrlParams() {
  const [search, setSearch] = useState<string>(typeof window !== "undefined" ? window.location.search : "");
  useEffect(() => {
    const update = () => {
      setTimeout(() => {
        setSearch(window.location.search);
      }, 0);
    };
    window.addEventListener("popstate", update);
    const origPush = history.pushState;
    const origReplace = history.replaceState;
    history.pushState = function (...args: any[]) { origPush.apply(this, args as any); update(); };
    history.replaceState = function (...args: any[]) { origReplace.apply(this, args as any); update(); };
    update();
    return () => {
      window.removeEventListener("popstate", update);
      history.pushState = origPush;
      history.replaceState = origReplace;
    };
  }, []);
  return new URLSearchParams(search);
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState("newest");

  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalProductCount, setTotalProductCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [inquiryProduct, setInquiryProduct] = useState<any | null>(null);

  // Guards against out-of-order responses (initial unfiltered fetch racing
  // the deep-linked ?q=/?categoryId= fetch that immediately follows).
  const requestSeq = useRef(0);

  const searchParams = useUrlParams();
  const spString = searchParams.toString();

  // Sync query / category from URL whenever it changes
  useEffect(() => {
    const q = searchParams.get("q") || "";
    const cat = searchParams.get("categoryId") || null;

    setQuery(q);
    setDebouncedQuery(q);
    setActiveCategoryId(cat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spString]);

  // Fetch categories (one time) — used to expand a category to its
  // descendant ids and to name the "Browsing Category" badge.
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          setCategories(json.data || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  // Debounce search — skip the first run so a deep-linked ?q= isn't stomped.
  const isInitialRender = useRef(true);
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    const handler = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(handler);
  }, [query]);

  const getCategoryIdsParam = (categoryId: string | null, allCats: any[]): string | null => {
    if (!categoryId) return null;
    if (!allCats.length) return categoryId;
    const descendants = (targetId: string): string[] => {
      const ids = [targetId];
      for (const child of allCats.filter(c => c.parentId === targetId)) {
        ids.push(...descendants(child.id));
      }
      return ids;
    };
    return descendants(categoryId).join(',');
  };

  const activeCategoryIdsParam = useMemo(
    () => getCategoryIdsParam(activeCategoryId, categories),
    [activeCategoryId, categories]
  );

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  // Locate a node anywhere in the tree by id.
  const findTreeNode = (nodes: any[], targetId: string): any => {
    for (const node of nodes) {
      if (node.id === targetId) return node;
      const found = findTreeNode(node.children || [], targetId);
      if (found) return found;
    }
    return null;
  };

  const toChip = (c: any) => ({
    id: c.id,
    name: c.name,
    count: c.recursiveProductCount as number,
    thumbnailUrl: (c.displayThumbnail ?? null) as string | null,
  });

  const rootChips = useMemo(
    () => categoryTree.map(toChip).sort((a, b) => a.name.localeCompare(b.name)),
    [categoryTree]
  );

  const popularSubcategories = useMemo(() => {
    const allLeaves = categoryTree.flatMap(flattenLeaves);
    return allLeaves
      .sort((a, b) => (b.recursiveProductCount - a.recursiveProductCount) || a.name.localeCompare(b.name))
      .slice(0, 20)
      .map(toChip);
  }, [categoryTree]);

  // The category row shown under the breadcrumb. Rules:
  //  • root (nothing active)        → top-level categories
  //  • active node WITH children    → its children (drill one level deeper)
  //  • active LEAF (no children)    → its siblings (parent's children), with the
  //    active leaf highlighted — so users never lose sibling browsing.
  const levelOptions = useMemo(() => {
    const byCount = (a: any, b: any) => (b.recursiveProductCount - a.recursiveProductCount) || a.name.localeCompare(b.name);
    if (!activeCategoryId || !categoryTree.length) {
      return { label: "Browse by Category", items: rootChips, activeId: null as string | null };
    }
    const active = findTreeNode(categoryTree, activeCategoryId);
    if (!active) return { label: "Browse by Category", items: rootChips, activeId: null as string | null };
    if (active.children?.length) {
      return { label: "Refine within this category", items: [...active.children].sort(byCount).map(toChip), activeId: null as string | null };
    }
    const parent = active.parentId ? findTreeNode(categoryTree, active.parentId) : null;
    const items = (parent ? [...parent.children].sort(byCount) : [active]).map(toChip);
    return { label: parent ? `More in ${parent.name}` : "Browse by Category", items, activeId: activeCategoryId };
  }, [activeCategoryId, categoryTree, rootChips]);

  // Full ancestor path (root → … → active) for the drill-down breadcrumb, so a
  // shopper always sees where they are and can jump back up any level.
  const categoryPath = useMemo(() => {
    if (!activeCategoryId || !categories.length) return [] as { id: string; name: string }[];
    const byId = new Map(categories.map(c => [c.id, c]));
    const path: { id: string; name: string }[] = [];
    let cur = byId.get(activeCategoryId);
    const guard = new Set<string>(); // defend against any accidental parent cycle
    while (cur && !guard.has(cur.id)) {
      guard.add(cur.id);
      path.unshift({ id: cur.id, name: cur.name });
      cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
    return path;
  }, [activeCategoryId, categories]);

  // Drill into (or, with null, clear) a category via the URL so it stays
  // shareable/back-button friendly.
  const goToCategory = (categoryId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId) params.set("categoryId", categoryId);
    else params.delete("categoryId");
    router.push(`/products?${params.toString()}`);
  };

  const fetchProducts = async (
    searchQuery: string,
    catId: string | null,
    sort: string,
    pageNum: number
  ) => {
    const seq = ++requestSeq.current;
    try {
      setLoading(true);
      setError(null);

      const finalCatId = catId;
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (finalCatId) params.append("categoryId", finalCatId);
      if (sort) params.append("sortBy", sort);
      const isDefaultView = !searchQuery && !finalCatId;
      if (searchQuery || isDefaultView) params.append("getChips", "true");
      params.append("page", pageNum.toString());
      params.append("limit", String(PAGE_SIZE));

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const json = await res.json();
      if (seq !== requestSeq.current) return;

      setProducts(json.data);
      setTotalPages(json.pagination.totalPages);
      setTotalProductCount(json.pagination.total);
    } catch (err: any) {
      if (seq === requestSeq.current) setError(err.message);
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchProducts(debouncedQuery, activeCategoryIdsParam, sortBy, 1);
  }, [debouncedQuery, activeCategoryIdsParam, sortBy]);

  const goToPage = (p: number) => {
    setPage(p);
    fetchProducts(debouncedQuery, activeCategoryIdsParam, sortBy, p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.delete('categoryId'); // New searches are global by default
    if (query) {
      params.set('q', query);
    } else {
      params.delete('q');
    }
    router.push(`/products?${params.toString()}`);
  };

  const handleClearAll = () => {
    setSortBy("newest");
    setQuery("");
    router.push('/products');
  };

  const gridClass = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4";

  return (
    <div className="min-h-screen bg-slate-50 font-sans pt-28">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pb-12">
        <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Product Catalog</h1>
            <p className="text-slate-500 mt-2">
              {totalProductCount.toLocaleString()} products available
            </p>
          </div>

          <form onSubmit={handleSearch} className="w-full xl:w-[440px] relative flex-shrink-0">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all bg-white"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 flex items-center justify-center bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Sort</span>
              <select
                className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand bg-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="alpha">A-Z</option>
              </select>
            </div>

            <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1"></div>

            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors ml-auto sm:ml-0"
            >
              Clear All Filters
            </button>
          </div>

          {rootChips.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              {/* Breadcrumb trail — shows where you are in the tree and lets you
                  jump back up to any ancestor level. Sits as the card header,
                  only once you've drilled into a category. */}
              {categoryPath.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 text-sm px-4 sm:px-5 py-3 border-b border-slate-100">
                  <button
                    onClick={() => goToCategory(null)}
                    className="font-bold text-slate-500 hover:text-brand-dark transition-colors"
                  >
                    All Categories
                  </button>
                  {categoryPath.map((seg, i) => {
                    const isLast = i === categoryPath.length - 1;
                    return (
                      <span key={seg.id} className="flex items-center gap-1">
                        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                        <button
                          onClick={() => goToCategory(seg.id)}
                          disabled={isLast}
                          className={`font-bold transition-colors ${isLast ? "text-brand-dark cursor-default" : "text-slate-500 hover:text-brand-dark"}`}
                        >
                          {seg.name}
                        </button>
                      </span>
                    );
                  })}
                  <button
                    onClick={() => goToCategory(null)}
                    className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                </div>
              )}

              <div className="p-4 sm:p-5 flex flex-col gap-6">
                {/* Current level as a uniform, wrapping image-tile grid — no
                    horizontal scroll, columns line up across rows and fill the
                    width. Root → top categories; parent → its subcategories;
                    leaf → its siblings (active one highlighted). */}
                {levelOptions.items.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{levelOptions.label}:</span>
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-x-2 gap-y-5 mt-3">
                      {levelOptions.items.map((chip) => (
                        <CategoryTile
                          key={chip.id}
                          name={chip.name}
                          thumbnailUrl={chip.thumbnailUrl}
                          count={chip.count}
                          active={chip.id === levelOptions.activeId}
                          onClick={() => goToCategory(chip.id)}
                          className="w-full"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular subcategories — discovery shortcut, top level only. */}
                {!activeCategoryId && popularSubcategories.length > 0 && (
                  <div className="pt-5 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Popular Subcategories:</span>
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-x-2 gap-y-5 mt-3">
                      {popularSubcategories.map((chip) => (
                        <CategoryTile
                          key={`pop-${chip.id}`}
                          name={chip.name}
                          thumbnailUrl={chip.thumbnailUrl}
                          count={chip.count}
                          onClick={() => goToCategory(chip.id)}
                          className="w-full"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className={gridClass}>
            {[...Array(PAGE_SIZE / 2)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-[300px] animate-pulse border border-slate-100 shadow-sm w-full">
                <div className="h-44 bg-slate-100 rounded-t-xl"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                  <div className="h-6 bg-slate-100 rounded w-full mt-4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className={gridClass}>
              {products.map((product) => (
                <div key={product.id} className="w-full">
                  <ProductCard product={product} onClick={() => setInquiryProduct(product)} />
                </div>
              ))}
            </div>

            {error && (
              <div className="mt-8 p-4 bg-red-50 text-red-600 rounded-xl text-center border border-red-100">
                {error}
              </div>
            )}

            {!error && products.length === 0 && (
              <div className="mt-12 text-center text-slate-500 py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-lg font-medium text-slate-900">No products found</p>
                <p className="mt-1">Try adjusting your search or filters.</p>
              </div>
            )}

            <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
          </>
        )}
      </div>
      <FooterSection />
      <InquiryModal product={inquiryProduct} onClose={() => setInquiryProduct(null)} />
    </div>
  );
}
