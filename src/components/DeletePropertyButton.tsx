"use client";

import { useState } from "react";
import { deleteProperty } from "@/app/actions/properties";

interface DeletePropertyButtonProps {
    id: string;
}

export default function DeletePropertyButton({ id }: DeletePropertyButtonProps) {
    const [isPending, setIsPending] = useState(false);

    async function handleDelete() {
        // Standard browser confirm to prevent accidental clicks
        const confirmed = window.confirm(
            "Are you sure you want to delete this property? This action cannot be undone."
        );

        if (!confirmed) return;

        setIsPending(true);

        try {
            await deleteProperty(id);
            // Note: deleteProperty should include revalidatePath('/admin') 
            // to refresh the list automatically.
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete property. Please try again.");
            setIsPending(false);
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className={`
        px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all
        ${isPending
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "text-red-500 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-100"
                }
      `}
        >
            {isPending ? (
                <span className="flex items-center gap-2">
                    <svg className="animate-spin h-3 w-3 text-gray-400" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                </span>
            ) : (
                "Delete"
            )}
        </button>
    );
}