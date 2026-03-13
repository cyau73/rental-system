//app/page.tsx
// app/page.tsx
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import PropertyClientView from "@/components/PropertyClientView";
import AdminNav from "@/components/AdminNav";
import Welcome from "@/components/Welcome";
import Footer from "@/components/Footer";

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
      status: "AVAILABLE",
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
    rental: Number(prop.rental || 0),
    rentalDuration: Number(prop.rentalDuration || 12),
    createdAt: prop.createdAt.toISOString(),
  }));

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 1. ADMIN BAR - Only appears if logged in */}
      {session?.user && (
        <AdminNav user={session.user} />
      )}

      {/* 2. WELCOME HERO */}
      <Welcome />

      {/* 3. PUBLIC VIEW */}
      <PropertyClientView
        initialProperties={properties}
        session={session}
        query={query}
      />

      <Footer />
    </main>
  );
}