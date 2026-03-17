import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// PATCH: Update existing tenant
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> } // Define params as a Promise
) {
    try {
        // 1. Unwrap the params first
        const { id } = await params;
        const body = await req.json();

        // 2. Standard Console Output
        console.log(`\n--- 🚀 TENANT UPDATE ---`);
        console.log(`🆔 ID: ${id}`);
        console.log(`📦 PAYLOAD:`, JSON.stringify(body, null, 2));
        console.log(`-----------------------\n`);

        const updated = await prisma.tenant.update({
            where: { id },
            data: {
                name: body.name,
                rentalAmount: body.rentalAmount ? parseFloat(body.rentalAmount) : null,
                securityDeposit: body.securityDeposit ? parseFloat(body.securityDeposit) : null,
                utilityDeposit: body.utilityDeposit ? parseFloat(body.utilityDeposit) : null,
                startDate: body.startDate ? new Date(body.startDate) : null,
                endDate: body.endDate ? new Date(body.endDate) : null,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("❌ PATCH ERROR:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}

// DELETE: Remove tenant
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> } // Define params as a Promise
) {
    try {
        // 1. Unwrap the params first
        const { id } = await params;

        console.log(`\n--- 🗑️  TENANT DELETE ---`);
        console.log(`🆔 ID: ${id}`);
        console.log(`------------------------\n`);

        await prisma.tenant.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("❌ DELETE ERROR:", error);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}