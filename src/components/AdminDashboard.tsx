//components/AdminDashboard.tsx

'use client';

import React, { useState, useMemo } from 'react';

// --- ICONS ---
const IconChartBar = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 16v-4" /><path d="M11 16V9" /><path d="M15 16V5" /><path d="M19 16v-7" /></svg>
);

const IconChartPie = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>
);

const IconChevron = ({ isOpen, className = "" }: { isOpen: boolean, className?: string }) => (
    <svg
        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        className={`transition-transform duration-300 ${isOpen ? 'rotate-0' : '-rotate-90'} ${className}`}
    >
        <path d="m6 9 6 6 6-6" />
    </svg>
);

export default function AdminDashboard({ properties = [] }: { properties: any[] }) {
    const [viewType, setViewType] = useState<'bar' | 'ring'>('bar');
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const { sorted, maxRevenue, totalRevenueAll, chartColors } = useMemo(() => {
        const groups: Record<string, { name: string; totalRevenue: number; count: number; items: any[] }> = {};
        let totalAll = 0;

        properties.forEach(prop => {
            const seriesPrefix = prop.title.substring(0, 2).toUpperCase();
            if (!groups[seriesPrefix]) {
                groups[seriesPrefix] = { name: seriesPrefix, totalRevenue: 0, count: 0, items: [] };
            }
            const rev = Number(prop.rental || 0);
            groups[seriesPrefix].totalRevenue += rev;
            groups[seriesPrefix].count += 1;
            groups[seriesPrefix].items.push(prop);
            totalAll += rev;
        });

        // --- CORRECTED SORTING LOGIC ---
        Object.values(groups).forEach(group => {
            group.items.sort((a, b) => {
                const titleA = a.title.toUpperCase();
                const titleB = b.title.toUpperCase();
                const [baseA, floorA] = titleA.split('-');
                const [baseB, floorB] = titleB.split('-');

                if (baseA !== baseB) {
                    return baseA.localeCompare(baseB, undefined, { numeric: true });
                }

                const getWeight = (f: string) => {
                    if (!f) return 0;
                    if (f === 'G') return 1;
                    if (f === 'M') return 2;
                    const n = parseInt(f);
                    return isNaN(n) ? 99 : 10 + n;
                };

                return getWeight(floorA) - getWeight(floorB);
            });
        });

        const sortedData = Object.values(groups).sort((a, b) => b.totalRevenue - a.totalRevenue);
        const colors = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#06b6d4'];

        return {
            sorted: sortedData,
            maxRevenue: sortedData[0]?.totalRevenue || 0,
            totalRevenueAll: totalAll,
            chartColors: sortedData.map((_, i) => colors[i % colors.length])
        };
    }, [properties]);

    {/* 1. Define these constants at the top of your component */ }
    const radius = 75;
    const strokeWidthDefault = 35;
    const strokeWidthSelected = 45;
    const circumference = 2 * Math.PI * radius;

    return (
        <div className="space-y-6">
            <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-10">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-black">Revenue Analytics</h2>
                    <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                        <button onClick={() => { setViewType('bar'); setSelectedIndex(null); }} className={`p-2 rounded-lg transition-all ${viewType === 'bar' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}><IconChartBar /></button>
                        <button onClick={() => setViewType('ring')} className={`p-2 rounded-lg transition-all ${viewType === 'ring' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}><IconChartPie /></button>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-12">
                    {viewType === 'bar' ? (
                        <div className="w-full space-y-6">
                            {sorted.map((group) => (
                                <div key={group.name} className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-tight text-gray-900">
                                        <span>{group.name} Series</span>
                                        <span className="text-blue-600 font-black">${group.totalRevenue.toLocaleString()}</span>
                                    </div>
                                    <div className="h-4 w-full bg-gray-50 rounded-full border border-gray-100 overflow-hidden">
                                        <div className="h-full bg-blue-600 rounded-full transition-all duration-700 ease-out" style={{ width: `${(group.totalRevenue / maxRevenue) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center w-full gap-10">
                            {/* CENTERED RING */}
                            <div className="relative w-80 h-80 flex-shrink-0 flex items-center justify-center">
                                <svg
                                    width="320"
                                    height="320"
                                    viewBox="0 0 200 200"
                                    fill="none"
                                    className="-rotate-90 drop-shadow-md overflow-visible" // Added overflow-visible
                                >
                                    {sorted.reduce((acc, group, i) => {
                                        const percentage = (group.totalRevenue / totalRevenueAll);
                                        const offset = acc.currentOffset;
                                        acc.currentOffset += percentage;
                                        const isSelected = selectedIndex === i;

                                        acc.elements.push(
                                            <circle
                                                key={group.name}
                                                cx="100"
                                                cy="100"
                                                r={radius}
                                                stroke={chartColors[i]}
                                                strokeWidth={isSelected ? strokeWidthSelected : strokeWidthDefault}
                                                strokeDasharray={`${percentage * circumference} ${circumference}`}
                                                strokeDashoffset={-offset * circumference}
                                                strokeLinecap="butt" // Keeps the segments clean and touching
                                                className="transition-all duration-500 cursor-pointer hover:opacity-90"
                                                style={{
                                                    opacity: selectedIndex === null || isSelected ? 1 : 0.3,
                                                    // This adds a slight "zoom" effect to the selected slice
                                                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                                                    transformOrigin: 'center'
                                                }}
                                                onClick={() => setSelectedIndex(prev => prev === i ? null : i)}
                                            />
                                        );
                                        return acc;
                                    }, { elements: [] as React.ReactNode[], currentOffset: 0 }).elements}
                                </svg>
                                {/* CENTER TEXT - Calibrated for the larger hole */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    {selectedIndex !== null ? (
                                        <div className="text-center animate-in fade-in zoom-in duration-300">
                                            <span className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] block mb-1">
                                                {sorted[selectedIndex].name}
                                            </span>
                                            <span className="text-2xl font-black text-black block tracking-tighter leading-none">
                                                ${sorted[selectedIndex].totalRevenue.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase mt-1 block">
                                                {((sorted[selectedIndex].totalRevenue / totalRevenueAll) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="text-center animate-in fade-in duration-500">
                                            <span className="text-[11px] font-black text-gray-300 uppercase tracking-[0.2em] block mb-1">Portfolio</span>
                                            <span className="text-3xl font-black text-black block tracking-tighter leading-none">
                                                ${totalRevenueAll.toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* LEGEND IN A ROW BELOW */}
                            <div className="flex flex-wrap justify-center gap-4 w-full px-4">
                                {sorted.map((group, i) => (
                                    <button key={group.name} onClick={() => setSelectedIndex(prev => prev === i ? null : i)} className={`flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all ${selectedIndex === i ? 'bg-white border-blue-200 shadow-sm scale-105' : 'bg-gray-50 border-transparent hover:bg-gray-100'}`}>
                                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: chartColors[i] }} />
                                        <div className="flex flex-col text-left">
                                            <span className={`text-[10px] font-black uppercase tracking-tight ${selectedIndex === i ? 'text-blue-600' : 'text-gray-900'}`}>{group.name}</span>
                                            <span className="text-[8px] font-bold text-gray-400 uppercase">${group.totalRevenue.toLocaleString()}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* ACCORDION LIST */}
            <div className="space-y-3">
                {sorted.map((group) => {
                    const isOpen = !!expandedGroups[group.name];

                    return (
                        <div key={group.name} className={`bg-white rounded-[2rem] border transition-all duration-300 overflow-hidden shadow-sm ${isOpen ? 'border-blue-200 ring-1 ring-blue-50' : 'border-gray-100'}`}>
                            <button
                                onClick={() => setExpandedGroups(p => ({ ...p, [group.name]: !isOpen }))}
                                className="w-full flex items-center justify-between p-6 hover:bg-gray-50/50 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    {/* THE ROTATING CHEVRON BOX */}
                                    <div className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all duration-500 ${isOpen
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                                        : 'bg-gray-50 border-gray-100 text-gray-400'
                                        }`}>
                                        <IconChevron isOpen={isOpen} />
                                    </div>

                                    <div className="text-left">
                                        <h3 className="font-black text-black text-sm tracking-tight">
                                            {group.name} Series
                                        </h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">
                                            {group.count} units total
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    {/* REVENUE SUMMARY (Hidden on tiny screens) */}
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Revenue</p>
                                        <p className={`text-sm font-black transition-colors ${isOpen ? 'text-blue-600' : 'text-black'}`}>
                                            ${group.totalRevenue.toLocaleString()}
                                        </p>
                                    </div>

                                    {/* SECONDARY ROTATING INDICATOR */}
                                    <div className={`p-2 rounded-xl transition-all duration-300 ${isOpen ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-300'}`}>
                                        <IconChevron isOpen={isOpen} className="w-3 h-3" />
                                    </div>
                                </div>
                            </button>

                            {isOpen && (
                                <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="bg-gray-50/50 rounded-[1.5rem] border border-gray-100 overflow-hidden">
                                        {/* TABLE HEADER */}
                                        <div className="flex items-center px-4 py-2 border-b border-gray-100 bg-gray-100/50 text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                            <div className="w-24">Unit ID</div>
                                            <div className="flex-grow">Current Tenant</div>
                                            <div className="w-32 text-right">Monthly Rental</div>
                                        </div>

                                        <div className="divide-y divide-gray-100">
                                            {group.items.map((item: any) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center px-4 py-2.5 bg-white hover:bg-blue-50/30 transition-colors group/item"
                                                >
                                                    {/* UNIT ID */}
                                                    <div className="w-24 font-black text-[11px] text-black uppercase tracking-tight">
                                                        {item.title}
                                                    </div>

                                                    {/* TENANT INFO */}
                                                    <div className="flex-grow flex items-center gap-3">
                                                        {/* Use currentTenant which we defined in the service */}
                                                        <div className={`w-1.5 h-1.5 rounded-full ${item.currentTenant !== 'VACANT' ? 'bg-green-500' : 'bg-gray-200'}`} />
                                                        <div className="flex flex-col">
                                                            <span className={`text-[11px] font-bold tracking-tight ${item.currentTenant !== 'VACANT' ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                                                                {item.currentTenant}
                                                            </span>
                                                            {/* Small address sub-text */}
                                                            <span className="text-[10px] text-gray-400 font-medium truncate max-w-[200px]">
                                                                {item.address}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* RENTAL AMOUNT */}
                                                    <div className="w-32 text-right">
                                                        <span className="font-black text-xs text-blue-600">
                                                            ${Number(item.rental).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}