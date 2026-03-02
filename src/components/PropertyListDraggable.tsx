"use client";

import React, { useState, useEffect } from 'react';
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

export default function PropertyListDraggable({ properties = [] }: { properties: any[] }) {
    const [items, setItems] = useState(properties);
    const [isMounted, setIsMounted] = useState(false);

    // 1. Fix Hydration: Only render interactive DND after mount
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 2. Sync state if server props change (e.g., after a search or delete)
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

        // Sort so pinned stay at top
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

    // Prevent Hydration Mismatch: Render a static placeholder on the server
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
            <div className="bg-white rounded-[2rem] border-2 border-dashed border-gray-200 py-20 text-center text-gray-400 text-xs italic">
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

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 0,
        position: 'relative' as 'relative',
    };

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const whatsappLink = `https://wa.me/?text=${encodeURIComponent(`Check out ${prop.title}: ${baseUrl}/properties/${prop.id}`)}`;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group bg-white rounded-[1.5rem] md:rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col lg:flex-row ${isDragging ? 'opacity-50 ring-2 ring-blue-500 shadow-xl' : ''}`}
        >
            {/* DRAG & PIN CONTROLS */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                <button
                    {...attributes}
                    {...listeners}
                    className="p-2.5 bg-white/90 backdrop-blur rounded-xl shadow-sm cursor-grab active:cursor-grabbing text-gray-400 hover:text-blue-600 border border-gray-100"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 9h14M5 15h14" /></svg>
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); onPin(); }}
                    className={`p-2.5 rounded-xl shadow-sm border transition-all ${prop.isPinned ? 'bg-yellow-400 border-yellow-500 text-white' : 'bg-white/90 border-gray-100 text-gray-300 hover:text-yellow-600'}`}
                >
                    📌
                </button>
            </div>

            {/* IMAGE */}
            <div className="relative w-full lg:w-[320px] h-[240px] overflow-hidden bg-gray-100 flex-shrink-0">
                <img
                    src={prop.images?.[0] || "/placeholder.png"}
                    alt={prop.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
            </div>

            {/* CONTENT */}
            <div className="p-4 lg:px-8 lg:py-6 flex flex-col justify-between flex-grow gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${prop.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {prop.status}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 tracking-tight">{prop.title}</h3>
                    </div>
                    <p className="text-gray-500 text-[11px]">📍 {prop.address}</p>
                    <p className="text-base font-black text-blue-600 mt-2">${Number(prop.rental || 0).toLocaleString()}</p>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                    <a href={whatsappLink} target="_blank" className="px-6 py-2.5 border border-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:border-green-500 hover:text-green-600 transition-all">
                        Share
                    </a>
                    <Link href={`/admin/edit/${prop.id}`} className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-widest px-8 py-2.5 rounded-xl shadow-md">
                        Edit
                    </Link>
                    <DeletePropertyButton id={prop.id} />
                </div>
            </div>
        </div>
    );
}