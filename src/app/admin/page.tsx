//app/admin/page.tsx
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
import TitleInput from "@/components/TitleInput";
import ResetOrderButton from "@/components/ResetOrderButton";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string }>;
}) {
  const session = await auth();
  // console.log("DEBUG SESSION:", JSON.stringify(session?.user));
  // 1. Authentication & Role Protection
  if (!session || !session.user) redirect("/login");
  // @ts-ignore
  if (session.user.role !== "ADMIN") redirect("/");

  const params = await searchParams;
  const query = params.query;
  const statusFilter = params.status;

  // 1. Prepare the search term for Postgres ILIKE
  const searchTerm = query ? `%${query}%` : '%';

  // A. Main Data Fetch (The Search Results)
  const rawProperties: any[] = await prisma.$queryRaw`
  SELECT * FROM "Property"
  WHERE 
    (title ILIKE ${searchTerm} OR address ILIKE ${searchTerm})
    AND (
      (${statusFilter === 'AVAILABLE'} AND status IN ('FOR_RENT', 'FOR_SALE'))
      OR 
      (${!!statusFilter && statusFilter !== 'AVAILABLE'} AND status::text = ${statusFilter})
      OR 
      (${!statusFilter})
    )
  ORDER BY 
    "isPinned" DESC, 
    "order" ASC,
    -- 1. Sort by the base name (everything before the first hyphen)
    split_part(title, '-', 1) ASC,
    -- 2. Custom Suffix Logic
    CASE 
      WHEN title NOT LIKE '%-%' THEN 0      -- Base names (MR01) come first
      WHEN title ILIKE '%-G' THEN 1         -- Ground floor (-G) second
      WHEN title ILIKE '%-M' THEN 2         -- Mezzanine (-M) third
      WHEN title ~ '-\d' THEN 3             -- Numbers (-1, -2) fourth
      ELSE 4                                -- Anything else last
    END ASC,
    -- 3. Finally, numeric sort for the actual unit numbers
    length(title) ASC,                      -- Helps keep "MR01-2" before "MR01-10"
    title ASC
`;

  const searchTotal = rawProperties.length;

  // B. Total Database Count (The Inventory)
  const globalTotal = await prisma.property.count();

  // C. Accurate Building Count (Unique Prefixes)
  // This counts "MR01" and "MR01-G" as 1 building
  const buildingCount = new Set(
    rawProperties.map(p => p.title.split('-')[0].trim())
  ).size;

  // 3. SERIALIZATION FIX: Convert Prisma Decimals/Dates to Plain Objects
  // This prevents the "Decimal objects are not supported" error in Client Components
  const properties = rawProperties.map(prop => ({
    ...prop,
    // Postgres returns Decimal as an object; convert to Number for the frontend    rental: Number(prop.rental || 0),
    rental: Number(prop.rental || 0),
    price: prop.price ? Number(prop.price) : null,
    landArea: prop.landArea ? Number(prop.landArea) : null,
    builtUp: prop.builtUp ? Number(prop.builtUp) : null,

    // Convert Dates to Strings for Client Components
    createdAt: prop.createdAt instanceof Date ? prop.createdAt.toISOString() : prop.createdAt,
    updatedAt: prop.updatedAt instanceof Date ? prop.updatedAt.toISOString() : prop.updatedAt,

    images: prop.images,
    isPinned: prop.isPinned,
    order: prop.order,

    displayStatus: prop.status
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char: string) => char.toUpperCase()),
  }));

  // --- 3. Calculate "Base Properties" (No -G, -M, -1 etc) ---
  // We can do this by filtering the main rawProperties array we already fetched
  const basePropertiesCount = rawProperties.filter(prop => !prop.title.includes('-')).length;

  // 1. Get the base name of every property in the current search results
  // e.g., "MR01-G" becomes "MR01", "Villa" stays "Villa"
  const buildingNames = rawProperties.map(prop => {
    return prop.title.split('-')[0].trim();
  });

  // 2. Use a Set to get only the UNIQUE building names
  const uniqueBuildings = new Set(buildingNames);

  const getTabClass = (active: boolean) =>
    `px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl ${active ? "bg-blue-600 text-white shadow-md" : "text-gray-400 hover:text-gray-900 hover:bg-white"
    }`;

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-blue-100">
      <AdminNav user={session.user} />

      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 pt-4 md:pt-6 pb-10">
        {/* HEADER & FILTERS */}
        <header className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Link href="/admin" className={getTabClass(!statusFilter)}>All</Link>
              <Link
                href={`/admin?status=AVAILABLE${query ? `&query=${query}` : ''}`}
                className={getTabClass(statusFilter === 'AVAILABLE')}
              >
                Available
              </Link>

              <Link href={`/admin?status=RENTED${query ? `&query=${query}` : ''}`}
                className={getTabClass(statusFilter === 'RENTED')}>Rented</Link>

              {/* Optional: Add Sold */}
              <Link href={`/admin?status=SOLD${query ? `&query=${query}` : ''}`}
                className={getTabClass(statusFilter === 'SOLD')}>Sold</Link>

            </div>
          </div>
          <div className="w-full md:w-72">
            <SearchBar />
          </div>
        </header>

        {/* QUICK ADD FORM */}
        <QuickAddToggle>
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
            {/* Section Title: Changed to black and extrabold */}
            <h2 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-black mb-4">
              Quick Add Property
            </h2>

            <form action={addProperty} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Labels: Changed to text-black and font-extrabold */}
                <TitleInput />

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
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue="RENTED" // This now correctly points to your RENTED enum
                    className="border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black bg-white appearance-none"
                  >
                    <option value="FOR_SALE">For Sale</option>
                    <option value="FOR_RENT">For Rent</option>
                    <option value="RENTED">Rented</option>
                    <option value="SOLD">Sold</option>
                    <option value="NOT_AVAILABLE">Not Available</option>
                  </select>
                </div>

                {/* <div className="flex flex-col gap-1">
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
                </div> */}
              </div>
              <SubmitButton label="Add New Property" />
            </form>
          </section>
        </QuickAddToggle>

        {/* STATS BAR */}
        <div className="flex flex-wrap items-center gap-6 mb-6 px-2">
          <div className="flex flex-col">
            <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">
              Search Results
            </span>
            <span className="text-lg font-black text-black">
              {searchTotal} <span className="text-[10px] text-gray-400 font-bold uppercase ml-1">Units</span>
            </span>
          </div>

          <div className="flex flex-col border-l border-gray-200 pl-6">
            <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest text-blue-600">
              Buildings
            </span>
            <span className="text-lg font-black text-blue-600">
              {buildingCount}
            </span>
          </div>

          <div className="flex flex-col border-l border-gray-200 pl-6">
            <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">
              Total Inventory
            </span>
            <span className="text-lg font-black text-gray-300">
              {globalTotal}
            </span>
          </div>

          <div className="ml-auto">
            <ResetOrderButton />
          </div>

        </div>

        {/* DRAGGABLE PROPERTY LIST */}
        <PropertyListDraggable properties={properties} />

      </main>
      <ScrollToTop />
    </div>
  );
}