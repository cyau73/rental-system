//admin/reports/page.tsx

import { auth } from "@/auth";
import AdminNav from "@/components/AdminNav";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import AdminDashboard from "@/components/AdminDashboard";
import SearchBar from "@/components/SearchBar";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const query = params.query || "";

  if (!session || !session.user) redirect("/login");
  // @ts-ignore
  if (session.user.role !== "ADMIN") redirect("/");

  const rawProperties = await prisma.property.findMany({
    where: query ? {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { address: { contains: query, mode: "insensitive" } },
      ],
    } : {},
    orderBy: { title: 'asc' }
  });

  const properties = rawProperties.map(prop => ({
    ...prop,
    rental: Number(prop.rental || 0),
    price: prop.price ? Number(prop.price) : null,
    landArea: prop.landArea ? Number(prop.landArea) : null,
    builtUp: prop.builtUp ? Number(prop.builtUp) : null,
    createdAt: prop.createdAt instanceof Date ? prop.createdAt.toISOString() : prop.createdAt,
    updatedAt: prop.updatedAt instanceof Date ? prop.updatedAt.toISOString() : prop.updatedAt,
  }));

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-blue-100">
      <AdminNav user={session.user} />

      {/* MATCHED PADDING: md:px-6 lg:px-10 */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 pt-4 md:pt-6 pb-20">
        
        {/* MATCHED HEADER: flex-row md:items-end */}
        <header className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-black tracking-tight uppercase">
                Portfolio Reports
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
              Financial Overview & Building Analytics
            </p>
          </div>
          
          {/* MATCHED SEARCHBAR WIDTH: w-72 */}
          <div className="w-full md:w-72">
            <SearchBar />
          </div>
        </header>

        <div className="space-y-8 mt-8">
            <section className="pt-4">
                <AdminDashboard properties={properties} />
            </section>
        </div>
      </main>
    </div>
  );
}