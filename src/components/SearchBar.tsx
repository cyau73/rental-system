//components/SearchBar.tsx
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useState, useEffect } from "react";

export default function SearchBar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const [inputValue, setInputValue] = useState(searchParams.get("query") || "");

    // Debounce effect for typing
    useEffect(() => {
        const timer = setTimeout(() => {
            // Only update if the value is actually different from the URL
            if (inputValue !== (searchParams.get("query") || "")) {
                updateUrl(inputValue);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [inputValue]);

    // Reusable function to push URL changes
    const updateUrl = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set("query", value);
        } else {
            params.delete("query");
        }

        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    // Instant clear function
    const handleClear = () => {
        setInputValue("");
        updateUrl("");
    };

    return (
        <div className="relative w-full md:w-72 group">
            {/* Search Icon */}
            <span className="absolute left-3 top-3.5 text-gray-400 font-extrabold z-10">
                🔍
            </span>

            <input
                type="text"
                placeholder="Search address..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full border border-gray-100 py-3 pl-10 pr-0 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black font-bold placeholder:text-gray-400 bg-white shadow-sm transition-all group-hover:border-gray-300"
            />

            {/* Right-side Icons (Loading Spinner OR Clear Button) */}
            <div className="absolute right-3 top-3 flex items-center gap-2">
                {isPending ? (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mt-0.5" />
                ) : (
                    inputValue && (
                        <button
                            onClick={handleClear}
                            className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors text-xs font-bold"
                            title="Clear search"
                        >
                            ✕
                        </button>
                    )
                )}
            </div>
        </div>
    );
}