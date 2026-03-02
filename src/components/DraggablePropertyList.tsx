"use client";
import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { updatePropertyOrder } from "@/app/actions/properties";

export default function DraggablePropertyList({ initialProperties }: { initialProperties: any[] }) {
    const [items, setItems] = useState(initialProperties);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    async function handleDragEnd(event: any) {
        const { active, over } = event;
        if (active.id !== over.id) {
            setItems((prev) => {
                const oldIndex = prev.findIndex((i) => i.id === active.id);
                const newIndex = prev.findIndex((i) => i.id === over.id);
                const newArray = arrayMove(prev, oldIndex, newIndex);

                // Map new orders and save to DB
                const updates = newArray.map((item, index) => ({
                    id: item.id,
                    order: index,
                    isPinned: item.isPinned
                }));
                updatePropertyOrder(updates);
                return newArray;
            });
        }
    }

    const togglePin = async (id: string) => {
        const newItems = items.map(item =>
            item.id === id ? { ...item, isPinned: !item.isPinned } : item
        );
        // Sort so pinned are always at the very top
        const sorted = [...newItems].sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1));
        setItems(sorted);

        const updates = sorted.map((item, index) => ({
            id: item.id,
            order: index,
            isPinned: item.isPinned
        }));
        await updatePropertyOrder(updates);
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-4">
                    {items.map((prop) => (
                        <SortableItem
                            key={prop.id}
                            prop={prop}
                            onPin={() => togglePin(prop.id)}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

function SortableItem({ prop, onPin }: any) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: prop.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center gap-4 shadow-sm group">
            {/* DRAG HANDLE */}
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-blue-600">
                ⣿
            </div>

            <img src={prop.images[0] || '/icon.png'} className="w-12 h-12 rounded-lg object-cover" />

            <div className="flex-grow">
                <h3 className="font-bold text-gray-900">{prop.title}</h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">{prop.address}</p>
            </div>

            {/* PIN BUTTON */}
            <button
                onClick={onPin}
                className={`p-2 rounded-lg transition-colors ${prop.isPinned ? 'bg-yellow-100 text-yellow-600' : 'text-gray-300 hover:bg-gray-100'}`}
            >
                📌
            </button>
        </div>
    );
}