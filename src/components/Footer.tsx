// components/Footer.tsx
"use client";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        /* 
           Outer footer: Full-width background and top border.
           Includes Geist font family for visual consistency.
        */
        <footer className="w-full bg-white border-t border-gray-100 font-[family-name:var(--font-geist-sans)]">

            {/* 
                Inner Container: Matches the width and padding of AdminNav 
                and the Main Content Wrapper (max-w-7xl, mx-auto, px-6).
            */}
            <div className="max-w-7xl mx-auto px-6">

                {/* 
                    Bottom Bar: Centered content with the 10px vertical 
                    padding you requested previously.
                */}
                <div className="flex flex-col items-center justify-center py-[10px] gap-2 text-center">
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                        © {currentYear} May Properties Sdn Bhd. All rights reserved.
                    </p>

                    {/* Optional: Dev Credit aligned with the same typography */}
                    <div className="flex gap-1">
                        <span className="text-[8px] text-gray-300 font-medium uppercase tracking-[0.2em]">
                            CYK Full Stack Development
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}