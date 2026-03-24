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
  SELECT 
  p.*, 
  t.name as "currentTenantName",
  t."startDate",
  t."endDate",
  t."securityDeposit",
  t."utilityDeposit"

FROM "Property" p
LEFT JOIN "Tenant" t ON t.id = (
  SELECT id FROM "Tenant" 
  WHERE "propertyId" = p.id 
  ORDER BY "startDate" DESC LIMIT 1
)
  WHERE 
  (
  p.title ILIKE ${searchTerm} OR p.address ILIKE ${searchTerm}
  OR t.name ILIKE ${searchTerm} 
  )AND (
    -- ALL: No filter
    (${!statusFilter})
    
    -- NOT AVAILABLE: Properties explicitly marked as off-market
    OR (${statusFilter === 'NOT_AVAILABLE'} AND p.status = 'NOT_AVAILABLE')

    -- AVAILABLE: Both For Rent and For Sale
    OR (${statusFilter === 'AVAILABLE'} AND p.status IN ('FOR_RENT', 'FOR_SALE'))

    -- RENTED: Specifically the Rented status
    OR (${statusFilter === 'RENTED'} AND p.status = 'RENTED')

    -- EXPIRED: Rented without tenants OR any active property with expired/missing dates
    OR (
      ${statusFilter === 'EXPIRED'} 
      AND p.status = 'RENTED' -- The intent is Rented...
      AND (
        t.id IS NULL           -- ...but no tenant record exists yet (VACANT)
        OR t."endDate" < CURRENT_DATE -- ...or the lease has already lapsed
        OR t."endDate" IS NULL -- ...or the lease exists but is missing the end date
      )
    )
    -- EXPIRING: Strictly between 3 and 6 months from now
    OR (
      ${statusFilter === 'EXPIRING'} 
      AND p.status NOT IN ('FOR_SALE', 'SOLD', 'NOT_AVAILABLE')
      AND t."endDate" >= CURRENT_DATE + INTERVAL '3 months'
      AND t."endDate" <= CURRENT_DATE + INTERVAL '6 months'
    )
  )
ORDER BY 
  -- 1. KEEP PINNED AT THE TOP
  p."isPinned" DESC, 
  
  -- 2. PRIMARY SORT: Group by the building/base name (MP0020, then MP0030)
  split_part(p.title, '-', 1) ASC,

  -- 3. SECONDARY SORT: Order within that specific building group
  CASE 
    WHEN p.title NOT LIKE '%-%' THEN 0      -- Base unit (MP0020) FIRST
    WHEN p.title ILIKE '%-G' THEN 1         -- Ground floor (-G) SECOND
    WHEN p.title ILIKE '%-M' THEN 2         -- Mezzanine (-M) THIRD
    WHEN p.title ~ '-\d' THEN 3             -- Numbers (-1, -2) FOURTH
    ELSE 4                                  -- Everything else
  END ASC,

  -- 4. TERTIARY SORT: Numeric order for the units (helps with -2 before -10)
  length(p.title) ASC,
  p.title ASC,

  -- 5. MANUAL DRAG-DROP ORDER (Only if same title/rank)
  p."order" ASC
`;

  // 1. Declare your date windows FIRST
  const threeMonthsOut = new Date();
  threeMonthsOut.setMonth(threeMonthsOut.getMonth() + 3);

  const sixMonthsOut = new Date();
  sixMonthsOut.setMonth(sixMonthsOut.getMonth() + 6);

  // 2. Execute the counts
  const [rentedCount, notAvailableCount, availableCount, expiredCount, expiringCount] = await Promise.all([
    // ALL RENTED: Total properties with status 'RENTED'
    prisma.property.count({ where: { status: 'RENTED' } }),
    prisma.property.count({ where: { status: 'NOT_AVAILABLE' } }),

    // ALL AVAILABLE: Combined For Rent & For Sale
    prisma.property.count({ where: { status: { in: ['FOR_RENT', 'FOR_SALE'] } } }),

    // EXPIRED: Status is Rented, but data is missing or old
    prisma.property.count({
      where: {
        status: 'RENTED',
        OR: [
          { tenants: { none: {} } }, // No tenant record
          {
            NOT: {
              tenants: {
                some: { endDate: { gte: new Date() } } // No future/current dates found
              }
            }
          },
          { tenants: { some: { endDate: null } } } // Record exists but date is blank
        ]
      }
    }),

    // ✅ Expired if there are NO active/future leases
    prisma.property.count({
      where: {
        status: 'RENTED',
        tenants: {
          // 1. Must have a tenant expiring in the 3-6 month window
          some: {
            endDate: { gte: threeMonthsOut, lte: sixMonthsOut },
          },
          // 2. IMPORTANT: Must NOT have any tenant with an end date BEYOND 6 months
          // This ensures the 3-6 month tenant is actually the latest one.
          none: {
            endDate: { gt: sixMonthsOut }
          }
        }
      }
    })

  ]);

  const searchTotal = rawProperties.length;

  // B. Total Database Count (The Inventory)
  const globalTotal = await prisma.property.count();

  // C. Accurate Building Count (Unique Prefixes)
  // This counts "MR01" and "MR01-G" as 1 building
  const buildingCount = new Set(
    rawProperties.map(p => p.title.split('-')[0].trim())
  ).size;

  const now = new Date();

  // 3. SERIALIZATION FIX: Convert Prisma Decimals/Dates to Plain Objects
  const properties = rawProperties.map(prop => {
    // 1. Logic to determin if the Tenant is "Current" or "Previous" based on endDate
    const endDateObj = prop.endDate ? new Date(prop.endDate) : null;
    const isExpired = endDateObj && endDateObj < now;
    const noTenant = !prop.currentTenantName;
    const noDate = prop.currentTenantName && !endDateObj;

    const isExcluded = ['FOR_SALE', 'SOLD', 'NOT_AVAILABLE'].includes(prop.status);
    const isVacant = !isExcluded && (noTenant || isExpired || noDate);

    // Format the date for the UI
    const formattedEndDate = endDateObj // ✅ Use the object you just created
      ? endDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : null;

    let tenantDisplay = "VACANT";
    if (prop.currentTenantName) {
      tenantDisplay = isExpired
        ? `PREVIOUS: ${prop.currentTenantName}`
        : prop.currentTenantName;
    }

    // Final logic for the display label
    let availabilityLabel = prop.status.replace(/_/g, ' ');

    // Inside properties.map logic
    if (prop.status === 'RENTED' && noTenant) {
      availabilityLabel = "RENTED (PENDING TENANT DATA)";
    } else if (prop.status === 'RENTED' && isExpired) {
      availabilityLabel = "RENTED (LEASE EXPIRED)";
    } else if (prop.status === 'RENTED' && noDate) {
      availabilityLabel = "RENTED (MISSING END DATE)";
    }

    // 2. Return the object explicitly
    return {
      ...prop,
      // Convert Decimals to Numbers
      rental: Number(prop.rental || 0),
      price: prop.price ? Number(prop.price) : null,
      landArea: prop.landArea ? Number(prop.landArea) : null,
      builtUp: prop.builtUp ? Number(prop.builtUp) : null,

      // Deposits: Ensure they are numbers and default to 0 if null/undefined
      securityDeposit: Number(prop.securityDeposit || 0),
      utilityDeposit: Number(prop.utilityDeposit || 0),

      // Use the logic variables we calculated above
      currentTenant: tenantDisplay,
      isVacant: noTenant || isExpired || noDate,
      displayStatus: availabilityLabel.toUpperCase(), // Keep it bold/uppercase
      endDate: prop.endDate, // Keep raw date for other logic if needed

      // Convert Dates to Strings for Client Components
      createdAt: prop.createdAt instanceof Date ? prop.createdAt.toISOString() : prop.createdAt,
      updatedAt: prop.updatedAt instanceof Date ? prop.updatedAt.toISOString() : prop.updatedAt,
      // endDate: prop.endDate instanceof Date ? prop.endDate.toISOString() : prop.endDate,

      images: prop.images,
      isPinned: prop.isPinned,
      order: prop.order,
    };
  });

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
    `relative px-4 py-2 mr-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl ${active
      ? "bg-blue-600 text-white shadow-md"
      : "text-gray-400 hover:text-gray-900 hover:bg-white"
    }`;

  const Badge = ({
    count,
    active,
    type
  }: {
    count: number;
    active: boolean;
    type: 'ALL' | 'AVAILABLE' | 'RENTED' | 'EXPIRED' | 'EXPIRING'
  }) => {
    if (count === 0) return null;

    // Exact mapping to match your PropertyDraggable status colors
    const colorMap = {
      ALL: 'bg-gray-500 border-gray-500',
      AVAILABLE: 'bg-emerald-500 border-emerald-500',
      RENTED: 'bg-blue-600 border-blue-600',
      EXPIRED: 'bg-red-600 border-red-600',
      EXPIRING: 'bg-amber-500 border-amber-500',
      NOT_AVAILABLE: 'bg-slate-400 border-slate-400', // Distinct neutral color      
    };

    return (
      <span className={`
      absolute -top-2 -right-3
      flex items-center justify-center 
      min-w-[18px] h-[18px] px-1
      rounded-full 
      text-[8px] font-black leading-none
      border-2 ${active ? 'ring-2 ring-white' : 'border-transparent'}
      ${colorMap[type]} 
      text-white shadow-sm transition-all z-20
    `}>
        {count}
      </span>
    );
  };


  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-blue-100">
      <AdminNav user={session.user} />

      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 pt-4 md:pt-6 pb-10">
        {/* COMPACT HEADER (TABS + RESET BUTTON) */}
        {/* 1. COMPACT HEADER (TABS + RESET BUTTON) */}
        <header className="mb-4 flex items-center justify-between gap-2">
          <div className="flex-1 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 min-w-max pt-3">
              <Link href="/admin" className={getTabClass(!statusFilter)}>
                All <Badge count={globalTotal} active={!statusFilter} type="ALL" />
              </Link>

              <Link
                href={`/admin?status=AVAILABLE${query ? `&query=${query}` : ''}`}
                className={getTabClass(statusFilter === 'AVAILABLE')}
              >
                Avail <Badge count={availableCount} active={statusFilter === 'AVAILABLE'} type="AVAILABLE" />
              </Link>

              <Link
                href={`/admin?status=RENTED${query ? `&query=${query}` : ''}`}
                className={getTabClass(statusFilter === 'RENTED')}
              >
                Rent <Badge count={rentedCount} active={statusFilter === 'RENTED'} type="RENTED" />
              </Link>
              <Link
                href={`/admin?status=NOT_AVAILABLE${query ? `&query=${query}` : ''}`}
                className={getTabClass(statusFilter === 'NOT_AVAILABLE')}
              >
                N/A <Badge count={notAvailableCount} active={statusFilter === 'NOT_AVAILABLE'} type="NOT_AVAILABLE" />
              </Link>
              <Link
                href={`/admin?status=EXPIRED${query ? `&query=${query}` : ''}`}
                className={getTabClass(statusFilter === 'EXPIRED')}
              >
                Exp <Badge count={expiredCount} active={statusFilter === 'EXPIRED'} type="EXPIRED" />
              </Link>

              <Link
                href={`/admin?status=EXPIRING${query ? `&query=${query}` : ''}`}
                className={getTabClass(statusFilter === 'EXPIRING')}
              >
                Exp (3-6 mths) <Badge count={expiringCount} active={statusFilter === 'EXPIRING'} type="EXPIRING" />
              </Link>
            </div>
          </div>

          <div className="shrink-0 pt-2">
            <ResetOrderButton />
          </div>

          <div className="shrink-0 pt-2">
            <SearchBar />
          </div>

        </header>
        {/* <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">
              Search Directory
            </span>
            <div className="w-full">
              <SearchBar />
            </div>
          </div>
        </section> */}

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