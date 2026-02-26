"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

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

    // Rental Formatting
    const rawRental = formData.get("rental") as string;
    const cleanRental = rawRental ? parseFloat(rawRental.replace(/,/g, "")) : 0;

    const rentalDuration = formData.get("rentalDuration") as string;

    // Handle Image Uploads
    const imageFiles = formData.getAll("images") as File[];
    const imageUrls: string[] = [];

    if (imageFiles && imageFiles.length > 0) {
        for (const file of imageFiles) {
            if (file.size > 0 && file.name !== 'undefined') {
                const buffer = Buffer.from(await file.arrayBuffer());
                const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
                const filePath = path.join(process.cwd(), "public/uploads", fileName);

                await fs.mkdir(path.join(process.cwd(), "public/uploads"), { recursive: true });
                await fs.writeFile(filePath, buffer);
                imageUrls.push(`/uploads/${fileName}`);
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
    // Note: We don't redirect here so the Quick Add toggle can reset
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

    // Rental Formatting
    const rawRental = formData.get("rental") as string;
    const cleanRental = rawRental ? parseFloat(rawRental.replace(/,/g, "")) : 0;

    const rentalDuration = formData.get("rentalDuration") as string;
    const rentalStart = formData.get("rentalStart") as string;

    // ✨ IMAGE LOGIC: Combine reordered existing images + new uploads
    // 1. Get the list of images kept/reordered in ImageManager
    const existingImages = formData.getAll("existingImages") as string[];

    // 2. Process new files
    const newFiles = formData.getAll("newImages") as File[];
    const newImageUrls: string[] = [];

    for (const file of newFiles) {
        if (file && file.size > 0) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
            const filePath = path.join(process.cwd(), "public/uploads", fileName);

            await fs.mkdir(path.join(process.cwd(), "public/uploads"), { recursive: true });
            await fs.writeFile(filePath, buffer);
            newImageUrls.push(`/uploads/${fileName}`);
        }
    }

    // 3. Merge: Reordered ones first, then brand new ones
    const finalImages = [...existingImages, ...newImageUrls];

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

    if (!id || typeof id !== 'string') {
        console.error("Delete failed: ID is not a string", id);
        return;
    }

    // Optional: You could add logic here to delete the physical files 
    // from /public/uploads using fs.unlink if you want to save disk space.

    await prisma.property.delete({
        where: { id },
    });

    revalidatePath("/admin");
    revalidatePath("/");
}