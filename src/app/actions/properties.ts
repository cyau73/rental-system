//actions/properties.ts

"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAction } from "@/lib/logger";
import prisma from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

/**
 * Action: Reset all manual ordering to 0
 */
export async function resetPropertyOrder() {
    await checkAdmin(); // Security check

    try {
        await prisma.property.updateMany({
            data: {
                order: 0,
                isPinned: false // Optional: Unpin everything too for a total reset
            }
        });

        await logAction("ORDER RESET: All properties set to order 0.");

        revalidatePath("/admin");
        revalidatePath("/");

        return { success: true };
    } catch (error) {
        console.error("Failed to reset order:", error);
        throw new Error("Failed to reset property order.");
    }
}
/**
 * Generate a unique slug based on the title, ensuring no duplicates in the database. If a duplicate exists, append a number suffix (e.g., "property-title", "property-title_1", "property-title_2", etc.). The currentId parameter is used to exclude the current property when updating an existing one.
 */
async function generateUniqueSlug(title: string, currentId?: string): Promise<string> {
    const baseSlug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, '')    // 1. Remove all special chars (including existing hyphens)
        .replace(/\s+/g, '_')       // 2. Replace spaces with underscores
        .replace(/_+/g, '_')        // 3. Prevent double underscores
        .replace(/^_+|_+$/g, '');   // 4. Trim underscores from ends

    let uniqueSlug = baseSlug;
    let counter = 1;

    while (true) {
        const existing = await prisma.property.findFirst({
            where: {
                slug: uniqueSlug,
                NOT: currentId ? { id: currentId } : undefined,
            },
        });

        if (!existing) break;

        // If a duplicate exists, append a number with an underscore
        uniqueSlug = `${baseSlug}_${counter}`;
        counter++;
    }
    return uniqueSlug;
}

export async function checkSlugAvailability(title: string) {
    const baseSlug = title.toLowerCase().trim().replace(/[\s-]+/g, '_').replace(/[^\w]/g, '');

    // Find the highest suffix for this base slug
    const existing = await prisma.property.findMany({
        where: { slug: { startsWith: baseSlug } },
        select: { slug: true }
    });

    if (existing.length === 0) return baseSlug;

    // Logic to find the next available number (e.g., base_1, base_2)
    return `${baseSlug}_${existing.length}`;
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
    const slug = await generateUniqueSlug(title);

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
    try {
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
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new Error("A property with a very similar title already exists. Please modify the title.");
        }
        throw error;
    }
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
    const rawStatus = formData.get("status") as string;

    // Generate a new unique slug based on the new title
    const slug = await generateUniqueSlug(title, id);

    // Map UI strings to Prisma Enums
    const statusMap: Record<string, string> = {
        "For Sale": "FOR_SALE",
        "For Rent": "FOR_RENT",
        "Rented": "RENTED",
        "Sold": "SOLD",
        "Not Available": "NOT_AVAILABLE",
        // Case-insensitive / direct matches
        "FOR_SALE": "FOR_SALE",
        "FOR_RENT": "FOR_RENT",
        "RENTED": "RENTED",
        "SOLD": "SOLD",
        "NOT_AVAILABLE": "NOT_AVAILABLE"
    };
    const status = statusMap[rawStatus] || "FOR_RENT"; // Default fallback
    const parseNum = (key: string) => {
        const val = formData.get(key) as string;
        return val ? parseFloat(val.replace(/,/g, "")) : null;
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
            slug,
            address,
            type,
            status: status as any,
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