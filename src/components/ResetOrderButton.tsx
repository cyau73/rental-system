//components/ResetOrderButton.tsx

'use client';

import { resetPropertyOrder } from "@/app/actions/properties";
import { useState } from "react";

export default function ResetOrderButton() {
    const [isPending, setIsPending] = useState(false);

    const handleReset = async () => {
        const confirmed = window.confirm(
            "Are you sure? This will remove all custom drag-and-drop positions and return to the default alphabetical/unit sorting."
        );

        if (!confirmed) return;

        setIsPending(true);
        try {
            await resetPropertyOrder();
            // The page will revalidate via the server action
        } catch (err) {
            alert("Reset failed.");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <button
            onClick={handleReset}
            disabled={isPending}
            className="px-4 py-2 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-200 transition-all disabled:opacity-50"
        >
            {isPending ? "Resetting..." : "Reset Sort"}
        </button>
    );
}