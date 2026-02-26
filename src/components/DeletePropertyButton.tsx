"use client";

import { deleteProperty } from "@/app/actions/properties";
import { useTransition } from "react";

interface DeleteProps {
    id: string;
}

export default function DeletePropertyButton({ id }: DeleteProps) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
            startTransition(async () => {
                await deleteProperty(id);
            });
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className={`
        /* Layout & Size */
        min-w-[110px] px-8 py-2.5 rounded-xl text-center
        /* Typography */
        text-[10px] font-bold uppercase tracking-widest
        /* Initial State: Outline & Black Font */
        border border-gray-300 bg-transparent text-black
        /* Hover State: Red Outline & Red Font */
        hover:border-red-500 hover:text-red-500
        /* Interaction */
        transition-all duration-200 active:scale-95 disabled:opacity-50
      `}
        >
            {isPending ? "Deleting..." : "Delete"}
        </button>
    );
}