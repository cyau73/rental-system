"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { updatePropertyOrder } from "@/app/actions/properties";
import DeletePropertyButton from "@/components/DeletePropertyButton";
import Link from "next/link";
import { getStatusTheme } from "@/lib/status-styles";
import Lightbox from "@/components/LightBox";

export default function PropertyListDraggable({ properties = [] }: { properties: any[] }) {
    const [items, setItems] = useState(properties);
    const [isMounted, setIsMounted] = useState(false);

    // 1. Hydration Fix: Only render DND logic after browser mount
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 2. Sync state when server data updates (search/filters)
    useEffect(() => {
        setItems(properties);
    }, [properties]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 }
        })
    );

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((i) => i.id === active.id);
            const newIndex = items.findIndex((i) => i.id === over.id);

            const newArray = arrayMove(items, oldIndex, newIndex);
            setItems(newArray);

            const updates = newArray.map((item, index) => ({
                id: item.id,
                order: index,
                isPinned: item.isPinned
            }));
            await updatePropertyOrder(updates);
        }
    }

    const togglePin = async (id: string) => {
        const newItems = items.map(item =>
            item.id === id ? { ...item, isPinned: !item.isPinned } : item
        );

        const sorted = [...newItems].sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            return 0;
        });

        setItems(sorted);
        const updates = sorted.map((item, index) => ({
            id: item.id,
            order: index,
            isPinned: item.isPinned
        }));
        await updatePropertyOrder(updates);
    };

    // Static shell for Server-Side Rendering to prevent hydration errors
    if (!isMounted) {
        return (
            <div className="flex flex-col gap-4">
                {properties.map((prop) => (
                    <div key={prop.id} className="bg-white rounded-[2rem] h-[240px] border border-gray-100 animate-pulse" />
                ))}
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="bg-white rounded-[2rem] border-2 border-dashed border-gray-300 py-20 text-center text-black font-bold text-xs italic">
                No properties found.
            </div>
        );
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-4">
                    {items.map((prop) => (
                        <SortablePropertyCard key={prop.id} prop={prop} onPin={() => togglePin(prop.id)} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

function SortablePropertyCard({ prop, onPin }: { prop: any; onPin: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: prop.id });

    // 1. MATCHING STATES FOR GALLERY LOGIC
    const [currentIdx, setCurrentIdx] = useState(0);
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);

    const rawImages = (prop.images as string[]) || [];
    const images = rawImages.length > 0 ? rawImages : ["/placeholder-house.jpg"];
    const theme = getStatusTheme(prop.status);

    // 2. REUSABLE NAVIGATION LOGIC
    const showNext = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        e?.preventDefault();
        setCurrentIdx((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const showPrev = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        e?.preventDefault();
        setCurrentIdx((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 0,
        position: 'relative' as 'relative',
    };

    const isForSale = prop.status === 'FOR_SALE' || prop.status === 'SOLD';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const whatsappLink = `https://wa.me/?text=${encodeURIComponent(`Check out ${prop.title}: ${baseUrl}/properties/${prop.id}`)}`;

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                className={`group bg-white rounded-[1.5rem] md:rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col lg:flex-row ${isDragging ? 'opacity-50 ring-2 ring-blue-500 shadow-xl' : ''}`}
            >
                {/* DRAG & PIN CONTROLS */}
                <div className="absolute top-4 right-4 z-40 flex flex-col gap-2">
                    <button {...attributes} {...listeners} className="p-2.5 bg-white/95 backdrop-blur-md rounded-xl shadow-sm cursor-grab active:cursor-grabbing text-black hover:text-blue-600 border border-gray-200">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 9h14M5 15h14" /></svg>
                    </button>
                    <button onClick={(e) => { e.preventDefault(); onPin(); }} className={`p-2.5 rounded-xl shadow-sm border backdrop-blur-md transition-all ${prop.isPinned ? 'bg-yellow-400 border-yellow-500 text-black' : 'bg-white/95 border-gray-200 text-black'}`}>
                        <span className="text-lg leading-none">{prop.isPinned ? '📌' : '📍'}</span>
                    </button>
                </div>

                {/* IMAGE SECTION - Now with Arrows & View Larger */}
                <div className="relative w-full lg:w-[320px] h-[240px] overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center group/img">
                    <img
                        src={images[currentIdx]}
                        alt={prop.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
                    />

                    {/* MINI NAVIGATION ARROWS (Same as Public Page) */}
                    {images.length > 1 && (
                        <div className="absolute inset-0 flex items-center justify-between px-2 z-30 pointer-events-none">
                            <button
                                onClick={showPrev}
                                className="pointer-events-auto bg-white/90 backdrop-blur-md w-8 h-8 flex items-center justify-center rounded-full opacity-0 group-hover/img:opacity-100 transition-all hover:bg-white shadow-lg text-black font-bold active:scale-90"
                            >
                                ←
                            </button>
                            <button
                                onClick={showNext}
                                className="pointer-events-auto bg-white/90 backdrop-blur-md w-8 h-8 flex items-center justify-center rounded-full opacity-0 group-hover/img:opacity-100 transition-all hover:bg-white shadow-lg text-black font-bold active:scale-90"
                            >
                                →
                            </button>
                        </div>
                    )}

                    {/* VIEW LARGER BUTTON (Same as Public Page) */}
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                        <button
                            type="button"
                            onClick={() => setPreviewIndex(currentIdx)}
                            className="pointer-events-auto opacity-0 group-hover/img:opacity-100 bg-black/60 backdrop-blur-xl px-4 py-1.5 rounded-full text-[8px] font-black uppercase border border-white/20 text-white hover:bg-black/80 transition-all translate-y-2 group-hover/img:translate-y-0 cursor-pointer shadow-2xl"
                        >
                            View Larger
                        </button>
                    </div>
                </div>

                {/* CONTENT SECTION */}
                <div className="p-4 lg:px-8 lg:py-6 flex flex-col justify-between flex-grow gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border-2 ${theme.bg} ${theme.text} ${theme.border}`}>
                                {theme.label}
                            </span>
                            <h3 className="text-lg font-extrabold text-black tracking-tight">{prop.title}</h3>
                        </div>
                        <p className="text-black font-semibold text-[11px] opacity-90">📍 {prop.address}</p>

                        <p className={`text-base font-black mt-2 ${isForSale ? theme.text : 'text-blue-700'}`}>
                            ${Number(isForSale ? (prop.price || 0) : (prop.rental || 0)).toLocaleString()}
                            <span className="ml-2 text-[8px] uppercase text-gray-400 font-bold">
                                {isForSale ? 'Asking Price' : 'Monthly'}
                            </span>
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                        <a href={whatsappLink} target="_blank" className="px-6 py-2.5 border border-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest text-black hover:border-green-600 transition-all">Share</a>
                        <Link href={`/admin/edit/${prop.id}`} className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-8 py-2.5 rounded-xl shadow-md">Edit</Link>
                        <DeletePropertyButton id={prop.id} />
                    </div>
                </div>
            </div>

            {/* LIGHTBOX */}
            {previewIndex !== null && (
                <Lightbox
                    images={images}
                    currentIndex={previewIndex}
                    onClose={() => setPreviewIndex(null)}
                    onNavigate={(index) => setPreviewIndex(index)}
                />
            )}
        </>
    );
}