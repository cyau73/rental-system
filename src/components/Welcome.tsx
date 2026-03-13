//componets/Welcome.tsx
"use client";

import { useState } from "react";

export default function Welcome() {
    // State to track if the section is open or closed
    const [isOpen, setIsOpen] = useState(true);

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
            <div className={`max-w-4xl w-full flex flex-col gap-1 overflow-hidden transition-all duration-500 ${isOpen ? "opacity-100 max-h-[1000px]" : "opacity-0 max-h-0"}`}>
                {/* Responsive Text: Consistent with public page.tsx scaling */}
                <h1 className="text-center text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900">
                    Welcome to<br />
                    <span className="bg-gradient-to-r from-blue-600 to-pink-500 bg-clip-text text-transparent">
                        May Properties Sdn Bhd
                    </span>
                </h1>

                <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
                    We are a privately owned investment firm specializing in the long-term stewardship of residential and commercial real estate properties. Browse our exclusive portfolio and rest assured that all prospects and property agents will be dealing directly with the owners.
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
            {/* Toggle Button with Up/Down Arrow */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="mb-2 p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-2 group"
            >
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-gray-600">
                    {isOpen ? "Close Info Section" : "Open Info Section"}
                </span>
                {/* Arrow rotates 180 degrees based on state */}
                <div className={`transition-transform duration-300 ${isOpen ? "rotate-0" : "rotate-180"}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                </div>
            </button>

        </section>
    );
}