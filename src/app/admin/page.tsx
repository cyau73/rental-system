import { auth } from "@/auth";
import { addProperty } from "@/app/actions/properties";
import AdminNav from "@/components/AdminNav";
import { redirect } from "next/navigation";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import QuickAddToggle from '@/components/QuickAddToggle';
import CurrencyInput from "@/components/CurrencyInput";
import SubmitButton from "@/components/SubmitButton";
import ScrollToTop from "@/components/ScrollToTop";
import prisma from "@/lib/prisma";
import PropertyListDraggable from "@/components/PropertyListDraggable";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string }>;
}) {
  const session = await auth();

  // 1. Authentication & Role Protection
  if (!session || !session.user) redirect("/login");
  // @ts-ignore
  if (session.user.role !== "ADMIN") redirect("/");

  const params = await searchParams;
  const query = params.query;
  const statusFilter = params.status;

  // 2. Data Fetching
  const rawProperties = await prisma.property.findMany({
    where: {
      AND: [
        query ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { address: { contains: query, mode: "insensitive" } },
          ],
        } : {},
        statusFilter ? { status: statusFilter as any } : {},
      ]
    },
    orderBy: [
      { isPinned: 'desc' },
      { order: 'asc' },
    ],
  });

  // 3. SERIALIZATION FIX: Convert Prisma Decimals/Dates to Plain Objects
  // This prevents the "Decimal objects are not supported" error in Client Components
  const properties = rawProperties.map(prop => ({
    ...prop,
    rental: Number(prop.rental || 0),
    price: prop.price ? Number(prop.price) : null,
    rentalDuration: Number(prop.rentalDuration || 0),
    createdAt: prop.createdAt.toISOString(),
    updatedAt: prop.updatedAt.toISOString(),
    // Convert any other Date fields if they exist in your schema
    rentalStart: prop.rentalStart ? prop.rentalStart.toISOString() : null,
  }));

  const getTabClass = (active: boolean) =>
    `px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl ${active ? "bg-blue-600 text-white shadow-md" : "text-gray-400 hover:text-gray-900 hover:bg-white"
    }`;

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-blue-100">
      <AdminNav user={session.user} />

      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-10">
        {/* HEADER & FILTERS */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Link href="/admin" className={getTabClass(!statusFilter)}>All</Link>
              <Link href={`/admin?status=AVAILABLE${query ? `&query=${query}` : ''}`} className={getTabClass(statusFilter === 'AVAILABLE')}>Available</Link>
              <Link href={`/admin?status=RENTED${query ? `&query=${query}` : ''}`} className={getTabClass(statusFilter === 'RENTED')}>Rented</Link>
            </div>
          </div>
          <div className="w-full md:w-72">
            <SearchBar />
          </div>
        </header>

        {/* QUICK ADD FORM */}
        {/* QUICK ADD FORM */}
        <QuickAddToggle>
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
            {/* Section Title: Changed to black and extrabold */}
            <h2 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-black mb-4">
              Quick Add Property
            </h2>

            <form action={addProperty} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1">
                  {/* Labels: Changed to text-black and font-extrabold */}
                  <label className="text-[9px] font-extrabold text-black ml-1 uppercase tracking-widest">
                    Name
                  </label>
                  <input
                    name="title"
                    placeholder="Villa Name"
                    className="border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black placeholder:text-gray-400 transition-all"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-extrabold text-black ml-1 uppercase tracking-widest">
                    Location
                  </label>
                  <input
                    name="address"
                    placeholder="Address"
                    className="border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black placeholder:text-gray-400 transition-all"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-extrabold text-black ml-1 uppercase tracking-widest">
                    Rent
                  </label>
                  <CurrencyInput
                    name="rental"
                    placeholder="0.00"
                    className="border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-extrabold text-black ml-1 uppercase tracking-widest">
                    Photos
                  </label>
                  <input
                    name="images"
                    type="file"
                    multiple
                    accept="image/*"
                    className="text-[10px] file:bg-blue-600 file:text-white file:font-bold file:rounded-lg file:border-0 file:px-3 file:py-1 text-black"
                  />
                </div>
              </div>
              <SubmitButton label="Add New Property" />
            </form>
          </section>
        </QuickAddToggle>

        {/* DRAGGABLE PROPERTY LIST */}
        <PropertyListDraggable properties={properties} />

      </main>
      <ScrollToTop />
    </div>
  );
}