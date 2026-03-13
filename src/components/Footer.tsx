//components/Footer.tsx
"use client";

import Link from "next/link";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-6">
                {/* Bottom Bar */}
                <div className="border-t border-gray-50 flex flex-col items-center justify-center py-[10px] gap-2 text-center">
                    <p className="text-[10px] text-gray-400 font-medium uppercase">
                        © {currentYear} May Properties Sdn Bhd. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}