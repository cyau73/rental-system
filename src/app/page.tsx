//app/page.tsx
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import PropertyClientView from "@/components/PropertyClientView";

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
    orderBy: [{ isPinned: 'desc' }, { order: 'asc' }],
  });

  const properties = rawProperties.map(prop => ({
    ...prop,
    images: Array.isArray(prop.images)
      ? prop.images.filter((url: string) => url && url.trim() !== "")
      : [],
    rental: Number(prop.rental || 0),
    rentalDuration: Number(prop.rentalDuration || 12),
    createdAt: prop.createdAt.toISOString(),
  }));

  return (
    <PropertyClientView
      initialProperties={properties}
      session={session}
      query={query}
    />
  );
}