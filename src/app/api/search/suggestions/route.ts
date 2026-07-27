import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Live autocomplete: returns matching CATEGORIES (so typing "sh" surfaces
// "Shirts", "Shoes"…) and matching PRODUCTS, from as little as one letter.
export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q")?.trim();
    if (!query || query.length < 1) {
      return NextResponse.json({ categories: [], products: [], suggestions: [] });
    }

    const like = `%${query}%`;
    const prefix = `${query}%`;

    const [categories, products] = await Promise.all([
      prisma.$queryRaw<Array<{ id: string; name: string; parentName: string | null; thumbnailUrl: string | null }>>`
        SELECT "id", "name", "parentName", "thumbnailUrl"
        FROM "Category"
        WHERE "name" ILIKE ${like} AND "thumbnailUrl" IS NOT NULL
        ORDER BY ("name" ILIKE ${prefix}) DESC, "name" ASC
        LIMIT 6
      `,
      prisma.$queryRaw<Array<{ id: number; name: string; imageUrl: string | null; category: string | null }>>`
        SELECT "id", "name", "imageUrl", "category"
        FROM "Product"
        WHERE "name" ILIKE ${like}
        ORDER BY 
          ("category" ILIKE ${like}) DESC,
          ("name" ILIKE ${prefix}) DESC,
          NULLIF(POSITION(lower(${query}) IN lower("name")), 0) ASC NULLS LAST,
          "id" DESC
        LIMIT 6
      `,
    ]);

    // `suggestions` kept for backward-compatibility with the navbar dropdown.
    return NextResponse.json({ categories, products, suggestions: products });
  } catch (error) {
    console.error("Search suggestions error:", error);
    return NextResponse.json({ categories: [], products: [], suggestions: [] }, { status: 500 });
  }
}
