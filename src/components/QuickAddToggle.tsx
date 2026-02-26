// src/components/QuickAddToggle.tsx

"use client";

import React, { useState, useEffect } from 'react';

/**
 * A client-side wrapper component that toggles the visibility of its children.
 * Features a CSS triangle indicator and persists state to localStorage.
 */

interface QuickAddToggleProps {
    children: React.ReactNode;
}

export default function QuickAddToggle({ children }: QuickAddToggleProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [hasMounted, setHasMounted] = useState(false);

    // Sync with localStorage on mount to remember user preference
    useEffect(() => {
        setHasMounted(true);
        const savedState = localStorage.getItem('quickAddVisible');
        if (savedState !== null) {
            setIsVisible(JSON.parse(savedState));
        }
    }, []);

    const toggleVisibility = () => {
        const newState = !isVisible;
        setIsVisible(newState);
        localStorage.setItem('quickAddVisible', JSON.stringify(newState));
    };

    // Prevent hydration mismatch (Server vs Client HTML difference)
    if (!hasMounted) {
        return <div className="mb-10 h-10" />; // Placeholder to prevent layout shift
    }

    return (
        <div className="w-full mb-10">
            {/* Toggle Button with Triangle */}
            <button
                onClick={toggleVisibility}
                type="button"
                className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-all duration-200 group active:scale-95"
            >
                <span
                    className="inline-block transition-transform duration-300 ease-in-out"
                    style={{
                        width: 0,
                        height: 0,
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderTop: '7px solid #9ca3af', // gray-400
                        transform: isVisible ? 'rotate(0deg)' : 'rotate(-90deg)',
                    }}
                />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-gray-700">
                    {isVisible ? 'Hide' : 'Show'} Quick Add Property
                </span>
            </button>

            {/* Animated Container for the Form */}
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${isVisible
                    ? 'mt-6 opacity-100 max-h-[500px] visible'
                    : 'mt-0 opacity-0 max-h-0 invisible'
                    }`}
            >
                {children}
            </div>
        </div>
    );
}