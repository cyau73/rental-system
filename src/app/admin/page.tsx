import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import PropertyListDraggable from "@/components/PropertyListDraggable";
import SearchBar from "@/components/SearchBar";
import ResetOrderButton from "@/components/ResetOrderButton";
import QuickAddToggle from '@/components/QuickAddToggle';
import TitleInput from "@/components/TitleInput";
import CurrencyInput from "@/components/CurrencyInput";
import SubmitButton from "@/components/SubmitButton";
import ScrollToTop from "@/components/ScrollToTop";
import { addProperty } from "@/app/actions/properties";
import { getPropertiesWithLatestTenant } from "@/lib/property-service";
import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  const query = params.query || "";
  const statusFilter = params.status || "";

  // 1. Fetch the main list
  const properties = await getPropertiesWithLatestTenant(query, null, statusFilter);

  // 2. Date Windows for Badges
  const now = new Date();
  const threeMonthsOut = new Date();
  threeMonthsOut.setMonth(threeMonthsOut.getMonth() + 3);
  const nineMonthsOut = new Date();
  nineMonthsOut.setMonth(nineMonthsOut.getMonth() + 9);

  // 3. Execute Badge Counts
  const [
    rentedCount,
    notAvailableCount,
    availableCount,
    expiredCount,
    expiringCount,
    globalTotal
  ] = await Promise.all([
    prisma.property.count({ where: { status: 'RENTED' } }),
    prisma.property.count({ where: { status: 'NOT_AVAILABLE' } }),
    prisma.property.count({ where: { status: { in: ['FOR_RENT', 'FOR_SALE'] } } }),
    prisma.property.count({
      where: {
        status: 'RENTED',
        OR: [
          { tenants: { none: {} } },
          { NOT: { tenants: { some: { endDate: { gte: now } } } } },
          { tenants: { some: { endDate: null } } }
        ]
      }
    }),
    prisma.property.count({
      where: {
        status: 'RENTED',
        tenants: {
          some: { endDate: { gte: threeMonthsOut, lte: nineMonthsOut } },
          none: { endDate: { gt: nineMonthsOut } }
        }
      }
    }),
    prisma.property.count()
  ]);

  // 4. UI Calculations
  const searchTotal = properties.length;
  const buildingCount = new Set(properties.map(p => p.title.split('-')[0].trim())).size;

  const getTabClass = (active: boolean) =>
    `relative px-4 py-2 mr-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl ${active ? "bg-blue-600 text-white shadow-md" : "text-gray-400 hover:text-gray-900 hover:bg-white"
    }`;

  const Badge = ({ count, type, active }: { count: number; type: string, active: boolean }) => {
    if (count === 0) return null;
    const colors: Record<string, string> = {
      ALL: 'bg-gray-500',
      AVAILABLE: 'bg-emerald-500',
      RENTED: 'bg-blue-600',
      EXPIRED: 'bg-red-600',
      EXPIRING: 'bg-amber-500',
      NOT_AVAILABLE: 'bg-slate-400',
    };
    return (
      <span className={`absolute -top-2 -right-3 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[8px] font-black border-2 ${active ? 'border-white' : 'border-transparent'} ${colors[type] || 'bg-gray-500'} text-white shadow-sm z-20`}>
        {count}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-blue-100">
      <AdminNav user={session.user} />
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 pt-4 md:pt-6 pb-10">
        <header className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-black tracking-tight uppercase">Property Management</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Overview of Portfolio Status</p>
          </div>
          <div className="w-full md:w-72"><SearchBar /></div>
        </header>

        <div className="mb-4 border-b border-gray-100 pb-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2">
            <Link href="/admin" className={getTabClass(!statusFilter)}>
              All <Badge count={globalTotal} active={!statusFilter} type="ALL" />
            </Link>
            <Link href={`/admin?status=RENTED${query ? `&query=${query}` : ''}`} className={getTabClass(statusFilter === 'RENTED')}>
              Rented <Badge count={rentedCount} active={statusFilter === 'RENTED'} type="RENTED" />
            </Link>
            <Link href={`/admin?status=AVAILABLE${query ? `&query=${query}` : ''}`} className={getTabClass(statusFilter === 'AVAILABLE')}>
              Available <Badge count={availableCount} active={statusFilter === 'AVAILABLE'} type="AVAILABLE" />
            </Link>
            <Link href={`/admin?status=EXPIRED${query ? `&query=${query}` : ''}`} className={getTabClass(statusFilter === 'EXPIRED')}>
              Expired <Badge count={expiredCount} active={statusFilter === 'EXPIRED'} type="EXPIRED" />
            </Link>
            <Link href={`/admin?status=EXPIRING${query ? `&query=${query}` : ''}`} className={getTabClass(statusFilter === 'EXPIRING')}>
              Soon <Badge count={expiringCount} active={statusFilter === 'EXPIRING'} type="EXPIRING" />
            </Link>
            <ResetOrderButton />
          </div>
        </div>

        <QuickAddToggle>
          <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-4">
            <h2 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-black mb-2">Add Property</h2>
            <form action={addProperty} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <TitleInput />
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-extrabold text-black ml-1 uppercase tracking-widest">Location</label>
                  <input name="address" placeholder="Address" className="border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black transition-all" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-extrabold text-black ml-1 uppercase tracking-widest">Rent</label>
                  <CurrencyInput name="rental" placeholder="0.00" className="border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black font-mono" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-extrabold text-black ml-1 uppercase tracking-widest">Status</label>
                  <select name="status" defaultValue="RENTED" className="border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black bg-white appearance-none">
                    <option value="FOR_SALE">For Sale</option>
                    <option value="FOR_RENT">For Rent</option>
                    <option value="RENTED">Rented</option>
                    <option value="SOLD">Sold</option>
                    <option value="NOT_AVAILABLE">Not Available</option>
                  </select>
                </div>
              </div>
              <SubmitButton label="Add New Property" />
            </form>
          </section>
        </QuickAddToggle>

        <div className="flex flex-wrap items-center gap-6 mb-6 px-2">
          <div className="flex flex-col">
            <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">Search Results</span>
            <span className="text-lg font-black text-black">{searchTotal} <span className="text-[10px] text-gray-400 font-bold uppercase ml-1">Units</span></span>
          </div>
          <div className="flex flex-col border-l border-gray-200 pl-6">
            <span className="text-[9px] font-extrabold text-blue-600 uppercase tracking-widest">Buildings</span>
            <span className="text-lg font-black text-blue-600">{buildingCount}</span>
          </div>
          <div className="flex flex-col border-l border-gray-200 pl-6">
            <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">Total Inventory</span>
            <span className="text-lg font-black text-gray-300">{globalTotal}</span>
          </div>
        </div>

        <PropertyListDraggable properties={properties} />
      </main>
      <ScrollToTop />
    </div>
  );
}