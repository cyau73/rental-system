"use client";

import { useState, useEffect, useCallback } from "react";
import { uploadPropertyImage, reorderPropertyImages } from "@/app/actions/properties";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// --- Sub-component: SortableImage ---
function SortableImage({
    url,
    index,
    onRemove,
    onPreview
}: {
    url: string;
    index: number;
    onRemove: (url: string, index: number) => void;
    onPreview: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: url });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 0,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm transition-transform ${isDragging ? "opacity-50 scale-95 ring-2 ring-blue-500" : "opacity-100"
                }`}
        >
            <div
                {...attributes}
                {...listeners}
                className="w-full h-full cursor-grab active:cursor-grabbing"
            >
                <img src={url} alt="Property" className="w-full h-full object-cover pointer-events-none" />
            </div>

            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        onPreview();
                    }}
                    className="pointer-events-auto bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-white/30 text-white hover:bg-white/40 transition-colors"
                >
                    View Large
                </button>
            </div>

            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove(url, index);
                }}
                className="absolute top-2 right-2 bg-white/90 hover:bg-red-500 hover:text-white text-gray-700 w-8 h-8 rounded-full flex items-center justify-center shadow-md z-20 transition-all opacity-0 group-hover:opacity-100"
            >
                <span className="text-xl font-light">×</span>
            </button>

            {index === 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-blue-600/90 text-white text-[10px] font-bold uppercase py-1 text-center backdrop-blur-sm pointer-events-none">
                    Cover Image
                </div>
            )}

            <input type="hidden" name="existingImages" value={url} />
        </div>
    );
}

// --- Main Component ---
export default function ImageManager({ initialImages, propertyId }: { initialImages: string[], propertyId: string }) {
    const [images, setImages] = useState<string[]>(initialImages);
    const [isUploading, setIsUploading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);
    const [showUndo, setShowUndo] = useState(false);
    const [lastDeleted, setLastDeleted] = useState<{ url: string; index: number } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 }
        }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const showNext = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (previewIndex !== null) {
            setPreviewIndex((previewIndex + 1) % images.length);
        }
    }, [previewIndex, images.length]);

    const showPrev = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (previewIndex !== null) {
            setPreviewIndex((previewIndex - 1 + images.length) % images.length);
        }
    }, [previewIndex, images.length]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (previewIndex === null) return;
            if (e.key === "ArrowRight") showNext();
            if (e.key === "ArrowLeft") showPrev();
            if (e.key === "Escape") setPreviewIndex(null);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [previewIndex, showNext, showPrev]);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = images.indexOf(active.id as string);
            const newIndex = images.indexOf(over.id as string);
            const newOrder = arrayMove(images, oldIndex, newIndex);

            setImages(newOrder);
            setIsSyncing(true);
            try {
                await reorderPropertyImages(propertyId, newOrder);
            } catch (error) {
                console.error("Failed to sync order:", error);
                setImages(images);
            } finally {
                setTimeout(() => setIsSyncing(false), 800);
            }
        }
    }; // Fixed: Closed the brace here!

    const handleInstantUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        for (const file of Array.from(files)) {
            const formData = new FormData();
            formData.append("file", file);
            try {
                const newUrl = await uploadPropertyImage(propertyId, formData);
                if (newUrl) setImages((prev) => [...prev, newUrl]);
            } catch (err) {
                console.error("Upload Error:", err);
            }
        }
        setIsUploading(false);
        e.target.value = "";
    };

    const handleRemoveImage = (url: string, index: number) => {
        setLastDeleted({ url, index });
        setImages((prev) => prev.filter((img) => img !== url));
        setShowUndo(true);
    };

    const handleUndo = () => {
        if (lastDeleted) {
            const newImages = [...images];
            newImages.splice(lastDeleted.index, 0, lastDeleted.url);
            setImages(newImages);
            setShowUndo(false);
            setLastDeleted(null);
        }
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Property Gallery</h3>
                <div className={`flex items-center gap-2 transition-opacity duration-300 ${isSyncing ? "opacity-100" : "opacity-0"}`}>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-gray-500">Saving order...</span>
                </div>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={images} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {images.map((url, index) => (
                            <SortableImage
                                key={url}
                                url={url}
                                index={index}
                                onRemove={handleRemoveImage}
                                onPreview={() => setPreviewIndex(index)}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <div className="relative border-2 border-dashed border-gray-300 rounded-[2rem] p-10 text-center bg-white hover:border-blue-400 transition-colors group">
                <input
                    type="file"
                    multiple
                    onChange={handleInstantUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={isUploading}
                />
                <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                        {isUploading ? "⏳" : "＋"}
                    </div>
                    <p className="text-sm font-bold text-gray-700">
                        {isUploading ? "Uploading photos..." : "Add Property Photos"}
                    </p>
                </div>
                {isUploading && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-100 overflow-hidden rounded-b-[2rem]">
                        <div className="h-full bg-blue-600 animate-pulse"></div>
                    </div>
                )}
            </div>

            {showUndo && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-4 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl">
                    <span className="text-sm">Image removed</span>
                    <button type="button" onClick={handleUndo} className="text-blue-400 font-bold text-sm uppercase hover:text-blue-300">
                        Undo
                    </button>
                </div>
            )}

            {previewIndex !== null && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md"
                    onClick={() => setPreviewIndex(null)}
                >
                    <button type="button" className="absolute top-6 right-6 text-white/70 hover:text-white text-4xl">×</button>

                    <button
                        type="button"
                        onClick={showPrev}
                        className="absolute left-4 md:left-10 p-4 text-white/50 hover:text-white bg-white/5 rounded-full hover:bg-white/10"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>

                    <div className="relative max-w-5xl max-h-[85vh] w-full h-full flex flex-col items-center justify-center p-4">
                        <img
                            src={images[previewIndex]}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <div className="absolute -bottom-10 bg-white/10 px-4 py-1 rounded-full text-white/80 text-xs border border-white/10">
                            {previewIndex + 1} / {images.length}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={showNext}
                        className="absolute right-4 md:right-10 p-4 text-white/50 hover:text-white bg-white/5 rounded-full hover:bg-white/10"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            )}
        </div>
    );
}