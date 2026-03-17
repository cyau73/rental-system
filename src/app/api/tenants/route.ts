//app/api/tenants/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Ensure this matches your import style

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Standard Console Output for debugging
        console.log(`\n--- 🆕 TENANT ADD ---`);
        console.log(`📦 JSON PAYLOAD:`, JSON.stringify(body, null, 2));
        console.log(`-----------------------\n`);

        // Helper to handle empty strings for numbers
        const parseAmount = (val: any) => (val && val !== "" ? parseFloat(val) : null);

        // Helper to handle empty strings for dates
        const parseDate = (val: any) => (val && val !== "" ? new Date(val) : null);

        const tenant = await prisma.tenant.create({
            data: {
                name: body.name,
                address: body.address || "",
                mobile: body.mobile || "",
                email: body.email || "",
                rentalAmount: parseAmount(body.rentalAmount),
                securityDeposit: parseAmount(body.securityDeposit),
                utilityDeposit: parseAmount(body.utilityDeposit),
                startDate: parseDate(body.startDate),
                endDate: parseDate(body.endDate),
                property: {
                    connect: { id: body.propertyId }
                },
            },
        });

        return NextResponse.json(tenant);
    } catch (error) {
        console.error("❌ CREATE ERROR:", error);
        return NextResponse.json({ error: "Create failed" }, { status: 500 });
    }
}