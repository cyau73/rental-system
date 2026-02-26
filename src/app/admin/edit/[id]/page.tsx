// app/admin/edit/[id]/page.tsx

import { auth } from "@/auth";
import { updateProperty } from "@/app/actions/properties";
import AdminNav from "@/components/AdminNav";
import CurrencyInput from "@/components/CurrencyInput";
import ImageManager from "@/components/ImageManager"; // ✨ New component
import SubmitButton from "@/components/SubmitButton"; // ✨ New component
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

                {/* Main Form - ✨ no need to have encType="multipart/form-data" for image support */}
                <form action={updateProperty} className="space-y-10">
                    <input type="hidden" name="id" value={property.id} />

                    {/* 1. TEXT DETAILS SECTION */}
                    <section className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-200">
                        <h2 className="text-xs font-bold uppercase text-gray-400 tracking-widest mb-6">General Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold uppercase text-gray-500 ml-1">Property Title</label>
                                <input
                                    name="title"
                                    defaultValue={property.title}
                                    className="border border-gray-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold uppercase text-gray-500 ml-1">Availability Status</label>
                                <select
                                    name="status"
                                    defaultValue={property.status}
                                    className="border border-gray-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    <option value="AVAILABLE">AVAILABLE</option>
                                    <option value="RENTED">RENTED</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-2 md:col-span-2">
                                <label className="text-xs font-bold uppercase text-gray-500 ml-1">Address</label>
                                <input
                                    name="address"
                                    defaultValue={property.address}
                                    className="border border-gray-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold uppercase text-gray-500 ml-1">Monthly Rent ($)</label>
                                <input
                                    name="rental"
                                    defaultValue={property.rental ? Number(property.rental).toLocaleString('en-US') : ""}
                                    className="border border-gray-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold uppercase text-gray-500 ml-1">Lease (Months)</label>
                                <input
                                    name="rentalDuration"
                                    type="number"
                                    defaultValue={Number(property.rentalDuration) || ""}
                                    className="border border-gray-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </section>

                    {/* 2. PHOTO GALLERY SECTION - ✨ The ImageManager Integration */}
                    <section className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-200">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-gray-900">Property Photos</h2>
                            <p className="text-sm text-gray-500">The first photo in the list is the cover image. Drag to reorder.</p>
                        </div>

                        <ImageManager
                            initialImages={property.images || []}
                            propertyId={property.id}
                        />
                    </section>

                    {/* 3. SUBMIT SECTION */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Wrap the SubmitButton in a flex-1 div to match the Link */}
                        <div className="flex-1">
                            <SubmitButton label="Update Property" />
                        </div>
                        <Link
                            href="/admin"
                            className="flex-1 bg-white border border-gray-200 text-gray-600 font-bold py-4 rounded-2xl hover:bg-gray-50 transition text-center text-sm flex items-center justify-center"
                        >
                            Discard Changes
                        </Link>
                    </div>
                </form>
            </main>
        </div>
    );
}