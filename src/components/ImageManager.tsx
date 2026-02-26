// src/components/ImageManager.tsx
"use client";

import { useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sub-component for individual sortable items
function SortableImage({ url, index, onRemove }: { url: string; index: number; onRemove: (i: number) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: url });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            {/* Drag handle area (the image itself) */}
            <img src={url} {...attributes} {...listeners} className="w-full h-full object-cover cursor-grab active:cursor-grabbing" alt="Property" />

            <input type="hidden" name="existingImages" value={url} />

            {/* Delete button (X) */}
            <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-lg z-10 hover:bg-red-600 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {index === 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-blue-600/80 text-white text-[10px] py-1 text-center font-bold uppercase tracking-widest">
                    Cover Image
                </div>
            )}
        </div>
    );
}

export default function ImageManager({ initialImages }: { initialImages: string[] }) {
    const [images, setImages] = useState<string[]>(initialImages);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setImages((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over.id as string);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }

    return (
        <div className="space-y-6">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={images} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {images.map((url, index) => (
                            <SortableImage key={url} url={url} index={index} onRemove={(i) => setImages(images.filter((_, idx) => idx !== i))} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <label className="text-xs font-bold text-blue-700 uppercase block mb-2">Add More Photos</label>
                <input name="newImages" type="file" multiple accept="image/*" className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer" />
            </div>
        </div>
    );
}