//app/page.tsx
import prisma from "@/lib/prisma";
import { auth, signOut } from "@/auth";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import ScrollToTop from "@/components/ScrollToTop";
import PublicGalleryCard from "@/components/PublicGalleryCard";

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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* NAV SECTION */}
      <nav className="flex items-center justify-between bg-white border-b px-8 py-4 shadow-sm sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-3 group">
          <img src="/icon.png" alt="Logo" className="w-10 h-10 object-contain" />
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">Rental Management</h1>
        </Link>

        <div className="flex items-center gap-6">
          {session?.user ? (
            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900 leading-none">{session.user.name}</p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">{session.user.email}</p>
              </div>
              <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
                <button type="submit" className="text-[10px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 px-5 py-2.5 rounded-xl border border-red-100 transition-all active:scale-95">
                  Logout
                </button>
              </form>
            </div>
          ) : (
            <Link href="/login" className="text-[10px] font-bold uppercase text-blue-600 px-5 py-2.5 border border-blue-100 rounded-xl hover:bg-blue-50 transition-all">
              Staff Login
            </Link>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-10 pt-10">
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Available Rentals</h2>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Direct from May Properties</p>
          </div>
          <div className="w-full md:w-80">
            <SearchBar />
          </div>
        </header>

        {/* PROPERTY LIST WITH EMPTY STATE CHECK */}
        {properties.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-gray-200 shadow-inner">
            <div className="mb-4 text-4xl">🏘️</div>
            <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">
              No rentals found matching "{query}"
            </p>
            <Link href="/" className="text-blue-600 text-[10px] uppercase tracking-widest font-black mt-6 inline-block hover:text-blue-700">
              ← View All Properties
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {properties.map((prop) => (
              <PublicGalleryCard key={prop.id} prop={prop} />
            ))}
          </div>
        )}
      </main>
      <ScrollToTop />
    </div>
  );
}