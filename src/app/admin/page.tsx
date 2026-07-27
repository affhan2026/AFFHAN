import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getCurrentUser();
  if (!admin) redirect("/admin/login");
  if (admin.role !== "admin") redirect("/");

  const [productCount, categoryCount, inquiryCount, inquiries] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.inquiry.count(),
    prisma.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  const data = {
    adminName: admin.name || admin.email,
    adminImage: admin.image ?? null,
    stats: {
      products: productCount,
      categories: categoryCount,
      inquiries: inquiryCount,
    },
    inquiries: inquiries.map(i => ({
      id: i.id,
      createdAt: i.createdAt.toISOString(),
      customerName: i.customerName,
      companyName: i.companyName,
      email: i.email,
      country: i.country,
      phone: i.phone,
      productName: i.productName,
      quantity: i.quantity,
      message: i.message,
    })),
  };

  return <AdminDashboardClient data={data} />;
}
