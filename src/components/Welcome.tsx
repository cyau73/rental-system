//componets/Welcome.tsx
"use client";

import { useState, useEffect } from "react";

export default function Welcome() {
    // State to track if the section is open or closed
    const [isOpen, setIsOpen] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);

    // 1. On mount, check if the user previously closed the section
    useEffect(() => {
        const savedState = localStorage.getItem("welcomeSectionOpen");
        if (savedState !== null) {
            setIsOpen(savedState === "true");
        }
        setIsLoaded(true); // Prevents layout flickers during hydration
    }, []);

    // 2. Wrap the toggle function to save the choice
    const toggleSection = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        localStorage.setItem("welcomeSectionOpen", String(newState));
    };

    // Prevent rendering until we know the saved state to avoid "flickering"
    if (!isLoaded) return null;

    return (
        /* 
          CONSISTENCY CHECK: 
          - p-8 for Mobile (matches your page.tsx)
          - sm:p-20 for iPad/Tablet (matches your page.tsx)
          - Geist font family as defined in your README [2]
        */
        <section className={`flex flex-col items-center justify-center transition-all duration-500 ease-in-out font-[family-name:var(--font-geist-sans)] ${isOpen
            ? "min-h-[40vh] pt-2 px-2 pb-1 sm:pt-5 sm:px-5 sm:pb-1"
            : "min-h-0 pt-4 px-4 pb-0"
            }`}>
            <div className={`w-full flex flex-col gap-1 overflow-hidden transition-all duration-500 ${isOpen ? "opacity-100 max-h-[1000px]" : "opacity-0 max-h-0"}`}>
                {/* Responsive Text: Consistent with public page.tsx scaling */}
                <h1 className="text-center text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900">
                    Welcome to<br />
                    <span className="bg-gradient-to-r from-blue-600 to-pink-500 bg-clip-text text-transparent">
                        May Properties Sdn Bhd
                    </span>
                </h1>

                <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mx-auto">
                    We are a privately owned property investment company specializing in the long-term stewardship of residential and commercial real estate properties. Please browse our exclusive portfolio and all prospects and property agents will deal with us directly.
                </p>

                {/* 
                    FIXED GRID: 
                    - grid-cols-1 for Mobile
                    - sm:grid-cols-3 for iPad/Tablet
                */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left mt-5">
                    {/* NEW: Spanning Header in UPPER CASE */}
                    <div className="sm:col-span-3">
                        <h3 className="text-md font-bold uppercase tracking-[0.2em] text-gray-500 border-b pb-2">
                            Rental Terms & Conditions
                        </h3>
                    </div>
                    {/* Item 1: Rental Deposit with Spanning Footnote */}
                    <div className="flex flex-col gap-1 p-1 rounded-xl bg-gray-50/50">
                        {/* Top Row: Icon and Words */}
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 bg-blue-50 p-2 rounded-lg text-lg">🏢</div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">Rental Deposit</h4>
                                <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">2 months security deposit*</p>
                            </div>
                        </div>
                        {/* Spanning Text: Now starts from the far left, under both the icon and the words */}
                        <p className="text-xs text-gray-400 italic leading-tight border-t pt-0 border-gray-100">
                            * additional 1 month for Non-Malaysian
                        </p>
                    </div>

                    {/* Item 2: Utility Deposit */}
                    <div className="flex items-start gap-1 p-1 rounded-xl bg-gray-50/50">
                        <div className="flex-shrink-0 bg-green-50 p-2 rounded-lg text-lg">🛡️</div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm">Utility Deposit</h4>
                            <p className="text-sm text-gray-500 mt-1 leading-relaxed">1 month utility deposit</p>
                        </div>
                    </div>

                    {/* Item 3: Advance Rental */}
                    <div className="flex items-start gap-1 p-1 rounded-xl bg-gray-50/50">
                        <div className="flex-shrink-0 bg-purple-50 p-2 rounded-lg text-lg">🤝</div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm">Advance Rental</h4>
                            <p className="text-sm text-gray-500 mt-1 leading-relaxed">1 month advance rent</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="w-full flex justify-center mb-6 relative group">

                {/* Tooltip text: Hidden by default (scale-0), appears on hover (scale-100) */}
                <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all duration-200 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg pointer-events-none">
                    {isOpen ? "Close Section" : "Open Section"}
                </span>

                {/* Circle Button */}
                <button
                    onClick={toggleSection}
                    className="w-12 h-12 rounded-full bg-white border-2 border-gray-100 shadow-sm flex items-center justify-center hover:border-gray-300 hover:bg-gray-50 transition-all duration-300"
                >
                    {/* SVG: Kept at stroke-3.5 and text-gray-900 for iPad visibility */}
                    <div className={`transition-transform duration-500 ${isOpen ? "rotate-0" : "rotate-180"}`}>
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-900"
                        >
                            <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                    </div>
                </button>
            </div>

        </section>
    );
}