"use client";

import { useEffect, useCallback } from "react";

interface LightboxProps {
    images: string[];
    currentIndex: number;
    onClose: () => void;
    onNavigate: (index: number) => void;
}

export default function Lightbox({ images, currentIndex, onClose, onNavigate }: LightboxProps) {

    const showNext = useCallback(() => {
        onNavigate((currentIndex + 1) % images.length);
    }, [currentIndex, images.length, onNavigate]);

    const showPrev = useCallback(() => {
        onNavigate((currentIndex - 1 + images.length) % images.length);
    }, [currentIndex, images.length, onNavigate]);

    useEffect(() => {
        // Prevent background scrolling
        document.body.style.overflow = "hidden";

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") showNext();
            if (e.key === "ArrowLeft") showPrev();
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            // Re-enable scrolling on cleanup
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [showNext, showPrev, onClose]);

    // Safety check for empty arrays or null index
    if (currentIndex === null || !images || images.length === 0) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300"
            onClick={onClose}
        >
            {/* Close Button: Added backdrop-blur and padding for better hit-zone */}
            <button
                type="button"
                onClick={onClose}
                className="absolute top-6 right-6 text-white/50 hover:text-white transition-all z-[210] p-2 hover:rotate-90"
            >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>

            {/* Navigation Arrows */}
            {images.length > 1 && (
                <>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            showPrev();
                        }}
                        className="absolute left-4 md:left-10 w-14 h-14 flex items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/20 transition-all border border-white/10 z-[210] active:scale-90"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            showNext();
                        }}
                        className="absolute right-4 md:right-10 w-14 h-14 flex items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/20 transition-all border border-white/10 z-[210] active:scale-90"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                </>
            )}

            {/* Main Image Container */}
            <div
                className="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-12 select-none"
                onClick={e => e.stopPropagation()}
            >
                <img
                    src={images[currentIndex]}
                    alt={`Property view ${currentIndex + 1}`}
                    className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-500 ease-in-out"
                />

                {/* Counter & Filename/Info Area */}
                <div className="mt-8 flex flex-col items-center gap-2">
                    <p className="text-white/40 text-[10px] font-black tracking-[0.4em] uppercase">
                        {currentIndex + 1} / {images.length}
                    </p>
                    {/* Add a subtle indicator for Mac mini users that they can use arrow keys */}
                    <div className="hidden md:flex gap-4 mt-2">
                        <span className="text-[8px] text-white/20 uppercase font-bold border border-white/10 px-2 py-1 rounded">Esc to Close</span>
                        <span className="text-[8px] text-white/20 uppercase font-bold border border-white/10 px-2 py-1 rounded">Arrows to Nav</span>
                    </div>
                </div>
            </div>
        </div>
    );
}