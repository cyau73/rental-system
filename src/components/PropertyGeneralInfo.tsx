//components/PropertyGeneralInfo.tsx

"use client";

import { useState } from "react";
import { updateProperty } from "@/app/actions/properties";

export default function PropertyGeneralInfo({ property }: { property: any }) {
    const [isEditing, setIsEditing] = useState(false);

    const inputBaseClass = "border border-gray-300 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white text-gray-900 font-bold text-xs";
    const labelClass = "text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1";

    if (!isEditing) {
        return (
            <section className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 mb-2 relative group">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4 w-full">
                        <h2 className="text-[11px] font-black uppercase text-blue-600 tracking-[0.2em] whitespace-nowrap">
                            General Information
                        </h2>
                        <div className="h-[1px] bg-gray-50 flex-grow" />
                    </div>

                    <button
                        onClick={() => setIsEditing(true)}
                        className="ml-4 p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4">
                    <div className="col-span-2">
                        <p className={labelClass}>Property Name</p>
                        <p className="text-sm font-bold text-gray-900">{property.title}</p>
                    </div>
                    <div>
                        <p className={labelClass}>Type</p>
                        <p className="text-sm font-bold text-gray-700">{property.type || "—"}</p>
                    </div>
                    <div>
                        <p className={labelClass}>Status</p>
                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg inline-block ${property.status === 'AVAILABLE' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                            {property.status}
                        </span>
                    </div>

                    <div>
                        <p className={labelClass}>Land Area</p>
                        <p className="text-sm font-bold text-gray-900">{property.landArea ? `${property.landArea} sqft` : "—"}</p>
                    </div>
                    <div>
                        <p className={labelClass}>Built-Up</p>
                        <p className="text-sm font-bold text-gray-900">{property.builtUp ? `${property.builtUp} sqft` : "—"}</p>
                    </div>
                    <div>
                        <p className={labelClass}>Monthly Rent</p>
                        <p className="text-sm font-bold text-blue-600">${Number(property.rental).toLocaleString()}</p>
                    </div>
                    <div>
                        <p className={labelClass}>Asking Price</p>
                        <p className="text-sm font-bold text-emerald-600">${property.price ? Number(property.price).toLocaleString() : "—"}</p>
                    </div>

                    <div className="col-span-2 md:col-span-4">
                        <p className={labelClass}>Address</p>
                        <p className="text-sm font-medium text-gray-600 leading-relaxed">{property.address}</p>
                    </div>

                    {property.remarks && (
                        <div className="col-span-2 md:col-span-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <p className={labelClass}>Internal Remarks</p>
                            <p className="text-xs text-gray-500 italic">{property.remarks}</p>
                        </div>
                    )}
                </div>
            </section>
        );
    }

    return (
        <section className="bg-blue-50 p-6 md:p-8 rounded-[2rem] shadow-md border border-blue-200 mb-2 animate-in fade-in zoom-in-95 duration-200">
            <form action={async (formData) => {
                await updateProperty(formData);
                setIsEditing(false);
            }}>
                <input type="hidden" name="id" value={property.id} />

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-[11px] font-black uppercase text-blue-700 tracking-[0.2em]">Editing Details</h2>
                    <div className="flex gap-4">
                        <button type="button" onClick={() => setIsEditing(false)} className="text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest">Cancel</button>
                        <button type="submit" className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest">Save Changes</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1 lg:col-span-2">
                        <label className={labelClass}>Property Title</label>
                        <input name="title" defaultValue={property.title} className={inputBaseClass} required />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className={labelClass}>Property Type</label>
                        <input name="type" placeholder="e.g. Semi-D, Office" defaultValue={property.type} className={inputBaseClass} />
                    </div>
                    <div className="flex flex-col gap-1 lg:col-span-3">
                        <label className={labelClass}>Address</label>
                        <input name="address" defaultValue={property.address} className={inputBaseClass} required />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className={labelClass}>Land Area (sqft)</label>
                        <input
                            name="landArea"
                            type="text" // Changed from number to text
                            placeholder="e.g. 2,400 sqft or 22x75"
                            defaultValue={property.landArea || ""}
                            className={inputBaseClass}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className={labelClass}>Built-Up (sqft)</label>
                        <input
                            name="builtUp"
                            type="text" // Changed from number to text
                            placeholder="e.g. 1,800 sqft"
                            defaultValue={property.builtUp || ""}
                            className={inputBaseClass}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className={labelClass}>Status</label>
                        <select name="status" defaultValue={property.status} className={inputBaseClass}>
                            <option value="AVAILABLE">AVAILABLE</option>
                            <option value="RENTED">RENTED</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className={labelClass}>Monthly Rent ($)</label>
                        <input name="rental" defaultValue={property.rental} className={inputBaseClass} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className={labelClass}>Sale Price ($)</label>
                        <input name="price" defaultValue={property.price} className={inputBaseClass} />
                    </div>
                    <div className="flex flex-col gap-1 md:col-span-2 lg:col-span-3">
                        <label className={labelClass}>Remarks</label>
                        <textarea name="remarks" defaultValue={property.remarks} rows={3} className={`${inputBaseClass} font-normal`} />
                    </div>
                </div>
            </form>
        </section>
    );
}