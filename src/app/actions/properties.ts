"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import { logAction } from "@/lib/logger";

/**
 * Helper to check admin authorization
 */
async function checkAdmin() {
    const session = await auth();
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized: Admin access required");
    }
}

/**
 * Action: Add a New Property
 */
export async function addProperty(formData: FormData) {
    await checkAdmin();

    const title = formData.get("title") as string;
    const address = formData.get("address") as string;
    const rawRental = formData.get("rental") as string;
    const cleanRental = rawRental ? parseFloat(rawRental.replace(/,/g, "")) : 0;
    const rentalDuration = formData.get("rentalDuration") as string;

    const imageFiles = formData.getAll("images") as File[];
    const imageUrls: string[] = [];

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    if (imageFiles && imageFiles.length > 0) {
        for (const file of imageFiles) {
            if (file.size > 0 && file.name !== 'undefined') {
                const buffer = Buffer.from(await file.arrayBuffer());
                const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
                const filePath = path.join(uploadDir, fileName);

                await fs.writeFile(filePath, buffer);
                imageUrls.push(`/uploads/${fileName}`);
                // LOG: Successful upload
                await logAction(`New property image uploaded: ${fileName}`);
            }
        }
    }

    await prisma.property.create({
        data: {
            title,
            address,
            rental: cleanRental,
            rentalDuration: rentalDuration ? parseInt(rentalDuration) : null,
            images: imageUrls,
            status: "AVAILABLE",
        },
    });

    revalidatePath("/admin");
    revalidatePath("/");
}

/**
 * Action: Update an Existing Property
 */
export async function updateProperty(formData: FormData) {
    await checkAdmin();

    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const address = formData.get("address") as string;
    const status = formData.get("status") as any;
    const rawRental = formData.get("rental") as string;
    const cleanRental = rawRental ? parseFloat(rawRental.replace(/,/g, "")) : 0;
    const rentalDuration = formData.get("rentalDuration") as string;
    const rentalStart = formData.get("rentalStart") as string;

    // 1. Get current images from Database
    const currentProperty = await prisma.property.findUnique({
        where: { id },
        select: { images: true }
    });

    // 2. Get images currently in the frontend ImageManager (existingImages inputs)
    const existingImagesInForm = formData.getAll("existingImages") as string[];

    // --- START: DELETION TRACKING & DISK CLEANUP ---
    if (currentProperty?.images) {
        // Filter out images that are in DB but NOT in the new form data
        const imagesToDelete = currentProperty.images.filter(
            (img) => !existingImagesInForm.includes(img)
        );

        for (const imagePath of imagesToDelete) {
            try {
                // Remove leading slash so path.join works correctly with 'public'
                const relativePath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
                const fullPath = path.join(process.cwd(), "public", relativePath);

                // Perform physical disk deletion
                await fs.access(fullPath);
                await fs.unlink(fullPath);

                // HIGHLIGHT: Tracking successful deletion in log
                await logAction(`CLEANUP SUCCESS: Deleted file ${imagePath} from disk.`);
            } catch (err) {
                // HIGHLIGHT: Tracking failed deletion in log (e.g., file already gone)
                await logAction(`CLEANUP SKIPPED/FAILED: ${imagePath} - check if file exists.`);
            }
        }
    }
    // --- END: DELETION TRACKING ---

    // 4. Handle new file uploads
    const newFiles = formData.getAll("newImages") as File[];
    const newImageUrls: string[] = [];
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    for (const file of newFiles) {
        if (file && file.size > 0) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
            const filePath = path.join(uploadDir, fileName);

            await fs.mkdir(uploadDir, { recursive: true });
            await fs.writeFile(filePath, buffer);
            newImageUrls.push(`/uploads/${fileName}`);
        }
    }

    const finalImages = [...existingImagesInForm, ...newImageUrls];

    await prisma.property.update({
        where: { id },
        data: {
            title,
            address,
            status,
            rental: cleanRental,
            rentalDuration: rentalDuration ? parseInt(rentalDuration) : null,
            rentalStart: rentalStart ? new Date(rentalStart) : null,
            images: finalImages,
        },
    });

    // LOG: Final update success
    await logAction(`UPDATE SUCCESS: Property ${id} database updated.`);

    revalidatePath("/admin");
    revalidatePath(`/admin/edit/${id}`);
    revalidatePath("/");

    redirect("/admin");
}

/**
 * Action: Delete a Property
 */
export async function deleteProperty(id: string) {
    await checkAdmin();

    const property = await prisma.property.findUnique({
        where: { id },
        select: { images: true }
    });

    if (property?.images) {
        for (const imagePath of property.images) {
            try {
                const relativePath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
                const fullPath = path.join(process.cwd(), "public", relativePath);
                await fs.unlink(fullPath);
                // LOG: Tracking each image deleted when property is removed
                await logAction(`PROPERTY DELETE: Removed image file ${imagePath}`);
            } catch (err) { }
        }
    }

    await prisma.property.delete({
        where: { id },
    });

    await logAction(`PROPERTY DELETE SUCCESS: ID ${id} fully removed.`);

    revalidatePath("/admin");
    revalidatePath("/");
}

/**
 * Instant Upload for ImageManager.tsx
 */
export async function uploadPropertyImage(propertyId: string, formData: FormData) {
    await checkAdmin();
    const file = formData.get("file") as File;
    if (!file || file.size === 0) return null;

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const publicPath = `/uploads/${fileName}`;
    const filePath = path.join(process.cwd(), "public", "uploads", fileName);

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);

    await prisma.property.update({
        where: { id: propertyId },
        data: {
            images: {
                push: publicPath
            }
        }
    });

    // LOG: Instant upload tracking
    await logAction(`INSTANT UPLOAD: Image ${fileName} added to property ${propertyId}`);

    return publicPath;
}

/**
 * Action: Instantly reorder images in the DB
 */
export async function reorderPropertyImages(id: string, images: string[]) {
    await checkAdmin(); // Security first

    await prisma.property.update({
        where: { id },
        data: { images },
    });

    await logAction(`REORDER SUCCESS: Property ${id} images updated via drag-drop.`);

    // Refresh only the necessary parts of the cache
    revalidatePath(`/admin/edit/${id}`);
}