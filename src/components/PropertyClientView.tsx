//components/PropertyClientView.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import SearchBar from "@/components/SearchBar";
import ScrollToTop from "@/components/ScrollToTop";
import PublicGalleryCard from "@/components/PublicGalleryCard";

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
    const [isMounted, setIsMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const savedCols = localStorage.getItem("preferred-grid-layout");
        if (savedCols) {
            const parsed = parseInt(savedCols);
            setCols(parsed);
        }
        setIsMounted(true);
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const handleLayoutChange = (num: number) => {
        setCols(num);
        localStorage.setItem("preferred-grid-layout", num.toString());
    };

    const gridClasses: Record<number, string> = {
        1: "grid-cols-1 w-full max-w-5xl mx-auto",
        2: "grid-cols-1 md:grid-cols-2",
        3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    };

    if (!isMounted) {
        return (
            <div className="min-h-screen bg-gray-50">
                <nav className="flex items-center justify-between bg-white border-b px-8 py-4 shadow-sm sticky top-0 z-50">
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
            <main className="max-w-7xl mx-auto px-2 md:px-5 pt-1">
                <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Available Rentals</h2>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Direct from May Properties</p>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm items-center shrink-0">
                            {[1, 2, 3].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => handleLayoutChange(num)}
                                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${cols === num ? "bg-gray-900 text-white shadow-md scale-110" : "text-gray-400 hover:text-gray-600"}`}
                                >
                                    <div className={`grid gap-0.5 ${num === 1 ? 'grid-cols-1' : num === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                        {Array.from({ length: num * num }).map((_, i) => (
                                            <div key={i} className={`rounded-[1px] ${num === 1 ? 'w-5 h-5' : num === 2 ? 'w-2 h-2' : 'w-1.5 h-1.5'} ${cols === num ? 'bg-white' : 'bg-gray-400'}`} />
                                        ))}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="w-full md:w-64 lg:w-80">
                            <SearchBar />
                        </div>
                    </div>
                </header>

                {initialProperties.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                        <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">No rentals found matching "{query}"</p>
                    </div>
                ) : (
                    <div className={`grid gap-8 md:gap-10 transition-all duration-500 ease-in-out ${gridClasses[cols]}`}>
                        {initialProperties.map((prop) => (
                            <PublicGalleryCard key={prop.id} prop={prop} layoutCols={cols} />
                        ))}
                    </div>
                )}
            </main>
            <ScrollToTop />
        </div>
    );
}