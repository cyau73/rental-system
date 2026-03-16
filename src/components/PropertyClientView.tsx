//components/PropertyClientView.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import SearchBar from "@/components/SearchBar";
import ScrollToTop from "@/components/ScrollToTop";
import PublicGalleryCard from "@/components/PublicGalleryCard";
import ContactUs from "@/components/ContactUs";

export default function PropertyClientView({
    initialProperties,
    session,
    query
}: {
    initialProperties: any[],
    session: any,
    query?: string
}) {
    const [cols, setCols] = useState(3);
    const [loading, setLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const savedCols = localStorage.getItem("preferred-grid-layout");
        if (savedCols) {
            const parsed = parseInt(savedCols);
            setCols(parsed);
        }
        const timer = setTimeout(() => {
            setLoading(false);
            setIsVisible(true);
        }, 500); // Small delay for a smooth transition
        return () => clearTimeout(timer);
    }, []);

    const handleLayoutChange = (num: number) => {
        setCols(num);
        localStorage.setItem("preferred-grid-layout", num.toString());
    };

    const gridClasses: { [key: number]: string } = {
        1: "grid-cols-1",
        2: "grid-cols-1 sm:grid-cols-2",
        3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <nav className="flex items-center justify-between bg-white border-b px-6 py-4 shadow-sm sticky top-0 z-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
                        <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">Rental Management</h1>
                    </div>
                </nav>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-gray-50 pb-20 transition-opacity duration-700 ease-in ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <main className="w-full max-w-7xl mx-auto px-6 pt-1">
                <header className="mb-12 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Available Properties</h2>
                        <ContactUs />
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto justify-end max-w-full">                    {/* <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-end max-w-full"> */}
                        <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm items-center shrink-0">
                            {/* 
                                FIX 4: Corrected Mapping and Balanced Icon Symmetry (Total 20px) 
                            */}
                            {[1, 2, 3].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => handleLayoutChange(num)}
                                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${cols === num ? "bg-gray-900 text-white shadow-md scale-110" : "text-gray-400 hover:text-gray-600"}`}
                                >
                                    {/* 
                                        Icon Grid logic: 
                                        Generates 1, 4, or 9 squares based on the 'num' value.
                                    */}
                                    <div className={`grid gap-0.5 ${num === 1 ? 'grid-cols-1' : num === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                        {Array.from({ length: num * num }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={`rounded-[1px] ${num === 1 ? 'w-5 h-5' :
                                                    num === 2 ? 'w-2 h-2' :
                                                        'w-1.5 h-1.5'
                                                    } ${cols === num ? 'bg-white' : 'bg-gray-400'}`}
                                            />
                                        ))}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* JUTTING OUT FIX: flex-1 and min-w-0 */}
                        <div className="flex justify-end flex-1md:w-64 lg:w-80 min-w-0 ">
                            <SearchBar />
                        </div>
                    </div>
                </header>

                <div className={`grid gap-8 md:gap-10 transition-all duration-500 ease-in-out ${gridClasses[cols]}`}>
                    {initialProperties.map((prop: any) => (
                        <PublicGalleryCard key={prop.id} prop={prop} layoutCols={cols} />
                    ))}
                </div>
            </main>
            <ScrollToTop />
        </div>
    );
}