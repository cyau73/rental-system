// src/components/SearchBar.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export default function SearchBar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    function handleSearch(term: string) {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("query", term);
        } else {
            params.delete("query");
        }

        startTransition(() => {
            router.push(`/admin?${params.toString()}`);
        });
    }

    return (
        <div className="relative w-full md:w-72">
            <input
                type="text"
                placeholder="Search address..."
                defaultValue={searchParams.get("query")?.toString()}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full border border-gray-300 p-3 pl-10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black font-bold placeholder:text-gray-500 shadow-sm transition-all"
            />
            <span className="absolute left-3 top-3.5 text-black font-extrabold">
                🔍
            </span>
            {isPending && (
                <span className="absolute right-3 top-3.5 animate-spin text-xs">⌛</span>
            )}
        </div>
    );
}