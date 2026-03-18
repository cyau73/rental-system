//app/page.tsx
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import PropertyClientView from "@/components/PropertyClientView";
import AdminNav from "@/components/AdminNav";
import Welcome from "@/components/Welcome";
import Footer from "@/components/Footer";
import { PropertyStatus } from "@prisma/client";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const query = params.query;

  const rawProperties = await prisma.property.findMany({
    where: {
      status: { in: [PropertyStatus.FOR_SALE, PropertyStatus.FOR_RENT] },
      ...(query ? {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { address: { contains: query, mode: "insensitive" } },
        ],
      } : {}),
    },
    // Priority: Pinned first, then manual order, then newest
    orderBy: [
      { isPinned: 'desc' },
      { order: 'asc' },
      { createdAt: 'desc' }
    ],
  });

  const properties = rawProperties.map(prop => ({
    ...prop,
    // Ensure images is always a valid array for the gallery
    images: Array.isArray(prop.images)
      ? prop.images.filter((url: string) => url && url.trim() !== "")
      : [],
    statusDisplay: prop.status
      .replace(/_/g, ' ') // Replace underscore with space
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase()),
    rental: Number(prop.rental || 0),
    price: Number(prop.price || 0),
    createdAt: prop.createdAt.toISOString(),
    updatedAt: prop.updatedAt.toISOString(),
  }));

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center">
      {/* 1. ADMIN BAR - Only appears if logged in */}
      {session?.user && (
        <AdminNav user={session.user} />
      )}

      {/* 
          2. UNIFIED CONTENT WRAPPER 
          MATCHING YOUR FOOTER: max-w-7xl, mx-auto, px-6
      */}
      <div className="w-full max-w-7xl mx-auto px-6">
        <Welcome />

        <PropertyClientView
          initialProperties={properties}
          session={session}
          query={query}
        />
      </div>

      <Footer />
    </main>
  );
}