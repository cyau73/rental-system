"use client";

import { useState } from "react";
import { updateProperty } from "@/app/actions/properties";
import { getStatusTheme } from "@/lib/status-styles";

export default function PropertyGeneralInfo({ property }: { property: any }) {
    const [isEditing, setIsEditing] = useState(false);
    const [status, setStatus] = useState(property.status);
    const theme = getStatusTheme(status);

    const inputBaseClass = "border border-gray-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white text-gray-900 font-bold text-xs";
    const labelClass = "text-[9px] font-black uppercase text-gray-400 tracking-widest mb-0.5";

    if (!isEditing) {
        return (
            <section className="bg-white p-4 md:p-5 rounded-[1.5rem] shadow-sm border border-gray-100 mb-2 relative group">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-[9px] font-black uppercase text-blue-600 tracking-[0.2em]">General Info</h2>
                    <button onClick={() => setIsEditing(true)} className="p-1 text-gray-300 hover:text-blue-500 transition-all">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2.5">
                    <div className="col-span-2 md:col-span-1">
                        <p className={labelClass}>Property Name</p>
                        <p className="text-base font-black text-black truncate">{property.title}</p>
                    </div>
                    <div>
                        <p className={labelClass}>Rent / Sale Price</p>
                        <p className="text-sm font-black text-blue-700 whitespace-nowrap">
                            ${Number(property.rental).toLocaleString()}
                            <span className="text-gray-300 mx-1">/</span>
                            <span className="text-orange-700">${property.price ? Number(property.price).toLocaleString() : "—"}</span>
                        </p>
                    </div>
                    <div className="flex flex-col items-start">
                        <p className={labelClass}>Status</p>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border-2 ${theme.bg} ${theme.text} ${theme.border}`}>
                            {theme.label}
                        </span>
                    </div>

                    <div className="col-span-2 md:col-span-2">
                        <p className={labelClass}>Address</p>
                        <p className="text-sm font-bold text-gray-800 leading-snug line-clamp-2">
                            {property.address}
                        </p>
                    </div>
                    <div>
                        <p className={labelClass}>Type & Area</p>
                        <p className="text-[11px] font-bold text-black">
                            {property.type || "—"} • {property.landArea || "—"} / {property.builtUp || "—"}
                        </p>
                    </div>

                    {property.remarks && (
                        <div className="col-span-2 md:col-span-3 mt-1 pt-2 border-t border-gray-50">
                            <p className={labelClass}>Remarks</p>
                            <p className="text-[12px] text-gray-500 italic line-clamp-1">{property.remarks}</p>
                        </div>
                    )}
                </div>
            </section>
        );
    }

    return (
        <section className="bg-blue-50 p-4 md:p-5 rounded-[1.5rem] shadow-md border border-blue-200 mb-2">
            <form action={async (formData) => { await updateProperty(formData); setIsEditing(false); }}>
                <input type="hidden" name="id" value={property.id} />
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-[10px] font-black uppercase text-blue-700 tracking-[0.2em]">Editing Details</h2>
                    <div className="flex gap-4">
                        <button type="button" onClick={() => setIsEditing(false)} className="text-[9px] font-black text-gray-400 uppercase">Cancel</button>
                        <button type="submit" className="text-[9px] font-black text-blue-600 uppercase">Save</button>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-3 gap-3">
                        {/* Title: 1 column */}
                        <div className="flex flex-col">
                            <label className={labelClass}>Title</label>
                            <input name="title" defaultValue={property.title} className={inputBaseClass} required />
                        </div>
                        {/* Address: 2 columns - FIXED HERE */}
                        <div className="flex flex-col col-span-2">
                            <label className={labelClass}>Address</label>
                            <input name="address" defaultValue={property.address} className={inputBaseClass} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col">
                            <label className={labelClass}>Rent ($)</label>
                            <input name="rental" defaultValue={property.rental} className={inputBaseClass} />
                        </div>
                        <div className="flex flex-col">
                            <label className={labelClass}>Price ($)</label>
                            <input name="price" defaultValue={property.price} className={inputBaseClass} />
                        </div>
                        <div className="flex flex-col">
                            <label className={labelClass}>Status</label>
                            <select
                                name="status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className={`p-1.5 rounded-xl border-2 font-black uppercase text-[9px] ${theme.bg} ${theme.text} ${theme.border} outline-none`}
                            >
                                <option value="FOR_SALE">For Sale</option>
                                <option value="FOR_RENT">For Rent</option>
                                <option value="RENTED">Rented</option>
                                <option value="SOLD">Sold</option>
                                <option value="NOT_AVAILABLE">Not Available</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col">
                            <label className={labelClass}>Type</label>
                            <input name="type" defaultValue={property.type} className={inputBaseClass} />
                        </div>
                        <div className="flex flex-col">
                            <label className={labelClass}>Land Area</label>
                            <input name="landArea" defaultValue={property.landArea || ""} className={inputBaseClass} />
                        </div>
                        <div className="flex flex-col">
                            <label className={labelClass}>Built-Up</label>
                            <input name="builtUp" defaultValue={property.builtUp || ""} className={inputBaseClass} />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label className={labelClass}>Internal Remarks</label>
                        <textarea
                            name="remarks"
                            defaultValue={property.remarks}
                            rows={2}
                            className={`${inputBaseClass} font-normal h-12 py-1.5`}
                            placeholder="Add private notes here..."
                        />
                    </div>
                </div>
            </form>
        </section>
    );
}