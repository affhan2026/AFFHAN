import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

// Escapes regex metacharacters so user search text is matched literally,
// not interpreted as a regex pattern.
function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const category = searchParams.get("category");
    const categoryId = searchParams.get("categoryId");
    const sortBy = searchParams.get("sortBy");
    const getChips = searchParams.get("getChips");

    // Pagination params
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "40", 10);
    const skip = (page - 1) * limit;

    const anchorId = searchParams.get("anchorId");

    // Word-boundary regex pattern (Postgres POSIX `\y`) so "car" matches
    // "Car Charger" but not "Care" or "Scarf" — plain `contains` matched
    // any substring anywhere, which flooded results/chips with noise.
    // We also make it plural-tolerant: strip a trailing "s" to a root and
    // allow an optional "s"/"es" suffix, so "shirt" matches the "Shirts"
    // category and "bags" matches "Bag". Without this the word boundary was
    // too strict — "shirt" never matched "Shirts", so nothing got the
    // relevance boost and results fell back to raw newest-first noise.
    const rawQuery = query ? query.trim() : "";
    const searchRoot = rawQuery.length > 3 ? rawQuery.replace(/s$/i, "") : rawQuery;
    const searchPattern = rawQuery ? `\\y${escapeRegex(searchRoot)}(s|es)?\\y` : null;

    // All conditions reference the Product as `p` and its joined Category as
    // `c`, because search now matches the CATEGORY name too (see below).
    // Conditions used for the final filtered query (search + category + anchor)
    const conditions: Prisma.Sql[] = [];
    // Conditions used for chip generation (search + anchor only, no category)
    const chipConditions: Prisma.Sql[] = [];

    if (anchorId) {
      const anchor = Prisma.sql`p."id" <= ${parseInt(anchorId, 10)}`;
      conditions.push(anchor);
      chipConditions.push(anchor);
    }

    if (searchPattern) {
      // Match the product name OR its category name — so a "bags" search
      // includes every product in a "…Bags…" category, not only products
      // that happen to spell "bags" in their own title. Description is
      // deliberately excluded: it added noise without improving relevance.
      const searchCond = Prisma.sql`(p."name" ~* ${searchPattern} OR c."name" ~* ${searchPattern})`;
      conditions.push(searchCond);
      chipConditions.push(searchCond);
    }

    let descendants: string[] = [];
    if (categoryId) {
      const targetCatIds = categoryId.includes(",") ? categoryId.split(",") : [categoryId];

      // Fetch all categories to build adjacency list and find all descendant IDs
      const allCategories = await prisma.category.findMany({
        select: { id: true, parentId: true }
      });

      const childrenMap = new Map<string, string[]>();
      for (const cat of allCategories) {
        if (cat.parentId) {
          if (!childrenMap.has(cat.parentId)) childrenMap.set(cat.parentId, []);
          childrenMap.get(cat.parentId)!.push(cat.id);
        }
      }

      const descendantSet = new Set<string>(targetCatIds);
      const queue = [...targetCatIds];

      while (queue.length > 0) {
        const curr = queue.shift()!;
        const children = childrenMap.get(curr);
        if (children) {
          for (const child of children) {
            if (!descendantSet.has(child)) {
              descendantSet.add(child);
              queue.push(child);
            }
          }
        }
      }

      descendants = Array.from(descendantSet);
      conditions.push(Prisma.sql`p."categoryId" IN (${Prisma.join(descendants)})`);
    } else if (category) {
      conditions.push(Prisma.sql`p."category" ILIKE ${"%" + category + "%"}`);
    }

    const hasFilters = conditions.length > 0;

    // Base sort. When searching, we prepend a relevance boost so products
    // whose CATEGORY matches the query (e.g. Pet Bags, Storage Bags) rank
    // above products that merely mention the word in their name (e.g. a
    // keychain "…for bags"). That's what makes a "bags" search return bags.
    const baseOrderSql = sortBy === "alpha"
      ? Prisma.sql`p."name" ASC, p."id" DESC`
      : Prisma.sql`p."id" DESC`;
    const orderSql = searchPattern
      ? Prisma.sql`(CASE WHEN c."name" ~* ${searchPattern} THEN 1 ELSE 0 END) DESC, NULLIF(POSITION(lower(${rawQuery}) IN lower(p."name")), 0) ASC NULLS LAST, ${baseOrderSql}`
      : baseOrderSql;

    let products: any[] = [];
    let total = 0;

    // Homepage hero (no filters, page 1 only) -> a diverse mix drawn ONLY
    // from these 5 preferred top-level categories. Fixed (not re-randomized
    // every call) and a single windowed query (not N per-category round
    // trips). Load-more reuses this branch (excludeIds strips shown items).
    if (!hasFilters && page === 1) {
      const excludeParam = searchParams.get('excludeIds');
      const excludeIds = excludeParam ? excludeParam.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id)) : [];

      const PREFERRED_TOP_NAMES = [
        "Automobiles & Motorcycles",
        "Pet Supplies",
        "Home, Garden & Furniture",
        "Computer & Office",
        "Phones & Accessories",
      ];

      // 1. Expand the 5 preferred top-level categories to all their
      // descendant category ids (products attach only to leaf nodes).
      const allCategories = await prisma.category.findMany({ select: { id: true, name: true, parentId: true } });
      const childrenMap = new Map<string, string[]>();
      for (const c of allCategories) {
        if (c.parentId) {
          if (!childrenMap.has(c.parentId)) childrenMap.set(c.parentId, []);
          childrenMap.get(c.parentId)!.push(c.id);
        }
      }
      const preferredTopIds = allCategories
        .filter(c => !c.parentId && PREFERRED_TOP_NAMES.includes(c.name))
        .map(c => c.id);
      const sourceCatSet = new Set<string>();
      const queue = [...preferredTopIds];
      while (queue.length > 0) {
        const curr = queue.shift()!;
        sourceCatSet.add(curr);
        for (const child of childrenMap.get(curr) ?? []) queue.push(child);
      }
      const sourceCatIds = Array.from(sourceCatSet);

      if (sourceCatIds.length > 0) {
        const excludeSql = excludeIds.length > 0 ? Prisma.sql`AND "id" NOT IN (${Prisma.join(excludeIds)})` : Prisma.empty;

        // 2. One windowed query: a few newest per leaf, interleaved (rn ASC
        // first, then categoryId — which is a random-ish UUID, giving a
        // varied spread) across all leaves of the 5 preferred categories.
        const rows = await prisma.$queryRaw<Array<{ id: number; name: string; imageUrl: string | null; category: string | null; categoryId: string | null }>>(
          Prisma.sql`
            SELECT "id", "name", "imageUrl", "category", "categoryId" FROM (
              SELECT "id", "name", "imageUrl", "category", "categoryId",
                ROW_NUMBER() OVER (PARTITION BY "categoryId" ORDER BY "id" DESC) as rn
              FROM "Product"
              WHERE "categoryId" IN (${Prisma.join(sourceCatIds)})
              ${excludeSql}
            ) ranked
            WHERE rn <= 3
            ORDER BY rn ASC, "categoryId" ASC
            LIMIT ${limit}
          `
        );

        const catIds = Array.from(new Set(rows.map(r => r.categoryId).filter(Boolean))) as string[];
        const cats = catIds.length > 0
          ? await prisma.category.findMany({ where: { id: { in: catIds } }, select: { id: true, name: true } })
          : [];
        const catNameById = new Map(cats.map(c => [c.id, c.name]));

        products = rows.map(r => ({
          id: r.id,
          name: r.name,
          imageUrl: r.imageUrl,
          category: r.category,
          categoryRef: r.categoryId ? { name: catNameById.get(r.categoryId) || null } : null
        }));
      }

      total = await prisma.product.count();
    } else {
      // Deterministic, real-offset query — used for every filtered request
      // (search / category / anchor) AND for unfiltered browsing past page 1,
      // so numbered pagination (1, 2, 3 ... N) actually returns stable pages
      // instead of a fresh random sample every call. LEFT JOINs Category so
      // search can match/rank on the category name.
      const whereSql = hasFilters ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}` : Prisma.empty;

      const [rows, countRows] = await Promise.all([
        prisma.$queryRaw<Array<{ id: number; name: string; imageUrl: string | null; category: string | null; categoryId: string | null }>>(
          Prisma.sql`
            SELECT p."id", p."name", p."imageUrl", p."category", p."categoryId"
            FROM "Product" p
            LEFT JOIN "Category" c ON p."categoryId" = c."id"
            ${whereSql}
            ORDER BY ${orderSql}
            LIMIT ${limit} OFFSET ${skip}
          `
        ),
        prisma.$queryRaw<Array<{ count: bigint }>>(
          Prisma.sql`SELECT COUNT(*)::bigint as count FROM "Product" p LEFT JOIN "Category" c ON p."categoryId" = c."id" ${whereSql}`
        )
      ]);

      const catIds = Array.from(new Set(rows.map(r => r.categoryId).filter(Boolean))) as string[];
      const cats = catIds.length > 0
        ? await prisma.category.findMany({ where: { id: { in: catIds } }, select: { id: true, name: true } })
        : [];
      const catNameById = new Map(cats.map(c => [c.id, c.name]));

      products = rows.map(r => ({
        id: r.id,
        name: r.name,
        imageUrl: r.imageUrl,
        category: r.category,
        categoryRef: r.categoryId ? { name: catNameById.get(r.categoryId) || null } : null
      }));
      total = Number(countRows[0]?.count ?? 0);
    }

    return NextResponse.json({ 
      success: true, 
      data: products, 
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error("Failed to fetch products:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
