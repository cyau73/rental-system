// src/components/DeletePropertyButton.tsx
"use client";

import { deleteProperty } from "@/app/actions/properties";

export default function DeletePropertyButton({ id }: { id: string }) {
    return (
        <button
            onClick={async () => {
                if (confirm("Are you sure?")) {
                    // Explicitly passing the 'id' string here
                    await deleteProperty(id);
                }
            }}
            className="text-red-600 font-bold text-xs px-4 py-2 rounded-lg hover:bg-red-50"
        >
            Delete
        </button>
    );
}