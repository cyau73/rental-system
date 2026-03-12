// src/components/PropertyGalleryCard.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

export default function PublicGalleryCard({ prop }: { prop: any }) {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);

    const rawImages = (prop.images as string[]) || [];
    const images = rawImages.length > 0 ? rawImages : ["/placeholder-house.jpg"];

    const showNext = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        e?.preventDefault();
        setCurrentIdx((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const showPrev = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        e?.preventDefault();
        setCurrentIdx((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    return (
        <>
            <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full">

                {/* IMAGE SECTION */}
                <div className="relative h-72 bg-gray-100 group shrink-0 overflow-hidden">
                    <Image
                        src={images[currentIdx] || "/placeholder-house.jpg"}
                        alt={prop.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* 1. NAVIGATION ARROWS - HIGHEST Z-INDEX (z-30) */}
                    {images.length > 1 && (
                        <div className="absolute inset-0 flex items-center justify-between px-2 z-30 pointer-events-none">
                            <button
                                onClick={showPrev}
                                className="pointer-events-auto bg-white/90 backdrop-blur-md w-10 h-10 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-lg text-gray-800 font-bold active:scale-90"
                            >
                                ←
                            </button>
                            <button
                                onClick={showNext}
                                className="pointer-events-auto bg-white/90 backdrop-blur-md w-10 h-10 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-lg text-gray-800 font-bold active:scale-90"
                            >
                                →
                            </button>
                        </div>
                    )}

                    {/* 2. CENTER HOVER ZONE - MIDDLE Z-INDEX (z-20) */}
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                        <div className="w-1/3 h-1/3 flex items-center justify-center group/btn pointer-events-auto">
                            <button
                                type="button"
                                onClick={() => setPreviewIndex(currentIdx)}
                                className="opacity-0 group-hover/btn:opacity-100 bg-black/60 backdrop-blur-xl px-5 py-2 rounded-full text-[9px] font-bold uppercase border border-white/20 text-white hover:bg-black/80 transition-all scale-90 group-hover/btn:scale-100 cursor-pointer shadow-2xl"
                            >
                                View Large
                            </button>
                        </div>
                    </div>

                    {/* 3. PRICE TAG - LOWER Z-INDEX (z-10) */}
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-4 py-1.5 rounded-xl shadow-sm border border-gray-100 z-10">
                        <p className="text-sm font-black text-blue-600">${prop.rental.toLocaleString()}</p>
                    </div>
                </div>

                {/* CONTENT SECTION */}
                <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-xl font-extrabold text-gray-900 tracking-tight line-clamp-1">{prop.title}</h3>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-4 italic line-clamp-1">{prop.address}</p>

                    <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-100 mt-auto">
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase">Term</p>
                            <p className="text-sm font-bold text-gray-900">{prop.rentalDuration} Mo.</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-bold text-gray-400 uppercase">Status</p>
                            <p className="text-sm font-bold text-green-600">Available</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* LIGHTBOX MODAL */}
            {previewIndex !== null && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-200"
                    onClick={() => setPreviewIndex(null)}
                >
                    <button className="absolute top-6 right-6 text-white text-4xl">&times;</button>
                    <div className="relative max-w-5xl max-h-[85vh] w-full h-full flex flex-col items-center justify-center p-4">
                        <img
                            src={images[previewIndex] || "/placeholder-house.jpg"}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </>
    );
}