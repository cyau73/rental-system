//actions/properties.ts

"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAction } from "@/lib/logger";
import prisma from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-')  // Replace spaces/underscores with hyphens
        .replace(/^-+|-+$/g, '');  // Trim hyphens from ends
}

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
    const type = formData.get("type") as string;
    const remarks = formData.get("remarks") as string;

    // FIXED: Corrected the keys and converted to Numbers for Decimal support
    const landArea = formData.get("landArea") as string || null;
    const builtUp = formData.get("builtUp") as string || null;

    // RENTAL PRICE
    const rawRental = formData.get("rental") as string;
    const cleanRental = rawRental ? parseFloat(rawRental.replace(/,/g, "")) : 0;

    // ASKING PRICE (Added this as we added it to schema)
    const rawPrice = formData.get("price") as string;
    const cleanPrice = rawPrice ? parseFloat(rawPrice.replace(/,/g, "")) : 0;

    // AUTO-GENERATE SLUG
    const slug = generateSlug(title);

    // Initial Image Handling for new properties
    const imageFiles = formData.getAll("images") as File[];
    const imageUrls: string[] = [];
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    for (const file of imageFiles) {
        if (file.size > 0 && file.name !== 'undefined') {
            const buffer = Buffer.from(await file.arrayBuffer());
            const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
            const filePath = path.join(uploadDir, fileName);
            await fs.writeFile(filePath, buffer);
            imageUrls.push(`/uploads/${fileName}`);
        }
    }

    await prisma.property.create({
        data: {
            title,
            slug,
            address,
            type,
            landArea: landArea ? parseFloat(landArea) : null, // Ensure numeric for Decimal
            builtUp: builtUp ? parseFloat(builtUp) : null,   // Ensure numeric for Decimal
            rental: cleanRental,
            price: cleanPrice,
            remarks,
            status: "FOR_RENT", // Use the Uppercase Enum value
            images: imageUrls,
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
    const type = formData.get("type") as string;
    const remarks = formData.get("remarks") as string;
    const status = formData.get("status") as string;

    // Map UI strings to Prisma Enums
    const statusMap: Record<string, any> = {
        "For Sale": "FOR_SALE",
        "For Rent": "FOR_RENT",
        "Rented": "RENTED",
        "FOR_SALE": "FOR_SALE", // Defensive check
        "FOR_RENT": "FOR_RENT",
        "RENTED": "RENTED"
    };

    // FIXED: Corrected keys and type casting
    const landArea = parseFloat(formData.get("landArea") as string) || null;
    const builtUp = parseFloat(formData.get("builtUp") as string) || null;

    const rawRental = formData.get("rental") as string;
    const cleanRental = rawRental ? parseFloat(rawRental.replace(/,/g, "")) : 0;

    const rawPrice = formData.get("price") as string;
    const cleanPrice = rawPrice ? parseFloat(rawPrice.replace(/,/g, "")) : 0;

    // NOTE: Image cleanup logic removed here because ImageManager.tsx 
    // now handles deletions instantly via deletePropertyImage()

    await prisma.property.update({
        where: { id },
        data: {
            title,
            address,
            type,
            status,
            landArea,
            builtUp,
            remarks,
            rental: cleanRental,
            price: cleanPrice,
            // FIXED: Removed rentalDuration and rentalStart as they are no longer in schema
        },
    });

    await logAction(`UPDATE SUCCESS: Property ${id} details updated.`);

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

/**
 * Action: Update Property Order and Pinned Status (Drag-and-Drop)
 */
export async function updatePropertyOrder(
    items: { id: string; order: number; isPinned: boolean }[]
) {
    // 1. SECURITY: Ensure only admins can trigger reordering
    await checkAdmin();

    try {
        // 2. TRANSACTION: Run all updates as a single "all-or-nothing" block
        // This is much safer than running individual Promise.all calls
        await prisma.$transaction(
            items.map((item) =>
                prisma.property.update({
                    where: { id: item.id },
                    data: {
                        order: item.order,
                        isPinned: item.isPinned
                    },
                })
            )
        );

        // 3. LOGGING: Track the movement in your logs
        await logAction(`REORDER SUCCESS: ${items.length} properties rearranged via drag-drop.`);

        // 4. REVALIDATE: Refresh the admin and public list caches
        revalidatePath("/admin");
        revalidatePath("/");

    } catch (error) {
        console.error("Failed to update property order:", error);
        throw new Error("Failed to save property order.");
    }
}

/**
 * Action: Instantly delete a specific image from DB and Disk
 */
export async function deletePropertyImage(propertyId: string, imagePath: string) {
    await checkAdmin();

    try {
        // 1. Get the current property to see the image list
        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            select: { images: true }
        });

        if (!property) throw new Error("Property not found");

        // 2. Create the new array without the deleted image
        const updatedImages = property.images.filter((img) => img !== imagePath);

        // 3. Update the Database first
        await prisma.property.update({
            where: { id: propertyId },
            data: { images: updatedImages },
        });

        // 4. Physical Disk Cleanup
        // Remove leading slash for path.join (e.g., '/uploads/file.jpg' -> 'uploads/file.jpg')
        const relativePath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
        const fullPath = path.join(process.cwd(), "public", relativePath);

        try {
            await fs.access(fullPath); // Check if it exists
            await fs.unlink(fullPath); // Delete it
            await logAction(`DELETE IMAGE SUCCESS: Removed ${imagePath} from disk and property ${propertyId}`);
        } catch (unlinkErr) {
            // Log but don't crash if the file was already missing from disk
            await logAction(`DELETE IMAGE WARNING: ${imagePath} removed from DB, but file was missing on disk.`);
        }

        // 5. Refresh the UI
        revalidatePath(`/admin/edit/${propertyId}`);
        return { success: true };

    } catch (error) {
        console.error("Failed to delete image:", error);
        throw new Error("Failed to delete image.");
    }
}