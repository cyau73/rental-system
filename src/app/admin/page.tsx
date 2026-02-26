// app/admin/page.tsx

import { auth } from "@/auth";
import { addProperty } from "@/app/actions/properties";
import AdminNav from "@/components/AdminNav";
import DeletePropertyButton from "@/components/DeletePropertyButton";
import { redirect } from "next/navigation";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import QuickAddToggle from '@/components/QuickAddToggle';
import CurrencyInput from "@/components/CurrencyInput";
import SubmitButton from "@/components/SubmitButton";
import ScrollToTop from "@/components/ScrollToTop"; // ✨ New: Floating Scroll Button
import prisma from "@/lib/prisma";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const session = await auth();

  // Security Protection
  if (!session || !session.user) redirect("/login");
  // @ts-ignore
  if (session.user.role !== "ADMIN") redirect("/");

  const { query } = await searchParams;

  // Optimized Search: Checks Title OR Address
  const properties = await prisma.property.findMany({
    where: query
      ? {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { address: { contains: query, mode: "insensitive" } },
        ],
      }
      : {},
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-blue-100">
      <AdminNav user={session.user} />

      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-10">
        {/* HEADER SECTION */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Rental Management
            </h1>
            <p className="text-sm md:text-base text-gray-500 mt-1">
              Efficiently manage your property portfolio and listings.
            </p>
          </div>
          <div className="w-full md:w-72 lg:w-96">
            <SearchBar />
          </div>
        </header>

        {/* QUICK ADD SECTION (Mobile-Friendly Form) */}
        <QuickAddToggle>
          <section className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-gray-200 mb-10">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6">
              Quick Add Property
            </h2>
            <form action={addProperty} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">Property Name</label>
                  <input name="title" placeholder="e.g. Sunset Villa" className="border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">Location</label>
                  <input name="address" placeholder="e.g. 123 Main St" className="border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">Monthly Rent</label>
                  <CurrencyInput name="rental" placeholder="0.00" className="border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">Photos (Max 20)</label>
                  <input name="images" type="file" multiple accept="image/*" className="text-[10px] text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer" />
                </div>
              </div>
              <SubmitButton label="Add New Property" />
            </form>
          </section>
        </QuickAddToggle>

        {/* PROPERTY FEED: Responsive Card-based Layout */}
        <div className="flex flex-col gap-6">
          {properties.length > 0 ? (
            properties.map((prop) => (
              <div key={prop.id} className="group bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col lg:flex-row">

                {/* IMAGE COMPONENT (iMac/iPad Side-by-side, iPhone Stacked) */}
                <div className="relative w-full lg:w-[400px] aspect-[4/3] lg:aspect-auto lg:h-auto overflow-hidden bg-gray-100 flex-shrink-0">
                  {prop.images && prop.images.length > 0 ? (
                    <img
                      src={prop.images[0]}
                      alt={prop.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-300">
                      <span className="text-5xl">🏠</span>
                      <p className="text-[10px] uppercase font-bold tracking-widest mt-3">No Photos Available</p>
                    </div>
                  )}
                  {prop.images && prop.images.length > 1 && (
                    <div className="absolute top-4 left-4 bg-black/70 text-white text-[10px] px-3 py-1.5 rounded-full backdrop-blur-md font-bold shadow-lg">
                      {prop.images.length} PHOTOS
                    </div>
                  )}
                </div>

                {/* DETAILS COMPONENT */}
                <div className="p-6 md:p-10 flex flex-col justify-between flex-grow gap-8">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${prop.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                        {prop.status}
                      </span>
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{prop.title}</h3>
                    </div>

                    <p className="text-gray-500 flex items-start gap-2 text-sm md:text-base leading-relaxed">
                      <span className="text-blue-600 bg-blue-50 p-1.5 rounded-lg">📍</span>
                      {prop.address}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 pt-6 border-t border-gray-100">
                      <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Monthly Rent</p>
                        <p className="text-xl md:text-2xl font-black text-blue-600">
                          ${prop.rental ? Number(prop.rental).toLocaleString() : '—'}
                          <span className="text-xs font-medium text-gray-400 ml-1">/mo</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Lease Terms</p>
                        <p className="text-sm md:text-base font-bold text-gray-700">
                          {prop.rentalDuration ? `${prop.rentalDuration} Months` : 'Negotiable'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BAR */}
                  <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-gray-100 gap-4">
                    <span className="text-xs text-gray-400 font-medium">
                      Last Updated: {new Date(prop.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <Link
                        href={`/admin/edit/${prop.id}`}
                        className="flex-1 sm:flex-none text-center bg-white border border-gray-200 text-gray-700 font-bold text-xs px-6 py-3 rounded-2xl hover:bg-gray-50 shadow-sm transition-all active:scale-95"
                      >
                        Edit Listing
                      </Link>
                      <DeletePropertyButton id={prop.id} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200 py-32 text-center">
              <span className="text-5xl block mb-4 grayscale">🔍</span>
              <p className="text-gray-500 font-medium italic">
                {query ? `No properties match your search for "${query}"` : "Start by adding your first property listing."}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Floating Utilities */}
      <ScrollToTop />
    </div>
  );
}