//components/LightBox.tsx
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
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") showNext();
            if (e.key === "ArrowLeft") showPrev();
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showNext, showPrev, onClose]);

    if (currentIndex === null || !images[currentIndex]) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300"
            onClick={onClose}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 text-white/50 hover:text-white text-4xl transition-colors z-[210]"
            >
                &times;
            </button>

            {/* Navigation Arrows */}
            {images.length > 1 && (
                <>
                    <button
                        type="button" // Force type button so it doesn't submit forms
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            showPrev();
                        }}
                        className="absolute left-4 md:left-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/10 transition-all border border-white/10 z-[210] pointer-events-auto"
                    >
                        ←
                    </button>
                    <button
                        type="button" // Force type button so it doesn't submit forms
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            showNext();
                        }}
                        className="absolute right-4 md:right-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/10 transition-all border border-white/10 z-[210] pointer-events-auto"
                    >
                        →
                    </button>                </>
            )}

            {/* Main Image Container */}
            <div
                className="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-10"
                onClick={e => e.stopPropagation()}
            >
                <img
                    src={images[currentIndex]}
                    alt="Lightbox View"
                    className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                />
                <p className="text-white/40 text-[10px] font-black mt-6 tracking-[0.3em] uppercase">
                    {currentIndex + 1} / {images.length}
                </p>
            </div>
        </div>
    );
}