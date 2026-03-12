"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

export default function SearchBar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname(); // 1. Grab the current path
    const [isPending, startTransition] = useTransition();

    function handleSearch(term: string) {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("query", term);
        } else {
            params.delete("query");
        }

        startTransition(() => {
            // 2. Use pathname instead of "/admin"
            router.push(`${pathname}?${params.toString()}`);
        });
    }

    return (
        <div className="relative w-full md:w-72 group">
            <input
                type="text"
                placeholder="Search address..."
                defaultValue={searchParams.get("query")?.toString()}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full border border-gray-100 p-3 pl-10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black font-bold placeholder:text-gray-400 bg-white shadow-sm transition-all group-hover:border-gray-300"
            />
            <span className="absolute left-3 top-3.5 text-black font-extrabold grayscale group-hover:grayscale-0 transition-all">
                🔍
            </span>
            {isPending && (
                <div className="absolute right-3 top-4">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}