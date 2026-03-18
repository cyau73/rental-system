//componets/PublicGalleryCard.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Lightbox from "@/components/LightBox";
import { getStatusTheme } from "@/lib/status-styles"; // Ensure this import is correct

export default function PublicGalleryCard({
    prop,
    layoutCols
}: {
    prop: any;
    layoutCols: number
}) {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);

    const theme = getStatusTheme(prop.status);
    const isForSale = prop.status === "FOR_SALE" || prop.status === "SOLD";

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

    const imageWrapperClasses = {
        1: "w-full md:w-3/5 h-64 md:h-auto",
        2: "w-full h-48 md:h-64 lg:h-72",
        3: "w-full h-40 md:h-48",
    }[layoutCols];

    const contentPadding = layoutCols === 1 ? "p-8" : "p-4 md:p-5";

    return (
        <>
            <div className={`bg-white rounded-[2rem] overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-500 ${layoutCols === 1 ? "flex flex-col md:flex-row min-h-[350px]" : "flex flex-col h-full"
                }`}>

                {/* IMAGE SECTION */}
                <div className={`relative w-full bg-gray-100 group shrink-0 overflow-hidden ${imageWrapperClasses}`}>
                    <Image
                        src={images[currentIdx] || "/placeholder-house.jpg"}
                        alt={prop.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />

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
                </div>

                {/* CONTENT SECTION */}
                <div className={`${contentPadding} flex flex-col justify-center flex-grow`}>
                    <div className="space-y-2">
                        {/* STATUS BADGE - Before Title */}
                        <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border-2 shadow-sm ${theme.bg} ${theme.text} ${theme.border}`}>
                                {theme.label}
                            </span>
                        </div>

                        <h3 className={`${layoutCols === 1 ? 'text-2xl' : 'text-lg'} font-extrabold text-gray-900 tracking-tight line-clamp-1`}>
                            {prop.title}
                        </h3>

                        <p className={`${layoutCols === 1 ? 'text-base' : 'text-sm'} text-gray-500 tracking-tight italic line-clamp-1`}>
                            📍 {prop.address}
                        </p>

                        {/* PRICE DISPLAY - Matches Admin Logic */}
                        <div className="pt-1">
                            {isForSale ? (
                                <p className={`${layoutCols === 1 ? 'text-2xl' : 'text-xl'} font-black ${theme.text} tracking-tight`}>
                                    ${Number(prop.price || 0).toLocaleString()}
                                    <span className="ml-2 text-[9px] uppercase text-gray-400 font-black">Asking</span>
                                </p>
                            ) : (
                                <p className={`${layoutCols === 1 ? 'text-xl' : 'text-lg'} font-black text-blue-700 tracking-tight`}>
                                    ${Number(prop.rental || 0).toLocaleString()}
                                    <span className="ml-2 text-[9px] uppercase text-gray-400 font-black">/ Month</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div >

            {/* LIGHTBOX */}
            {previewIndex !== null && (
                <Lightbox
                    images={images}
                    currentIndex={previewIndex}
                    onClose={() => setPreviewIndex(null)}
                    onNavigate={(index) => setPreviewIndex(index)}
                />
            )}
        </>
    );
}