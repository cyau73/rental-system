//components/TitleInput.tsx

'use client';

import { useState, useEffect } from 'react';
import { checkSlugAvailability } from '@/app/actions/properties';

export default function TitleInput() {
    const [title, setTitle] = useState("");
    const [finalSlug, setFinalSlug] = useState("");
    const [isValidating, setIsValidating] = useState(false);

    // 1. Local Preview Logic (Instant feedback)
    const slugPreview = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, '')
        .replace(/[\s-]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');

    // 2. Server Validation (Handles duplicates)
    useEffect(() => {
        if (!title) {
            setFinalSlug("");
            return;
        }

        setIsValidating(true);
        const timer = setTimeout(async () => {
            try {
                const available = await checkSlugAvailability(title);
                setFinalSlug(available);
            } catch (err) {
                console.error("Slug check failed", err);
            } finally {
                setIsValidating(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [title]);

    return (
        <div className="flex flex-col gap-1">
            <label className="text-[9px] font-extrabold text-black ml-1 uppercase tracking-widest">
                Name
            </label>
            <input
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Villa Name"
                className="border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black placeholder:text-gray-400 transition-all"
                required
            />

            {title && (
                <div className="flex items-center gap-1 mt-1 ml-1 animate-in fade-in slide-in-from-left-1">
                    <span className="text-[8px] font-black uppercase text-gray-400 tracking-tighter">
                        {isValidating ? 'Checking...' : 'Link:'}
                    </span>
                    <p className={`text-[9px] font-bold lowercase tracking-wider transition-colors ${isValidating ? 'text-gray-300' : 'text-blue-600'
                        }`}>
                        {/* Use finalSlug if available, otherwise show the local preview */}
                        /property/{finalSlug || slugPreview}
                    </p>

                    {!isValidating && finalSlug && finalSlug !== slugPreview && (
                        <span className="text-[8px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-md font-bold uppercase ml-1">
                            Unique ID Added
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}