import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const totalProducts = await prisma.product.count();

    // Map to a cleaner format and include productCount
    const formattedCategories = categories.map(cat => ({
      ...cat,
      productCount: cat._count.products
    }));

    return NextResponse.json({ 
      success: true, 
      data: formattedCategories,
      totalCount: totalProducts
    });
  } catch (error: any) {
    console.error("Failed to fetch categories:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
