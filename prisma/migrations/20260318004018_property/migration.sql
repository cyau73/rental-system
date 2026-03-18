/*
  Warnings:

  - The values [AVAILABLE] on the enum `PropertyStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PropertyStatus_new" AS ENUM ('FOR_SALE', 'FOR_RENT', 'RENTED');
ALTER TABLE "Property" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Property" ALTER COLUMN "status" TYPE "PropertyStatus_new" USING ("status"::text::"PropertyStatus_new");
ALTER TYPE "PropertyStatus" RENAME TO "PropertyStatus_old";
ALTER TYPE "PropertyStatus_new" RENAME TO "PropertyStatus";
DROP TYPE "PropertyStatus_old";
ALTER TABLE "Property" ALTER COLUMN "status" SET DEFAULT 'FOR_RENT';
COMMIT;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "remarks" TEXT DEFAULT '',
ALTER COLUMN "status" SET DEFAULT 'FOR_RENT',
ALTER COLUMN "builtUp" SET DEFAULT '',
ALTER COLUMN "landArea" SET DEFAULT '',
ALTER COLUMN "type" SET DEFAULT '';

-- AlterTable
ALTER TABLE "Tenant" ALTER COLUMN "mobile" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;
