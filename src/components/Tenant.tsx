"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';

export default function Tenant({ tenants = [], propertyId }: { tenants: any[], propertyId: string }) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [visibleCount, setVisibleCount] = useState(1);

    useEffect(() => { setMounted(true); }, []);

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
        setLoading(true);
        const container = e.currentTarget.closest(tenantId ? '.edit-container' : '.tenant-form-container');
        const inputs = container?.querySelectorAll('input');
        const data: any = {};

        inputs?.forEach(input => {
            const isMoney = ['rentalAmount', 'securityDeposit', 'utilityDeposit'].includes(input.name);
            data[input.name] = isMoney ? stripCommas(input.value) : input.value;
        });

        // One Clean URL Logic
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
                if (!tenantId) {
                    setIsAddOpen(false);
                    inputs?.forEach(i => i.value = ""); // Clear form
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
            {/* 1. HISTORY SECTION */}
            <div className="mt-2 mb-2">
                <div className="flex justify-between items-end mb-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                        Tenant History
                    </h3>
                </div>

                {/* Table Header - Strictly 12 slots */}
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
                        <div
                            key={tenant.id}
                            className={`edit-container group px-6 py-4 rounded-2xl border transition-all relative ${editingId === tenant.id
                                ? "bg-blue-50 border-blue-200 shadow-md ring-1 ring-blue-100"
                                : "bg-white border-gray-100 hover:border-gray-300 shadow-sm"
                                }`}
                        >
                            <div className="grid grid-cols-12 gap-4 items-center">

                                {/* 1. NAME - Occupies 3 slots */}
                                <div className="col-span-3">
                                    {editingId === tenant.id ? (
                                        <input
                                            name="name"
                                            defaultValue={tenant.name}
                                            className="w-full text-xs font-bold border-b-2 border-blue-300 bg-transparent outline-none focus:border-blue-500 transition-colors"
                                        />
                                    ) : (
                                        <p className="text-xs font-bold text-gray-900 truncate">{tenant.name}</p>
                                    )}
                                </div>

                                {/* 2. CONTACT ICONS - Occupies 1 slot, perfectly centered */}
                                <div className="col-span-1 flex items-center justify-center gap-3">
                                    {/* Email - Official Blue */}
                                    {tenant.email ? (
                                        <a href={`mailto:${tenant.email}`} className="transition-transform hover:scale-110" title={tenant.email}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0078d4" strokeWidth="2.5">
                                                <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                            </svg>
                                        </a>
                                    ) : (
                                        <div className="opacity-20 grayscale"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg></div>
                                    )}

                                    {/* WhatsApp - Official Emerald */}
                                    {tenant.mobile ? (
                                        <a href={`https://wa.me/${tenant.mobile.replace(/\D/g, '')}`} target="_blank" className="transition-transform hover:scale-110" title="WhatsApp">
                                            <svg width="16" height="16" fill="#25D366" viewBox="0 0 16 16">
                                                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.06 3.973L0 16l4.104-1.076a7.863 7.863 0 0 0 3.885 1.02h.006c4.369 0 7.927-3.558 7.93-7.927a7.865 7.865 0 0 0-2.324-5.691zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
                                            </svg>
                                        </a>
                                    ) : (
                                        <div className="opacity-20 grayscale"><svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.06 3.973L0 16l4.104-1.076a7.863 7.863 0 0 0 3.885 1.02h.006c4.369 0 7.927-3.558 7.93-7.927a7.865 7.865 0 0 0-2.324-5.691z" /></svg></div>
                                    )}
                                </div>

                                {/* 3. RENT - Occupies 2 slots */}
                                <div className="col-span-2 text-center">
                                    {editingId === tenant.id ? (
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs font-bold text-blue-600">$</span>
                                            <input
                                                name="rentalAmount"
                                                defaultValue={formatCurrency(tenant.rentalAmount)}
                                                onChange={handleCurrencyInput}
                                                className="w-full text-xs font-bold border-b-2 border-blue-300 bg-transparent outline-none text-blue-600"
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-xs font-bold text-blue-600">${formatCurrency(tenant.rentalAmount)}</p>
                                    )}
                                </div>

                                {/* 4. DEPOSITS - Occupies 2 slots */}
                                <div className="col-span-2 text-center">
                                    {editingId === tenant.id ? (
                                        <div className="flex gap-2">
                                            <input name="securityDeposit" defaultValue={formatCurrency(tenant.securityDeposit)} onChange={handleCurrencyInput} className="w-1/2 text-[10px] border-b-2 border-blue-300 bg-transparent outline-none" placeholder="Sec" />
                                            <input name="utilityDeposit" defaultValue={formatCurrency(tenant.utilityDeposit)} onChange={handleCurrencyInput} className="w-1/2 text-[10px] border-b-2 border-blue-300 bg-transparent outline-none" placeholder="Util" />
                                        </div>
                                    ) : (
                                        <p className="text-[10px] font-bold text-gray-500">
                                            ${formatCurrency(tenant.securityDeposit)} / ${formatCurrency(tenant.utilityDeposit)}
                                        </p>
                                    )}
                                </div>

                                {/* 5. Duration- Occupies 2 slots */}
                                <div className="col-span-2 text-center">
                                    {editingId === tenant.id ? (
                                        <div className="flex items-center gap-1">
                                            <input name="startDate" type="date" defaultValue={tenant.startDate?.split('T')[0]} className="text-[10px] border-b-2 border-blue-300 bg-transparent outline-none" />
                                            <span className="text-gray-400">-</span>
                                            <input name="endDate" type="date" defaultValue={tenant.endDate?.split('T')[0]} className="text-[10px] border-b-2 border-blue-300 bg-transparent outline-none" />
                                        </div>
                                    ) : (
                                        <p className="text-[10px] font-bold text-gray-700">
                                            {tenant.startDate ? new Date(tenant.startDate).toLocaleDateString('en-GB') : "—"}
                                            <span className="mx-1 text-gray-300">to</span>
                                            {tenant.endDate ? new Date(tenant.endDate).toLocaleDateString('en-GB') : "—"}
                                        </p>
                                    )}
                                </div>

                                {/* 6. ACTIONS - 2 Slots */}
                                <div className="col-span-2 flex justify-end items-center gap-2 border-gray-50">
                                    {editingId === tenant.id ? (
                                        <div className="flex gap-3">
                                            <button
                                                onClick={(e) => handleSave(e, tenant.id)}
                                                className="text-[10px] font-extrabold text-green-600 hover:text-green-700 uppercase"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="text-[10px] font-extrabold text-gray-400 hover:text-gray-600 uppercase"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => setEditingId(tenant.id)}
                                                className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                                title="Edit Tenant"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(tenant.id)}
                                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                title="Delete Tenant"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                                </svg>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* LOAD MORE BUTTON */}
            {tenants.length > visibleCount && (
                <div className="flex justify-center mt-6 mb-12">
                    <button
                        onClick={() => setVisibleCount(prev => prev + 10)}
                        className="group flex flex-col items-center gap-2 transition-all"
                    >
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 group-hover:text-blue-500">
                            Load More History
                        </span>
                        <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center group-hover:border-blue-100 group-hover:bg-blue-50">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-300 group-hover:text-blue-500">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </button>
                </div>
            )}
            {/* 2. ADD TENANT SECTION */}
            <div className="flex flex-col items-center">
                <button
                    type="button"
                    onClick={() => setIsAddOpen(!isAddOpen)}
                    className="flex flex-col items-center gap-1 group"
                >
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-gray-600 transition-colors">
                        {isAddOpen ? "Close" : "Add New Tenant"}
                    </span>
                    <div className={`w-12 h-12 rounded-full border-2 transition-all duration-300 flex items-center justify-center shadow-sm ${isAddOpen ? "bg-gray-900 border-gray-900 text-white" : "bg-white border-gray-100 text-gray-900 hover:border-gray-300"}`}>
                        <div className={`transition-transform duration-500 ${isAddOpen ? "rotate-0" : "rotate-180"}`}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="18 15 12 9 6 15"></polyline>
                            </svg>
                        </div>
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
                                    <input name="address" className={inputBaseClass} autoComplete="off" />
                                </div>
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <label className={labelClass}>Tenant Email</label>
                                    <input name="email" className={inputBaseClass} autoComplete="off" />
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={loading}
                                onClick={(e) => handleSave(e)}
                                className="mt-6 w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                            >
                                {loading ? "Saving..." : "Add New Tenant"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}