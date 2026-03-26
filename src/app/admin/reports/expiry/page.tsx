//reports/expiry/page.tsx

import { auth } from "@/auth";
import AdminNav from "@/components/AdminNav";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import SearchBar from "@/components/SearchBar";
import Link from "next/link";
import PropertyListDraggable from "@/components/PropertyListDraggable";
import { getPropertiesWithLatestTenant } from "@/lib/property-service";
import { Prisma } from "@prisma/client";

export default async function ExpiryReportPage({
    searchParams,
}: {
    searchParams: Promise<{ query?: string; year?: string }>;
}) {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") redirect("/login");

    const params = await searchParams;
    const query = params.query || "";
    const searchTerm = `%${query}%`;
    const yearFilter = params.year || null; // This will be 'PAST', '2026', '2027', etc.

    // 1. Fetch Year Counts (Global Badges)
    const currentYear = new Date().getFullYear();

    // Define your dynamic ranges
    const reportTabs = [
        { label: `Before ${currentYear}`, value: 'PAST', year: null },
        { label: `${currentYear}`, value: currentYear.toString(), year: currentYear },
        { label: `${currentYear + 1}`, value: (currentYear + 1).toString(), year: currentYear + 1 },
        { label: `${currentYear + 2}`, value: (currentYear + 2).toString(), year: currentYear + 2 },
    ];

    const tabCounts = await Promise.all(
        reportTabs.map(tab => {
            if (tab.value === 'PAST') {
                return prisma.property.count({
                    where: {
                        tenants: {
                            some: { endDate: { lt: new Date(`${currentYear}-01-01`) } },
                            none: { endDate: { gte: new Date(`${currentYear}-01-01`) } } // Ensure no newer lease exists
                        }
                    }
                });
            }
            return prisma.property.count({
                where: {
                    tenants: {
                        some: {
                            endDate: {
                                gte: new Date(`${tab.year}-01-01`),
                                lte: new Date(`${tab.year}-12-31`),
                            }
                        },
                        none: { endDate: { gt: new Date(`${tab.year}-12-31`) } } // Latest is in this year
                    }
                }
            });
        })
    );

    // Just pass the query and the year filter from params
    const properties = await getPropertiesWithLatestTenant(query, yearFilter);

    const getTabClass = (active: boolean) =>
        `relative px-4 py-2 mr-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl ${active ? "bg-amber-500 text-white shadow-md" : "text-gray-400 hover:text-gray-900 hover:bg-white"
        }`;

    const Badge = ({ count, active }: { count: number; active: boolean }) => (
        count > 0 ? (
            <span className={`absolute -top-2 -right-3 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[8px] font-black border-2 ${active ? 'ring-2 ring-white' : 'border-transparent'} bg-amber-500 text-white shadow-sm z-20`}>
                {count}
            </span>
        ) : null
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans selection:bg-blue-100">
            <AdminNav user={session.user} />

            <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 pt-4 md:pt-6 pb-10">
                {/* COMPACT HEADER (TABS + RESET BUTTON) */}
                {/* 1. COMPACT HEADER (TABS + RESET BUTTON) */}
                <header className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-black text-black tracking-tight uppercase">
                            Expiry Reports
                        </h1>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                            Overview of Expiring Tenancies
                        </p>
                    </div>

                    {/* SearchBar stays on the right on desktop */}
                    <div className="w-full md:w-72">
                        <SearchBar />
                    </div>
                </header>
                {/* 2. NAVIGATION: Tabs below the title row, but above the list */}
                <div className="mb-8 border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-1.5 min-w-max pt-2">
                            <Link href="/admin/reports/expiry" className={getTabClass(!yearFilter)}>
                                All
                            </Link>

                            {reportTabs.map((tab, index) => (
                                <Link
                                    key={tab.value}
                                    href={`/admin/reports/expiry?year=${tab.value}${query ? `&query=${query}` : ''}`}
                                    className={getTabClass(yearFilter === tab.value)}
                                >
                                    {tab.label} <Badge count={tabCounts[index]} active={yearFilter === tab.value} />
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* LIST SECTION */}
                <PropertyListDraggable properties={properties} />
            </main>
        </div>
    );
}