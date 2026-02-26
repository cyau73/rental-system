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
import ScrollToTop from "@/components/ScrollToTop";
import prisma from "@/lib/prisma";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string }>;
}) {
  const session = await auth();

  if (!session || !session.user) redirect("/login");
  // @ts-ignore
  if (session.user.role !== "ADMIN") redirect("/");

  const params = await searchParams;
  const query = params.query;
  const statusFilter = params.status;

  const properties = await prisma.property.findMany({
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
    orderBy: { createdAt: "desc" },
  });

  const getTabClass = (active: boolean) =>
    `px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl ${active ? "bg-blue-600 text-white shadow-md" : "text-gray-400 hover:text-gray-900 hover:bg-white"
    }`;

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-blue-100">
      <AdminNav user={session.user} />

      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-10">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Rental Management</h1>
              <p className="text-xs text-gray-400 mt-1">Manage your properties and availability.</p>
            </div>

            {/* QUICK FILTERS */}
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

        <QuickAddToggle>
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">Quick Add Property</h2>
            <form action={addProperty} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-gray-400 ml-1 uppercase tracking-widest">Name</label>
                  <input name="title" placeholder="Villa Name" className="border border-gray-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-gray-400 ml-1 uppercase tracking-widest">Location</label>
                  <input name="address" placeholder="Address" className="border border-gray-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-gray-400 ml-1 uppercase tracking-widest">Rent</label>
                  <CurrencyInput name="rental" placeholder="0.00" className="border border-gray-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-gray-400 ml-1 uppercase tracking-widest">Photos</label>
                  <input name="images" type="file" multiple accept="image/*" className="text-[10px] file:bg-blue-50 file:rounded-full file:border-0 file:px-3 file:py-1" />
                </div>
              </div>
              <SubmitButton label="Add New Property" />
            </form>
          </section>
        </QuickAddToggle>

        <div className="flex flex-col gap-4">
          {properties.length > 0 ? (
            properties.map((prop) => {
              const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/properties/${prop.id}`;
              const whatsappLink = `https://wa.me/?text=${encodeURIComponent(`Property: ${prop.title} - ${shareUrl}`)}`;

              return (
                <div key={prop.id} className="group bg-white rounded-[1.5rem] md:rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col lg:flex-row relative">

                  <div className="absolute top-4 right-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">
                      Updated: {new Date(prop.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  <div className="relative w-full lg:w-[320px] h-[240px] overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={prop.images?.[0] || "/placeholder.png"}
                      alt={prop.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>

                  <div className="p-4 lg:px-8 lg:py-6 flex flex-col justify-between flex-grow gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${prop.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {prop.status}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 tracking-tight leading-tight">{prop.title}</h3>
                      </div>
                      <p className="text-gray-500 flex items-center gap-1.5 text-[11px]">
                        <span className="text-blue-600 bg-blue-50 p-1 rounded-md">📍</span>
                        {prop.address}
                      </p>
                      <div className="pt-2">
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Rent</p>
                        <p className="text-base font-black text-blue-600">${Number(prop.rental || 0).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                      <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-2.5 border border-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-black hover:border-green-500 hover:text-green-600 transition-all min-w-[110px] justify-center group/wa">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-400 group-hover/wa:fill-green-500 transition-colors" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg> Share </a>
                      <Link href={`/admin/edit/${prop.id}`} className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-widest px-8 py-2.5 rounded-xl shadow-md min-w-[110px] text-center">Edit</Link>
                      <DeletePropertyButton id={prop.id} />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-[2rem] border-2 border-dashed border-gray-200 py-20 text-center text-gray-400 text-xs italic">No properties found matching your filter.</div>
          )}
        </div>
      </main>
      <ScrollToTop />
    </div>
  );
}