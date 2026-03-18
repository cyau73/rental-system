//components/Tenant.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from 'next/navigation';

export default function Tenant({ tenants = [], propertyId }: { tenants: any[], propertyId: string }) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [visibleCount, setVisibleCount] = useState(3); // Increased default for better visibility
    const [activePopover, setActivePopover] = useState<string | null>(null);
    const [showCheck, setShowCheck] = useState<string | null>(null);

    // 1. Stable Silent Save Function
    const handleSilentSave = useCallback(async (tenantId: string, container: Element) => {
        const inputs = container.querySelectorAll('input[name]');
        const data: any = {};

        inputs.forEach(input => {
            const isMoney = ['rentalAmount', 'securityDeposit', 'utilityDeposit'].includes(input.name);
            data[input.name] = isMoney ? stripCommas(input.value) : input.value;
        });

        try {
            const response = await fetch(`/api/tenants/${tenantId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, propertyId }),
            });

            if (response.ok) {
                setShowCheck(tenantId);
                // Optional: Uncomment below if you want the icons to update instantly
                // router.refresh(); 
                setTimeout(() => setShowCheck(null), 2000);
            }
        } catch (error) {
            console.error("Silent save failed", error);
        }
    }, [propertyId]); // Removed router from deps to prevent effect re-runs

    // 2. Updated Click Outside Logic
    useEffect(() => {
        setMounted(true);
        const handleClickOutside = async (event: MouseEvent) => {
            const target = event.target as Element;
            const isPopoverClick = target.closest('.contact-popover-container');

            // NEW: Check if we are clicking the 'Save' button itself
            const isSaveButtonClick = target.tagName === 'BUTTON' && target.textContent?.toLowerCase() === 'save';

            if (activePopover && !isPopoverClick && !isSaveButtonClick) {
                const container = document.querySelector(`.edit-container[data-tenant-id="${activePopover}"]`);
                if (container) {
                    // Only save if it's not a direct button click (which has its own handler)
                    await handleSilentSave(activePopover, container);
                }
                setActivePopover(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [activePopover, handleSilentSave]);

    const formatCurrency = (val: any) => {
        if (val === undefined || val === null || val === "") return "";
        const num = val.toString().replace(/,/g, "");
        return Number(num).toLocaleString('en-US');
    };

    const stripCommas = (val: string) => val.replace(/,/g, "");

    const handleCurrencyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = stripCommas(e.target.value);
        if (isNaN(Number(rawValue)) && rawValue !== "") return;
        e.target.value = formatCurrency(rawValue);
    };

    const handleSave = async (e: React.MouseEvent, tenantId?: string) => {
        // Prevent double-triggering
        if (loading) return;
        setLoading(true);

        const container = e.currentTarget.closest(tenantId ? '.edit-container' : '.tenant-form-container');
        if (!container) return;

        // This grabs ALL inputs in the row AND the popover inside it
        const inputs = container.querySelectorAll('input');
        const data: any = {};

        inputs.forEach(input => {
            const val = input.value.trim();
            if (['rentalAmount', 'securityDeposit', 'utilityDeposit'].includes(input.name)) {
                const cleanNum = stripCommas(val);
                data[input.name] = cleanNum === "" ? null : parseFloat(cleanNum);
            } else {
                // Force email/mobile to be empty strings if blank, never null
                data[input.name] = val || "";
            }
        });

        const url = tenantId ? `/api/tenants/${tenantId}` : '/api/tenants';
        const method = tenantId ? 'PATCH' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, propertyId }),
            });

            if (response.ok) {
                router.refresh();
                setEditingId(null);
                setActivePopover(null);
                if (!tenantId) {
                    setIsAddOpen(false);
                    inputs.forEach(i => i.value = "");
                }
            }
        } catch (error) {
            console.error("Save failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this tenant record?")) return;
        try {
            const res = await fetch(`/api/tenants/${id}`, { method: 'DELETE' });
            if (res.ok) router.refresh();
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    const labelClass = "text-[10px] font-bold uppercase text-gray-600 ml-1 tracking-widest";
    const inputBaseClass = "border border-gray-300 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white text-gray-900 font-bold placeholder:text-gray-400";

    if (!mounted) return <div className="mt-8 pt-6 border-t border-gray-100" />;

    return (
        <div className="mt-0 border-gray-100 pt-0">
            <div className="mt-2 mb-2">
                <div className="flex justify-between items-end mb-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Tenant History</h3>
                </div>

                <div className="hidden md:grid grid-cols-12 gap-4 px-6 mb-3">
                    <div className="col-span-3 text-[9px] font-black text-gray-400 uppercase">Tenant Name</div>
                    <div className="col-span-1 text-[9px] font-black text-gray-400 uppercase text-center">Contact</div>
                    <div className="col-span-2 text-[9px] font-black text-gray-400 uppercase text-center">Rental</div>
                    <div className="col-span-2 text-[9px] font-black text-gray-400 uppercase text-center">Deposits (S/U)</div>
                    <div className="col-span-2 text-[9px] font-black text-gray-400 uppercase text-center">Tenancy Period</div>
                    <div className="col-span-2 text-[9px] font-black text-gray-400 uppercase text-center">Actions</div>
                </div>

                <div className="space-y-2">
                    {tenants.slice(0, visibleCount).map((tenant) => (
                        <div key={tenant.id}
                            data-tenant-id={tenant.id}
                            className={`edit-container group px-6 py-4 rounded-2xl border transition-all relative ${editingId === tenant.id ? "bg-blue-50 border-blue-200 shadow-md ring-1 ring-blue-100" : "bg-white border-gray-100 hover:border-gray-300 shadow-sm"}`}>
                            <div className="grid grid-cols-12 gap-4 items-center">

                                <div className="col-span-3">
                                    {editingId === tenant.id ? (
                                        <input name="name" defaultValue={tenant.name} className="w-full text-gray-900 text-xs font-bold border-b-2 border-blue-300 bg-transparent outline-none focus:border-gray-500 transition-colors" />
                                    ) : (
                                        <p className="text-xs font-bold text-gray-900 truncate">{tenant.name}</p>
                                    )}
                                </div>

                                <div className="col-span-1 flex items-center justify-center relative contact-popover-container">
                                    {editingId === tenant.id ? (
                                        <div className="relative">
                                            <button type="button" onClick={() => setActivePopover(activePopover === tenant.id ? null : tenant.id)} className={`p-2 rounded-lg transition-all ${activePopover === tenant.id ? 'bg-blue-600 text-white' : 'bg-blue-50 text-gray-900 hover:bg-blue-100'}`}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                                            </button>
                                            {activePopover === tenant.id && (
                                                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-56 bg-white border border-gray-200 shadow-2xl rounded-[1.5rem] p-4 z-[100] animate-in fade-in zoom-in-95 duration-200">
                                                    <div className="flex flex-col gap-4">
                                                        <div className="flex flex-col gap-1">
                                                            <label className="text-[9px] font-black uppercase text-blue-500 ml-1">Email Address</label>
                                                            <input name="email"
                                                                defaultValue={tenant.email || ""}
                                                                autoComplete="email"
                                                                placeholder="tenant@email.com"
                                                                className="text-xs text-gray-900 font-bold border-b border-gray-100 bg-transparent py-1 outline-none focus:border-blue-400" />
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <label className="text-[9px] font-black uppercase text-emerald-500 ml-1">WhatsApp Number</label>
                                                            <input name="mobile"
                                                                defaultValue={tenant.mobile || ""}
                                                                autoComplete="tel"
                                                                placeholder="60123456789"
                                                                className="text-xs text-gray-900 font-bold border-b border-gray-100 bg-transparent py-1 outline-none focus:border-emerald-400" />
                                                        </div>
                                                    </div>
                                                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45"></div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-3">
                                            {tenant.email && <a href={`mailto:${tenant.email}`} title={tenant.email}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0078d4" strokeWidth="2.5"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg></a>}
                                            {tenant.mobile && <a href={`https://wa.me/${tenant.mobile.replace(/\D/g, '')}`} target="_blank"><svg width="14" height="14" fill="#25D366" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.06 3.973L0 16l4.104-1.076a7.863 7.863 0 0 0 3.885 1.02h.006c4.369 0 7.927-3.558 7.93-7.927a7.865 7.865 0 0 0-2.324-5.691z" /></svg></a>}
                                        </div>
                                    )}
                                </div>

                                <div className="col-span-2 text-center">
                                    {editingId === tenant.id ? (
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs font-bold text-blue-600">$</span>
                                            <input name="rentalAmount" defaultValue={formatCurrency(tenant.rentalAmount)} onChange={handleCurrencyInput} className="w-full text-xs text-gray-900 font-bold border-b-2 border-blue-300 bg-transparent outline-none text-blue-600" />
                                        </div>
                                    ) : (
                                        <p className="text-xs font-bold text-blue-600">${formatCurrency(tenant.rentalAmount)}</p>
                                    )}
                                </div>

                                <div className="col-span-2 text-center">
                                    {editingId === tenant.id ? (
                                        <div className="flex gap-2">
                                            <input name="securityDeposit" defaultValue={formatCurrency(tenant.securityDeposit)} onChange={handleCurrencyInput} className="w-1/2 text-[10px] text-gray-900 border-b-2 border-blue-300 bg-transparent outline-none" placeholder="$1,000" />
                                            <input name="utilityDeposit" defaultValue={formatCurrency(tenant.utilityDeposit)} onChange={handleCurrencyInput} className="w-1/2 text-[10px] text-gray-900 border-b-2 border-blue-300 bg-transparent outline-none" placeholder="$1,000" />
                                        </div>
                                    ) : (
                                        <p className="text-[10px] font-bold text-gray-500">${formatCurrency(tenant.securityDeposit)} / ${formatCurrency(tenant.utilityDeposit)}</p>
                                    )}
                                </div>

                                <div className="col-span-2 text-center">
                                    {editingId === tenant.id ? (
                                        <div className="flex items-center gap-1">
                                            <input name="startDate" type="date" defaultValue={tenant.startDate?.split('T')[0]} className="text-[10px] text-gray-900 border-b-2 border-blue-300 bg-transparent outline-none" />
                                            <input name="endDate" type="date" defaultValue={tenant.endDate?.split('T')[0]} className="text-[10px] text-gray-900 border-b-2 border-blue-300 bg-transparent outline-none" />
                                        </div>
                                    ) : (
                                        <p className="text-[10px] font-bold text-gray-700">
                                            {tenant.startDate ? new Date(tenant.startDate).toLocaleDateString('en-GB') : "—"}
                                            <span className="mx-1 text-gray-300">to</span>
                                            {tenant.endDate ? new Date(tenant.endDate).toLocaleDateString('en-GB') : "—"}
                                        </p>
                                    )}
                                </div>

                                <div className="col-span-2 flex justify-end items-center gap-2 relative">
                                    {showCheck === tenant.id && (
                                        <div className="absolute -left-8 top-1/2 -translate-y-1/2 bg-emerald-500 text-white p-1 rounded-full shadow-lg animate-in zoom-in-50 fade-in duration-300">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </div>
                                    )}
                                    {editingId === tenant.id ? (
                                        <div className="flex gap-3">
                                            <button onClick={(e) => handleSave(e, tenant.id)} className="text-[10px] font-extrabold text-green-600 hover:text-green-700 uppercase">Save</button>
                                            <button onClick={() => { setEditingId(null); setActivePopover(null); }} className="text-[10px] font-extrabold text-gray-400 hover:text-gray-600 uppercase">Cancel</button>
                                        </div>
                                    ) : (
                                        <>
                                            <button onClick={() => setEditingId(tenant.id)} className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                                            <button onClick={() => handleDelete(tenant.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg></button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Load More & Add Section */}
            {tenants.length > visibleCount && (
                <div className="flex justify-center mt-6 mb-12">
                    <button onClick={() => setVisibleCount(prev => prev + 10)} className="group flex flex-col items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 group-hover:text-blue-500">Load More History</span>
                        <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-blue-50"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg></div>
                    </button>
                </div>
            )}

            <div className="flex flex-col items-center mt-8">
                <button type="button" onClick={() => setIsAddOpen(!isAddOpen)} className="flex flex-col items-center gap-1 group">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-gray-600">{isAddOpen ? "Close" : "Add New Tenant"}</span>
                    <div className={`w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center ${isAddOpen ? "bg-gray-900 border-gray-900 text-white" : "bg-white border-gray-100 text-gray-900"}`}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" className={`transition-transform duration-300 ${isAddOpen ? "rotate-0" : "rotate-180"}`}><polyline points="18 15 12 9 6 15"></polyline></svg>
                    </div>
                </button>

                {isAddOpen && (
                    <div className="w-full mt-8 animate-in fade-in slide-in-from-top-2">
                        <div className="tenant-form-container bg-gray-50 rounded-xl p-6 border border-dashed border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <label className={labelClass}>Tenant Name</label>
                                    <input name="name" className={inputBaseClass} autoComplete="off" />
                                </div>
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <label className={labelClass}>Rental Amount ($)</label>
                                    <input name="rentalAmount" onChange={handleCurrencyInput} className={inputBaseClass} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className={labelClass}>Start Date</label>
                                    <input name="startDate" type="date" className={inputBaseClass} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className={labelClass}>End Date</label>
                                    <input name="endDate" type="date" className={inputBaseClass} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className={labelClass}>Security Deposit ($)</label>
                                    <input name="securityDeposit" onChange={handleCurrencyInput} className={inputBaseClass} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className={labelClass}>Utility Deposit ($)</label>
                                    <input name="utilityDeposit" onChange={handleCurrencyInput} className={inputBaseClass} />
                                </div>
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <label className={labelClass}>Tenant Address</label>
                                    <input name="address" className={inputBaseClass} />
                                </div>
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <label className={labelClass}>Tenant Email</label>
                                    <input name="email" className={inputBaseClass} autoComplete="email" />
                                </div>
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <label className={labelClass}>Mobile Number (for WhatsApp)</label>
                                    <input name="mobile" placeholder="e.g. 60123456789" className={inputBaseClass} />
                                </div>
                            </div>
                            <button type="button" disabled={loading} onClick={(e) => handleSave(e)} className="mt-6 w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-colors shadow-lg">
                                {loading ? "Saving..." : "Add New Tenant"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}