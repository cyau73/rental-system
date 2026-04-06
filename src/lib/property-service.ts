import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function getPropertiesWithLatestTenant(
  query: string,
  yearFilter?: string | null,
  statusFilter?: string
) {
  const searchTerm = `%${query}%`;
  const currentYear = new Date().getFullYear();

  // 1. Build the Year Filter Logic inside the service
  let yearCondition = Prisma.sql`1=1`; // Default: Show all

  if (yearFilter === 'PAST') {
    yearCondition = Prisma.sql`EXTRACT(YEAR FROM t."endDate") < ${currentYear}`;
  } else if (yearFilter && yearFilter !== 'ALL') {
    // Matches specific years like "2026", "2027"
    yearCondition = Prisma.sql`EXTRACT(YEAR FROM t."endDate")::text = ${yearFilter}`;
  }

  // 2. Build the Status Filter Logic
  let statusCondition = Prisma.sql`1=1`;
  if (statusFilter === 'NOT_AVAILABLE') {
    statusCondition = Prisma.sql`p.status = 'NOT_AVAILABLE'`;
  } else if (statusFilter === 'AVAILABLE') {
    statusCondition = Prisma.sql`p.status IN ('FOR_RENT', 'FOR_SALE')`;
  } else if (statusFilter === 'RENTED') {
    statusCondition = Prisma.sql`p.status = 'RENTED'`;
  } else if (statusFilter === 'EXPIRED') {
    statusCondition = Prisma.sql`p.status = 'RENTED' AND (t.id IS NULL OR t."endDate" < CURRENT_DATE OR t."endDate" IS NULL)`;
  } else if (statusFilter === 'EXPIRING') {
    statusCondition = Prisma.sql`p.status NOT IN ('FOR_SALE', 'SOLD', 'NOT_AVAILABLE') AND t."endDate" >= CURRENT_DATE + INTERVAL '3 months' AND t."endDate" <= CURRENT_DATE + INTERVAL '9 months'`;
  }

  try {
    // 2. Fetch the data with the integrated filter
    const rawProperties: any[] = await prisma.$queryRaw`
    SELECT 
      p.*, 
      t.name as "currentTenantName", 
      t."startDate", 
      t."endDate", 
      t."securityDeposit", 
      t."utilityDeposit"
    FROM "Property" p
    LEFT JOIN "Tenant" t ON t.id = (
      SELECT id FROM "Tenant" 
      WHERE "propertyId" = p.id 
      ORDER BY "startDate" DESC LIMIT 1
    )
    -- ✅ FIX 1: Added missing WHERE keyword
    WHERE (p.title ILIKE ${searchTerm} OR p.address ILIKE ${searchTerm} OR t.name ILIKE ${searchTerm})
      -- ✅ FIX 2: Added missing logic connectors
      AND (${statusCondition})
      AND (${yearCondition})
    ORDER BY 
      p."isPinned" DESC,
      p."order" ASC,
      split_part(p.title, '-', 1) ASC,
      CASE 
        WHEN p.title NOT LIKE '%-%' THEN 0      
        WHEN p.title ILIKE '%-G' THEN 1         
        WHEN p.title ILIKE '%-M' THEN 2         
        WHEN p.title ~ '-\d' THEN 3             
        ELSE 4                                  
      END ASC,
      length(p.title) ASC,
      p.title ASC 
    `;

    // 3. Centralized Serialization
    return rawProperties.map(prop => {
      // --- LOGIC FOR UI FIELDS ---
      const now = new Date();
      const leaseEnd = prop.endDate ? new Date(prop.endDate).toLocaleDateString('en-GB') : null;
      const isExpired = !!(prop.endDate && prop.endDate < now);
      const isVacant = !prop.currentTenantName || isExpired; // If expired, it IS vacant regardless of name

      // 3. Status & Variant Logic
      const rawStatus = prop.status.toLowerCase().split('_');
      const camelStatus = rawStatus
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      let displayStatus = camelStatus;
      let badgeVariant = "success"; // Default

      // Helper for the "Last" date reference
      const lastRef = leaseEnd ? ` (Since: ${leaseEnd})` : "";

      // 4. New logic
      if (prop.status === 'NOT_AVAILABLE') {
        displayStatus = "Off Market";
        badgeVariant = "neutral";
      }
      else if (prop.status === 'RENTED') {
        if (isVacant) {
          // Logic: Technically Rented in DB but no active tenant or expired
          displayStatus = `Vacant${lastRef}`;
          badgeVariant = "neutral";
        }
        else if (isExpired) {
          // Logic: "Lease Expired on 20/01/2024"
          displayStatus = `Tenancy Expired ${leaseEnd ? `on ${leaseEnd}` : ""}`.trim();
          badgeVariant = "danger";
        }
        else if (!leaseEnd) {
          displayStatus = "Occupied";
          badgeVariant = "success";
        }
        else {
          displayStatus = `Occupied until ${leaseEnd}`;
          badgeVariant = "success";
        }
      }
      else if (prop.status === 'FOR_RENT' || prop.status === 'FOR_SALE') {
        // Logic: Display "For Rent (Last: 20/01/2024)" or "For Sale (Last: 20/01/2024)"
        const cleanStatus = prop.status.replace('_', ' ');
        displayStatus = `${camelStatus}${lastRef}`;
        badgeVariant = "danger";
      }

      return {
        ...prop,
        rental: Number(prop.rental || 0),
        price: prop.price ? Number(prop.price) : null,
        sale: prop.sale ? Number(prop.sale) : null,

        landArea: prop.landArea ? Number(prop.landArea) : null,
        builtUp: prop.builtUp ? Number(prop.builtUp) : null,

        securityDeposit: prop.securityDeposit ? Number(prop.securityDeposit) : 0,
        utilityDeposit: prop.utilityDeposit ? Number(prop.utilityDeposit) : 0,

        createdAt: prop.createdAt instanceof Date ? prop.createdAt.toISOString() : prop.createdAt,
        updatedAt: prop.updatedAt instanceof Date ? prop.updatedAt.toISOString() : prop.updatedAt,
        startDate: prop.startDate instanceof Date ? prop.startDate.toISOString() : prop.startDate,
        endDate: prop.endDate instanceof Date ? prop.endDate.toISOString() : prop.endDate,

        images: Array.isArray(prop.images) ? prop.images : [],
        currentTenant: prop.currentTenantName || "VACANT",

        order: prop.order !== null ? Number(prop.order) : 0,
        isPinned: Boolean(prop.isPinned),

        displayStatus,
        badgeVariant,
        isVacant,
      };
    });

  } catch (error) {
    console.error("Prisma Query Error:", error);
    throw new Error("Failed to fetch properties. Check SQL syntax.");
  }
}