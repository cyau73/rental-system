// src/components/SubmitButton.tsx
"use client";

import { useFormStatus } from "react-dom";

interface SubmitButtonProps {
    label?: string; // e.g., "Add Property" or "Update Property"
}

export default function SubmitButton({ label = "Save" }: SubmitButtonProps) {
    const { pending } = useFormStatus();

    // Determine the loading text based on the button's purpose
    const getLoadingText = () => {
        if (label === "Add Property") return "Uploading & Adding...";
        if (label === "Update Property") return "Uploading & Updating...";
        return "Saving...";
    };

    return (
        <button
            type="submit"
            disabled={pending}
            className={`w-full relative flex items-center justify-center bg-blue-600 text-white font-bold py-4 rounded-2xl transition shadow-md active:scale-95 text-sm ${pending ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700"
                }`}
        >
            {pending ? (
                <>
                    <svg
                        className="animate-spin h-5 w-5 mr-3 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    {getLoadingText()}
                </>
            ) : (
                label
            )}
        </button>
    );
}