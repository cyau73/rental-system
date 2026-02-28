// app/admin/edit/[id]/page.tsx

import { auth } from "@/auth";
import { updateProperty } from "@/app/actions/properties";
import AdminNav from "@/components/AdminNav";
import ImageManager from "@/components/ImageManager";
import SubmitButton from "@/components/SubmitButton";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";

export default async function EditPropertyPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session || !session.user) redirect("/login");
    // @ts-ignore
    if (session.user.role !== "ADMIN") redirect("/");

    const { id } = await params;

    const property = await prisma.property.findUnique({
        where: { id },
    });

    if (!property) notFound();

    // High-visibility class for iPad / Retina displays
    const inputBaseClass = "border border-gray-300 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white text-gray-900 font-bold placeholder:text-gray-400";
    const labelClass = "text-[10px] font-bold uppercase text-gray-600 ml-1 tracking-widest";

    // Helper to format the rental with commas for the initial display
    const formattedRental = property.rental
        ? Number(property.rental).toLocaleString('en-US')
        : "";

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <AdminNav user={session.user} />

            <main className="max-w-5xl mx-auto p-4 md:p-6 lg:p-10">
                <header className="mb-8">
                    <Link href="/admin" className="text-sm text-blue-600 font-bold hover:underline mb-2 inline-block">
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Edit Property</h1>
                    <p className="text-gray-500 mt-1">Update property details and manage the photo gallery.</p>
                </header>

                <form action={updateProperty} className="space-y-10">
                    <input type="hidden" name="id" value={property.id} />

                    {/* 1. TEXT DETAILS SECTION */}
                    <section className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-200">
                        <h2 className="text-xs font-bold uppercase text-gray-400 tracking-widest mb-6 border-b pb-2">General Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Title */}
                            <div className="flex flex-col gap-2">
                                <label className={labelClass}>Property Title</label>
                                <input
                                    name="title"
                                    defaultValue={property.title}
                                    className={inputBaseClass}
                                    required
                                />
                            </div>

                            {/* Status */}
                            <div className="flex flex-col gap-2">
                                <label className={labelClass}>Availability Status</label>
                                <select
                                    name="status"
                                    defaultValue={property.status}
                                    className={inputBaseClass}
                                >
                                    <option value="AVAILABLE">AVAILABLE</option>
                                    <option value="RENTED">RENTED</option>
                                </select>
                            </div>

                            {/* Address */}
                            <div className="flex flex-col gap-2 md:col-span-2">
                                <label className={labelClass}>Address</label>
                                <input
                                    name="address"
                                    defaultValue={property.address}
                                    className={inputBaseClass}
                                    required
                                />
                            </div>

                            {/* Monthly Rent - NOW WITH COMMA FORMATTING */}
                            <div className="flex flex-col gap-2">
                                <label className={labelClass}>Monthly Rent ($)</label>
                                <input
                                    name="rental"
                                    type="text" // Changed to text to allow comma display
                                    defaultValue={formattedRental}
                                    placeholder="e.g. 2,500"
                                    className={`${inputBaseClass} font-mono text-blue-600`}
                                />
                            </div>

                            {/* Lease Duration - FIXED 12 MONTH STEP */}
                            <div className="flex flex-col gap-2">
                                <label className={labelClass}>Lease Duration (Months)</label>
                                <input
                                    name="rentalDuration"
                                    type="number"
                                    min="12"
                                    step="12"
                                    defaultValue={Number(property.rentalDuration) || 12}
                                    className={inputBaseClass}
                                />
                                <p className="text-[9px] text-gray-400 ml-1 italic font-bold">Increments of 12 months only.</p>
                            </div>
                        </div>
                    </section>

                    {/* 2. PHOTO GALLERY SECTION */}
                    <section className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-200">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-gray-900">Property Photos</h2>
                            <p className="text-sm text-gray-500">The first photo is the cover. Drag to reorder.</p>
                        </div>

                        <ImageManager
                            initialImages={property.images || []}
                            propertyId={property.id}
                        />
                    </section>

                    {/* 3. SUBMIT SECTION */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <SubmitButton label="Update Property" />
                        </div>
                        <Link
                            href="/admin"
                            className="flex-1 bg-white border border-gray-300 text-gray-900 font-bold py-4 rounded-2xl hover:bg-gray-50 transition text-center text-[11px] uppercase tracking-widest flex items-center justify-center shadow-sm"
                        >
                            Discard Changes
                        </Link>
                    </div>
                </form>
            </main>
        </div>
    );
}