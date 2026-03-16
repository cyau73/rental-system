"use client";

import { useState } from "react";

export default function Tenant({ tenants = [] }: { tenants: any[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [visibleCount, setVisibleCount] = useState(1); // Initially show only the latest
    const latestTenant = tenants || null; const hasMore = tenants.length > visibleCount;

    const inputBaseClass = "border border-gray-300 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white text-gray-900 font-bold placeholder:text-gray-400";
    const labelClass = "text-[10px] font-bold uppercase text-gray-600 ml-1 tracking-widest";

    const formattedRental = latestTenant?.rental
        ? Number(latestTenant.rental).toLocaleString('en-US')
        : "";
    const formattedSecurityDeposit = latestTenant?.securityDeposit
        ? Number(latestTenant.securityDeposit).toLocaleString('en-US')
        : "";
    const formattedUtilityDeposit = latestTenant?.utilityDeposit
        ? Number(latestTenant.utilityDeposit).toLocaleString('en-US')
        : "";

    const toggleSection = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="mt-8 border-t border-gray-100 pt-6 font-[family-name:var(--font-geist-sans)]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                    Tenant Information
                </h3>

                {/* 2. ADD type="button" TO PREVENT FORM SUBMISSION/REDIRECT */}
                <button
                    type="button"
                    onClick={toggleSection}
                    className={`w-12 h-12 rounded-full border-2 transition-all duration-300 flex items-center justify-center shadow-sm ${isOpen
                        ? "bg-gray-900 border-gray-900 text-white"
                        : "bg-white border-gray-100 text-gray-900 hover:border-gray-300"
                        }`}
                >
                    <div className={`transition-transform duration-500 ${isOpen ? "rotate-0" : "rotate-180"}`}>
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                    </div>
                </button>
            </div >

            {/* 3. CONDITIONAL RENDERING: Only shows when isOpen is true */}
            {
                isOpen && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                        {tenants.length === 0 ? (
                            <div className="bg-gray-50 rounded-xl p-6 border border-dashed border-gray-200">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 text-center">
                                    No tenants found. Fill in details to add.
                                </p>
                                {/* Render your Add Tenant Form fields here */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2 md:col-span-2">
                                        <label className={labelClass}>Tenant Name</label>
                                        <input
                                            name="title"
                                            defaultValue={tenants.name}
                                            className={inputBaseClass}
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 md:col-span-2">
                                        <label className={labelClass}>Tenant Address</label>
                                        <input
                                            name="title"
                                            defaultValue={tenants.address}
                                            className={inputBaseClass}
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className={labelClass}>Tenant Mobile</label>
                                        <input
                                            name="title"
                                            defaultValue={tenants.mobile}
                                            className={inputBaseClass}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className={labelClass}>Tenant Email</label>
                                        <input
                                            name="title"
                                            defaultValue={tenants.email}
                                            className={inputBaseClass}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className={labelClass}>Tenant Start Date</label>
                                        <input
                                            name="rental"
                                            type="text" // Changed to text to allow comma display
                                            defaultValue={formattedRental}
                                            placeholder="e.g. 2,500"
                                            className={`${inputBaseClass} font-mono text-blue-600`}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className={labelClass}>Tenancy Start Date</label>
                                        <input
                                            name="rental"
                                            type="date" // Changed to text to allow comma display
                                            placeholder="DD/MM/YYYY"
                                            className={`${inputBaseClass} font-mono text-blue-600`}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className={labelClass}>Security Deposit ($)</label>
                                        <input
                                            name="securityDeposit"
                                            type="text" // Changed to text to allow comma display
                                            defaultValue={formattedSecurityDeposit}
                                            placeholder="e.g. 2,500"
                                            className={`${inputBaseClass} font-mono text-blue-600`}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className={labelClass}>Utility Deposit ($)</label>
                                        <input
                                            name="utilityDeposit"
                                            type="text" // Changed to text to allow comma display
                                            defaultValue={formattedUtilityDeposit}
                                            placeholder="e.g. 2,500"
                                            className={`${inputBaseClass} font-mono text-blue-600`}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {tenants.slice(0, visibleCount).map((tenant, idx) => (
                                    <div key={tenant.id} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
                                        <div>
                                            <label className="text-[8px] font-extrabold uppercase tracking-widest text-gray-400 block mb-1">Name</label>
                                            <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{tenant.name}</p>
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-extrabold uppercase tracking-widest text-gray-400 block mb-1">Mobile</label>
                                            <p className="text-sm font-bold text-gray-900 tracking-tight">{tenant.mobile}</p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-[8px] font-extrabold uppercase tracking-widest text-gray-400 block mb-1">Address</label>
                                            <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{tenant.address}</p>
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-extrabold uppercase tracking-widest text-gray-400 block mb-1">Start Date</label>
                                            <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{new Date(tenant.startDate).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-extrabold uppercase tracking-widest text-gray-400 block mb-1">Rental Amount</label>
                                            <p className="text-sm font-bold text-blue-600 uppercase tracking-tight">RM {tenant.rentalAmount}</p>
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-extrabold uppercase tracking-widest text-gray-400 block mb-1">Security Deposit</label>
                                            <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">RM {tenant.securityDeposit}</p>
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-extrabold uppercase tracking-widest text-gray-400 block mb-1">Utility Deposit</label>
                                            <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">RM {tenant.utilityDeposit}</p>
                                        </div>
                                    </div>
                                ))}

                                {/* Load More Logic */}
                                <div className="flex justify-center mt-4">
                                    {hasMore ? (
                                        <button
                                            onClick={() => setVisibleCount(tenants.length)}
                                            className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 hover:text-blue-800 transition-colors"
                                        >
                                            Load More Tenants
                                        </button>
                                    ) : tenants.length > 1 && (
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300">
                                            No other tenants
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )
            }
        </div >
    );
}