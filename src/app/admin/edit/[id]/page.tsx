// app/admin/edit/[id]/page.tsx

import { auth } from "@/auth";
import { updateProperty } from "@/app/actions/properties";
import AdminNav from "@/components/AdminNav";
import ImageManager from "@/components/ImageManager";
import SubmitButton from "@/components/SubmitButton";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import Tenant from "@/components/Tenant";
import PropertyGeneralInfo from "@/components/PropertyGeneralInfo";
import { getStatusTheme } from "@/lib/status-styles";

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

    const propertyRaw = await prisma.property.findUnique({
        where: { id: id },
        include: {
            tenants: {
                orderBy: {
                    startDate: {
                        sort: 'desc',
                        nulls: 'first', // This puts null startDates at the very top
                    },
                },
            },
        },
    });
    if (!propertyRaw) notFound();

    const theme = getStatusTheme(propertyRaw.status);

    // --- CONSOLIDATED SERIALIZATION ---
    // This cleans the top-level property AND the nested tenants in one go
    const serializedProperty = {
        ...propertyRaw,
        // 1. Top-level Property Decimals -> Numbers
        rental: Number(propertyRaw.rental),
        price: propertyRaw.price ? Number(propertyRaw.price) : 0,

        // 2. Force nulls to empty strings 
        landArea: propertyRaw.landArea ?? "",
        builtUp: propertyRaw.builtUp ?? "",
        remarks: propertyRaw.remarks ?? "",
        address: propertyRaw.address ?? "",

        // 3. Nested Tenants Sanatization
        tenants: propertyRaw.tenants.map((t) => ({
            ...t,
            email: t.email ?? "", // Force empty string
            mobile: t.mobile ?? "", // Force empty string
            rentalAmount: t.rentalAmount ? Number(t.rentalAmount) : null,
            securityDeposit: t.securityDeposit ? Number(t.securityDeposit) : null,
            utilityDeposit: t.utilityDeposit ? Number(t.utilityDeposit) : null,
            startDate: t.startDate ? t.startDate.toISOString() : null,
            endDate: t.endDate ? t.endDate.toISOString() : null,
            createdAt: t.createdAt.toISOString(),
        })),
    };

    // High-visibility class for iPad / Retina displays
    const inputBaseClass = "border border-gray-300 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white text-gray-900 font-bold placeholder:text-gray-400";
    const labelClass = "text-[10px] font-bold uppercase text-gray-600 ml-1 tracking-widest";

    // Helper to format the rental with commas for the initial display
    const formattedRental = serializedProperty.rental
        ? Number(serializedProperty.rental).toLocaleString('en-US')
        : "";

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <AdminNav user={session.user} />

            <main className="max-w-5xl mx-auto p-4 md:p-10 lg:p-10">
                <header className="mb-8">
                    <Link href="/admin" className="text-sm text-blue-600 font-bold hover:underline mb-2 inline-block">
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Edit Property</h1>
                    <p className="text-gray-500 mt-1">Update property details and manage the photo gallery.</p>
                </header>

                <PropertyGeneralInfo property={serializedProperty} />

                {/* 2. PHOTO GALLERY SECTION */}
                <section className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-200 mb-2">
                    <div className="flex items-center gap-4 mb-2">
                        <h2 className="text-[11px] font-black uppercase text-amber-500 tracking-[0.2em] whitespace-nowrap">
                            Property Photos
                        </h2>
                        <p className="w-full text-sm text-gray-500">The first photo is the cover. Drag to reorder.</p>
                        <div className="h-[1px] w-full bg-gray-100" />
                    </div>

                    <ImageManager
                        initialImages={serializedProperty.images || []}
                        propertyId={serializedProperty.id}
                    />
                </section>

                {/* 3. TENANT SECTION */}
                <section className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-200 mb-2">
                    <div className="flex items-center gap-4 mb-2">
                        <h2 className="text-[11px] font-black uppercase text-emerald-600 tracking-[0.2em] whitespace-nowrap">
                            Tenant Management
                        </h2>
                        <p className="w-full text-sm text-gray-500">Manage tenant history for this property.</p>
                        <div className="h-[1px] w-full bg-gray-100" />
                    </div>
                    <Tenant
                        tenants={serializedProperty.tenants || []}
                        propertyId={serializedProperty.id}
                    />
                </section>
            </main>
        </div >
    );
}